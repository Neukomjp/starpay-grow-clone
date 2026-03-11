const fs = require('fs');
const filepath = 'src/lib/services/bookings.ts';
let content = fs.readFileSync(filepath, 'utf8');

const target = `    async deleteBooking(id: string) {
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('bookings')
                .delete()
                .eq('id', id)

            if (error) throw new Error(error.message)
        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : JSON.stringify(error))
        }
    },`;

const replacement = `    async deleteBooking(id: string, serverClient?: any) {
        try {
            const supabase = serverClient || createClient()
            const { error } = await supabase
                .from('bookings')
                .delete()
                .eq('id', id)

            if (error) throw new Error(error.message)
        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : JSON.stringify(error))
        }
    },`;

content = content.replace(target, replacement);

fs.writeFileSync(filepath, content);
console.log("Patched bookingService.deleteBooking logic.");
