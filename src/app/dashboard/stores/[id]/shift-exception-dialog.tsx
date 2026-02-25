'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Shift, ShiftException } from '@/lib/types/shift'
import { upsertShiftExceptionAction, deleteShiftExceptionAction } from '@/lib/actions/shift'
import { toast } from 'sonner'
import { Loader2, Trash2 } from 'lucide-react'

interface ShiftExceptionDialogProps {
    staffId: string
    staffName: string
    date: Date
    defaultShift: Shift | null
    existingException: ShiftException | undefined
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: () => void
}

export function ShiftExceptionDialog({
    staffId,
    staffName,
    date,
    defaultShift,
    existingException,
    open,
    onOpenChange,
    onSave
}: ShiftExceptionDialogProps) {
    const [loading, setLoading] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)

    // Form state based on exception or fallback to default
    const [isHoliday, setIsHoliday] = useState(false)
    const [startTime, setStartTime] = useState('09:00')
    const [endTime, setEndTime] = useState('18:00')
    const [breakStartTime, setBreakStartTime] = useState('')
    const [breakEndTime, setBreakEndTime] = useState('')

    useEffect(() => {
        if (open) {
            if (existingException) {
                setIsHoliday(existingException.is_holiday)
                setStartTime(existingException.start_time ? existingException.start_time.slice(0, 5) : '09:00')
                setEndTime(existingException.end_time ? existingException.end_time.slice(0, 5) : '18:00')
                setBreakStartTime(existingException.break_start_time ? existingException.break_start_time.slice(0, 5) : '')
                setBreakEndTime(existingException.break_end_time ? existingException.break_end_time.slice(0, 5) : '')
            } else if (defaultShift) {
                setIsHoliday(defaultShift.is_holiday)
                setStartTime(defaultShift.start_time.slice(0, 5))
                setEndTime(defaultShift.end_time.slice(0, 5))
                setBreakStartTime(defaultShift.break_start_time ? defaultShift.break_start_time.slice(0, 5) : '')
                setBreakEndTime(defaultShift.break_end_time ? defaultShift.break_end_time.slice(0, 5) : '')
            } else {
                // No default shift means holiday by default usually, but let's assume standard working hours if turning it on
                setIsHoliday(true)
                setStartTime('09:00')
                setEndTime('18:00')
                setBreakStartTime('')
                setBreakEndTime('')
            }
        }
    }, [open, existingException, defaultShift])

    const handleSave = async () => {
        setLoading(true)
        try {
            // Local date string format YYYY-MM-DD
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const dateStr = `${year}-${month}-${day}`

            await upsertShiftExceptionAction({
                staff_id: staffId,
                date: dateStr,
                is_holiday: isHoliday,
                start_time: isHoliday ? null : `${startTime}:00`,
                end_time: isHoliday ? null : `${endTime}:00`,
                break_start_time: (isHoliday || !breakStartTime) ? null : `${breakStartTime}:00`,
                break_end_time: (isHoliday || !breakEndTime) ? null : `${breakEndTime}:00`
            })

            toast.success('例外シフトを保存しました')
            onSave()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error('保存に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!existingException) return

        setDeleteLoading(true)
        try {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const dateStr = `${year}-${month}-${day}`

            await deleteShiftExceptionAction(staffId, dateStr)

            toast.success('特別設定を削除しました')
            onSave()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error('削除に失敗しました')
        } finally {
            setDeleteLoading(false)
        }
    }

    const formatJsDate = (d: Date) => {
        return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{formatJsDate(date)} のシフト設定</DialogTitle>
                    <DialogDescription>
                        {staffName} さんのこの日だけの特別なシフト（例外）を設定します。<br />
                        設定を削除すると、通常の曜日シフトに戻ります。
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="holiday-switch" className="text-base font-medium">休日にする</Label>
                        <Switch
                            id="holiday-switch"
                            checked={isHoliday}
                            onCheckedChange={setIsHoliday}
                        />
                    </div>

                    {!isHoliday && (
                        <>
                            <div className="grid gap-4 p-4 border rounded-md bg-stone-50">
                                <h4 className="font-medium text-sm">勤務時間</h4>
                                <div className="flex items-center gap-2">
                                    <div className="grid gap-1.5 flex-1">
                                        <Label htmlFor="start">出勤</Label>
                                        <Input
                                            id="start"
                                            type="time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                        />
                                    </div>
                                    <span className="mt-6">〜</span>
                                    <div className="grid gap-1.5 flex-1">
                                        <Label htmlFor="end">退勤</Label>
                                        <Input
                                            id="end"
                                            type="time"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 p-4 border rounded-md bg-stone-50">
                                <h4 className="font-medium text-sm align-middle flex items-center justify-between">
                                    <span>休憩時間</span>
                                    <span className="text-xs font-normal text-muted-foreground mr-1">任意</span>
                                </h4>
                                <div className="flex items-center gap-2">
                                    <div className="grid gap-1.5 flex-1">
                                        <Label htmlFor="break-start">開始</Label>
                                        <Input
                                            id="break-start"
                                            type="time"
                                            value={breakStartTime}
                                            onChange={(e) => setBreakStartTime(e.target.value)}
                                        />
                                    </div>
                                    <span className="mt-6">〜</span>
                                    <div className="grid gap-1.5 flex-1">
                                        <Label htmlFor="break-end">終了</Label>
                                        <Input
                                            id="break-end"
                                            type="time"
                                            value={breakEndTime}
                                            onChange={(e) => setBreakEndTime(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
                    <div>
                        {existingException && (
                            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading || deleteLoading}>
                                {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                例外を削除 (通常に戻す)
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading || deleteLoading}>
                            キャンセル
                        </Button>
                        <Button onClick={handleSave} disabled={loading || deleteLoading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            保存
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
