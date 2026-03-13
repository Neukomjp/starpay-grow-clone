import { createClient } from '@/lib/supabase/server'
import { Shift, ShiftException } from '@/lib/types/shift'

export const shiftService = {
    async getShiftsByStaffId(staffId: string) {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('staff_shifts')
            .select('*')
            .eq('staff_id', staffId)
            .order('day_of_week', { ascending: true })

        if (error) throw new Error(error.message)
        return data as Shift[]
    },

    async getShiftsByStaffAndStore(staffId: string, storeId: string) {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('staff_shifts')
            .select('*')
            .eq('staff_id', staffId)
            .eq('store_id', storeId)
            .order('start_time', { ascending: true })

        if (error) throw new Error(error.message)
        return data as Shift[]
    },

    async getShiftsByStoreId(storeId: string) {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('staff_shifts')
            .select('*')
            .eq('store_id', storeId)
            .order('day_of_week', { ascending: true })

        if (error) throw new Error(error.message)
        return data as Shift[]
    },

    async saveWeeklyShifts(staffId: string, storeId: string, shifts: Omit<Shift, 'id'>[]) {
        const supabase = await createClient()
        
        // Delete all normal shifts for this staff at this store
        const { error: deleteError } = await supabase
            .from('staff_shifts')
            .delete()
            .eq('staff_id', staffId)
            .eq('store_id', storeId)
            
        if (deleteError) throw new Error(deleteError.message)
        
        if (shifts.length > 0) {
            const { data, error } = await supabase
                .from('staff_shifts')
                .insert(shifts)
                .select()

            if (error) throw new Error(error.message)
            return data as Shift[]
        }
        return []
    },

    async getShiftForDate(staffId: string, date: Date) {
        const dayOfWeek = date.getDay()
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('staff_shifts')
            .select('*')
            .eq('staff_id', staffId)
            .eq('day_of_week', dayOfWeek)
            .maybeSingle()

        if (error) throw new Error(error.message)
        return data as Shift | null
    },

    // --- Shift Exceptions ---

    async getShiftExceptionsByStoreId(storeId: string, startDate?: string, endDate?: string) {
        const supabase = await createClient()
        let query = supabase
            .from('staff_shift_exceptions')
            .select('*')
            .eq('store_id', storeId)
            .order('date', { ascending: true })

        if (startDate) {
            query = query.gte('date', startDate)
        }
        if (endDate) {
            query = query.lte('date', endDate)
        }

        const { data, error } = await query

        if (error) throw new Error(error.message)
        return data as ShiftException[]
    },

    async upsertShiftException(exceptionConfig: Omit<ShiftException, 'id'>) {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('staff_shift_exceptions')
            .upsert(exceptionConfig, { onConflict: 'staff_id, date' })
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as ShiftException
    },

    async deleteShiftException(staffId: string, date: string) {
        const supabase = await createClient()
        const { error } = await supabase
            .from('staff_shift_exceptions')
            .delete()
            .eq('staff_id', staffId)
            .eq('date', date)

        if (error) throw new Error(error.message)
        return true
    }
}
