import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
import { bookingService } from './src/lib/services/bookings';
const fs = require('fs');

async function testAvailability() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const storeId = "0ad7d7d8-b2e4-4b63-9729-2f1a6428309d"; // The active "テストカンパニー"
    const date = new Date('2026-03-11T00:00:00+09:00'); // Note: Week start date in local JST

    const durationMinutes = 60; // Assume 60 min service
    const staffId = undefined; // Try undefined, which WeeklyCalendar sends if "no-preference"

    try {
        const slots = await bookingService.getWeeklyAvailability(storeId, date, durationMinutes, staffId, 0, 0, 7, supabase);
        fs.writeFileSync('debug_weekly.json', JSON.stringify(slots, null, 2));
        console.log("Wrote week availability to debug_weekly.json");
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

testAvailability();
