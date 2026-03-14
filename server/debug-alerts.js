const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAlerts() {
    const { data: alerts, error } = await supabase.from('alerts').select('*');
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('Total Alerts:', alerts.length);
    console.log('Alerts:', alerts.map(a => ({
        id: a.id,
        title: a.title,
        state_id: a.state_id,
        city_id: a.city_id
    })));
}

checkAlerts();
