import Stripe from 'stripe'

const stripeKey = process.env.STRIPE_SECRET_KEY || 'dummy_key_for_build_purposes_do_not_use'

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️ STRIPE_SECRET_KEY is missing. Stripe features will fail at runtime. Please set it in your .env.local file.')
}

export const stripe = new Stripe(stripeKey, {
    apiVersion: '2025-02-24.acacia' as any, // Bypass strict string literal type while staying valid
    appInfo: {
        name: 'Salon Booking System',
        version: '0.1.0',
    },
})
