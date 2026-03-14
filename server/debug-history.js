const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkStatusHistory() {
    const { data, error } = await supabase.from('status_history').select('*').limit(1);
    if (data && data.length > 0) {
        console.log('Status History Columns:', Object.keys(data[0]));
    } else {
        console.log('No status history yet');
    }
}

checkStatusHistory();
