import { createClient } from '@/lib/supabase/client'
import { Organization } from '@/lib/types/organization'

export const organizationService = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        return data.map((m: Record<string, unknown>) => ({ ...(m.organization as Record<string, unknown>), role: m.role })) as (Organization & { role: string })[]
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getOrganizationMembers(organizationId: string, customClient?: any) {
        const supabase = customClient || createClient()
        // 1. Fetch members
        const { data: members, error } = await supabase
            .from('organization_members')
            .select('*')
            .eq('organization_id', organizationId)
            .order('joined_at', { ascending: true })

        if (error) throw new Error(error.message)
        if (!members || members.length === 0) return []

        // 2. Fetch profiles for these members
        const userIds = members.map((m: Record<string, unknown>) => m.user_id)
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone')
            .in('id', userIds)

        if (profilesError) {
            console.error('Failed to fetch profiles for members', profilesError)
            // Return members without profiles if fetching profiles fails (e.g. RLS issues)
            return members
        }

        // 3. Map profiles to members
        const profileMap = new Map(profiles?.map((p: Record<string, unknown>) => [p.id, p]) || [])
        return members.map((m: Record<string, unknown>) => ({
            ...m,
            profile: profileMap.get(m.user_id) || null
        }))
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async updateMemberRole(organizationId: string, memberId: string, newRole: string, customClient?: any) {
        const supabase = customClient || createClient()
        const { error } = await supabase
            .from('organization_members')
            .update({ role: newRole })
            .eq('organization_id', organizationId)
            .eq('id', memberId)

        if (error) throw new Error(error.message)
        return true
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async removeMember(organizationId: string, memberId: string, customClient?: any) {
        const supabase = customClient || createClient()
        const { error } = await supabase
            .from('organization_members')
            .delete()
            .eq('organization_id', organizationId)
            .eq('id', memberId)

        if (error) throw new Error(error.message)
        return true
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async inviteMember(organizationId: string, email: string, role: string) {
        // Use the admin client (Service Role Key) specifically for inviting,
        // because standard users cannot read other users' emails from the profiles table due to RLS.
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 1. Find user by email from profiles table bypassing RLS
        const { data: profile, error: profileError } = await adminSupabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single()

        if (profileError || !profile) {
            throw new Error('指定されたメールアドレスのユーザーが見つかりません。先にシステムにサインアップしてもらう必要があります。')
        }

        // 2. Check if already a member
        const { data: existingMember } = await adminSupabase
            .from('organization_members')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('user_id', profile.id)
            .single()

        if (existingMember) {
            throw new Error('このユーザーは既にメンバーです。')
        }

        // 3. Add member
        const { data: member, error: memberError } = await adminSupabase
            .from('organization_members')
            .insert([{
                organization_id: organizationId,
                user_id: profile.id,
                role: role
            }])
            .select()
            .single()

        if (memberError) {
            throw new Error(memberError.message)
        }

        return member
    }
}
