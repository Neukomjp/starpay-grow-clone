'use server'

import { Resend } from 'resend'
import { createClient } from '../supabase/server'
import { updateStoreAction } from './store'

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456')

export async function addCustomDomainAction(storeId: string, domainName: string) {
    if (!process.env.RESEND_API_KEY) {
        throw new Error('Resend API key is missing. Contact system administrator.')
    }

    // 1. Create domain in Resend
    const { data: resendData, error: resendError } = await resend.domains.create({
        name: domainName,
    })

    if (resendError || !resendData) {
        console.error('Failed to create domain in Resend:', resendError)
        throw new Error(resendError?.message || 'Failed to create domain')
    }

    // 2. Fetch current store to update its email_config
    const supabase = await createClient()
    const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('email_config')
        .eq('id', storeId)
        .single()

    if (storeError) {
        throw new Error('Store not found')
    }

    const currentConfig = store.email_config || {}
    
    // 3. Save the domain ID and records to the store's email config
    const updatedConfig = {
        ...currentConfig,
        custom_domain: {
             id: resendData.id,
             name: resendData.name,
             status: resendData.status,
             records: resendData.records,
             region: resendData.region
        }
    }

    await updateStoreAction(storeId, { email_config: updatedConfig })

    return resendData
}

export async function checkDomainStatusAction(storeId: string, domainId: string) {
    if (!process.env.RESEND_API_KEY) {
        throw new Error('Resend API key is missing. Contact system administrator.')
    }

    // 1. Get current status from Resend
    const { data, error } = await resend.domains.get(domainId)
    
    if (error || !data) {
        console.error('Failed to fetch domain status:', error)
        throw new Error(error?.message || 'Failed to fetch domain status')
    }

    // 2. Update store config if status changed
    const supabase = await createClient()
    const { data: store } = await supabase
        .from('stores')
        .select('email_config')
        .eq('id', storeId)
        .single()

    if (store && store.email_config?.custom_domain) {
        const updatedConfig = {
            ...store.email_config,
             custom_domain: {
                 ...store.email_config.custom_domain,
                 status: data.status
             }
        }
        await updateStoreAction(storeId, { email_config: updatedConfig })
    }

    return data
}

export async function verifyDomainAction(domainId: string) {
    if (!process.env.RESEND_API_KEY) {
        throw new Error('Resend API key is missing.')
    }

    const { data, error } = await resend.domains.verify(domainId)
    
    if (error || !data) {
         console.error('Failed to verify domain:', error)
         throw new Error(error?.message || 'Failed to verify domain')
    }

    return data
}
