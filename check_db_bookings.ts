import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkBookings() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // we want to see everything
    const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey);

    const storeId = "0ad7d7d8-b2e4-4b63-9729-2f1a6428309d"; // "デモ店舗"
    
    // Let's get all bookings for this store in March
    const { data: bookings, error } = await supabase
        .from('bookings')
        .select('id, start_time, status, customer_name')
        .eq('store_id', storeId)
        .gte('start_time', '2026-03-01T00:00:00Z')
        .lte('start_time', '2026-03-31T23:59:59Z');

    if (error) {
        console.error("Error fetching bookings:", error);
        return;
    }

    console.log(`Found ${bookings.length} bookings for March:`);
    bookings.forEach((b: any) => {
        console.log(`- ${b.id}: ${b.start_time} | Status: ${b.status} | Name: ${b.customer_name}`);
    });
}

checkBookings();
