import { BookingCalendar } from './calendar-view'
import { bookingService } from '@/lib/services/bookings'
import { storeService } from '@/lib/services/stores'
import { ManualBookingDialog } from './manual-booking-dialog'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'

export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'

// ...

export default async function BookingsPage() {
    // In a real app, you might select the store from a dropdown or context
    // For now, we'll fetch the first store found for the user/organization
    let bookings = [];
    let storeId = '';

    const cookieStore = await cookies()
    const organizationId = cookieStore.get('organization-id')?.value

    const today = new Date()
    // Pre-fetch a range that covers the visible month grid (including prev/next month buffer days)
    const startDate = startOfWeek(startOfMonth(today), { weekStartsOn: 1 })
    const endDate = endOfWeek(endOfMonth(today), { weekStartsOn: 1 })

    try {
        const stores = await storeService.getStores(organizationId);
        if (stores.length > 0) {
            storeId = stores[0].id; // Default to first store
            bookings = await bookingService.getBookingsByDateRange(storeId, startDate.toISOString(), endDate.toISOString());
        }
    } catch (error) {
        console.error('Failed to fetch bookings:', error);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">予約管理</h2>
                <ManualBookingDialog storeId={storeId} />
            </div>
            <BookingCalendar initialBookings={bookings} storeId={storeId} defaultDate={today.toISOString()} />
        </div>
    )
}
