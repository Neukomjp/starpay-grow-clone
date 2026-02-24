import { createClient } from '@/lib/supabase/client'
import { StoreData } from '@/lib/types/store'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const storeService = {
    async getStores(organizationId?: string, customClient?: any) {
        // Use a generic client to avoid strict SSR auth requirements if only reading public/org data
        const supabase = customClient || createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        let query = supabase
            .from('stores')
            .select('*')
            .order('created_at', { ascending: false })

        if (organizationId) {
            query = query.eq('organization_id', organizationId)
        } else {
            // For Demo Login, use the known demo UUID if no auth user is found
            query = query.eq('organization_id', '11111111-1111-1111-1111-111111111111')
        }

        const { data, error } = await query
        if (error) {
            throw new Error(`Failed to fetch stores: ${error.message}`)
        }
        return data as StoreData[]
    },

    async getStoreById(id: string, organizationId?: string, customClient?: any) {
        const supabase = customClient || createClient()
        let query = supabase
            .from('stores')
            .select('*')
            .eq('id', id)

        if (organizationId) {
            query = query.eq('organization_id', organizationId)
        }

        const { data, error } = await query.single()
        if (error) throw new Error(error.message)
        return data as StoreData
    },

    async getStoreBySlug(slug: string, customClient?: any) {
        const supabase = customClient || createClient()
        const { data, error } = await supabase
            .from('stores')
            .select('*')
            .eq('slug', slug)
            .eq('is_published', true)
            .single()

        if (error) throw new Error(error.message)
        return data as StoreData
    },

    async createStore(name: string, slug: string, organizationId?: string, customClient?: any) {
        const supabase = customClient || createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            throw new Error('Not authenticated')
        }

        const storeId = crypto.randomUUID()
        const uniqueSlug = `${slug}-${storeId.slice(0, 8)}`

        const { data, error } = await supabase
            .from('stores')
            .insert([
                {
                    id: storeId,
                    name,
                    slug: uniqueSlug,
                    merchant_id: user.id,
                    organization_id: organizationId
                }
            ])
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data
    },

    async updateStore(id: string, updates: Partial<StoreData>, customClient?: any) {
        const supabase = customClient || createClient()
        const { data, error } = await supabase
            .from('stores')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data
    }
}
