const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAllOfficers() {
    const { data: officers } = await supabase.from('officers').select('role, username');
    console.log('All Officers:', officers);
}

checkAllOfficers();
