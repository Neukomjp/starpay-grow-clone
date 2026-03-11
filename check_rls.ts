import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testDelRLS() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.from('pg_policies').select('*');
    if (error) {
        console.log("Could not read pg_policies natively via REST.");
    } else {
        console.log(JSON.stringify(data.filter((d: any) => d.tablename === 'bookings'), null, 2));
    }
}

testDelRLS();
