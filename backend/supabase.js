const { createClient } = require('@supabase/supabase-js');
const path = require('path');
// Cek di folder backend maupun di folder root
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('CRITICAL ERROR: Supabase URL or Service Role Key is missing in .env!');
    console.log('Current URL:', supabaseUrl ? 'OK' : 'MISSING');
    console.log('Current Key:', supabaseServiceRoleKey ? 'OK' : 'MISSING');
} else {
    console.log('Supabase initialized with URL:', supabaseUrl);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

module.exports = supabase;
