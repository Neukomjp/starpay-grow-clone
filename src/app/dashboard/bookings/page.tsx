import { BookingCalendar } from './calendar-view'
import { bookingService } from '@/lib/services/bookings'
import { storeService } from '@/lib/services/stores'
import { ManualBookingDialog } from './manual-booking-dialog'
import { StoreSelector } from './store-selector'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'

export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function BookingsPage(props: Props) {
    const searchParams = await props.searchParams;
    const urlStoreId = searchParams.store as string | undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let bookings: any[] = [];
    let storeId = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stores: any[] = [];

    const cookieStore = await cookies()
    const organizationId = cookieStore.get('organization-id')?.value

    const today = new Date()
    // Pre-fetch a range that covers the visible month grid (including prev/next month buffer days)
    const startDate = startOfWeek(startOfMonth(today), { weekStartsOn: 1 })
    const endDate = endOfWeek(endOfMonth(today), { weekStartsOn: 1 })

    try {
        stores = await storeService.getStores(organizationId);
        if (stores.length > 0) {
            // Use URL param, otherwise fallback to first store
            storeId = urlStoreId && stores.find(s => s.id === urlStoreId) ? urlStoreId : stores[0].id;
            bookings = await bookingService.getBookingsByDateRange(storeId, startDate.toISOString(), endDate.toISOString());
        }
    } catch (error) {
        console.error('Failed to fetch bookings:', error);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-bold tracking-tight">予約管理</h2>
                    <StoreSelector stores={stores} currentStoreId={storeId} />
                </div>
                <ManualBookingDialog storeId={storeId} />
            </div>
            <BookingCalendar initialBookings={bookings} storeId={storeId} defaultDate={today.toISOString()} />
        </div>
    )
}
