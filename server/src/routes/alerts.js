const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');

router.get('/', async (req, res) => {
    try {
        const { state_id, city_id } = req.query;
        let query = supabase.from('alerts').select('*');

        // Apply regional filtering if user context provided
        if (state_id || city_id) {
            let filterParts = ['and(state_id.is.null,city_id.is.null)']; // General alerts
            
            if (state_id) {
                // If state_id is provided, show ALL alerts for that state (both state-wide and city-specific)
                filterParts.push(`state_id.eq.${state_id}`); 
            }
            
            if (city_id) {
                // If city_id is provided (and maybe no state_id), show alerts for that city
                filterParts.push(`city_id.eq.${city_id}`);
            }
            
            query = query.or(filterParts.join(','));
        }

        const { data: alerts, error } = await query.order('published_at', { ascending: false });

        if (error) {
            // Note: error code '42P01' means relation/table does not exist in PostgreSQL.
            // If the user hasn't created the 'alerts' table yet in Supabase, 
            // we'll fail gracefully and return an empty array instead of crashing.
            if (error.code === '42P01') {
                console.warn('[DB] "alerts" table does not exist yet. Returning empty array.');
                return res.json({ success: true, alerts: [] });
            }
            throw error;
        }

        res.json({ success: true, alerts: alerts || [] });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        try { require('fs').appendFileSync('server_errors.log', `[${new Date().toISOString()}] GET /api/alerts\n${error.stack}\n\n`); } catch (e) {}
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { title, description, category, priority, location, source, state_id, city_id, created_by } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, error: 'Title is required' });
        }

        const { data: alert, error } = await supabase
            .from('alerts')
            .insert({
                title,
                description,
                category,
                priority: priority || 'medium',
                location,
                source: source || 'Official Update',
                state_id: state_id || null,
                city_id: city_id || null,
                created_by: created_by || null,
                published_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, alert });
    } catch (error) {
        console.error('Error creating alert:', error);
        try { require('fs').appendFileSync('server_errors.log', `[${new Date().toISOString()}] POST /api/alerts\n${error.stack}\n\n`); } catch (e) {}
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
