import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
import { bookingService } from './src/lib/services/bookings';
const fs = require('fs');

async function testAvailability() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: stores } = await supabase.from('stores').select('id, name');
    const targetStore = stores.find((s: any) => s.name === "テストカンパニー");
    
    if (!targetStore) {
        console.log("Store 'テストカンパニー' not found");
        return;
    }

    const storeId = targetStore.id; // Target store ID based on name "テストカンパニー"
    const date = new Date('2026-03-13T00:00:00+09:00'); // March 13th in local time

    const durationMinutes = 60; // Assume 60 min service
    const staffId = 'no-preference';

    try {
        const slots = await bookingService.getAvailableTimeSlots(storeId, date, durationMinutes, staffId, 0, 0, supabase);
        
        let out = { slots, bookings: [] };
        // Fetch raw UTC strings from DB
        const { data: bookings } = await supabase.from('bookings').select('start_time, end_time, status').eq('store_id', storeId).gte('start_time', '2026-03-12T15:00:00+00:00').lte('start_time', '2026-03-13T15:00:00+00:00');
        out.bookings = bookings || [];

        fs.writeFileSync('debug_slots.json', JSON.stringify(out, null, 2));
        console.log("Wrote to debug_slots.json");
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

testAvailability();
