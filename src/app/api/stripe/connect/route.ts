import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        // 1. Ensure the user is an owner and get their store
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('id, stripe_account_id')
            .eq('owner_id', user.id)
            .single()

        if (storeError || !store) {
            return NextResponse.json({ message: 'Store not found' }, { status: 404 })
        }

        const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

        // 2. We use Stripe OAuth standard flow
        // To use state, we can pass the storeId to verify in the callback
        const state = Buffer.from(JSON.stringify({ storeId: store.id })).toString('base64')

        // Generate the Connect URL
        const clientId = process.env.STRIPE_CLIENT_ID // Usually starts with ca_

        if (!clientId) {
            console.error('STRIPE_CLIENT_ID is missing from environment variables.')
            return NextResponse.json({ message: 'Stripe configuration missing' }, { status: 500 })
        }

        const stripeConnectUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&state=${state}&redirect_uri=${origin}/api/stripe/callback`

        return NextResponse.json({ url: stripeConnectUrl })

    } catch (error: any) {
        console.error('Stripe Connect error:', error)
        return NextResponse.json(
            { message: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
