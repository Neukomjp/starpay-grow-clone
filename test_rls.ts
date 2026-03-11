import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testDelRLS() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Login as a merchant to simulate the dashboard
    // We need an email and password or just use the admin user ID to force token?
    // Let's first check if we can delete using the anon key (which should fail)
    const { error: anonError } = await supabase.from('bookings').delete().eq('id', 'f379f69c-8409-4e2a-aefb-7a3a764eed60')
    console.log('Anon delete result:', anonError ? anonError.message : 'Success (WARNING: Should fail!)');

    // To test auth, we need a valid session. We can use the service role to simulate auth if we knew how to mock JWT
    // But let's check the SQL schema directly from Supabase
    const serviceClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey);
    const { data: policies, error: pError } = await serviceClient.rpc('get_policies'); // If we had a rpc
    if (pError) {
        // Fallback: check pg_policies
        const { data, error } = await serviceClient.from('pg_policies').select('*').eq('tablename', 'bookings');
        console.log("Policies:", data || error);
    }
}

testDelRLS();
