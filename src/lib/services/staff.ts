import { createClient } from '@/lib/supabase/client'
import { Staff } from '@/types/staff'

export const staffService = {
    async getStaffByStoreId(storeId: string) {
        try {
            const supabase = createClient()
            // Note: Supabase returns snake_case. valid runtime props are store_id, avatar_url
            // We need to map to Staff type (camelCase)
            const { data, error } = await supabase
                .from('staff')
                .select('*')
                .eq('store_id', storeId)

            if (error) throw new Error(error.message)

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (data || []).map((s: any) => ({
                id: s.id,
                storeId: s.store_id,
                name: s.name,
                role: s.role,
                bio: s.bio,
                avatarUrl: s.avatar_url,
                specialties: s.specialties,
                serviceIds: s.service_ids || []
            })) as Staff[]
        } catch (error: any) {
            throw new Error(error.message || JSON.stringify(error))
        }
    },

    async addStaff(staff: Omit<Staff, 'id'>) {
        try {
            const supabase = createClient()

            const dbStaff = {
                store_id: staff.storeId,
                name: staff.name,
                role: staff.role,
                bio: staff.bio,
                avatar_url: staff.avatarUrl,
                specialties: staff.specialties,
                service_ids: staff.serviceIds
            }

            const { data, error } = await supabase
                .from('staff')
                .insert([dbStaff])
                .select()
                .single()

            if (error) throw new Error(error.message)

            return {
                id: data.id,
                storeId: data.store_id,
                name: data.name,
                role: data.role,
                bio: data.bio,
                avatarUrl: data.avatar_url,
                specialties: data.specialties,
                serviceIds: data.service_ids
            } as Staff
        } catch (error: any) {
            throw new Error(error.message || JSON.stringify(error))
        }
    },

    async updateStaff(id: string, updates: Partial<Staff>) {
        try {
            const supabase = createClient()

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const dbUpdates: any = {}
            if (updates.name) dbUpdates.name = updates.name
            if (updates.role) dbUpdates.role = updates.role
            if (updates.bio !== undefined) dbUpdates.bio = updates.bio
            if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl
            if (updates.specialties) dbUpdates.specialties = updates.specialties
            if (updates.serviceIds) dbUpdates.service_ids = updates.serviceIds

            const { data, error } = await supabase
                .from('staff')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw new Error(error.message)

            return {
                id: data.id,
                storeId: data.store_id,
                name: data.name,
                role: data.role,
                bio: data.bio,
                avatarUrl: data.avatar_url,
                specialties: data.specialties,
                serviceIds: data.service_ids
            } as Staff
        } catch (error: any) {
            throw new Error(error.message || JSON.stringify(error))
        }
    },

    async deleteStaff(id: string) {
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('staff')
                .delete()
                .eq('id', id)

            if (error) throw new Error(error.message)
        } catch (error: any) {
            throw new Error(error.message || JSON.stringify(error))
        }
    }
}
