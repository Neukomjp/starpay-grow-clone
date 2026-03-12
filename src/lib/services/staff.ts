import { createClient } from '@/lib/supabase/client'
import { Staff } from '@/types/staff'

export const staffService = {
    async getStaffByStoreId(storeId: string) {
        try {
            const supabase = createClient()
            // Note: Use inner join with store_staff to get staff for this store
            const { data, error } = await supabase
                .from('staff')
                .select(`
                    *,
                    store_staff!inner ( store_id )
                `)
                .eq('store_staff.store_id', storeId)

            if (error) throw new Error(error.message)

            const staffIds = data ? data.map((s: any) => s.id) : []
            let storeStaffMapping: any[] = []
            
            if (staffIds.length > 0) {
               const { data: mapping } = await supabase
                   .from('store_staff')
                   .select('staff_id, store_id')
                   .in('staff_id', staffIds)
               storeStaffMapping = mapping || []
            }

            return (data || []).map((s: any) => ({
                id: s.id,
                storeId: s.store_id,
                storeIds: storeStaffMapping.filter((m: any) => m.staff_id === s.id).map((m: any) => m.store_id),
                name: s.name,
                role: s.role,
                bio: s.bio,
                avatarUrl: s.avatar_url,
                specialties: s.specialties,
                serviceIds: s.service_ids || []
            })) as Staff[]
        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : JSON.stringify(error))
        }
    },

    async addStaff(staff: Omit<Staff, 'id'>) {
        try {
            const supabase = createClient()

            const targetStoreIds = staff.storeIds && staff.storeIds.length > 0 ? staff.storeIds : (staff.storeId ? [staff.storeId] : [])

            const dbStaff = {
                store_id: targetStoreIds[0] || null, // Keep for backward compatibility
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

            // Insert into store_staff junction table
            if (targetStoreIds.length > 0) {
                const storeStaffEntries = targetStoreIds.map(sid => ({
                    store_id: sid,
                    staff_id: data.id
                }))
                await supabase.from('store_staff').insert(storeStaffEntries)
            }

            return {
                id: data.id,
                storeId: data.store_id,
                storeIds: targetStoreIds,
                name: data.name,
                role: data.role,
                bio: data.bio,
                avatarUrl: data.avatar_url,
                specialties: data.specialties,
                serviceIds: data.service_ids
            } as Staff
        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : JSON.stringify(error))
        }
    },

    async updateStaff(id: string, updates: Partial<Staff>) {
        try {
            const supabase = createClient()

            const dbUpdates: Record<string, unknown> = {}
            if (updates.name) dbUpdates.name = updates.name
            if (updates.role) dbUpdates.role = updates.role
            if (updates.bio !== undefined) dbUpdates.bio = updates.bio
            if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl
            if (updates.specialties) dbUpdates.specialties = updates.specialties
            if (updates.serviceIds) dbUpdates.service_ids = updates.serviceIds
            
            if (updates.storeIds && updates.storeIds.length > 0) {
                dbUpdates.store_id = updates.storeIds[0]
            }

            const { data, error } = await supabase
                .from('staff')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw new Error(error.message)

            // Update junction table if storeIds provided
            if (updates.storeIds) {
                await supabase.from('store_staff').delete().eq('staff_id', id)
                if (updates.storeIds.length > 0) {
                    const storeStaffEntries = updates.storeIds.map(sid => ({
                        store_id: sid,
                        staff_id: id
                    }))
                    await supabase.from('store_staff').insert(storeStaffEntries)
                }
            }

            return {
                id: data.id,
                storeId: data.store_id,
                storeIds: updates.storeIds || [],
                name: data.name,
                role: data.role,
                bio: data.bio,
                avatarUrl: data.avatar_url,
                specialties: data.specialties,
                serviceIds: data.service_ids
            } as Staff
        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : JSON.stringify(error))
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
        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : JSON.stringify(error))
        }
    }
}
