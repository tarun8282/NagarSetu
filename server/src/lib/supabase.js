const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
// Priority: SERVICE_ROLE_KEY (usually the correct one) then SUPABASE_SERVICE_ROLE_KEY
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase Server environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabase };

