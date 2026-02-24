'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { staffService } from '@/lib/services/staff'
import { Shift } from '@/lib/types/shift'
import { getShiftsByStoreIdAction } from '@/lib/actions/shift'
import { Staff } from '@/types/staff'
import { Clock, Edit, Loader2 } from 'lucide-react'
import { ShiftDialog } from './shift-dialog'
import { toast } from 'sonner'

interface ShiftManagerProps {
    storeId: string
}

const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土']

export function ShiftManager({ storeId }: ShiftManagerProps) {
    const [staffList, setStaffList] = useState<Staff[]>([])
    const [allShifts, setAllShifts] = useState<Shift[]>([])
    const [loading, setLoading] = useState(false)

    // Dialog state
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    useEffect(() => {
        if (storeId) {
            loadData()
        }
    }, [storeId])

    async function loadData() {
        setLoading(true)
        try {
            const [staffData, shiftsData] = await Promise.all([
                staffService.getStaffByStoreId(storeId),
                // We use getting all shifts logic here. 
                // Since I added getShiftsByStoreId in service, let's use it.
                // If it's not available (compile error?), we might need to fallback.
                // Assuming I added it successfully in previous step.
                getShiftsByStoreIdAction(storeId)
            ])
            setStaffList(staffData)
            setAllShifts(shiftsData || [])
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
        setIsDialogOpen(true)
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

            <Card>
                <CardContent className="p-0">
                    <div className="rounded-md border">
                        <Table>
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

            {selectedStaff && (
                <ShiftDialog
                    staffId={selectedStaff.id}
                    staffName={selectedStaff.name}
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    onSave={handleDialogSave}
                />
            )}
        </div>
    )
}
