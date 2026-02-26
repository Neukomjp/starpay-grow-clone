'use client'

import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EditBookingDialog } from '../edit-booking-dialog'
import { VisitRecordDialog } from '@/components/visit-record-dialog'
import { FileText } from 'lucide-react'
import { ja } from 'date-fns/locale'
import { Staff } from '@/types/staff'
import { Booking } from '@/types/booking'
import { format, differenceInMinutes, getHours, getMinutes } from 'date-fns'

interface DayViewProps {
    date: Date | undefined
    setDate: (date: Date | undefined) => void
    bookings: Booking[]
    storeId: string
    onStatusUpdate: (bookingId: string, status: 'confirmed' | 'cancelled') => Promise<void>
}

export function DayView({ date, setDate, bookings, storeId, onStatusUpdate }: DayViewProps) {
    const dailyBookings = bookings.filter(b => {
        const bookingDate = new Date(b.start_time)
        return date &&
            bookingDate.getFullYear() === date.getFullYear() &&
            bookingDate.getMonth() === date.getMonth() &&
            bookingDate.getDate() === date.getDate()
    })

    const startHour = 9
    const endHour = 22
    const HOUR_HEIGHT = 80 // a bit taller for day view to accommodate details

    const getPosition = (startTime: Date, durationMinutes: number) => {
        const startH = getHours(startTime)
        const startM = getMinutes(startTime)
        const minutesFromStart = (startH - startHour) * 60 + startM

        const top = (minutesFromStart / 60) * HOUR_HEIGHT
        const height = (durationMinutes / 60) * HOUR_HEIGHT

        return { top: `${top}px`, height: `${height}px` }
    }

    return (
        <div className="grid gap-6 md:grid-cols-[320px_1fr] h-full items-start">
            <Card className="sticky top-4">
                <CardHeader>
                    <CardTitle>日付選択</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border"
                        locale={ja}
                    />
                </CardContent>
            </Card>

            <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle>{date ? format(date, 'yyyy年 M月 d日 (E)', { locale: ja }) : ''} の予約</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-0 min-h-[600px] h-[70vh]">
                    <div className="flex relative min-w-[500px]">
                        {/* Time labels */}
                        <div className="w-16 shrink-0 border-r bg-gray-50 text-xs text-gray-500">
                            {Array.from({ length: endHour - startHour + 1 }).map((_, i) => (
                                <div key={i} className="border-b relative" style={{ height: `${HOUR_HEIGHT}px` }}>
                                    <span className="absolute -top-2 right-2 px-1 bg-gray-50">
                                        {startHour + i}:00
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Day column */}
                        <div className="flex-1 relative">
                            {/* Grid lines */}
                            {Array.from({ length: endHour - startHour + 1 }).map((_, i) => (
                                <div key={i} className="border-b border-gray-100" style={{ height: `${HOUR_HEIGHT}px` }}></div>
                            ))}

                            {/* Bookings */}
                            {dailyBookings.map(booking => {
                                const startTime = new Date(booking.start_time)
                                const endTime = new Date(booking.end_time) // Assuming end_time exists
                                // Support legacy records where end_time might be missing
                                const safeEndTime = isNaN(endTime.getTime()) ? new Date(startTime.getTime() + 60 * 60000) : endTime;
                                const duration = differenceInMinutes(safeEndTime, startTime)
                                const { top, height } = getPosition(startTime, duration)

                                return (
                                    <div
                                        key={booking.id}
                                        className={`absolute left-2 right-4 rounded-md p-2 text-sm overflow-hidden border shadow-sm transition-all hover:z-10
                                            ${booking.status === 'confirmed' ? 'bg-blue-50 border-blue-200 text-blue-900' :
                                                booking.status === 'cancelled' ? 'bg-red-50 border-red-200 text-red-900 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,0,0,0.05)_10px,rgba(255,0,0,0.05)_20px)]' :
                                                    booking.status === 'completed' ? 'bg-green-50 border-green-200 text-green-900' :
                                                        'bg-gray-50 border-gray-200 text-gray-900'
                                            }
                                        `}
                                        style={{ top, height, minHeight: '40px' }}
                                    >
                                        <div className="flex justify-between items-start h-full gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold flex flex-wrap items-center gap-2">
                                                    <span>{format(startTime, 'H:mm')} - {format(safeEndTime, 'H:mm')}</span>
                                                    <span className="truncate max-w-[150px]">{booking.customer_name}</span>
                                                    <Badge variant={
                                                        booking.status === 'confirmed' ? 'default' :
                                                            booking.status === 'cancelled' ? 'destructive' :
                                                                booking.status === 'completed' ? 'outline' : 'secondary'
                                                    } className="scale-75 origin-left whitespace-nowrap">
                                                        {booking.status}
                                                    </Badge>
                                                </div>
                                                <div className="text-muted-foreground mt-0.5 text-xs truncate">
                                                    {booking.service?.name || 'Service Unspecified'}
                                                    {booking.options && booking.options.length > 0 && ` (+${booking.options.map((o: any) => o.name).join(', ')})`}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    担当: {booking.staff?.name || '指名なし'}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1 items-end shrink-0">
                                                <div className="flex gap-1">
                                                    {(booking.status === 'confirmed' || booking.status === 'completed') && (
                                                        <VisitRecordDialog
                                                            storeId={storeId}
                                                            customerId={booking.customer_id || ''}
                                                            bookingId={booking.id}
                                                            staffId={booking.staff_id || undefined}
                                                            trigger={
                                                                <Button size="icon" variant="ghost" className="h-6 w-6 bg-white/50 hover:bg-white" title="来店記録を作成">
                                                                    <FileText className="h-3 w-3" />
                                                                </Button>
                                                            }
                                                        />
                                                    )}
                                                    <EditBookingDialog
                                                        booking={booking}
                                                        storeId={storeId}
                                                        trigger={
                                                            <Button size="sm" variant="outline" className="h-6 text-xs px-2 bg-white/50 hover:bg-white">
                                                                詳細・編集
                                                            </Button>
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
