import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { bookingId, amount, serviceName, storeName, storeId, customerEmail } = body

        if (!bookingId || !amount || !storeId) {
            return NextResponse.json(
                { message: 'Missing required parameters' },
                { status: 400 }
            )
        }

        const supabase = await createClient()
        const { data: storeData } = await supabase
            .from('stores')
            .select('stripe_account_id')
            .eq('id', storeId)
            .single()

        const stripeAccountId = storeData?.stripe_account_id

        if (!stripeAccountId) {
            console.error('Store does not have a connected Stripe account')
            return NextResponse.json({ message: '決済の準備ができていない店舗です。' }, { status: 400 })
        }

        // We use the absolute URL of the current request domain to build success/cancel URLs
        const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

        // Prepare line items for Stripe Checkout
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: customerEmail || undefined,
            line_items: [
                {
                    price_data: {
                        currency: 'jpy',
                        product_data: {
                            name: `${storeName} - ${serviceName}`,
                            description: `予約ID: ${bookingId}`,
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${origin}/store/${storeId}/thanks?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
            cancel_url: `${origin}/store/${storeId}/cancel?booking_id=${bookingId}`,
            metadata: {
                bookingId: bookingId,
                storeName: storeName
            },
        }, {
            stripeAccount: stripeAccountId
        })

        if (!session.url) {
            throw new Error('Failed to generate Stripe session URL')
        }

        return NextResponse.json({ url: session.url })
    } catch (err: any) {
        console.error('Stripe Checkout Error:', err)
        return NextResponse.json(
            { message: err.message || 'Error creating checkout session' },
            { status: 500 }
        )
    }
}
