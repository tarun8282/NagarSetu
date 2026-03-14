const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkCols() {
    const { data } = await supabase.from('officers').select('*').limit(1);
    if (data && data.length > 0) {
        console.log('Officer Columns:', Object.keys(data[0]));
    } else {
        console.log('No officers found');
    }

    const { data: comp } = await supabase.from('complaints').select('*').limit(1);
    if (comp && comp.length > 0) {
        console.log('Complaint Columns:', Object.keys(comp[0]));
    }
}

checkCols();
