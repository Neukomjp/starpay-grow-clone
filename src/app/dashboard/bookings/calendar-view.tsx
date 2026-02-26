'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList } from '@/components/ui/tabs'
import { updateStatusAction } from '@/lib/actions/booking'
import { staffService } from '@/lib/services/staff'
import { Staff } from '@/types/staff'
import { toast } from 'sonner'
import { DayView } from './views/day-view'
import { WeekView } from './views/week-view'
import { MonthView } from './views/month-view'
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { Loader2 } from 'lucide-react'
import { useBookingStore } from '@/store/useBookingStore'

interface BookingCalendarProps {
    initialBookings: any[]
    storeId: string
    defaultDate?: string
}

export function BookingCalendar({ initialBookings, storeId, defaultDate }: BookingCalendarProps) {
    const {
        bookings, date, viewMode, selectedStaff, isLoading,
        setBookings, setDate, setViewMode, setSelectedStaff, fetchBookings, updateBookingStatus
    } = useBookingStore()

    const [staffList, setStaffList] = useState<Staff[]>([])
    const [isInitialMount, setIsInitialMount] = useState(true)

    // Parse default date only on mount
    useEffect(() => {
        if (defaultDate) {
            setDate(new Date(defaultDate))
        }
        setBookings(initialBookings)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (storeId) {
            staffService.getStaffByStoreId(storeId).then(setStaffList).catch(console.error)
        }
    }, [storeId])

    useEffect(() => {
        if (isInitialMount) {
            setIsInitialMount(false)
            return
        }
        if (storeId) {
            fetchBookings(storeId)
        }
    }, [date, viewMode, fetchBookings, storeId, isInitialMount])

    const handleStatusUpdate = async (bookingId: string, newStatus: 'confirmed' | 'cancelled') => {
        try {
            // Optimistic Zustand update
            updateBookingStatus(bookingId, newStatus)
            await updateStatusAction(bookingId, newStatus)

            const booking = bookings.find((b: any) => b.id === bookingId)
            if (booking) {
                fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: 'customer@example.com',
                        subject: `【予約${newStatus === 'confirmed' ? '確定' : 'キャンセル'}】のお知らせ`,
                        type: 'booking_status_update',
                        data: {
                            status: newStatus,
                            customerName: booking.customer_name,
                            serviceName: booking.service?.name,
                            staffName: booking.staff?.name || '指定なし',
                            date: new Date(booking.start_time).toLocaleDateString(),
                            time: new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            message: newStatus === 'confirmed'
                                ? 'ご予約が確定いたしました。ご来店をお待ちしております。'
                                : '申し訳ございませんが、ご予約を承ることができませんでした。'
                        }
                    })
                }).catch(console.error)
            }

            toast.success(`Booking ${newStatus}`)
        } catch (error) {
            console.error('Failed to update status:', error)
            toast.error('Status update failed')
            // rollback logic omitted for simplicity
        }
    }

    const filteredBookings = bookings.filter((b: any) => {
        return selectedStaff === 'all' || b.staff_id === selectedStaff
    })

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full md:w-[400px]">
                    <TabsList className="w-full justify-start overflow-x-auto">
                        <TabsPrimitive.Trigger value="month" className="px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm rounded-md whitespace-nowrap">月 (Month)</TabsPrimitive.Trigger>
                        <TabsPrimitive.Trigger value="week" className="px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm rounded-md whitespace-nowrap">週 (Week)</TabsPrimitive.Trigger>
                        <TabsPrimitive.Trigger value="day" className="px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm rounded-md whitespace-nowrap">日 (Day)</TabsPrimitive.Trigger>
                    </TabsList>
                </Tabs>

                <div className="w-full md:w-[200px]">
                    <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                        <SelectTrigger>
                            <SelectValue placeholder="スタッフで絞り込み" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全てのスタッフ</SelectItem>
                            {staffList.map(staff => (
                                <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="min-h-[600px]">
                {viewMode === 'day' && (
                    <DayView
                        date={date}
                        setDate={(d) => d && setDate(d)}
                        bookings={filteredBookings}
                        storeId={storeId}
                        onStatusUpdate={handleStatusUpdate}
                    />
                )}
                {viewMode === 'week' && (
                    <WeekView
                        date={date}
                        setDate={setDate}
                        bookings={filteredBookings}
                        storeId={storeId}
                        onStatusUpdate={handleStatusUpdate}
                    />
                )}
                {viewMode === 'month' && (
                    <MonthView
                        date={date}
                        setDate={setDate}
                        bookings={filteredBookings}
                        storeId={storeId}
                        onStatusUpdate={handleStatusUpdate}
                    />
                )}
            </div>
        </div>
    )
}


