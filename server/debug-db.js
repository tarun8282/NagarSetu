const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
    console.log('Checking database counts...');
    
    const { count: totalComplaints } = await supabase.from('complaints').select('id', { count: 'exact' });
    console.log('Total Complaints in DB:', totalComplaints);

    const { data: sampleComplaints } = await supabase.from('complaints').select('id, city_id, state_id').limit(5);
    console.log('Sample Complaints (first 5):', sampleComplaints);

    const { data: cities } = await supabase.from('cities').select('id, name, state_id');
    console.log('Cities in DB:', cities);

    const { data: states } = await supabase.from('states').select('id, name');
    console.log('States in DB:', states);
}

checkData();
