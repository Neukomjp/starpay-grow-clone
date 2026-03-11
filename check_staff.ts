import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkStaff() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const storeId = "0ad7d7d8-b2e4-4b63-9729-2f1a6428309d"; // "デモ店舗"
    
    const { data: staff } = await supabase.from('staff').select('id, name').eq('store_id', storeId);
    console.log("Staff for store:", staff);
    
    // Let's check shifts
    const { data: shifts } = await supabase.from('staff_shifts').select('*').in('staff_id', staff.map((s:any) => s.id));
    console.log("Shifts for these staff:", shifts);
}

checkStaff();
