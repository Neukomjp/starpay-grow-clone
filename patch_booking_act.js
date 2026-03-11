const fs = require('fs');
const filepath = 'src/lib/actions/booking.ts';
let content = fs.readFileSync(filepath, 'utf8');

const target = `export async function deleteBookingAction(id: string) {
    await bookingService.deleteBooking(id)
    revalidatePath(\`/dashboard/bookings\`)
}`;

const replacement = `export async function deleteBookingAction(id: string) {
    const supabase = await createClient()
    await bookingService.deleteBooking(id, supabase)
    revalidatePath(\`/dashboard/bookings\`)
}`;

content = content.replace(target, replacement);

fs.writeFileSync(filepath, content);
console.log("Patched deleteBookingAction in src/lib/actions/booking.ts.");
