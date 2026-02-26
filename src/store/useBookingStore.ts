import { create } from 'zustand'
import { Booking } from '@/types/booking'
import { bookingService } from '@/lib/services/bookings'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'

type ViewMode = 'day' | 'week' | 'month'

interface BookingState {
    bookings: Booking[]
    date: Date
    viewMode: ViewMode
    selectedStaff: string
    isLoading: boolean
    error: string | null

    // Actions
    setBookings: (bookings: Booking[]) => void
    setDate: (date: Date) => void
    setViewMode: (mode: ViewMode) => void
    setSelectedStaff: (staffId: string) => void
    setIsLoading: (isLoading: boolean) => void
    setError: (error: string | null) => void

    // Thunks/Complex Actions
    fetchBookings: (storeId: string) => Promise<void>
    updateBookingStatus: (bookingId: string, status: Booking['status']) => void
}

export const useBookingStore = create<BookingState>((set, get) => ({
    bookings: [],
    date: new Date(),
    viewMode: 'month',
    selectedStaff: 'all',
    isLoading: false,
    error: null,

    setBookings: (bookings) => set({ bookings }),
    setDate: (date) => set({ date }),
    setViewMode: (viewMode) => set({ viewMode }),
    setSelectedStaff: (selectedStaff) => set({ selectedStaff }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    fetchBookings: async (storeId: string) => {
        const { date, viewMode } = get()
        set({ isLoading: true, error: null })

        try {
            let start: Date
            let end: Date

            if (viewMode === 'month') {
                start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 })
                end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 })
            } else if (viewMode === 'week') {
                start = startOfWeek(date, { weekStartsOn: 1 })
                end = endOfWeek(date, { weekStartsOn: 1 })
            } else {
                start = new Date(date)
                start.setHours(0, 0, 0, 0)
                end = new Date(date)
                end.setHours(23, 59, 59, 999)
            }

            const data = await bookingService.getBookingsByDateRange(storeId, start.toISOString(), end.toISOString())
            set({ bookings: data as Booking[] })
        } catch (error: any) {
            console.error('Failed to fetch bookings:', error)
            set({ error: error.message || 'Failed to fetch bookings' })
        } finally {
            set({ isLoading: false })
        }
    },

    updateBookingStatus: (bookingId, newStatus) => {
        set((state) => ({
            bookings: state.bookings.map((b) =>
                b.id === bookingId ? { ...b, status: newStatus } : b
            ),
        }))
    },
}))
