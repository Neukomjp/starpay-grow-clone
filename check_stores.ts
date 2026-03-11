import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkStores() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: stores, error } = await supabase.from('stores').select('id, name, slug');
    console.log("Stores:", stores);

    const { data: bookings } = await supabase.from('bookings').select('id, store_id, start_time');
    
    const storeMap = new Map();
    stores?.forEach((s: any) => storeMap.set(s.id, s.name));

    console.log("\nBookings:");
    bookings?.forEach((b: any) => {
        console.log(`- Date: ${b.start_time}, Store: ${storeMap.get(b.store_id) || 'Unknown'} (${b.store_id})`);
    });
}
checkStores();
