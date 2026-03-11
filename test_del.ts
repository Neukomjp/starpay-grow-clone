import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testDel() {
    console.log("Starting delete test...");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey);

    const { error } = await supabase.from('bookings').delete().eq('id', '480d4228-0635-4032-be52-b708c229f130')
    console.log('Delete result:', error ? error : 'Success');
}

testDel();
