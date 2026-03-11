import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'

async function checkDashboardFetch() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date()
    const startDate = startOfWeek(startOfMonth(today), { weekStartsOn: 1 })
    const endDate = endOfWeek(endOfMonth(today), { weekStartsOn: 1 })

    console.log("Fetching for range:", startDate.toISOString(), "to", endDate.toISOString())

    // Emulate what bookingService does
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            id,
            start_time,
            end_time,
            customer_name,
            store_id
        `)
        // .eq('store_id', '0ad7d7d8-b2e4-4b63-9729-2f1a6428309d') // we can omit to see all
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time', { ascending: true })

    if (error) {
        console.error('Error fetching bookings:', error);
    } else {
        console.log(`Found ${data.length} bookings in range:`);
        data.forEach((b: any) => {
            console.log(`- ID: ${b.id.substring(0,8)}, Customer: ${b.customer_name}, Date: ${b.start_time}`);
        });
    }
}

checkDashboardFetch();
