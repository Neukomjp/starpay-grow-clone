import { createClient } from '@/lib/supabase/client'
import { Service, ServiceOption } from '@/types/staff'

export const menuService = {
    async getServicesByStoreId(storeId: string, customClient?: any) {
        try {
            const supabase = customClient || createClient()
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('store_id', storeId)

            if (error) throw new Error(error.message)
            return data as Service[]
        } catch (error: any) {
            throw new Error(error.message || JSON.stringify(error))
        }
    },

    async addService(service: Omit<Service, 'id'> & { store_id: string, category?: string }) {
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('services')
                .insert([service])
                .select()
                .single()

            if (error) throw new Error(error.message)
            return data as Service
        } catch (error: any) {
            throw new Error(error.message || JSON.stringify(error))
        }
    },

    async updateService(id: string, service: Partial<Service>) {
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('services')
                .update(service)
                .eq('id', id)
                .select()
                .single()

            if (error) throw new Error(error.message)
            return data as Service
        } catch (error: any) {
            throw new Error(error.message || JSON.stringify(error))
        }
    },

    async deleteService(id: string) {
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('services')
                .delete()
                .eq('id', id)

            if (error) throw new Error(error.message)
        } catch (error: any) {
            throw new Error(error.message || JSON.stringify(error))
        }
    },

    async getOptionsByServiceId(serviceId: string) {
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('service_options')
                .select('*')
                .eq('service_id', serviceId)

            if (error) throw new Error(error.message)
            return data as ServiceOption[]
        } catch (error: any) {
            throw new Error(error.message || JSON.stringify(error))
        }
    },

    async getGlobalOptionsByStoreId(storeId: string) {
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('service_options')
                .select('*')
                .eq('store_id', storeId)
                .is('service_id', null)

            if (error) throw new Error(error.message)
            return data as ServiceOption[]
        } catch (error: any) {
            throw new Error(error.message || JSON.stringify(error))
        }
    },

    async addOption(option: Omit<ServiceOption, 'id'>) {
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('service_options')
                .insert([option])
                .select()
                .single()

            if (error) throw new Error(error.message)
            return data as ServiceOption
        } catch (error: any) {
            throw new Error(error.message || JSON.stringify(error))
        }
    },

    async deleteOption(id: string) {
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('service_options')
                .delete()
                .eq('id', id)

            if (error) throw new Error(error.message)
        } catch (error: any) {
            throw new Error(error.message || JSON.stringify(error))
        }
    }
}
