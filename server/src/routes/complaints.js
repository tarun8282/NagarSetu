const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { validateAndClassify } = require('../services/ai.service');
const { reverseGeocode } = require('../services/geo.service');
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

        // 8. Look up department
        let assignedDeptId = null;
        let slaHours = 24;
        try {
            const { data: dept } = await supabase
                .from('departments')
                .select('id, sla_hours')
                .eq('category_slug', aiResult.category)
                .maybeSingle();
            if (dept) {
                assignedDeptId = dept.id;
                slaHours = dept.sla_hours || 24;
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
                city_id: city_id || null,
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

        // 12. Upload media to Supabase Storage (async, non-blocking)
        if (mediaFiles.length > 0) {
            uploadMediaFiles(complaint.id, citizen_id, mediaFiles).catch(err =>
                console.error('[Storage] Media upload failed:', err.message)
            );
        }

        // 13. Return success
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

            await supabase.from('complaint_media').insert({
                complaint_id: complaintId,
                storage_path: storagePath,
                public_url: urlData.publicUrl,
                is_video: file.mimetype === 'video/mp4',
                is_resolution_proof: false,
                uploaded_by: uploadedBy
            });

            console.log(`[Storage] Uploaded: ${storagePath}`);
        } catch (err) {
            console.error(`[Storage] Error for ${file.originalname}:`, err.message);
        }
    }
}

router.get('/', async (req, res) => {
    try {
        const { citizen_id } = req.query;

        let query = supabase.from('complaints').select('*');
        if (citizen_id) query = query.eq('citizen_id', citizen_id);

        const { data: complaints, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        const complaintsWithAI = await Promise.all(
            (complaints || []).map(async (complaint) => {
                const { data: aiClassification } = await supabase
                    .from('ai_classifications')
                    .select('*')
                    .eq('complaint_id', complaint.id)
                    .single();
                return { ...complaint, ai_classification: aiClassification || null };
            })
        );

        res.json({ success: true, complaints: complaintsWithAI });
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
            .single();

        const { data: statusHistory } = await supabase
            .from('status_history')
            .select('*')
            .eq('complaint_id', complaint.id)
            .order('created_at', { ascending: true });

        res.json({
            success: true,
            complaint: {
                ...complaint,
                ai_classification: aiClassification || null,
                status_history: statusHistory || []
            }
        });
    } catch (error) {
        console.error('Error fetching complaint:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;