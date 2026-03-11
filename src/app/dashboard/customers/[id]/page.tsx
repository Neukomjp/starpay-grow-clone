import { notFound } from 'next/navigation'
import { customerService } from '@/lib/services/customers'
import { ticketService } from '@/lib/services/tickets'
import { getVisitRecordsAction } from '@/lib/actions/visit'
import { CustomerDetails } from './customer-details'

interface CustomerPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function CustomerPage({ params }: CustomerPageProps) {
    const { id } = await params
    const customer = await customerService.getCustomerById(id)

    if (!customer) {
        notFound()
    }

    // Also fetch initial tickets data to pass down
    const customerTickets = await ticketService.getCustomerTickets(id)
    // We also need ticket masters to allow granting new tickets
    const ticketMasters = await ticketService.getTicketMasters(customer.store_id)
    // Fetch visit records
    const visitRecords = await getVisitRecordsAction(customer.store_id, id)

    return (
        <CustomerDetails
            customer={customer}
            initialTickets={customerTickets}
            ticketMasters={ticketMasters}
            visitRecords={visitRecords}
        />
    )
}
