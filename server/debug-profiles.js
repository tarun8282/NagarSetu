const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkProfiles() {
    const { data: stateAdmins } = await supabase.from('profiles').select('*').eq('role', 'state_admin');
    console.log('State Admins in profiles:', stateAdmins);

    const { data: superAdmins } = await supabase.from('profiles').select('*').eq('role', 'admin');
    console.log('Super Admins in profiles:', superAdmins);
}

checkProfiles();
