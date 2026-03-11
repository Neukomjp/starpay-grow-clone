import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkStore() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const storeId = "0ad7d7d8-b2e4-4b63-9729-2f1a6428309d"; // "デモ店舗"
    
    const { data: store } = await supabase.from('stores').select('*').eq('id', storeId).single();
    console.log("Store:", JSON.stringify(store, null, 2));
}

checkStore();
