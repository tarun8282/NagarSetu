const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
    console.log('--- Complaint Stats ---');
    
    const { data: complaints } = await supabase.from('complaints').select('city_id, status');
    const cityCounts = {};
    complaints.forEach(c => {
        cityCounts[c.city_id] = (cityCounts[c.city_id] || 0) + 1;
    });
    console.log('Complaints per City ID:', cityCounts);

    const { data: cities } = await supabase.from('cities').select('id, name, state_id');
    console.log('Cities in DB (mapped to state):');
    cities.forEach(c => {
        console.log(`City: ${c.name} | ID: ${c.id} | StateID: ${c.state_id}`);
    });
}

checkData();
