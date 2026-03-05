import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
    // We need an admin client to bypass RLS in the background webhook
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Missing Supabase credentials for Webhooks')
        return NextResponse.json({ message: 'Server configuration error' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const rawBody = await req.text()
    const signature = req.headers.get('stripe-signature') as string

    // In local dev without webhook secret, or before setup, we can optionally bypass verification with a warning.
    // However, it is highly recommended to ALWAYS verify in production.
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    let event;

    try {
        if (!webhookSecret) {
            console.warn('⚠️ STRIPE_WEBHOOK_SECRET is not set. Bypassing signature verification. DO NOT DO THIS IN PRODUCTION.')
            event = JSON.parse(rawBody)
        } else {
            event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
        }
    } catch (err: any) {
        console.error(`⚠️ Webhook signature verification failed:`, err.message)
        return NextResponse.json({ message: 'Webhook error' }, { status: 400 })
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any

        // Retrieve the bookingId we stored in metadata
        const bookingId = session.metadata?.bookingId

        if (bookingId) {
            console.log(`✅ Payment received for booking: ${bookingId}`)

            // Update Supabase booking status
            const { error } = await supabaseAdmin
                .from('bookings')
                .update({
                    payment_status: 'paid',
                    status: 'confirmed'
                })
                .eq('id', bookingId)

            if (error) {
                console.error(`❌ Failed to update booking ${bookingId} in Supabase:`, error.message)
                return NextResponse.json({ message: 'Failed to update database' }, { status: 500 })
            }
        }
    }

    return NextResponse.json({ received: true })
}
