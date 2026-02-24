
export type PaymentMethod = 'local' | 'card' | 'paypay'
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded'

export interface PaymentIntent {
    id: string
    amount: number
    status: 'pending' | 'succeeded' | 'failed'
    client_secret?: string // For Stripe
}

export const paymentService = {
    async createPaymentIntent(amount: number, method: PaymentMethod): Promise<PaymentIntent> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        if (method === 'local') {
            return {
                id: `local_pi_${Date.now()}`,
                amount,
                status: 'succeeded' // Local payment is just a reservation confirmation
            }
        }

        // Mock external payment provider (Stripe/PayPay)
        const isSuccess = Math.random() > 0.1 // 90% success rate for demo

        if (isSuccess) {
            return {
                id: `pi_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                amount,
                status: 'succeeded',
                client_secret: 'mock_client_secret_123'
            }
        } else {
            throw new Error('Payment failed due to mock decline')
        }
    },

    async processMockPayment(_intentId: string): Promise<boolean> {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1500))
        return true
    }
}
