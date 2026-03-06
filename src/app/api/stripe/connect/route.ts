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

        // 1. Ensure the user is an owner of at least one organization
        // For simplicity, we get their first org where they are an owner.
        const { data: orgMember, error: orgMemberError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .eq('role', 'owner')
            .limit(1)
            .single()

        if (orgMemberError || !orgMember) {
            return NextResponse.json({ message: 'Organization owner not found' }, { status: 404 })
        }

        const orgId = orgMember.organization_id

        const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

        // 2. We use Stripe OAuth standard flow
        // To use state, we can pass the orgId to verify in the callback
        const state = Buffer.from(JSON.stringify({ orgId })).toString('base64')

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
