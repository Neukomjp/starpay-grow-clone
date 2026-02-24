export type Customer = {
    id: string
    store_id: string
    name: string
    name_kana?: string
    email?: string
    phone?: string
    notes?: string
    avatar_url?: string
    is_registered: boolean // true if linked to a Supabase auth user
    auth_user_id?: string // Link to public user if registered
    created_at: string
    updated_at: string
    last_visit_date?: string
    total_visits: number
    total_spent: number
}
