export type TicketMaster = {
    id: string
    store_id: string
    name: string // e.g. "General Cut 5-Pack"
    price: number
    total_uses: number // e.g. 5
    valid_days: number // e.g. 180 (days)
    description?: string
    is_active: boolean
    created_at: string
}

export type CustomerTicket = {
    id: string
    customer_id: string
    ticket_master_id: string
    name: string // Snapshot of master name
    remaining_uses: number
    purchase_date: string
    expires_at: string
    status: 'active' | 'used_up' | 'expired'
}
