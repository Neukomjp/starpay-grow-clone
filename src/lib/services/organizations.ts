import { createClient } from '@/lib/supabase/client'
import { Organization, OrganizationMember } from '@/lib/types/organization'

export const organizationService = {
    async getUserOrganizations(userId?: string, customClient?: any) {
        const supabase = customClient || createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const targetUserId = userId || user?.id
        if (!targetUserId) return []

        const { data, error } = await supabase
            .from('organization_members')
            .select('*, organization:organizations(*)')
            .eq('user_id', targetUserId)

        if (error) throw new Error(error.message)
        return data.map((m: any) => ({ ...m.organization, role: m.role })) as (Organization & { role: string })[]
    },

    async createOrganization(name: string, userId: string, customClient?: any): Promise<Organization> {
        const supabase = customClient || createClient()
        const baseSlug = name.toLowerCase().replace(/\s+/g, '-')
        const orgId = crypto.randomUUID()
        const slug = `${baseSlug}-${orgId.slice(0, 8)}`

        // 1. Create Organization (Do not .select() because RLS block reading until member is created)
        const { error: orgError } = await supabase
            .from('organizations')
            .insert([{ id: orgId, name, slug, plan: 'free' }])

        if (orgError) throw orgError

        // 2. Create Member
        const { error: memberError } = await supabase
            .from('organization_members')
            .insert([{
                organization_id: orgId,
                user_id: userId,
                role: 'owner'
            }])

        if (memberError) throw memberError

        // 3. Return constructed result
        return {
            id: orgId,
            name,
            slug,
            plan: 'free',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        } as Organization
    },

    async getOrganizationById(id: string, customClient?: any) {
        const supabase = customClient || createClient()
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw new Error(error.message)
        return data as Organization
    },

    async updateOrganization(id: string, updates: Partial<Organization>, customClient?: any) {
        const supabase = customClient || createClient()
        const { data, error } = await supabase
            .from('organizations')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as Organization
    }
}
