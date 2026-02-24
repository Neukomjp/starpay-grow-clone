export type Coupon = {
    id: string
    store_id: string
    code: string
    name: string
    discount_amount: number
    discount_type: 'fixed' | 'percent' // fixed amount (e.g. 1000 yen) or percentage (e.g. 10%)
    starts_at: string
    expires_at: string
    is_active: boolean
    created_at: string
}
