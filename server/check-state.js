const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkMaharashtra() {
    const { data: states } = await supabase.from('states').select('id, name').ilike('name', 'Maharashtra').single();
    if (!states) {
        console.log('Maharashtra state NOT FOUND');
        return;
    }
    console.log('Maharashtra ID:', states.id);

    const { data: cities } = await supabase.from('cities').select('id, name').eq('state_id', states.id);
    console.log(`Cities in Maharashtra (${cities.length}):`, cities.map(c => c.name));

    const cityIds = cities.map(c => c.id);
    const { count: complaintsCount } = await supabase.from('complaints').select('id', { count: 'exact' }).in('city_id', cityIds);
    console.log('Total Complaints in Maharashtra cities:', complaintsCount);
}

checkMaharashtra();
