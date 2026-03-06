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

        // 1. Get the merchant ID of the store
        const { data: storeData } = await supabase
            .from('stores')
            .select('merchant_id')
            .eq('id', storeId)
            .single()

        if (!storeData?.merchant_id) {
            return NextResponse.json({ message: '店舗が見つかりません。' }, { status: 404 })
        }

        // 2. Find the organization where this merchant is the owner
        const { data: orgMember } = await supabase
            .from('organization_members')
            .select('organization:organizations(stripe_account_id)')
            .eq('user_id', storeData.merchant_id)
            .eq('role', 'owner')
            .limit(1)
            .single()

        const stripeAccountId = (orgMember?.organization as any)?.stripe_account_id

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
