const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkChain() {
    const { data: complaints } = await supabase.from('complaints').select('city_id').limit(10);
    const uniqueCityIds = [...new Set(complaints.map(c => c.city_id))];
    console.log('Unique City IDs in Complaints:', uniqueCityIds);

    for (let cid of uniqueCityIds) {
        const { data: city } = await supabase.from('cities').select('name, state_id').eq('id', cid).single();
        if (city) {
            console.log(`City: ${city.name} (ID: ${cid}) belongs to State ID: ${city.state_id}`);
            const { data: state } = await supabase.from('states').select('name').eq('id', city.state_id).single();
            console.log(`State Name: ${state?.name || 'Unknown'}`);
        } else {
            console.log(`City ID: ${cid} NOT FOUND in cities table!`);
        }
    }
}

checkChain();
