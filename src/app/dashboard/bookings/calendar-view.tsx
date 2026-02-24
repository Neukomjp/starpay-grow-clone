'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger as TabTriggerOriginal } from '@/components/ui/tabs' // Shadcn Tabs might need distinct import
import { updateStatusAction } from '@/lib/actions/booking'
import { staffService } from '@/lib/services/staff'
import { bookingService } from '@/lib/services/bookings'
import { Staff } from '@/types/staff'
import { toast } from 'sonner'
import { DayView } from './views/day-view'
import { WeekView } from './views/week-view'
import { MonthView } from './views/month-view'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'

// Wrapper for TabTrigger to avoid collision if necessary, or just use primitive
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { Loader2 } from 'lucide-react'

interface BookingCalendarProps {
    initialBookings: any[]
    storeId: string
    defaultDate?: string
}

export function BookingCalendar({ initialBookings, storeId, defaultDate }: BookingCalendarProps) {
    const [bookings, setBookings] = useState<any[]>(initialBookings)
    const [date, setDate] = useState<Date>(defaultDate ? new Date(defaultDate) : new Date())
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month') // Default to month view
    const [selectedStaff, setSelectedStaff] = useState('all')
    const [staffList, setStaffList] = useState<Staff[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isInitialMount, setIsInitialMount] = useState(true)

    useEffect(() => {
        if (storeId) {
            staffService.getStaffByStoreId(storeId).then(setStaffList).catch(console.error)
        }
    }, [storeId])

    const fetchBookings = useCallback(async () => {
        if (!storeId) return;
        setIsLoading(true);
        try {
            let start: Date;
            let end: Date;

            if (viewMode === 'month') {
                start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
                end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
            } else if (viewMode === 'week') {
                start = startOfWeek(date, { weekStartsOn: 1 });
                end = endOfWeek(date, { weekStartsOn: 1 });
            } else {
                start = new Date(date);
                start.setHours(0, 0, 0, 0);
                end = new Date(date);
                end.setHours(23, 59, 59, 999);
            }

            const data = await bookingService.getBookingsByDateRange(storeId, start.toISOString(), end.toISOString());
            setBookings(data);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
            toast.error('予約データの取得に失敗しました');
        } finally {
            setIsLoading(false);
        }
    }, [storeId, date, viewMode]);

    useEffect(() => {
        if (isInitialMount) {
            // Already have initialBookings for the initial view
            setIsInitialMount(false);
            return;
        }
        fetchBookings();
    }, [date, viewMode, fetchBookings]);

    const handleStatusUpdate = async (bookingId: string, newStatus: 'confirmed' | 'cancelled') => {
        try {
            // Optimistic update
            const updatedBookings = bookings.map(b =>
                b.id === bookingId ? { ...b, status: newStatus } : b
            )
            setBookings(updatedBookings)

            await updateStatusAction(bookingId, newStatus)

            // Email sending logic (omitted for brevity, or kept if essential)
            // ... (Copying original email logic if needed, but for refactoring let's assume updateStatusAction handles it or we keep it simple)
            // Ideally, email logic should be in the Server Action purely, but here it's mixed.
            // Let's keep the optimistic update and toast.

            // Create a separate async function or just run fetch here if needed
            const booking = bookings.find(b => b.id === bookingId)
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
            setBookings(bookings)
        }
    }

    // Filter bookings by staff (View components will filter by date)
    const filteredBookings = bookings.filter(b => {
        return selectedStaff === 'all' || b.staff_id === selectedStaff
    })

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-[400px]">
                    <TabsList>
                        <TabsPrimitive.Trigger value="month" className="px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm rounded-md">月 (Month)</TabsPrimitive.Trigger>
                        <TabsPrimitive.Trigger value="week" className="px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm rounded-md">週 (Week)</TabsPrimitive.Trigger>
                        <TabsPrimitive.Trigger value="day" className="px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm rounded-md">日 (Day)</TabsPrimitive.Trigger>
                    </TabsList>
                </Tabs>

                <div className="w-[200px]">
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


