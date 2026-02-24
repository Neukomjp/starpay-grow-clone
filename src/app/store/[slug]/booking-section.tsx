'use client'

import { useState } from 'react'
import { WeeklyCalendar } from './weekly-calendar'
import { BookingForm } from './booking-form'
import { ja } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface BookingSectionProps {
    storeId: string
    storeName: string
    slug: string
    themeColor?: string
}

export function BookingSection({ storeId, storeName, slug, themeColor }: BookingSectionProps) {
    const [showCalendar, setShowCalendar] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

    const handleDateSelect = (date: Date, time?: string) => {
        setSelectedDate(date)
        if (time) {
            // If time is selected, we want to open the form and PRE-SET the time
            setIsOpen(true)
            // We need to pass the selected time to BookingForm. 
            // We can do this by setting initialTime state or passing it as part of initialDate (by setting hours/mins)
            // or adding a new prop to BookingForm.
            // Let's modify BookingForm to accept initialTime.
        }
    }

    // We need to track the selected time to pass it
    const [selectedTime, setSelectedTime] = useState<string>('')

    const handleSlotSelect = (date: Date, time?: string) => {
        setSelectedDate(date)
        if (time) {
            setSelectedTime(time)
            setShowCalendar(false) // Close the calendar dialog
            setIsOpen(true) // Open the booking form
        }
    }

    const handleMenuSelect = () => {
        setSelectedDate(undefined)
        setSelectedTime('')
        setIsOpen(true)
    }

    const formattedDate = selectedDate ? selectedDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' }) : ''
    const buttonLabel = selectedDate ? `${formattedDate} ${selectedTime}〜 で予約する` : '予約する'

    return (
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center w-full">
            <Button
                onClick={() => setShowCalendar(true)}
                size="lg"
                className="bg-stone-800 text-white hover:bg-stone-700"
                style={{ backgroundColor: themeColor }}
            >
                空き状況から選ぶ
            </Button>

            <Button
                onClick={handleMenuSelect}
                size="lg"
                className="bg-stone-800 text-white hover:bg-stone-700"
                style={{ backgroundColor: themeColor }}
            >
                メニューから選ぶ
            </Button>

            <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
                <DialogContent className="sm:max-w-[600px] md:max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>空き状況を確認</DialogTitle>
                    </DialogHeader>
                    <div className="w-full">
                        <WeeklyCalendar
                            storeId={storeId}
                            selected={selectedDate}
                            onSelect={handleSlotSelect}
                            themeColor={themeColor}
                        />
                        <p className="text-xs text-center text-gray-400 mt-4">
                            日時（◎）をクリックして予約に進めます
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Call to Action Button - Hidden since clicking slot opens form directly, but kept as backup */}
            <div className="flex flex-col items-center self-center hidden">
                <BookingForm
                    storeId={storeId}
                    storeName={storeName}
                    slug={slug}
                    themeColor={themeColor}
                    isOpen={isOpen}
                    onOpenChange={setIsOpen}
                    initialDate={selectedDate}
                    initialTime={selectedTime}
                    triggerLabel={buttonLabel}
                />

                <Button
                    variant="link"
                    className="mt-2 text-stone-500"
                    onClick={() => setShowCalendar(false)}
                >
                    カレンダーを閉じる
                </Button>
            </div>
        </div>
    )
}


