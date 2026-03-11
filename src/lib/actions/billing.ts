'use server'

import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { getOrganizationAction } from '@/lib/actions/organization'

export async function createBillingPortalSessionAction() {
    try {
        const supabase = await createClient()

        // 1. Get the current user's active organization
        const organizationId = await getOrganizationAction()
        if (!organizationId) {
            throw new Error('Organization not found')
        }

        // 2. Fetch the organization to see if they have a customer ID
        const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('name, stripe_customer_id')
            .eq('id', organizationId)
            .single()

        if (orgError || !orgData) {
            throw new Error('Failed to fetch organization details')
        }

        let customerId = orgData.stripe_customer_id

        // 3. If no stripe_customer_id, create one in Stripe
        if (!customerId) {
            const { data: { user } } = await supabase.auth.getUser()
            
            const customer = await stripe.customers.create({
                name: orgData.name,
                email: user?.email,
                metadata: {
                    organization_id: organizationId
                }
            })
            
            customerId = customer.id

            // Save to database
            const { error: updateError } = await (await createClient())
                .from('organizations')
                .update({ stripe_customer_id: customerId })
                .eq('id', organizationId)

            if (updateError) {
                console.error("Failed to save new stripe customer id:", updateError)
                throw new Error('Failed to link billing account')
            }
        }

        // 4. Create a billing portal session
        // Get the absolute base URL based on Vercel environment
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
        
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${baseUrl}/dashboard/settings`,
        })

        return { url: session.url }
    } catch (error: any) {
        console.error('createBillingPortalSessionAction Error:', error)
        return { error: error.message || 'Failed to create billing session' }
    }
}
