const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { validateAndClassify } = require('../services/ai.service');
const { reverseGeocode } = require('../services/geo.service');
const multer = require('multer');
const path = require('path');

// ── File size limits (server-side) ──────────────────────────────────────────
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;   // 5 MB
const VIDEO_MAX_BYTES = 30 * 1024 * 1024;  // 30 MB
const MULTER_MAX_BYTES = 30 * 1024 * 1024; // Align with highest limit

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

/**
 * @route POST /api/complaints
 * @desc  AI-first complaint submission:
 *        1. Validate file sizes
 *        2. Gemini reviews the complaint (sync)
 *        3. If rejected → 422, nothing saved
 *        4. If valid   → save to DB + upload media + return 201
 */
router.post('/', upload.array('media', 5), async (req, res) => {
    try {
        const {
            citizen_id, title, description,
            latitude, longitude, address: clientAddress,
            city_id, state_id
        } = req.body;
        const mediaFiles = req.files || [];

        // ── 1. Basic field validation ────────────────────────────────────────
        if (!citizen_id || !title || !description) {
            return res.status(400).json({
                success: false,
                error: 'citizen_id, title, and description are all required.'
            });
        }

        // ── 2. File size validation ──────────────────────────────────────────
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

        // ── 3. Reverse geocode (optional, but do it before AI) ───────────────
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

        // ── 4. Build image payloads for Gemini ───────────────────────────────
        // Only images are sent to Gemini
        const imagePayloads = mediaFiles
            .filter(f => f.mimetype !== 'video/mp4')
            .map(f => ({
                base64: f.buffer.toString('base64'),
                mimeType: f.mimetype
            }));

        // ── 5. Gemini validates + classifies SYNCHRONOUSLY ───────────────────
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
            aiResult = { is_valid: true, category: 'other', severity: 'medium', department_name: 'General', reasoning: 'AI unavailable — manual review required', confidence_score: 0 };
        }

        // ── 6. Reject if Gemini says not a civic complaint ───────────────────
        if (!aiResult.is_valid) {
            console.log(`[AI] Complaint rejected: ${aiResult.rejection_reason}`);
            return res.status(422).json({
                success: false,
                rejected: true,
                rejection_reason: aiResult.rejection_reason || 'Your complaint does not appear to be a valid civic issue.'
            });
        }

        // ── 7. Generate complaint number ─────────────────────────────────────
        const complaintNumber = `MH-MUM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // ── 8. Look up department ─────────────────────────────────────────────
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

        // ── 9. Save complaint to DB ───────────────────────────────────────────
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

        // ── 10. Save AI classification ────────────────────────────────────────
        await supabase.from('ai_classifications').insert({
            complaint_id: complaint.id,
            category: aiResult.category,
            severity: aiResult.severity,
            department_name: aiResult.department_name,
            reasoning: aiResult.reasoning,
            confidence_score: aiResult.confidence_score,
            raw_response: aiResult
        });

        // ── 11. Log status history ────────────────────────────────────────────
        await supabase.from('status_history').insert({
            complaint_id: complaint.id,
            old_status: null,
            new_status: 'under_review',
            remarks: `AI validated and classified as ${aiResult.category} (${aiResult.severity}). Confidence: ${(aiResult.confidence_score * 100).toFixed(0)}%`
        });

        // ── 12. Upload media to Supabase Storage (async, non-blocking) ────────
        if (mediaFiles.length > 0) {
            uploadMediaFiles(complaint.id, citizen_id, mediaFiles).catch(err =>
                console.error('[Storage] Media upload failed:', err.message)
            );
        }

        // ── 13. Return success ────────────────────────────────────────────────
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

/**
 * Upload media files to Supabase Storage bucket 'complaint-media'
 * and insert rows into complaint_media table.
 */
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

module.exports = router;
