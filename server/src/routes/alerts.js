const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');

router.get('/', async (req, res) => {
    try {
        const { data: alerts, error } = await supabase
            .from('alerts')
            .select('*')
            .order('publishedAt', { ascending: false });

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
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
