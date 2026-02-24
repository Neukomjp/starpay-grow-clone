import { createClient } from '@/lib/supabase/client'
import { Shift } from '@/lib/types/shift'

export const shiftService = {
    async getShiftsByStaffId(staffId: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('staff_shifts')
            .select('*')
            .eq('staff_id', staffId)
            .order('day_of_week', { ascending: true })

        if (error) throw new Error(error.message)
        return data as Shift[]
    },

    async getShiftsByStoreId(storeId: string) {
        // Without staff-store mapping in staff_shifts table, we need to join with staff table
        const supabase = createClient()
        const { data: staff, error: staffError } = await supabase
            .from('staff')
            .select('id')
            .eq('store_id', storeId)

        if (staffError) throw staffError

        const staffIds = staff.map(s => s.id)
        if (staffIds.length === 0) return []

        const { data, error } = await supabase
            .from('staff_shifts')
            .select('*')
            .in('staff_id', staffIds)
            .order('day_of_week', { ascending: true })

        if (error) throw new Error(error.message)
        return data as Shift[]
    },

    async upsertShift(shiftConfig: Omit<Shift, 'id'>) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('staff_shifts')
            .upsert(shiftConfig, { onConflict: 'staff_id, day_of_week' })
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as Shift
    },

    async getShiftForDate(staffId: string, date: Date) {
        const dayOfWeek = date.getDay()
        const supabase = createClient()
        const { data, error } = await supabase
            .from('staff_shifts')
            .select('*')
            .eq('staff_id', staffId)
            .eq('day_of_week', dayOfWeek)
            .maybeSingle()

        if (error) throw new Error(error.message)
        return data as Shift | null
    }
}
