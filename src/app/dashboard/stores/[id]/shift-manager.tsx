'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { staffService } from '@/lib/services/staff'
import { Shift, ShiftException } from '@/lib/types/shift'
import { getShiftsByStoreIdAction, getShiftExceptionsByStoreIdAction } from '@/lib/actions/shift'
import { Staff } from '@/types/staff'
import { Clock, Edit, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { ShiftDialog } from './shift-dialog'
import { ShiftExceptionDialog } from './shift-exception-dialog'
import { toast } from 'sonner'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale'

interface ShiftManagerProps {
    storeId: string
}

const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土']

export function ShiftManager({ storeId }: ShiftManagerProps) {
    const [view, setView] = useState('weekly')
    const [staffList, setStaffList] = useState<Staff[]>([])
    const [allShifts, setAllShifts] = useState<Shift[]>([])
    const [allExceptions, setAllExceptions] = useState<ShiftException[]>([])
    const [loading, setLoading] = useState(false)

    // Weekly Dialog state
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
    const [isWeeklyDialogOpen, setIsWeeklyDialogOpen] = useState(false)

    // Monthly View state
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date())
    const [selectedMonthStaffId, setSelectedMonthStaffId] = useState<string>('all')
    const [isExceptionDialogOpen, setIsExceptionDialogOpen] = useState(false)
    const [exceptionDialogDate, setExceptionDialogDate] = useState<Date>(new Date())

    useEffect(() => {
        if (storeId) {
            loadData()
        }
    }, [storeId, currentMonthDate])

    async function loadData() {
        setLoading(true)
        try {
            // Load exceptions for current month +/- padding
            const start = format(startOfWeek(startOfMonth(currentMonthDate), { weekStartsOn: 0 }), 'yyyy-MM-dd')
            const end = format(endOfWeek(endOfMonth(currentMonthDate), { weekStartsOn: 0 }), 'yyyy-MM-dd')

            const [staffData, shiftsData, exceptionsData] = await Promise.all([
                staffService.getStaffByStoreId(storeId),
                getShiftsByStoreIdAction(storeId),
                getShiftExceptionsByStoreIdAction(storeId, start, end)
            ])
            setStaffList(staffData)
            setAllShifts(shiftsData || [])
            setAllExceptions(exceptionsData || [])

            // Auto-select first staff if viewing monthly and none selected
            if (staffData.length > 0 && selectedMonthStaffId === 'all' && view === 'monthly') {
                setSelectedMonthStaffId(staffData[0].id)
            }
        } catch (error) {
            console.error('Failed to load shift data:', error)
            toast.error('データの読み込みに失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const getShiftForStaffDay = (staffId: string, dayIndex: number) => {
        return allShifts.find(s => s.staff_id === staffId && s.day_of_week === dayIndex)
    }

    const handleEditClick = (staff: Staff) => {
        setSelectedStaff(staff)
        setIsWeeklyDialogOpen(true)
    }

    const handleMonthViewSwitch = (v: string) => {
        setView(v)
        if (v === 'monthly' && selectedMonthStaffId === 'all' && staffList.length > 0) {
            setSelectedMonthStaffId(staffList[0].id)
        }
    }

    const prevMonth = () => setCurrentMonthDate(subMonths(currentMonthDate, 1))
    const nextMonth = () => setCurrentMonthDate(addMonths(currentMonthDate, 1))

    const calendarDays = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonthDate), { weekStartsOn: 0 }),
        end: endOfWeek(endOfMonth(currentMonthDate), { weekStartsOn: 0 })
    })

    const handleDayClick = (date: Date) => {
        if (selectedMonthStaffId === 'all' || selectedMonthStaffId === '') return

        const staff = staffList.find(s => s.id === selectedMonthStaffId)
        if (staff) {
            setSelectedStaff(staff)
            setExceptionDialogDate(date)
            setIsExceptionDialogOpen(true)
        }
    }

    const getExceptionForStaffDay = (staffId: string, date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd')
        return allExceptions.find(e => e.staff_id === staffId && e.date === dateStr)
    }

    const handleDialogSave = () => {
        // Reload data to reflect changes
        loadData()
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">シフト管理</h3>
                    <p className="text-sm text-gray-500">スタッフごとの週間シフトを設定します。</p>
                </div>
                <Button variant="outline" onClick={loadData} size="sm">
                    <Loader2 className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    更新
                </Button>
            </div>

            <Tabs value={view} onValueChange={handleMonthViewSwitch}>
                <div className="flex justify-between items-center mb-4">
                    <TabsList>
                        <TabsTrigger value="weekly">週間シフト (基本)</TabsTrigger>
                        <TabsTrigger value="monthly">月間シフト (例外設定)</TabsTrigger>
                    </TabsList>

                    {view === 'monthly' && (
                        <div className="flex items-center gap-2">
                            <Select value={selectedMonthStaffId} onValueChange={setSelectedMonthStaffId}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="スタッフを選択" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全員を表示</SelectItem>
                                    {staffList.map(staff => (
                                        <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center ml-4 space-x-2">
                                <Button variant="outline" size="icon" onClick={prevMonth}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="min-w-[100px] text-center font-medium">
                                    {format(currentMonthDate, 'yyyy年 M月')}
                                </div>
                                <Button variant="outline" size="icon" onClick={nextMonth}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <TabsContent value="weekly" className="mt-0">
                    <Card>
                        <CardContent className="p-0">
                            <div className="rounded-md border overflow-x-auto">
                                <Table className="min-w-max">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[150px]">スタッフ</TableHead>
                                            {DAYS_OF_WEEK.map((day, i) => (
                                                <TableHead key={i} className={`text-center ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : ''}`}>
                                                    {day}
                                                </TableHead>
                                            ))}
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading && staffList.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={9} className="text-center py-8">
                                                    読み込み中...
                                                </TableCell>
                                            </TableRow>
                                        ) : staffList.map((staff) => (
                                            <TableRow key={staff.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">
                                                            {staff.name.slice(0, 1)}
                                                        </div>
                                                        <span>{staff.name}</span>
                                                    </div>
                                                </TableCell>
                                                {DAYS_OF_WEEK.map((_, dayIndex) => {
                                                    const shift = getShiftForStaffDay(staff.id, dayIndex)
                                                    return (
                                                        <TableCell key={dayIndex} className="text-center text-xs p-2">
                                                            {shift ? (
                                                                shift.is_holiday ? (
                                                                    <span className="text-gray-300">-</span>
                                                                ) : (
                                                                    <div className="bg-green-50 text-green-700 py-1 px-2 rounded text-xs">
                                                                        <div>{shift.start_time.slice(0, 5)}-{shift.end_time.slice(0, 5)}</div>
                                                                        {shift.break_start_time && shift.break_end_time && (
                                                                            <div className="text-gray-500 text-[10px] mt-0.5">
                                                                                (休 {shift.break_start_time.slice(0, 5)}-{shift.break_end_time.slice(0, 5)})
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <span className="text-gray-300">-</span>
                                                            )}
                                                        </TableCell>
                                                    )
                                                })}
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(staff)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {!loading && staffList.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={9} className="text-center py-8 text-gray-400">
                                                    スタッフが登録されていません
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="monthly" className="mt-0">
                    <Card>
                        <CardContent className="p-4">
                            {!selectedMonthStaffId ? (
                                <div className="text-center py-12 text-gray-500">
                                    スタッフを選択してください
                                </div>
                            ) : (
                                <div className="border rounded-md">
                                    <div className="grid grid-cols-7 border-b bg-muted/50">
                                        {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                                            <div key={day} className={`p-2 text-center text-sm font-medium ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : ''}`}>
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7">
                                        {calendarDays.map((day, i) => {
                                            const isCurrentMonth = isSameMonth(day, currentMonthDate)
                                            const dayOfWeek = day.getDay()
                                            const isToday = isSameDay(day, new Date())

                                            // Render logic for single staff vs all staff
                                            const isAllStaff = selectedMonthStaffId === 'all'

                                            // Pre-calculate shift info if it's a single staff member
                                            let singleStaffShift = null
                                            let singleStaffException = null
                                            let singleIsHoliday = true

                                            if (!isAllStaff) {
                                                singleStaffShift = getShiftForStaffDay(selectedMonthStaffId, dayOfWeek)
                                                singleStaffException = getExceptionForStaffDay(selectedMonthStaffId, day)
                                                const effectiveShift = singleStaffException || singleStaffShift
                                                singleIsHoliday = effectiveShift?.is_holiday ?? true
                                            }

                                            return (
                                                <div
                                                    key={day.toISOString()}
                                                    onClick={() => !isAllStaff && isCurrentMonth && handleDayClick(day)}
                                                    className={`min-h-[100px] border-b border-r p-2 flex flex-col gap-1 transition-colors
                                                        ${isCurrentMonth ? (isAllStaff ? 'bg-white' : 'bg-white cursor-pointer hover:bg-stone-50') : 'bg-stone-50 text-gray-400'}
                                                        ${i % 7 === 6 ? 'border-r-0' : ''}
                                                    `}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <span className={`text-sm ${isToday ? 'bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center' : ''} ${dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : ''}`}>
                                                            {format(day, 'd')}
                                                        </span>
                                                        {!isAllStaff && singleStaffException && isCurrentMonth && (
                                                            <div className="w-2 h-2 rounded-full bg-amber-500" title="例外設定あり" />
                                                        )}
                                                    </div>

                                                    {isCurrentMonth && (
                                                        <div className="flex-1 mt-1 overflow-y-auto max-h-[120px] scrollbar-thin scrollbar-thumb-gray-200">
                                                            {isAllStaff ? (
                                                                // --- ALL STAFF VIEW ---
                                                                <div className="flex flex-col gap-1">
                                                                    {staffList.map(staff => {
                                                                        const shift = getShiftForStaffDay(staff.id, dayOfWeek)
                                                                        const exception = getExceptionForStaffDay(staff.id, day)
                                                                        const effectiveShift = exception || shift
                                                                        const isHoliday = effectiveShift?.is_holiday ?? true

                                                                        return (
                                                                            <div key={staff.id} className="text-xs flex items-center gap-1">
                                                                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isHoliday ? 'bg-gray-300' : exception ? 'bg-amber-500' : 'bg-green-500'}`} />
                                                                                <span className="truncate w-10 shrink-0 font-medium" title={staff.name}>{staff.name.slice(0, 3)}</span>
                                                                                {isHoliday ? (
                                                                                    <span className="text-gray-400 text-[10px]">休</span>
                                                                                ) : (
                                                                                    <span className={`${exception ? 'text-amber-700' : 'text-green-700'} text-[10px]`}>
                                                                                        {effectiveShift?.start_time?.slice(0, 5)}-{effectiveShift?.end_time?.slice(0, 5)}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                // --- SINGLE STAFF VIEW ---
                                                                singleIsHoliday ? (
                                                                    <div className={`text-xs py-1 px-1.5 rounded text-center ${singleStaffException ? 'bg-rose-100 text-rose-700 font-medium' : 'text-gray-400'}`}>
                                                                        休
                                                                    </div>
                                                                ) : (
                                                                    <div className={`text-xs py-1 px-1.5 rounded flex flex-col ${singleStaffException ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-green-50 text-green-700'}`}>
                                                                        <div className="font-medium">
                                                                            {(singleStaffException || singleStaffShift)?.start_time?.slice(0, 5)}-{(singleStaffException || singleStaffShift)?.end_time?.slice(0, 5)}
                                                                        </div>
                                                                        {(singleStaffException || singleStaffShift)?.break_start_time && (
                                                                            <div className="opacity-70 text-[10px] mt-0.5 scale-90 origin-left">
                                                                                休: {(singleStaffException || singleStaffShift)?.break_start_time?.slice(0, 5)}-{(singleStaffException || singleStaffShift)?.break_end_time?.slice(0, 5)}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {selectedStaff && (
                <>
                    <ShiftDialog
                        staffId={selectedStaff.id}
                        staffName={selectedStaff.name}
                        open={isWeeklyDialogOpen}
                        onOpenChange={setIsWeeklyDialogOpen}
                        onSave={handleDialogSave}
                    />

                    <ShiftExceptionDialog
                        staffId={selectedStaff.id}
                        staffName={selectedStaff.name}
                        date={exceptionDialogDate}
                        defaultShift={getShiftForStaffDay(selectedStaff.id, exceptionDialogDate.getDay()) || null}
                        existingException={getExceptionForStaffDay(selectedStaff.id, exceptionDialogDate)}
                        open={isExceptionDialogOpen}
                        onOpenChange={setIsExceptionDialogOpen}
                        onSave={handleDialogSave}
                    />
                </>
            )}
        </div>
    )
}
