const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');

// GET /api/analytics/admin
router.get('/admin', async (req, res) => {
    try {
        const { city_id } = req.query;

        // 1. Total Complaints
        let totalQuery = supabase.from('complaints').select('id', { count: 'exact' });
        if (city_id) totalQuery = totalQuery.eq('city_id', city_id);
        const { count: totalComplaints } = await totalQuery;

        // 2. Resolved Complaints
        let resolvedQuery = supabase.from('complaints').select('id', { count: 'exact' }).eq('status', 'resolved');
        if (city_id) resolvedQuery = resolvedQuery.eq('city_id', city_id);
        const { count: resolvedComplaints } = await resolvedQuery;

        // 3. Active Officers
        let officerQuery = supabase.from('officers').select('id', { count: 'exact' });
        if (city_id) officerQuery = officerQuery.eq('city_id', city_id);
        const { count: activeOfficers } = await officerQuery;

        // 4. SLA Breaches
        let slaQuery = supabase.from('complaints')
            .select('id', { count: 'exact' })
            .neq('status', 'resolved')
            .lt('sla_deadline', new Date().toISOString());
        if (city_id) slaQuery = slaQuery.eq('city_id', city_id);
        const { count: slaBreaches } = await slaQuery;

        // 5. Department Performance
        let deptQuery = supabase.from('departments').select('id, name');
        if (city_id) deptQuery = deptQuery.eq('city_id', city_id);
        const { data: departments } = await deptQuery;

        const deptPerformance = await Promise.all((departments || []).map(async (dept) => {
            const { count: deptTotal } = await supabase.from('complaints').select('id', { count: 'exact' }).eq('assigned_department_id', dept.id);
            const { count: deptResolved } = await supabase.from('complaints').select('id', { count: 'exact' }).eq('assigned_department_id', dept.id).eq('status', 'resolved');
            
            const rate = deptTotal > 0 ? Math.round((deptResolved / deptTotal) * 100) : 0;
            return {
                dept: dept.name,
                rate,
                total: deptTotal
            };
        }));

        res.json({
            success: true,
            stats: {
                totalComplaints: totalComplaints || 0,
                resolutionRate: totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 1000) / 10 : 0,
                activeOfficers: activeOfficers || 0,
                slaBreaches: slaBreaches || 0
            },
            deptPerformance: deptPerformance.sort((a, b) => b.rate - a.rate).slice(0, 5)
        });

    } catch (error) {
        console.error('Admin Analytics Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/analytics/state
router.get('/state', async (req, res) => {
    try {
        const { state_id, city_id } = req.query;
        if (!state_id) return res.status(400).json({ success: false, error: 'state_id is required' });

        // 0. Get all cities in this state
        const { data: allCities, error: cityError } = await supabase.from('cities').select('id, name').eq('state_id', state_id);
        if (cityError) throw cityError;

        const cityIdsInState = (allCities || []).map(c => c.id).filter(id => id);

        if (cityIdsInState.length === 0) {
            return res.json({
                success: true,
                stats: { totalComplaints: 0, resolutionRate: 0, activeCities: 0, slaBreaches: 0 },
                cityPerformance: [],
                categoryDistribution: [],
                cities: []
            });
        }

        // Determine filter: specific city or all cities in state
        const filterCityIds = city_id && city_id !== '' ? [city_id] : cityIdsInState;

        // 1. Overall Stats (filtered by cities)
        const { count: totalComplaints } = await supabase.from('complaints').select('id', { count: 'exact' }).in('city_id', filterCityIds);
        const { count: resolvedComplaints } = await supabase.from('complaints').select('id', { count: 'exact' }).in('city_id', filterCityIds).eq('status', 'resolved');
        const { count: slaBreaches } = await supabase.from('complaints')
            .select('id', { count: 'exact' })
            .in('city_id', filterCityIds)
            .neq('status', 'resolved')
            .lt('sla_deadline', new Date().toISOString());

        // 2. City Performance Leaderboard
        const cityPerformance = await Promise.all((allCities || []).map(async (city) => {
            const { count: cityTotal } = await supabase.from('complaints').select('id', { count: 'exact' }).eq('city_id', city.id);
            const { count: cityResolved } = await supabase.from('complaints').select('id', { count: 'exact' }).eq('city_id', city.id).eq('status', 'resolved');
            const rate = cityTotal > 0 ? Math.round((cityResolved / cityTotal) * 100) : 0;
            
            let status = 'Fair';
            if (rate >= 90) status = 'Excellent';
            else if (rate >= 80) status = 'Good';
            else if (rate >= 70) status = 'Average';
            else status = 'Critical';

            return {
                id: city.id,
                name: city.name,
                complaints: cityTotal || 0,
                rate,
                status
            };
        }));

        // 3. Category Distribution
        const { data: categories } = await supabase.from('complaints').select('category').in('city_id', filterCityIds);
        const catCounts = {};
        (categories || []).forEach(c => {
            catCounts[c.category] = (catCounts[c.category] || 0) + 1;
        });
        const categoryDistribution = Object.entries(catCounts).map(([category, count]) => ({
            category: category.replace(/_/g, ' '),
            count,
            percentage: totalComplaints > 0 ? Math.round((count / totalComplaints) * 100) : 0
        })).sort((a, b) => b.count - a.count).slice(0, 5);

        res.json({
            success: true,
            stats: {
                totalComplaints: totalComplaints || 0,
                resolutionRate: totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 1000) / 10 : 0,
                activeCities: allCities.length || 0,
                slaBreaches: slaBreaches || 0
            },
            cityPerformance: cityPerformance.sort((a, b) => b.rate - a.rate).slice(0, 10),
            categoryDistribution,
            cities: allCities
        });
    } catch (error) {
        console.error('State Analytics Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
