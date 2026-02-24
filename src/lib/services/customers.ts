import { createClient } from '@/lib/supabase/client'
import { Customer } from '@/lib/types/customer'

export const customerService = {
    async getCustomers(storeId: string, query?: string) {
        const supabase = createClient()

        let dbQuery = supabase
            .from('customers')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false })

        if (query) {
            dbQuery = dbQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
        }

        const { data, error } = await dbQuery

        if (error) throw new Error(error.message)
        return data as Customer[]
    },

    async getCustomerById(id: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw new Error(error.message)
        return data as Customer
    },

    async createCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'total_visits' | 'total_spent'>) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('customers')
            .insert([customer])
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as Customer
    },

    async updateCustomer(id: string, updates: Partial<Customer>) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('customers')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as Customer
    },

    async getCustomerByEmail(email: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('email', email)
            .single()

        if (error) return null
        return data as Customer
    }
}
