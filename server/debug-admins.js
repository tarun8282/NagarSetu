const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAdmins() {
    const { data: admins } = await supabase.from('officers').select('username, role, state_id, city_id').eq('role', 'state_admin');
    console.log('State Admins:', admins);
}

checkAdmins();
