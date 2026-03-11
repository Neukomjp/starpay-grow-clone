const fs = require('fs');
const filepath = 'src/lib/actions/booking.ts';
let c = fs.readFileSync(filepath, 'utf8');

// Fix the multiple unstable_noStore()
c = c.replace(/unstable_noStore\(\);\s*unstable_noStore\(\);\s*unstable_noStore\(\);/g, 'unstable_noStore();');

// Ensure unstable_noStore() is in getWeeklyAvailabilityAction
if (!c.includes('unstable_noStore();\n    const supabase = await createClient()', c.indexOf('getWeeklyAvailabilityAction'))) {
    const searchStr = 'export async function getWeeklyAvailabilityAction(';
    const bodyStart = c.indexOf('{', c.indexOf(searchStr)) + 1;
    c = c.slice(0, bodyStart) + '\n    unstable_noStore();' + c.slice(bodyStart);
}

fs.writeFileSync(filepath, c);
console.log('Fixed actions file.');
