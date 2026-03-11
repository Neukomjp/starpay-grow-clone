import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkBookings() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    console.log("Checking...", supabaseUrl.substring(0, 20));

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching bookings:', error);
    } else {
        const fs = require('fs');
        fs.writeFileSync('debug_bookings.json', JSON.stringify(data, null, 2));
        console.log('Bookings written to debug_bookings.json');
    }
}

checkBookings();
