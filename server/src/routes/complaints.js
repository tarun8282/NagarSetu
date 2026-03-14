const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { validateAndClassify } = require('../services/ai.service');
const { reverseGeocode } = require('../services/geo.service');
const { sendComplaintConfirmationEmail, sendStatusUpdateEmail } = require('../services/mail.service');
const multer = require('multer');
const path = require('path');

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const VIDEO_MAX_BYTES = 30 * 1024 * 1024;
const MULTER_MAX_BYTES = 30 * 1024 * 1024;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MULTER_MAX_BYTES },
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4'];
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error(`File type ${file.mimetype} is not allowed.`));
        }
        cb(null, true);
    }
});

router.post('/', upload.array('media', 5), async (req, res) => {
    try {
        const {
            citizen_id, title, description,
            latitude, longitude, address: clientAddress,
            city_id, state_id
        } = req.body;
        const mediaFiles = req.files || [];

        // 1. Basic field validation
        if (!citizen_id || !title || !description) {
            return res.status(400).json({
                success: false,
                error: 'citizen_id, title, and description are all required.'
            });
        }

        // 2. File size validation
        for (const file of mediaFiles) {
            const isVideo = file.mimetype === 'video/mp4';
            const maxBytes = isVideo ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
            const maxLabel = isVideo ? '30 MB' : '5 MB';

            if (file.size > maxBytes) {
                return res.status(400).json({
                    success: false,
                    error: `File "${file.originalname}" is too large. Maximum size for ${isVideo ? 'videos' : 'images'} is ${maxLabel}.`
                });
            }
        }

        // 3. Reverse geocode
        let resolvedAddress = clientAddress || null;
        let city = 'Unknown';
        let state = 'Maharashtra';

        if (latitude && longitude) {
            try {
                const geoInfo = await reverseGeocode(parseFloat(latitude), parseFloat(longitude));
                resolvedAddress = geoInfo.fullAddress || resolvedAddress;
                city = geoInfo.city || city;
                state = geoInfo.state || state;
            } catch (geoErr) {
                console.warn('[Geo] Geocoding failed, using client address:', geoErr.message);
            }
        }

        // 4. Build image payloads for Gemini
        const imagePayloads = mediaFiles
            .filter(f => f.mimetype !== 'video/mp4')
            .map(f => ({
                base64: f.buffer.toString('base64'),
                mimeType: f.mimetype
            }));

        // 5. Gemini validates + classifies synchronously
        console.log(`[AI] Validating complaint in ${city}: "${title}"`);
        let aiResult;
        try {
            aiResult = await validateAndClassify({
                title,
                description,
                city,
                state
            }, imagePayloads);
        } catch (aiError) {
            console.error('[AI] Gemini failed — falling back to manual review:', aiError.message);
            aiResult = {
                is_valid: true,
                category: 'other',
                severity: 'medium',
                department_name: 'General',
                reasoning: 'AI unavailable — manual review required',
                confidence_score: 0
            };
        }

        // 6. Reject if Gemini says not a civic complaint
        if (!aiResult.is_valid) {
            console.log(`[AI] Complaint rejected: ${aiResult.rejection_reason}`);
            return res.status(422).json({
                success: false,
                rejected: true,
                rejection_reason: aiResult.rejection_reason || 'Your complaint does not appear to be a valid civic issue.'
            });
        }

        // 7. Generate complaint number
        const complaintNumber = `MH-MUM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // 7.5. Look up real city_id if not explicitly provided
        let resolvedCityId = city_id || null;
        if (!resolvedCityId && city && city !== 'Unknown') {
            try {
                const { data: dbCity } = await supabase
                    .from('cities')
                    .select('id')
                    .ilike('name', city)
                    .limit(1)
                    .maybeSingle();
                if (dbCity) resolvedCityId = dbCity.id;
            } catch (err) {
                console.warn('[DB] City lookup failed:', err.message);
            }
        }

        // 8. Look up department
        let assignedDeptId = null;
        let slaHours = 24; // default fallback

        // Map AI strict categories to realistic DB category slugs
        const categoryMap = {
            'road_pothole': 'pwd', 'road_damage': 'pwd',
            'water_leakage': 'water', 'water_shortage': 'water',
            'garbage_overflow': 'solidwaste', 'garbage_collection': 'solidwaste',
            'electricity_outage': 'electricity', 'streetlight': 'electricity',
            'sanitation_drain': 'sewerage', 'sanitation_toilet': 'sewerage', 'flooding': 'sewerage',
            'illegal_construction': 'building', 'building_permit': 'building',
            'encroachment': 'townplanning',
            'noise_pollution': 'environment', 'environment_pollution': 'environment',
            'stray_animals': 'health',
            'tree_fallen': 'gardens', 'park_damage': 'gardens',
            'fire_hazard': 'fire',
            'other': 'admin'
        };

        // Category-level SLA fallback (when the department's sla_hours is not set in DB)
        const categorySlaMap = {
            'electricity_outage': 6,  'streetlight': 6,
            'garbage_overflow': 12,   'garbage_collection': 12,
            'water_leakage': 24,      'water_shortage': 24, 'flooding': 24,
            'road_pothole': 48,       'road_damage': 48,
            'illegal_construction': 72, 'building_permit': 72, 'encroachment': 72,
            'sanitation_drain': 24,   'sanitation_toilet': 24,
            'fire_hazard': 6,         // fire is always urgent
            'tree_fallen': 12,
            'noise_pollution': 48,    'environment_pollution': 48,
            'stray_animals': 24,
            'park_damage': 72,
            'other': 48
        };

        // Use category-level SLA as fallback default
        const categoryDefaultSla = categorySlaMap[aiResult.category] || 24;
        slaHours = categoryDefaultSla;

        const mappedSlug = categoryMap[aiResult.category] || 'admin';

        try {
            // Try electricity slug first, then pwd as fallback for electrical issues
            let deptQuery = supabase
                .from('departments')
                .select('id, sla_hours')
                .eq('category_slug', mappedSlug);

            if (resolvedCityId) {
                deptQuery = deptQuery.eq('city_id', resolvedCityId);
            }

            const { data: deptDepts, error: deptError } = await deptQuery.limit(1);
            if (!deptError && deptDepts && deptDepts.length > 0) {
                assignedDeptId = deptDepts[0].id;
                // Use DB sla_hours if set, otherwise use our category-based default
                slaHours = deptDepts[0].sla_hours || categoryDefaultSla;
            } else if (mappedSlug === 'electricity') {
                // Fallback: try 'pwd' slug for electricity if no electricity dept exists
                const { data: pwdDepts } = await supabase
                    .from('departments')
                    .select('id, sla_hours')
                    .eq('category_slug', 'pwd')
                    .eq('city_id', resolvedCityId)
                    .limit(1);
                if (pwdDepts && pwdDepts.length > 0) {
                    assignedDeptId = pwdDepts[0].id;
                    slaHours = categoryDefaultSla; // always use 6h for electricity even under PWD
                }
            }
        } catch (deptErr) {
            console.warn('[DB] Department lookup failed:', deptErr.message);
        }

        // 9. Save complaint to DB
        const { data: complaint, error: complaintError } = await supabase
            .from('complaints')
            .insert({
                complaint_number: complaintNumber,
                citizen_id,
                title,
                description,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                address: resolvedAddress,
                city_id: resolvedCityId,
                state_id: state_id || null,
                status: 'under_review',
                category: aiResult.category,
                priority: aiResult.severity,
                assigned_department_id: assignedDeptId,
                sla_deadline: new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString()
            })
            .select()
            .single();

        if (complaintError) throw complaintError;

        // 10. Save AI classification
        await supabase.from('ai_classifications').insert({
            complaint_id: complaint.id,
            category: aiResult.category,
            severity: aiResult.severity,
            department_name: aiResult.department_name,
            reasoning: aiResult.reasoning,
            confidence_score: aiResult.confidence_score,
            raw_response: aiResult
        });

        // 11. Log status history
        await supabase.from('status_history').insert({
            complaint_id: complaint.id,
            old_status: null,
            new_status: 'under_review',
            remarks: `AI validated and classified as ${aiResult.category} (${aiResult.severity}). Confidence: ${(aiResult.confidence_score * 100).toFixed(0)}%`
        });

        // 12. Upload media to Supabase Storage
        if (mediaFiles.length > 0) {
            try {
                await uploadMediaFiles(complaint.id, citizen_id, mediaFiles);
            } catch (err) {
                console.error('[Storage] Media upload failed:', err.message);
            }
        }

        // 13. Send confirmation email (non-blocking)
        try {
            const { data: citizen } = await supabase
                .from('citizens')
                .select('email, full_name')
                .eq('id', citizen_id)
                .single();

            if (citizen?.email) {
                sendComplaintConfirmationEmail(citizen.email, citizen.full_name || 'Citizen', {
                    id: complaint.id,
                    complaint_number: complaintNumber,
                    title,
                    description,
                    category: aiResult.category,
                    priority: aiResult.severity,
                    department_name: aiResult.department_name,
                    address: resolvedAddress,
                    sla_deadline: complaint.sla_deadline,
                }).catch(e => console.error('[Mail] Failed to send confirmation email:', e.message));
            }
        } catch (emailErr) {
            console.warn('[Mail] Could not fetch citizen for email:', emailErr.message);
        }

        // 14. Return success
        return res.status(201).json({
            success: true,
            complaint_id: complaint.id,
            complaint_number: complaintNumber,
            ai_category: aiResult.category,
            ai_severity: aiResult.severity,
            ai_department: aiResult.department_name,
            message: `Complaint accepted and assigned to ${aiResult.department_name}.`
        });

    } catch (error) {
        console.error('[Complaint] Submission error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

async function uploadMediaFiles(complaintId, uploadedBy, files) {
    for (const file of files) {
        try {
            const ext = path.extname(file.originalname) || (file.mimetype === 'video/mp4' ? '.mp4' : '.jpg');
            const storagePath = `${complaintId}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('complaint-media')
                .upload(storagePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (uploadError) {
                console.error(`[Storage] Failed to upload ${file.originalname}:`, uploadError.message);
                continue;
            }

            const { data: urlData } = supabase.storage
                .from('complaint-media')
                .getPublicUrl(storagePath);

            const { error: dbError } = await supabase.from('complaint_media').insert({
                complaint_id: complaintId,
                storage_path: storagePath,
                public_url: urlData.publicUrl,
                is_video: file.mimetype === 'video/mp4',
                is_resolution_proof: false,
                uploaded_by: uploadedBy
            });

            if (dbError) {
                console.error(`[DB] Failed to insert media record for ${file.originalname}:`, dbError.message);
                continue;
            }

            console.log(`[Storage] Uploaded: ${storagePath}`);
        } catch (err) {
            console.error(`[Storage] Error for ${file.originalname}:`, err.message);
        }
    }
}

// GET /api/complaints/heatmap — fast, lightweight endpoint for map rendering
// Only returns complaints with valid lat/lng, no joins
router.get('/heatmap', async (req, res) => {
    try {
        const { city_id, state_id } = req.query;

        let query = supabase
            .from('complaints')
            .select('id, complaint_number, title, description, latitude, longitude, status, priority, address')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null);

        if (city_id) {
            query = query.eq('city_id', city_id);
        } else if (state_id) {
            const { data: cities } = await supabase.from('cities').select('id').eq('state_id', state_id);
            const cityIds = (cities || []).map(c => c.id);
            if (cityIds.length > 0) {
                query = query.in('city_id', cityIds);
            } else {
                return res.json({ success: true, complaints: [] });
            }
        }

        const { data: complaints, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        // Extra safety: filter out any rows where coords are 0,0 or invalid
        const validComplaints = (complaints || []).filter(c =>
            c.latitude && c.longitude &&
            !isNaN(parseFloat(c.latitude)) && !isNaN(parseFloat(c.longitude)) &&
            !(c.latitude === 0 && c.longitude === 0)
        );

        return res.json({ 
            success: true, 
            complaints: validComplaints,
            total: validComplaints.length
        });
    } catch (error) {
        console.error('[Heatmap] Error fetching complaints:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const { citizen_id, city_id, state_id, department_id } = req.query;

        let query = supabase.from('complaints').select('*');
        
        if (citizen_id) {
            query = query.eq('citizen_id', citizen_id);
        } else if (city_id) {
            query = query.eq('city_id', city_id);
        } else if (state_id) {
            // Get all cities in this state to filter complaints
            const { data: cities } = await supabase.from('cities').select('id').eq('state_id', state_id);
            const cityIds = (cities || []).map(c => c.id);
            if (cityIds.length > 0) {
                query = query.in('city_id', cityIds);
            } else {
                return res.json({ success: true, complaints: [] });
            }
        }

        if (department_id) {
            query = query.eq('assigned_department_id', department_id);
        }

        const { data: complaints, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        const complaintsWithDetails = await Promise.all(
            (complaints || []).map(async (complaint) => {
                const { data: aiClassification } = await supabase
                    .from('ai_classifications')
                    .select('*')
                    .eq('complaint_id', complaint.id)
                    .maybeSingle();

                const { data: media } = await supabase
                    .from('complaint_media')
                    .select('*')
                    .eq('complaint_id', complaint.id);
                
                // Get ward info if available
                let wardName = 'N/A';
                if (complaint.city_id) {
                    const { data: city } = await supabase.from('cities').select('name').eq('id', complaint.city_id).maybeSingle();
                    if (city) wardName = city.name;
                }

                return { 
                    ...complaint, 
                    ai_classification: aiClassification || null, 
                    complaint_media: media || [],
                    ward_number: complaint.ward_number || wardName
                };
            })
        );

        res.json({ success: true, complaints: complaintsWithDetails });
    } catch (error) {
        console.error('Error fetching complaints:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: complaint, error } = await supabase
            .from('complaints')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!complaint) {
            return res.status(404).json({ success: false, error: 'Complaint not found' });
        }

        const { data: aiClassification } = await supabase
            .from('ai_classifications')
            .select('*')
            .eq('complaint_id', complaint.id)
            .maybeSingle();

        const { data: statusHistory } = await supabase
            .from('status_history')
            .select('*')
            .eq('complaint_id', complaint.id)
            .order('created_at', { ascending: true });

        const { data: media } = await supabase
            .from('complaint_media')
            .select('*')
            .eq('complaint_id', complaint.id);

        res.json({
            success: true,
            complaint: {
                ...complaint,
                ai_classification: aiClassification || null,
                status_history: statusHistory || [],
                media: media || []
            }
        });
    } catch (error) {
        console.error('Error fetching complaint:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/status', upload.array('proof', 1), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks, changed_by } = req.body;
        const proofFiles = req.files || [];

        if (!status) return res.status(400).json({ success: false, error: 'Status is required' });

        // 1. Get current status for history
        const { data: current, error: fetchErr } = await supabase
            .from('complaints')
            .select('status')
            .eq('id', id)
            .single();
        if (fetchErr) throw fetchErr;

        // 2. Update complaint
        const updateData = { 
            status, 
            updated_at: new Date().toISOString() 
        };
        if (status === 'resolved') {
            updateData.resolved_at = new Date().toISOString();
        }

        const { error: updateErr } = await supabase
            .from('complaints')
            .update(updateData)
            .eq('id', id);
        
        if (updateErr) {
            console.error('[DB] Status update failed:', updateErr.message);
            throw updateErr;
        }

        // 3. Log History
        const { error: historyErr } = await supabase.from('status_history').insert({
            complaint_id: id,
            old_status: current.status,
            new_status: status,
            changed_by: (changed_by && changed_by.trim() !== "") ? changed_by : null,
            remarks: remarks || `Status changed to ${status}`
        });

        if (historyErr) {
            console.error('[DB] History logging failed:', historyErr.message);
            // We don't necessarily want to fail the whole request if history fails, 
            // but let's at least log it.
        }

        // 4. Handle proof files if any (field name 'proof' or 'evidence')
        // req.files is handled by multer for array('proof', 1) or single('proof')
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const storagePath = `proofs/${id}/${Date.now()}-${file.originalname}`;
                const { error: uploadErr } = await supabase.storage
                    .from('complaint-media')
                    .upload(storagePath, file.buffer, { contentType: file.mimetype });

                if (!uploadErr) {
                    const { data: urlData } = supabase.storage
                        .from('complaint-media')
                        .getPublicUrl(storagePath);

                    await supabase.from('complaint_media').insert({
                        complaint_id: id,
                        storage_path: storagePath,
                        public_url: urlData.publicUrl,
                        is_resolution_proof: true,
                        uploaded_by: (changed_by && changed_by.trim() !== "") ? changed_by : null
                    });
                } else {
                    console.error('[Storage] Proof upload failed:', uploadErr.message);
                }
            }
        }

        // 5. Send status update email to citizen (non-blocking, fire-and-forget)
        // Use separate queries to avoid join issues
        (async () => {
            try {
                const { data: complaintData } = await supabase
                    .from('complaints')
                    .select('citizen_id, complaint_number, title')
                    .eq('id', id)
                    .single();

                if (!complaintData?.citizen_id) return;

                const { data: citizenData } = await supabase
                    .from('citizens')
                    .select('email, full_name')
                    .eq('id', complaintData.citizen_id)
                    .single();

                if (citizenData?.email) {
                    await sendStatusUpdateEmail(
                        citizenData.email,
                        citizenData.full_name || 'Citizen',
                        {
                            id,
                            complaint_number: complaintData.complaint_number,
                            title: complaintData.title,
                            old_status: current.status,
                            new_status: status,
                            remarks,
                            updated_at: new Date().toISOString(),
                        }
                    );
                    console.log(`[Mail] Status update email sent to ${citizenData.email}`);
                }
            } catch (emailErr) {
                console.warn('[Mail] Status update email failed (non-fatal):', emailErr.message);
            }
        })();

        res.json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/complaints/:id/evidence — add evidence photo (shows in Evidence Gallery)
router.post('/:id/evidence', upload.single('evidence'), async (req, res) => {
    try {
        const { id } = req.params;
        const { uploaded_by } = req.body;
        const file = req.file;

        if (!file) return res.status(400).json({ success: false, error: 'No file provided' });

        const storagePath = `evidence/${id}/${Date.now()}-${file.originalname}`;

        const { error: uploadErr } = await supabase.storage
            .from('complaint-media')
            .upload(storagePath, file.buffer, { contentType: file.mimetype });

        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
            .from('complaint-media')
            .getPublicUrl(storagePath);

        const { error: insertErr } = await supabase.from('complaint_media').insert({
            complaint_id: id,
            storage_path: storagePath,
            public_url: urlData.publicUrl,
            is_video: false,
            is_resolution_proof: false,
            uploaded_by: uploaded_by || null
        });

        if (insertErr) throw insertErr;

        res.json({ success: true, public_url: urlData.publicUrl });
    } catch (error) {
        console.error('Error uploading evidence:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;