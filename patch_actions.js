const fs = require('fs');
const filepath = 'src/lib/actions/booking.ts';
let c = fs.readFileSync(filepath, 'utf8');

if (!c.includes('unstable_noStore')) {
    c = c.replace(
        "import { revalidatePath } from 'next/cache'",
        "import { revalidatePath, unstable_noStore } from 'next/cache'"
    );
    
    c = c.replace(
        "    const supabase = await createClient()",
        "    unstable_noStore();\n    const supabase = await createClient()"
    );
    // And for getWeekly; it replaces the first occurrence, then the next.
    c = c.replace(
        "    const supabase = await createClient()",
        "    unstable_noStore();\n    const supabase = await createClient()"
    );

    // One more for createBooking
    c = c.replace(
        "    const supabase = await createClient()",
        "    unstable_noStore();\n    const supabase = await createClient()"
    );    
    fs.writeFileSync(filepath, c);
    console.log('Patched actions');
} else {
    console.log('Already patched');
}
