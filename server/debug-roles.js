const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRoles() {
    const { data: officers } = await supabase.from('officers').select('role, state_id').limit(20);
    const roles = [...new Set(officers.map(o => o.role))];
    console.log('Roles found in officers table:', roles);
    
    const { data: profiles } = await supabase.from('profiles').select('role').limit(20);
    if (profiles) {
        const pRoles = [...new Set(profiles.map(p => p.role))];
        console.log('Roles found in profiles table:', pRoles);
    }
}

checkRoles();
