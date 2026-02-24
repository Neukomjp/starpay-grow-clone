export type VisitRecord = {
    id: string
    store_id: string
    customer_id: string
    booking_id?: string // Optional, as a visit might be recorded without a booking in some cases (e.g. walk-in)
    staff_id: string
    visit_date: string
    content: string
    photos: string[] // Array of URLs
    tags: string[]
    created_at: string
    updated_at: string
}
