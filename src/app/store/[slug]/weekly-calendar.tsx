import * as React from 'react'
import { addDays, format, startOfWeek, subWeeks, addWeeks, isSameDay, isBefore, startOfDay, parse } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getWeeklyAvailabilityAction } from '@/lib/actions/booking'

interface WeeklyCalendarProps {
    storeId: string
    selected?: Date
    onSelect?: (date: Date, time?: string) => void
    themeColor?: string
    className?: string
    durationMinutes?: number
    staffId?: string
    bufferBefore?: number
    bufferAfter?: number
}

export function WeeklyCalendar({ storeId, selected, onSelect, themeColor, className, durationMinutes, staffId, bufferBefore, bufferAfter }: WeeklyCalendarProps) {
    const today = startOfDay(new Date())

    // State to track the start of the currently displayed week
    const [currentWeekStart, setCurrentWeekStart] = React.useState(() => today)
    const [availability, setAvailability] = React.useState<Record<string, string[]>>({})
    const [loading, setLoading] = React.useState(false)

    // Fetch availability when currentWeekStart changes
    React.useEffect(() => {
        const fetchAvailability = async () => {
            setLoading(true)
            try {
                const data = await getWeeklyAvailabilityAction(storeId, currentWeekStart, durationMinutes, staffId, bufferBefore, bufferAfter)
                setAvailability(data)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        fetchAvailability()
    }, [storeId, currentWeekStart, durationMinutes, staffId, bufferBefore, bufferAfter])

    const handlePreviousWeek = () => {
        const newStart = subWeeks(currentWeekStart, 1)
        if (isBefore(newStart, today)) {
            setCurrentWeekStart(today)
        } else {
            setCurrentWeekStart(newStart)
        }
    }

    const handleNextWeek = () => {
        setCurrentWeekStart(addWeeks(currentWeekStart, 1))
    }

    // Generate the 7 days to display
    const days = React.useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i))
    }, [currentWeekStart])

    const canGoBack = !isSameDay(currentWeekStart, today) && isBefore(today, currentWeekStart)

    // Generate time rows (e.g. 10:00 - 20:00)
    // We determine the range based on the returned availability to avoid showing empty rows?
    // Or just show standard hours. Let's show standard 10-20 for now, or dynamic.
    // Dynamic: Find min and max time in all availability.
    const timeRows = React.useMemo(() => {
        const times = new Set<string>()
        Object.values(availability).forEach(slots => {
            slots.forEach(t => times.add(t))
        })
        const timeArray = Array.from(times).sort()
        if (timeArray.length === 0) return []

        // Return unique times
        return timeArray
    }, [availability])

    // Helper to check if a slot is available
    const isAvailable = (date: Date, time: string) => {
        const y = date.getFullYear()
        const m = (date.getMonth() + 1).toString().padStart(2, '0')
        const d = date.getDate().toString().padStart(2, '0')
        const key = `${y}-${m}-${d}`
        return availability[key]?.includes(time)
    }

    return (
        <div className={cn("w-full bg-white p-4 rounded-lg border", className)}>
            {/* Header: Month and Navigation */}
            <div className="flex items-center justify-between mb-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePreviousWeek}
                    disabled={!canGoBack}
                    className={!canGoBack ? "opacity-20" : ""}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="font-semibold text-lg text-stone-700">
                    {format(currentWeekStart, 'yyyy年 M月', { locale: ja })}
                </div>
                <Button variant="ghost" size="icon" onClick={handleNextWeek}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
                </div>
            ) : (
                <div className="flex flex-col">
                    {/* Fixed Header Row: Days */}
                    <div className="min-w-[600px] border-b pb-2 mb-2">
                        <div className="grid grid-cols-8 gap-1">
                            <div className="font-medium text-xs text-muted-foreground self-end pb-1 text-center">時間</div>
                            {days.map((day) => {
                                const isToday = isSameDay(day, today)
                                return (
                                    <div key={day.toString()} className={cn("text-center flex flex-col items-center", isToday && "bg-stone-50 rounded-md")}>
                                        <span className={cn("text-xs font-medium", isToday ? "text-red-500" : "text-stone-500")}>
                                            {format(day, 'E', { locale: ja })}
                                        </span>
                                        <span className={cn("text-lg font-bold", isToday ? "text-red-600" : "text-stone-800")}>
                                            {format(day, 'd')}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Scrollable Body: Time Slots with Up/Down Buttons */}
                    <div className="relative">


                        <div id="calendar-vertical-scroll" className="overflow-y-auto max-h-[400px] scrollbar-hide min-w-[600px]">
                            {timeRows.length === 0 ? (
                                <div className="text-center py-8 text-stone-400">予約可能な時間がありません</div>
                            ) : (
                                timeRows.map((time) => (
                                    <div key={time} className="grid grid-cols-8 gap-1 py-1 border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors">
                                        <div className="text-xs text-stone-500 font-medium flex items-center justify-center">
                                            {time}
                                        </div>
                                        {days.map((day) => {
                                            const available = isAvailable(day, time)

                                            // Better past check:
                                            const slotDate = new Date(day)
                                            const [h, m] = time.split(':').map(Number)
                                            slotDate.setHours(h, m, 0, 0)

                                            // Using strict past check including time for today
                                            const isStrictPast = isBefore(slotDate, new Date())

                                            if (isStrictPast) {
                                                return (
                                                    <div key={day.toISOString() + time} className="flex justify-center items-center h-10">
                                                        <span className="text-stone-200">-</span>
                                                    </div>
                                                )
                                            }

                                            return (
                                                <button
                                                    key={day.toISOString() + time}
                                                    onClick={() => available && onSelect?.(day, time)}
                                                    disabled={!available}
                                                    className={cn(
                                                        "h-10 w-full flex items-center justify-center rounded-sm transition-all",
                                                        available
                                                            ? "text-blue-600 font-bold hover:bg-blue-50 cursor-pointer text-lg"
                                                            : "text-stone-300 text-sm cursor-not-allowed"
                                                    )}
                                                >
                                                    {available ? '◎' : '×'}
                                                </button>
                                            )
                                        })}
                                    </div>
                                ))
                            )}
                        </div>


                    </div>
                </div>
            )}
        </div>
    )
}
