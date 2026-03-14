const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkConstraints() {
    const { data, error } = await supabase.rpc('get_table_info', { table_name: 'status_history' });
    // Since we don't have this RPC, let's try to insert a record with a fake UUID to see the error
    const { error: insertErr } = await supabase.from('status_history').insert({
        complaint_id: '00000000-0000-0000-0000-000000000000', // Fake ID
        new_status: 'test',
        changed_by: '00000000-0000-0000-0000-000000000000'
    });
    console.log('Error (to check constraints):', insertErr);
}

checkConstraints();
