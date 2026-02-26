'use server'

import { storeService } from '@/lib/services/stores'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { StoreData } from '@/lib/types/store'

import { createClient } from '@/lib/supabase/server'

export async function getStoresAction() {
    const supabase = await createClient()
    let orgId = (await cookies()).get('organization-id')?.value
    if (!orgId) {
        const { getUserOrganizationsAction } = await import('@/lib/actions/organization')
        const orgs = await getUserOrganizationsAction()
        orgId = orgs[0]?.id
    }
    // If orgId is undefined, getStores will return empty or throw if not handled, but stores.ts handles it or we pass it
    // Wait, getStores defaults to demo org if orgId is undefined. So we must pass orgId.
    if (!orgId) return []
    return await storeService.getStores(orgId, supabase)
}

export async function createStoreAction(name: string, slug: string) {
    try {
        const supabase = await createClient()

        let orgId = (await cookies()).get('organization-id')?.value
        if (!orgId) {
            const { getUserOrganizationsAction } = await import('@/lib/actions/organization')
            const orgs = await getUserOrganizationsAction()
            orgId = orgs[0]?.id
        }

        if (!orgId) {
            orgId = '11111111-1111-1111-1111-111111111111' // Demo Organization Fallback
        }

        const result = await storeService.createStore(name, slug, orgId, supabase)
        revalidatePath('/dashboard/stores')
        return result
    } catch (error: any) {
        console.error('createStoreAction failed:', error.message || error)
        throw error
    }
}


export async function updateStoreAction(id: string, updates: Partial<StoreData>) {
    const supabase = await createClient()
    try {
        const result = await storeService.updateStore(id, updates, supabase)
        revalidatePath(`/dashboard/stores/${id}`)
        revalidatePath(`/store/${result.slug}`)
        return result
    } catch (err: any) {
        console.error("updateStoreAction error:", err.message || err)
        throw err
    }
}

export async function getStoreByIdAction(id: string) {
    const supabase = await createClient()
    return await storeService.getStoreById(id, undefined, supabase)
}
