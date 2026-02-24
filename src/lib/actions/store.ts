'use server'

import { storeService } from '@/lib/services/stores'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { StoreData } from '@/lib/types/store'

import { createClient } from '@/lib/supabase/server'

export async function getStoresAction() {
    const supabase = await createClient()
    // Attempt to get org from cookie, but in demo mode we fall back to the seed org ID
    const orgId = (await cookies()).get('organization-id')?.value || '11111111-1111-1111-1111-111111111111'
    return await storeService.getStores(orgId, supabase)
}

export async function createStoreAction(name: string, slug: string) {
    const supabase = await createClient()
    const orgId = (await cookies()).get('organization-id')?.value
    const result = await storeService.createStore(name, slug, orgId, supabase)
    revalidatePath('/dashboard/stores')
    return result
}


export async function updateStoreAction(id: string, updates: Partial<StoreData>) {
    const supabase = await createClient()
    const result = await storeService.updateStore(id, updates, supabase)
    revalidatePath(`/dashboard/stores/${id}`)
    revalidatePath(`/store/${result.slug}`)
    return result
}

export async function getStoreByIdAction(id: string) {
    const supabase = await createClient()
    return await storeService.getStoreById(id, undefined, supabase)
}
