export type StoreData = {
    id: string
    merchant_id: string
    name: string
    slug: string
    description?: string
    address?: string
    phone?: string
    logo_url?: string
    cover_image_url?: string
    theme_color?: string
    booking_interval_minutes?: number
    theme_config?: Record<string, unknown>
    email_config?: {
        sender_name?: string
        sender_email?: string
        booking_confirmation?: {
            subject: string
            body: string // HTML or text template
        }
        custom_domain?: {
            id: string
            name: string
            status: string
            records: any[]
            region: string
        }
    }
    is_published: boolean
    created_at?: string
    organization_id?: string // New field for SaaS multi-tenancy
    business_days?: BusinessDayConfig[]
    cross_store_buffers?: Record<string, number>
}

export type BusinessDayConfig = {
    day_of_week: number // 0 (Sun) - 6 (Sat)
    start_time: string // "09:00"
    end_time: string // "19:00"
    is_closed: boolean
}
