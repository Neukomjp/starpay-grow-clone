/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Shift } from '@/lib/types/shift'
import { getShiftsByStaffAndStoreAction, saveWeeklyShiftsAction } from '@/lib/actions/shift'
import { toast } from 'sonner'
import { Clock, Plus, Trash2 } from 'lucide-react'

export interface ShiftDialogProps {
    staffId: string
    staffName: string
    storeId: string
    open?: boolean
    onOpenChange?: (open: boolean) => void
    trigger?: React.ReactNode
    onSave?: () => void
}

const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土']

export function ShiftDialog({ staffId, staffName, storeId, open: controlledOpen, onOpenChange: setControlledOpen, trigger, onSave }: ShiftDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined

    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? setControlledOpen! : setInternalOpen

    const [loading, setLoading] = useState(false)
    const [shiftsByDay, setShiftsByDay] = useState<Partial<Shift>[][]>(Array(7).fill([]).map(() => []))

    useEffect(() => {
        if (open) {
            loadShifts()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, staffId, storeId])

    async function loadShifts() {
        if (!storeId) return
        try {
            const data = await getShiftsByStaffAndStoreAction(staffId, storeId)
            
            // Group by day of week
            const newShiftsByDay: Partial<Shift>[][] = Array(7).fill([]).map(() => [])
            data.forEach(shift => {
                newShiftsByDay[shift.day_of_week].push(shift)
            })

            // Ensure every day has at least one row, even if it's a holiday
            for (let i = 0; i < 7; i++) {
                if (newShiftsByDay[i].length === 0) {
                    newShiftsByDay[i].push({
                        staff_id: staffId,
                        store_id: storeId,
                        day_of_week: i,
                        start_time: '10:00',
                        end_time: '18:00',
                        is_holiday: true // Default missing days to holiday
                    })
                }
            }
            
            setShiftsByDay(newShiftsByDay)
        } catch (error) {
            console.error('Failed to load shifts:', error)
            toast.error('シフト情報の読み込みに失敗しました')
        }
    }

    const handleShiftChange = (dayIndex: number, shiftIndex: number, field: keyof Shift, value: any) => {
        const newShiftsByDay = [...shiftsByDay]
        newShiftsByDay[dayIndex] = [...newShiftsByDay[dayIndex]]
        newShiftsByDay[dayIndex][shiftIndex] = { ...newShiftsByDay[dayIndex][shiftIndex], [field]: value }
        
        // If unchecking holiday but it was holiday, ensure valid times exist
        if (field === 'is_holiday' && value === false) {
            if (!newShiftsByDay[dayIndex][shiftIndex].start_time) newShiftsByDay[dayIndex][shiftIndex].start_time = '10:00'
            if (!newShiftsByDay[dayIndex][shiftIndex].end_time) newShiftsByDay[dayIndex][shiftIndex].end_time = '18:00'
        }

        setShiftsByDay(newShiftsByDay)
    }

    const handleAddShiftSlot = (dayIndex: number) => {
        const newShiftsByDay = [...shiftsByDay]
        newShiftsByDay[dayIndex] = [...newShiftsByDay[dayIndex], {
            staff_id: staffId,
            store_id: storeId,
            day_of_week: dayIndex,
            start_time: '12:00',
            end_time: '18:00',
            is_holiday: false
        }]
        
        // If there was a holiday row, un-holiday it or remove the empty one
        if (newShiftsByDay[dayIndex][0].is_holiday) {
             newShiftsByDay[dayIndex][0].is_holiday = false
        }
        
        setShiftsByDay(newShiftsByDay)
    }

    const handleRemoveShiftSlot = (dayIndex: number, shiftIndex: number) => {
        const newShiftsByDay = [...shiftsByDay]
        
        if (newShiftsByDay[dayIndex].length === 1) {
            // Don't fully remove the last row, just make it a holiday
            newShiftsByDay[dayIndex] = [{ ...newShiftsByDay[dayIndex][0], is_holiday: true }]
        } else {
            newShiftsByDay[dayIndex] = newShiftsByDay[dayIndex].filter((_, i) => i !== shiftIndex)
        }
        
        setShiftsByDay(newShiftsByDay)
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const shiftsToSave: any[] = []
            
            shiftsByDay.forEach((dayShifts, i) => {
                if (dayShifts.length === 1 && dayShifts[0].is_holiday) {
                    shiftsToSave.push({
                        staff_id: staffId,
                        store_id: storeId,
                        day_of_week: i,
                        start_time: '10:00',
                        end_time: '18:00',
                        break_start_time: null,
                        break_end_time: null,
                        is_holiday: true
                    })
                } else {
                    dayShifts.forEach(shift => {
                        if (!shift.is_holiday) {
                            shiftsToSave.push({
                                staff_id: staffId,
                                store_id: storeId,
                                day_of_week: i,
                                start_time: shift.start_time || '10:00',
                                end_time: shift.end_time || '18:00',
                                break_start_time: shift.break_start_time || null,
                                break_end_time: shift.break_end_time || null,
                                is_holiday: false
                            })
                        }
                    })
                }
            })

            const res = await saveWeeklyShiftsAction(staffId, storeId, shiftsToSave)
            
            if (res && res.success === false) {
                 console.error('Save failed on server:', res.error)
                 toast.error('詳細なエラー: ' + res.error)
                 return
            }
            
            toast.success('シフトを保存しました')
            setOpen(false)
            if (onSave) onSave()
        } catch (error: any) {
            console.error('Failed to save shifts:', error)
            toast.error('シフトの保存に失敗しました: ' + (error.message || ''))
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
                        曜日ごとの勤務時間を設定してください。休日にはチェックを入れてください。時間枠は追加可能です。
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 overflow-y-auto max-h-[60vh] pr-2">
                    <div className="min-w-[600px]">
                        <div className="grid grid-cols-12 gap-2 font-medium text-sm text-center mb-2 items-center">
                            <div className="col-span-1">曜日</div>
                            <div className="col-span-1">休日</div>
                            <div className="col-span-2">開始</div>
                            <div className="col-span-2">終了</div>
                            <div className="col-span-2">休憩開始</div>
                            <div className="col-span-2">休憩終了</div>
                            <div className="col-span-2 text-left pl-4">操作</div>
                        </div>
                        {shiftsByDay.map((dayShifts, dayIndex) => (
                            <div key={dayIndex} className="mb-4 border-b border-gray-100 pb-2 last:border-0">
                                {dayShifts.map((shift, shiftIndex) => (
                                    <div key={shiftIndex} className="grid grid-cols-12 gap-2 items-center mb-2">
                                        <div className="col-span-1 text-center font-bold">
                                            {shiftIndex === 0 && (
                                                <span className={dayIndex === 0 ? 'text-red-500' : dayIndex === 6 ? 'text-blue-500' : ''}>
                                                    {DAYS_OF_WEEK[dayIndex]}
                                                </span>
                                            )}
                                        </div>
                                        <div className="col-span-1 text-center flex justify-center">
                                            {shiftIndex === 0 && (
                                                <Checkbox
                                                    checked={shift.is_holiday}
                                                    onCheckedChange={(checked) => handleShiftChange(dayIndex, shiftIndex, 'is_holiday', checked)}
                                                />
                                            )}
                                        </div>
                                        <div className="col-span-2">
                                            <Input
                                                type="time"
                                                value={shift.start_time?.slice(0, 5) || ''}
                                                disabled={dayShifts[0].is_holiday}
                                                onChange={(e) => handleShiftChange(dayIndex, shiftIndex, 'start_time', e.target.value)}
                                                className="h-8 text-xs disabled:opacity-50"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Input
                                                type="time"
                                                value={shift.end_time?.slice(0, 5) || ''}
                                                disabled={dayShifts[0].is_holiday}
                                                onChange={(e) => handleShiftChange(dayIndex, shiftIndex, 'end_time', e.target.value)}
                                                className="h-8 text-xs disabled:opacity-50"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Input
                                                type="time"
                                                value={shift.break_start_time?.slice(0, 5) || ''}
                                                disabled={dayShifts[0].is_holiday}
                                                onChange={(e) => handleShiftChange(dayIndex, shiftIndex, 'break_start_time', e.target.value)}
                                                className="h-8 text-xs disabled:opacity-50"
                                                placeholder="--:--"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Input
                                                type="time"
                                                value={shift.break_end_time?.slice(0, 5) || ''}
                                                disabled={dayShifts[0].is_holiday}
                                                onChange={(e) => handleShiftChange(dayIndex, shiftIndex, 'break_end_time', e.target.value)}
                                                className="h-8 text-xs disabled:opacity-50"
                                                placeholder="--:--"
                                            />
                                        </div>
                                        <div className="col-span-2 flex items-center justify-start gap-1 pl-4">
                                            {!dayShifts[0].is_holiday && (
                                                <>
                                                    {shiftIndex === dayShifts.length - 1 && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-7 w-7 text-blue-600 shrink-0" 
                                                            onClick={() => handleAddShiftSlot(dayIndex)}
                                                            title="枠を追加"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {(dayShifts.length > 1 || !shift.is_holiday) && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-7 w-7 text-red-500 shrink-0" 
                                                            onClick={() => handleRemoveShiftSlot(dayIndex, shiftIndex)}
                                                            title="枠を削除"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
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
