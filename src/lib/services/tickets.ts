import { createClient } from '@/lib/supabase/client'
import { TicketMaster, CustomerTicket } from '@/lib/types/ticket'

export const ticketService = {
    // --- Ticket Masters ---

    async getTicketMasters(storeId: string, customClient?: any) {
        const supabase = customClient || createClient()
        const { data, error } = await supabase
            .from('ticket_masters')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false })

        if (error) throw new Error(error.message)
        return data as TicketMaster[]
    },

    async createTicketMaster(master: Omit<TicketMaster, 'id' | 'created_at'>) {
        const supabase = createClient()
        // Real DB insert
        const { data, error } = await supabase
            .from('ticket_masters')
            .insert([master])
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as TicketMaster
    },

    async updateTicketMaster(id: string, updates: Partial<TicketMaster>) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('ticket_masters')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as TicketMaster
    },

    // --- Customer Tickets ---

    async getCustomerTickets(customerId: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('customer_tickets')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false })

        if (error) throw new Error(error.message)
        return data as CustomerTicket[]
    },

    async issueTicketToCustomer(customerId: string, ticketMasterId: string) {
        const supabase = createClient()

        // 1. Get Master to know details
        const { data: master, error: masterError } = await supabase
            .from('ticket_masters')
            .select('*')
            .eq('id', ticketMasterId)
            .single()

        if (masterError || !master) throw new Error('Ticket Master not found')

        // 2. Calculate expiry
        const now = new Date()
        const expiresAt = new Date(now)
        expiresAt.setDate(expiresAt.getDate() + master.valid_days)

        // 3. Create Record
        const { data, error } = await supabase
            .from('customer_tickets')
            .insert([{
                customer_id: customerId,
                ticket_master_id: ticketMasterId,
                name: master.name,
                remaining_uses: master.total_uses,
                purchase_date: now.toISOString(),
                expires_at: expiresAt.toISOString(),
                status: 'active'
            }])
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as CustomerTicket
    },

    async consumeTicket(customerTicketId: string) {
        const supabase = createClient()

        const { data: ticket, error: fetchError } = await supabase
            .from('customer_tickets')
            .select('*')
            .eq('id', customerTicketId)
            .single()

        if (fetchError || !ticket) throw new Error('Ticket not found')

        if (ticket.remaining_uses <= 0) throw new Error('No remaining uses')
        if (new Date(ticket.expires_at) < new Date()) throw new Error('Ticket expired')

        ticket.remaining_uses -= 1
        if (ticket.remaining_uses === 0) {
            ticket.status = 'used_up'
        }

        const { data, error } = await supabase
            .from('customer_tickets')
            .update({ remaining_uses: ticket.remaining_uses, status: ticket.status })
            .eq('id', customerTicketId)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as CustomerTicket
    },

    async logTransaction(transaction: any) {
        console.log('[Supabase DB] Log Transaction:', transaction)
        // In a real app, we would insert into 'ticket_transactions' table
    }
}
