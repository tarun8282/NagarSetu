const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkCities() {
    const { data: cities } = await supabase.from('cities').select('id, name, state_id').limit(10);
    console.log('Sample Cities:', cities);

    const { data: states } = await supabase.from('states').select('id, name').limit(10);
    console.log('Sample States:', states);
}

checkCities();
