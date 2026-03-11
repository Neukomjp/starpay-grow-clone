const fs = require('fs');
const filepath = 'src/lib/actions/booking.ts';
let content = fs.readFileSync(filepath, 'utf8');

const target = `export async function deleteBookingAction(id: string) {
    const supabase = await createClient()
    await bookingService.deleteBooking(id, supabase)
    revalidatePath(\`/dashboard/bookings\`)
}`;

const replacement = `export async function deleteBookingAction(id: string) {
    console.log("========== DELETE ACTION TRIGGERED FOR BOOKING:", id, "==========");
    const supabase = await createClient()
    
    // Debug Auth Session
    const { data: session } = await supabase.auth.getSession();
    console.log("Current delete session user:", session?.session?.user?.id || 'NO SESSION');

    try {
        await bookingService.deleteBooking(id, supabase)
        console.log("Delete service function completed without throwing.");
    } catch(err) {
        console.error("Delete service function THREW ERROR:", err);
    }
    revalidatePath(\`/dashboard/bookings\`)
}`;

content = content.replace(target, replacement);

fs.writeFileSync(filepath, content);
console.log("Patched deleteBookingAction with console.logs.");
