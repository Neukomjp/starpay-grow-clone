
'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EditBookingDialog } from '../edit-booking-dialog'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, getHours, getMinutes, differenceInMinutes } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Booking } from '@/types/booking'

interface WeekViewProps {
    date: Date
    setDate: (date: Date) => void
    bookings: Booking[]
    storeId: string
    onStatusUpdate: (bookingId: string, status: 'confirmed' | 'cancelled') => Promise<void>
}

export function WeekView({ date, setDate, bookings, storeId, onStatusUpdate }: WeekViewProps) {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }) // Monday start
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

    // Time range: 9:00 - 22:00 (13 hours)
    const startHour = 9
    const endHour = 22
    const totalMinutes = (endHour - startHour) * 60

    const nextWeek = () => setDate(addDays(date, 7))
    const prevWeek = () => setDate(addDays(date, -7))

    const handleBookingClick = (bookingId: string) => {
        // Maybe open edit dialog directly?
        // For now, let's just use the EditBookingDialog as the block itself or wrap it
    }

    // fixed height per hour in pixels
    const HOUR_HEIGHT = 60

    // Helper to calculate position
    const getPosition = (startTime: Date, durationMinutes: number) => {
        const startH = getHours(startTime)
        const startM = getMinutes(startTime)
        const minutesFromStart = (startH - startHour) * 60 + startM

        const top = (minutesFromStart / 60) * HOUR_HEIGHT
        const height = (durationMinutes / 60) * HOUR_HEIGHT

        return { top: `${top}px`, height: `${height}px` }
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between py-4">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevWeek}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <CardTitle>
                        {format(weekStart, 'yyyy年 M月 d日', { locale: ja })} - {format(weekEnd, 'M月 d日', { locale: ja })}
                    </CardTitle>
                    <Button variant="outline" size="icon" onClick={nextWeek}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto min-h-[600px] p-0">
                <div className="flex flex-col h-full min-w-[800px]">
                    {/* Header: Days */}
                    <div className="flex border-b">
                        <div className="w-16 shrink-0 border-r p-2 bg-gray-50"></div>
                        {days.map(day => (
                            <div key={day.toISOString()} className={`flex-1 p-2 text-center border-r font-medium ${isSameDay(day, new Date()) ? 'bg-blue-50 text-blue-600' : ''}`}>
                                {format(day, 'E', { locale: ja })}
                                <div className="text-xl">{format(day, 'd')}</div>
                            </div>
                        ))}
                    </div>

                    {/* Body: Time slots */}
                    <div className="flex flex-1 relative">
                        {/* Time labels */}
                        <div className="w-16 shrink-0 border-r bg-gray-50 text-xs text-gray-500">
                            {Array.from({ length: endHour - startHour + 1 }).map((_, i) => (
                                <div key={i} className="h-[60px] border-b relative">
                                    <span className="absolute -top-2 right-2 bg-gray-50 px-1">
                                        {startHour + i}:00
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Day columns */}
                        {days.map(day => {
                            const dayBookings = bookings.filter(b => isSameDay(new Date(b.start_time), day))
                            return (
                                <div key={day.toISOString()} className="flex-1 border-r relative">
                                    {/* Grid lines */}
                                    {Array.from({ length: endHour - startHour + 1 }).map((_, i) => (
                                        <div key={i} className="h-[60px] border-b border-gray-100"></div>
                                    ))}

                                    {/* Bookings */}
                                    {dayBookings.map(booking => {
                                        const startTime = new Date(booking.start_time)
                                        const endTime = new Date(booking.end_time)
                                        const duration = differenceInMinutes(endTime, startTime)
                                        const { top, height } = getPosition(startTime, duration)

                                        return (
                                            <div
                                                key={booking.id}
                                                className={`absolute left-1 right-1 rounded px-1 py-0.5 text-xs overflow-hidden border cursor-pointer hover:z-10 transition-all
                                                    ${booking.status === 'confirmed' ? 'bg-blue-100 border-blue-300 text-blue-800' :
                                                        booking.status === 'cancelled' ? 'bg-red-100 border-red-300 text-red-800' :
                                                            'bg-gray-100 border-gray-300 text-gray-800'
                                                    }
                                                `}
                                                style={{ top, height }}
                                            >
                                                {/* Use EditBookingDialog as wrapper or trigger */}
                                                <EditBookingDialog
                                                    booking={booking}
                                                    storeId={storeId}
                                                    trigger={
                                                        <div className="w-full h-full">
                                                            <div className="font-bold truncate">
                                                                {format(startTime, 'H:mm')} {booking.customer_name}
                                                            </div>
                                                            <div className="truncate opacity-75">
                                                                {booking.service?.name}
                                                            </div>
                                                        </div>
                                                    }
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
