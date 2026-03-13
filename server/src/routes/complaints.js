const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { classifyComplaint } = require('../services/ai.service');
const { reverseGeocode } = require('../services/geo.service');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @route POST /api/complaints
 * @desc Submit a new complaint
 */
router.post('/', upload.array('media', 5), async (req, res) => {
    try {
        const { citizen_id, title, description, latitude, longitude } = req.body;
        const mediaFiles = req.files;

        // 1. Generate Complaint Number
        // Format: STATE-CITY-YEAR-SEQUENCE (Simplified for hackathon)
        const complaintNumber = `MH-MUM-2024-${Math.floor(1000 + Math.random() * 9000)}`;

        // 2. Reverse Geocode (Nominatim)
        const geoInfo = await reverseGeocode(latitude, longitude);

        // 3. Save initial complaint to DB
        const { data: complaint, error: complaintError } = await supabase
            .from('complaints')
            .insert({
                complaint_number: complaintNumber,
                citizen_id,
                title,
                description,
                latitude,
                longitude,
                address: geoInfo.fullAddress,
                city_id: req.body.city_id,
                state_id: req.body.state_id,
                status: 'ai_processing',
                priority: 'medium', // Default priority while AI is processing
                category: 'pending'
            })
            .select()
            .single();

        if (complaintError) throw complaintError;

        // 4. Return early to user
        res.status(201).json({ 
            success: true, 
            complaint_id: complaint.id, 
            complaint_number: complaintNumber,
            message: 'Complaint submitted and AI processing started.'
        });

        // 5. Asynchronous AI Classification (Gemini)
        processAIClassification(complaint, mediaFiles);

    } catch (error) {
        console.error('Complaint Submission Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Handle AI classification in background
 */
async function processAIClassification(complaint, mediaFiles) {
    try {
        // Convert media files to base64 for Gemini if needed
        const images = mediaFiles.map(file => ({
            base64: file.buffer.toString('base64'),
            mimeType: file.mimetype
        }));

        const aiResult = await classifyComplaint({
            title: complaint.title,
            description: complaint.description,
            city: 'Mumbai', // Should be dynamic
            state: 'Maharashtra'
        }, images);

        // Save AI classification result
        await supabase
            .from('ai_classifications')
            .insert({
                complaint_id: complaint.id,
                category: aiResult.category,
                severity: aiResult.severity,
                department_name: aiResult.department_name,
                reasoning: aiResult.reasoning,
                confidence_score: aiResult.confidence_score,
                raw_response: aiResult
            });

        // Loop up department and assign
        const { data: dept } = await supabase
            .from('departments')
            .filter('category_slug', 'eq', aiResult.category)
            .single();

        const updates = {
            status: 'under_review',
            category: aiResult.category,
            priority: aiResult.severity,
            assigned_department_id: dept?.id || null,
            sla_deadline: new Date(Date.now() + (dept?.sla_hours || 24) * 60 * 60 * 1000).toISOString()
        };

        await supabase
            .from('complaints')
            .update(updates)
            .eq('id', complaint.id);

        // Log status change
        await supabase
            .from('status_history')
            .insert({
                complaint_id: complaint.id,
                old_status: 'ai_processing',
                new_status: 'under_review',
                remarks: `AI classified as ${aiResult.category} (${aiResult.severity})`
            });

    } catch (error) {
        console.error('Background AI Processing Error:', error);
        // Fallback: Set to under_review for manual handling
        await supabase
            .from('complaints')
            .update({ status: 'under_review' })
            .eq('id', complaint.id);
    }
}

/**
 * @route GET /api/complaints
 * @desc Get complaints - all if no citizen_id, or specific citizen's if citizen_id provided
 */
router.get('/', async (req, res) => {
    try {
        const { citizen_id } = req.query;

        let query = supabase.from('complaints').select('*');

        if (citizen_id) {
            query = query.eq('citizen_id', citizen_id);
        }

        const { data: complaints, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch AI classification for each complaint
        const complaintsWithAI = await Promise.all(
            (complaints || []).map(async (complaint) => {
                const { data: aiClassification } = await supabase
                    .from('ai_classifications')
                    .select('*')
                    .eq('complaint_id', complaint.id)
                    .single();

                return {
                    ...complaint,
                    ai_classification: aiClassification || null
                };
            })
        );

        res.json({ success: true, complaints: complaintsWithAI });
    } catch (error) {
        console.error('Error fetching complaints:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route GET /api/complaints/:id
 * @desc Get a specific complaint by ID with AI classification and status history
 */
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

        // Fetch AI classification if exists
        const { data: aiClassification } = await supabase
            .from('ai_classifications')
            .select('*')
            .eq('complaint_id', complaint.id)
            .single();

        // Fetch status history
        const { data: statusHistory } = await supabase
            .from('status_history')
            .select('*')
            .eq('complaint_id', complaint.id)
            .order('created_at', { ascending: true });

        // Build response with related data
        const complaintWithRelations = {
            ...complaint,
            ai_classification: aiClassification || null,
            status_history: statusHistory || []
        };

        res.json({ success: true, complaint: complaintWithRelations });
    } catch (error) {
        console.error('Error fetching complaint:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
