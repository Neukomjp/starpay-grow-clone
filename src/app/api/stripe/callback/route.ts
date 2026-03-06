import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
    try {
        // We need an admin client to update the store securely since this is a callback
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !serviceRoleKey) {
            console.error('Missing Supabase credentials for Callback')
            return NextResponse.json({ message: 'Server configuration error' }, { status: 500 })
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

        const { searchParams } = new URL(req.url)
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')
        const error_description = searchParams.get('error_description')

        const origin = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

        if (error) {
            console.error('Stripe Connect Error:', error, error_description)
            return NextResponse.redirect(`${origin}/dashboard/settings?stripe_error=true`)
        }

        if (!code || !state) {
            return NextResponse.redirect(`${origin}/dashboard/settings?stripe_error=missing_params`)
        }

        // Decode the state to get the internal organization ID
        let decodedState: { orgId: string }
        try {
            decodedState = JSON.parse(Buffer.from(state, 'base64').toString('ascii'))
        } catch (e) {
            console.error('Invalid state payload')
            return NextResponse.redirect(`${origin}/dashboard/settings?stripe_error=invalid_state`)
        }

        // Exchange the authorization code for an account ID
        const response = await stripe.oauth.token({
            grant_type: 'authorization_code',
            code,
        })

        const connectedAccountId = response.stripe_user_id

        if (!connectedAccountId) {
            throw new Error('No stripe_user_id returned from OAuth token exchange')
        }

        // Update the Supabase organization record with the new stripe_account_id
        const { error: dbError } = await supabaseAdmin
            .from('organizations')
            .update({ stripe_account_id: connectedAccountId })
            .eq('id', decodedState.orgId)

        if (dbError) {
            console.error('Supabase update error:', dbError)
            return NextResponse.redirect(`${origin}/dashboard/settings?stripe_error=db_update_failed`)
        }

        // Redirect back to settings with success
        return NextResponse.redirect(`${origin}/dashboard/settings?stripe_success=true`)

    } catch (error: any) {
        const origin = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        console.error('Stripe OAuth Callback Exception:', error)
        return NextResponse.redirect(`${origin}/dashboard/settings?stripe_error=exception`)
    }
}
