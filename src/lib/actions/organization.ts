'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { organizationService } from '@/lib/services/organizations'
import { createClient } from '@/lib/supabase/server'

export async function setOrganizationAction(organizationId: string) {
    (await cookies()).set('organization-id', organizationId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: 'lax'
    })
    revalidatePath('/dashboard')
}

export async function getOrganizationAction() {
    const orgId = (await cookies()).get('organization-id')?.value
    return orgId
}

export async function createOrganizationAction(name: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    if (!userId) throw new Error('Not authenticated')

    const newOrg = await organizationService.createOrganization(name, userId, supabase)

    // Auto-select the new org
    await setOrganizationAction(newOrg.id)
    return newOrg
}

export async function getUserOrganizationsAction() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    if (!userId) return []

    return await organizationService.getUserOrganizations(userId, supabase)
}

import { Organization } from '@/lib/types/organization'

export async function updateOrganizationAction(id: string, updates: Partial<Organization>) {
    const supabase = await createClient()
    const result = await organizationService.updateOrganization(id, updates, supabase)
    revalidatePath('/dashboard/settings')
    return result
}
