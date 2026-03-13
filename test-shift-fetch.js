const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const url = urlMatch[1].trim();
const key = keyMatch[1].trim();

async function run() {
    // 1. Get a staff member
    let res = await fetch(url + '/rest/v1/staff?select=id,store_id&limit=1', {
        headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
    });
    const staffData = await res.json();
    const staffId = staffData[0].id;
    const originalStoreId = staffData[0].store_id;
    
    // 2. Insert shift 1
    const p1 = { staff_id: staffId, store_id: originalStoreId, day_of_week: 1, start_time: '10:00:00', end_time: '12:00:00', is_holiday: false };
    res = await fetch(url + '/rest/v1/staff_shifts', {
        method: 'POST',
        headers: { 'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify(p1)
    });
    console.log('Insert 1:', await res.text());
    
    // 3. Get a different store 
    res = await fetch(url + '/rest/v1/stores?select=id&id=neq.' + originalStoreId + '&limit=1', {
        headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
    });
    const storeData = await res.json();
    const otherStoreId = storeData[0].id;
    
    // 4. Insert shift 2
    const p2 = { staff_id: staffId, store_id: otherStoreId, day_of_week: 1, start_time: '14:00:00', end_time: '18:00:00', is_holiday: false };
    res = await fetch(url + '/rest/v1/staff_shifts', {
        method: 'POST',
        headers: { 'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify(p2)
    });
    console.log('Insert 2:', await res.text());
    
    // Cleanup
    await fetch(url + '/rest/v1/staff_shifts?staff_id=eq.' + staffId + '&day_of_week=eq.1', {
        method: 'DELETE',
        headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
    });
}
run();
