
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EditBookingDialog } from '../edit-booking-dialog'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Booking } from '@/types/booking'

interface MonthViewProps {
    date: Date
    setDate: (date: Date) => void
    bookings: Booking[]
    storeId: string
    onStatusUpdate: (bookingId: string, status: 'confirmed' | 'cancelled') => Promise<void>
}

export function MonthView({ date, setDate, bookings, storeId, onStatusUpdate }: MonthViewProps) {
    const monthStart = startOfMonth(date)
    const monthEnd = endOfMonth(date)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    // Create grid days (including prev/next month days)
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    const nextMonth = () => setDate(addMonths(date, 1))
    const prevMonth = () => setDate(addMonths(date, -1))

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between py-4">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <CardTitle>
                        {format(date, 'yyyy年 M月', { locale: ja })}
                    </CardTitle>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-auto">
                <div className="flex flex-col h-full min-w-[800px]">
                    {/* Header: Days */}
                    <div className="grid grid-cols-7 border-b">
                        {['月', '火', '水', '木', '金', '土', '日'].map(day => (
                            <div key={day} className="p-2 text-center font-medium border-r last:border-r-0 bg-gray-50">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Body: Days Grid */}
                    <div className="grid grid-cols-7 auto-rows-fr flex-1">
                        {days.map(day => {
                            const dayBookings = bookings.filter(b => isSameDay(new Date(b.start_time), day))
                            const isCurrentMonth = isSameMonth(day, date)
                            const isToday = isSameDay(day, new Date())

                            return (
                                <div
                                    key={day.toISOString()}
                                    className={`
                                        min-h-[120px] border-b border-r p-1 hover:bg-gray-50 transition-colors
                                        ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : ''}
                                        ${isToday ? 'bg-blue-50/30' : ''}
                                    `}
                                    onClick={() => setDate(day)} // Select date on click (maybe switch to day view?)
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`
                                            text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full
                                            ${isToday ? 'bg-blue-600 text-white' : ''}
                                        `}>
                                            {format(day, 'd')}
                                        </span>
                                        {dayBookings.length > 0 && (
                                            <span className="text-xs text-gray-500 font-mono">
                                                {dayBookings.length}件
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        {dayBookings.slice(0, 4).map(booking => (
                                            <EditBookingDialog
                                                key={booking.id}
                                                booking={booking}
                                                storeId={storeId}
                                                trigger={
                                                    <div className={`
                                                        text-[10px] px-1 py-0.5 rounded truncate cursor-pointer
                                                        ${booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800 line-through opacity-50' :
                                                                'bg-gray-100 text-gray-800'
                                                        }
                                                    `}>
                                                        {format(new Date(booking.start_time), 'H:mm')} {booking.customer_name}
                                                    </div>
                                                }
                                            />
                                        ))}
                                        {dayBookings.length > 4 && (
                                            <div className="text-[10px] text-gray-400 text-center">
                                                +{dayBookings.length - 4} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
