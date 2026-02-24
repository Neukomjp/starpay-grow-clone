import { createClient } from '@/lib/supabase/client'
import { VisitRecord } from '@/lib/types/visit-record'

export const visitService = {
    async getVisitRecordsAndTagsByCustomerId(storeId: string, customerId: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('visit_records')
            .select('*')
            .eq('store_id', storeId)
            .eq('customer_id', customerId)
            .order('visit_date', { ascending: false })

        if (error) throw new Error(error.message)
        return data as VisitRecord[]
    },

    async createVisitRecord(record: Omit<VisitRecord, 'id' | 'created_at' | 'updated_at'>) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('visit_records')
            .insert(record)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as VisitRecord
    },

    async updateVisitRecord(id: string, updates: Partial<VisitRecord>) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('visit_records')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as VisitRecord
    },

    async deleteVisitRecord(id: string) {
        const supabase = createClient()
        const { error } = await supabase
            .from('visit_records')
            .delete()
            .eq('id', id)

        if (error) throw new Error(error.message)
        return true
    }
}
