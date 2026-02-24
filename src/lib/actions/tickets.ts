'use server'

import { ticketService } from '@/lib/services/tickets'
import { TicketMaster, CustomerTicket } from '@/lib/types/ticket'
import { revalidatePath } from 'next/cache'

export async function getTicketMastersAction(storeId: string) {
    return await ticketService.getTicketMasters(storeId)
}

export async function createTicketMasterAction(data: Omit<TicketMaster, 'id' | 'created_at'>) {
    // params needs to be Omit<TicketMaster, 'id' | 'created_at'>
    // define type inline or just use any/Omit
    const result = await ticketService.createTicketMaster(data)
    revalidatePath('/dashboard/stores/[id]') // Revalidate might be tricky with dynamic ID, but general path is okay
    return result
}

export async function updateTicketMasterAction(id: string, updates: Partial<TicketMaster>) {
    const result = await ticketService.updateTicketMaster(id, updates)
    revalidatePath('/dashboard/stores/[id]')
    return result
}

export async function getCustomerTicketsAction(customerId: string) {
    return await ticketService.getCustomerTickets(customerId)
}

export async function issueTicketToCustomerAction(customerId: string, ticketMasterId: string) {
    const result = await ticketService.issueTicketToCustomer(customerId, ticketMasterId)
    revalidatePath(`/dashboard/customers/${customerId}`)
    return result
}

export async function consumeTicketAction(customerTicketId: string) {
    const result = await ticketService.consumeTicket(customerTicketId)
    // We might need to revalidate the customer page
    // revalidatePath(`/dashboard/customers/[id]`) - hard to know ID here without passing it or fetching it.
    // For now, client Update is fine, or we return the result.
    return result
}

import { customerService } from '@/lib/services/customers'

export async function purchaseTicketAction(storeId: string, ticketMasterId: string, customerInfo: { name: string, email: string, phone: string }) {
    // 1. Find or Create Customer
    const customers = await customerService.getCustomers(storeId)
    let customer = customers.find(c => c.email === customerInfo.email)

    if (!customer) {
        customer = await customerService.createCustomer({
            store_id: storeId,
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
            is_registered: false // Guest purchase
        })
    }

    // 2. Issue Ticket
    const result = await ticketService.issueTicketToCustomer(customer.id, ticketMasterId)

    // 3. Log Transaction
    await ticketService.logTransaction({
        store_id: storeId,
        customer_id: customer.id,
        ticket_master_id: ticketMasterId,
        customer_ticket_id: result.id,
        amount: 0, // Ideally fetch price from master
        type: 'purchase',
        created_at: new Date().toISOString()
    })

    // 4. Send Email
    // Fetch Master for details
    const masters = await ticketService.getTicketMasters(storeId)
    const master = masters.find(m => m.id === ticketMasterId)

    if (master && customer.email) {
        const html = `
            <h1>回数券のご購入ありがとうございます</h1>
            <p>${customer.name} 様</p>
            <p>以下の回数券の購入が完了しました。</p>
            <div style="padding: 20px; border: 1px solid #ccc; border-radius: 8px; margin: 20px 0;">
                <h2>${master.name}</h2>
                <p>価格: ¥${master.price.toLocaleString()}</p>
                <p>回数: ${master.total_uses}回</p>
                <p>有効期限: ${new Date(result.expires_at).toLocaleDateString('ja-JP')}</p>
            </div>
            <p>店頭にてスタッフにこのメールまたはマイページをご提示ください。</p>
            <p>サロン予約システム</p>
        `

        try {
            // Dynamically import to avoid edge case issues or circular deps if any
            const { sendEmail } = await import('@/lib/email')
            await sendEmail({
                to: customer.email,
                subject: '【サロン予約システム】回数券購入完了のお知らせ',
                html: html
            })
        } catch (e) {
            console.error('Failed to send ticket email:', e)
        }
    }

    revalidatePath(`/dashboard/customers/${customer.id}`)
    return result
}
