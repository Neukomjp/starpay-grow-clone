const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: staffData, error: err1 } = await supabase.from('staff').select('id, store_id').limit(1);
  if (err1) throw err1;
  const staff = staffData[0];
  console.log('Testing with staff:', staff.id);
  
  const payload1 = { staff_id: staff.id, day_of_week: 1, store_id: staff.store_id, start_time: '10:00:00', end_time: '12:00:00', is_holiday: false };
  const res1 = await supabase.from('staff_shifts').insert(payload1);
  console.log('Insert 1 error:', res1.error);
  
  const { data: storeData } = await supabase.from('stores').select('id').neq('id', staff.store_id).limit(1);
  const payload2 = { staff_id: staff.id, day_of_week: 1, store_id: storeData[0].id, start_time: '12:00:00', end_time: '14:00:00', is_holiday: false };
  const res2 = await supabase.from('staff_shifts').insert(payload2);
  console.log('Insert 2 error:', res2.error);

  await supabase.from('staff_shifts').delete().eq('staff_id', staff.id).eq('day_of_week', 1);
}

run();
