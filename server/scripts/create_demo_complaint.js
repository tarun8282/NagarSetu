
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env from one level up
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://pxxboemapaamzisxsmpi.supabase.co';
const supabaseKey = process.env.SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('SERVICE_ROLE_KEY not found in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDemo() {
    console.log('--- NagarSetu Demo Complaint Generator ---');
    console.log('Connecting to:', supabaseUrl);
    
    try {
        // 1. Get States & Cities
        const { data: states } = await supabase.from('states').select('id, name').eq('code', 'MH');
        if (!states || states.length === 0) throw new Error('Maharashtra state not found');
        const state = states[0];

        const { data: cities } = await supabase.from('cities').select('id, name').eq('name', 'Mumbai');
        if (!cities || cities.length === 0) throw new Error('Mumbai city not found');
        const city = cities[0];

        // 2. Get Department (Roads)
        const { data: depts } = await supabase.from('departments')
            .select('id, name')
            .eq('city_id', city.id)
            .ilike('name', '%Roads%');
            
        if (!depts || depts.length === 0) throw new Error('Roads department not found in Mumbai');
        const dept = depts[0];

        // 3. Get an Officer (Mumbai Roads Officer)
        const { data: officers } = await supabase.from('officers')
            .select('id, full_name')
            .eq('department_id', dept.id)
            .limit(1);
            
        if (!officers || officers.length === 0) throw new Error('No officer found for Mumbai Roads');
        const officer = officers[0];

        // 4. Get a Citizen to act as complainant
        const { data: citizens } = await supabase.from('citizens').select('id, full_name').limit(1);
        let citizen = citizens?.[0];
        
        if (!citizen) {
            console.log('No citizens found. Using Mumbai Roads Officer as surrogate complainant...');
            citizen = officer;
        }

        const complaintNumber = `NS-${Math.floor(100000 + Math.random() * 900000)}`;
        const now = new Date();
        const deadline = new Date(now.getTime() + (48 * 60 * 60 * 1000)); // 48h SLA

        console.log(`Citizen: ${citizen.full_name || 'N/A'}`);
        console.log(`Dept: ${dept.name}`);
        console.log(`Officer: ${officer.full_name}`);
        console.log(`Issue: ${complaintNumber}`);

        // 5. Insert Complaint
        const { data: complaint, error: cErr } = await supabase.from('complaints').insert({
            complaint_number: complaintNumber,
            citizen_id: citizen.id,
            title: 'Hazardous Open Pothole - Linking Road',
            description: 'A deep pothole has opened up exactly at the turn near National College. Multiple bikes have narrowly avoided accidents. It collects water and is hard to see at night. Requires immediate barricading and repair.',
            latitude: 19.0622,
            longitude: 72.8347,
            address: 'Linking Rd, opposite National College, Bandra West, Mumbai, 400050',
            city_id: city.id,
            state_id: state.id,
            ward_number: 'H-West',
            status: 'under_review',
            priority: 'critical',
            category: 'roads',
            assigned_department_id: dept.id,
            assigned_officer_id: officer.id,
            sla_deadline: deadline.toISOString(),
            created_at: now.toISOString(),
            updated_at: now.toISOString()
        }).select().single();

        if (cErr) throw cErr;
        
        console.log('✅ Complaint Created!');

        // 6. Add AI Assessment
        await supabase.from('ai_classifications').insert({
            complaint_id: complaint.id,
            category: 'roads',
            severity: 'critical',
            department_name: dept.name,
            reasoning: 'Critical severity due to hazardous location (near educational institution) and high risk to two-wheelers. Automatic assignment to BMC Roads Dept.',
            confidence_score: 0.98,
            created_at: now.toISOString()
        });

        // 7. Add Status History
        await supabase.from('status_history').insert({
            complaint_id: complaint.id,
            old_status: 'submitted',
            new_status: 'under_review',
            changed_by: officer.id,
            remarks: 'Complaint automatically categorized as CRITICAL and routed to H-West Road Maintenance team.',
            created_at: now.toISOString()
        });

        console.log('✅ AI Classification & History Created');
        console.log('--- Demo Data Loaded Successfully ---');

    } catch (err) {
        console.error('❌ Error creating demo:', err.message || err);
    }
}

createDemo();
