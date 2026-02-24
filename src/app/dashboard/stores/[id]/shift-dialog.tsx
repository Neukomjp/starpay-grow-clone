'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Shift } from '@/lib/types/shift'
import { getShiftsByStaffIdAction, upsertShiftAction } from '@/lib/actions/shift'
import { toast } from 'sonner'
import { Clock } from 'lucide-react'

export interface ShiftDialogProps {
    staffId: string
    staffName: string
    open?: boolean
    onOpenChange?: (open: boolean) => void
    trigger?: React.ReactNode
    onSave?: () => void
}

const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土']

export function ShiftDialog({ staffId, staffName, open: controlledOpen, onOpenChange: setControlledOpen, trigger, onSave }: ShiftDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined

    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? setControlledOpen! : setInternalOpen

    const [loading, setLoading] = useState(false)
    const [shifts, setShifts] = useState<Partial<Shift>[]>([])

    useEffect(() => {
        if (open) {
            loadShifts()
        }
    }, [open, staffId])

    async function loadShifts() {
        try {
            const data = await getShiftsByStaffIdAction(staffId)
            // Initialize with defaults if not present
            const initializedShifts = Array(7).fill(null).map((_, i) => {
                const existing = data.find(s => s.day_of_week === i)
                return existing || {
                    staff_id: staffId,
                    day_of_week: i,
                    start_time: '10:00',
                    end_time: '18:00',
                    is_holiday: i === 0 || i === 6 ? false : false // Default all work days
                }
            })
            setShifts(initializedShifts)
        } catch (error) {
            console.error('Failed to load shifts:', error)
            toast.error('シフト情報の読み込みに失敗しました')
        }
    }

    const handleShiftChange = (index: number, field: keyof Shift, value: any) => {
        const newShifts = [...shifts]
        newShifts[index] = { ...newShifts[index], [field]: value }
        setShifts(newShifts)
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const promises = shifts.map(shift => {
                // Ensure proper formatting or validation if needed
                return upsertShiftAction({
                    staff_id: staffId,
                    day_of_week: shift.day_of_week!,
                    start_time: shift.start_time || '10:00',
                    end_time: shift.end_time || '18:00',
                    break_start_time: shift.break_start_time || null,
                    break_end_time: shift.break_end_time || null,
                    is_holiday: shift.is_holiday || false
                })
            })
            await Promise.all(promises)
            toast.success('シフトを保存しました')
            setOpen(false)
            if (onSave) onSave()
        } catch (error) {
            console.error('Failed to save shifts:', error)
            toast.error('シフトの保存に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            {!trigger && !isControlled && (
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                        <Clock className="mr-2 h-4 w-4" /> シフト管理
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{staffName}さんのシフト設定</DialogTitle>
                    <DialogDescription>
                        曜日ごとの勤務時間を設定してください。休日にはチェックを入れてください。
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 overflow-x-auto">
                    <div className="min-w-[600px]">
                        <div className="grid grid-cols-10 gap-2 font-medium text-sm text-center mb-2">
                            <div className="col-span-1">曜日</div>
                            <div className="col-span-1">休日</div>
                            <div className="col-span-2">開始</div>
                            <div className="col-span-2">終了</div>
                            <div className="col-span-2">休憩開始</div>
                            <div className="col-span-2">休憩終了</div>
                        </div>
                        {shifts.map((shift, index) => (
                            <div key={index} className="grid grid-cols-10 gap-2 items-center mb-2">
                                <div className="col-span-1 text-center font-bold">
                                    <span className={index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : ''}>
                                        {DAYS_OF_WEEK[index]}
                                    </span>
                                </div>
                                <div className="col-span-1 text-center flex justify-center">
                                    <Checkbox
                                        checked={shift.is_holiday}
                                        onCheckedChange={(checked) => handleShiftChange(index, 'is_holiday', checked)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        type="time"
                                        value={shift.start_time?.slice(0, 5)}
                                        disabled={shift.is_holiday}
                                        onChange={(e) => handleShiftChange(index, 'start_time', e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        type="time"
                                        value={shift.end_time?.slice(0, 5)}
                                        disabled={shift.is_holiday}
                                        onChange={(e) => handleShiftChange(index, 'end_time', e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        type="time"
                                        value={shift.break_start_time?.slice(0, 5) || ''}
                                        disabled={shift.is_holiday}
                                        onChange={(e) => handleShiftChange(index, 'break_start_time', e.target.value)}
                                        className="h-8 text-xs"
                                        placeholder="--:--"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        type="time"
                                        value={shift.break_end_time?.slice(0, 5) || ''}
                                        disabled={shift.is_holiday}
                                        onChange={(e) => handleShiftChange(index, 'break_end_time', e.target.value)}
                                        className="h-8 text-xs"
                                        placeholder="--:--"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? '保存中...' : '保存する'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
