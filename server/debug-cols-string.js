const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkCols() {
    const { data: off } = await supabase.from('officers').select('*').limit(1);
    console.log('OFFICER_COLS:' + JSON.stringify(Object.keys(off[0])));

    const { data: comp } = await supabase.from('complaints').select('*').limit(1);
    console.log('COMPLAINT_COLS:' + JSON.stringify(Object.keys(comp[0])));
}

checkCols();
