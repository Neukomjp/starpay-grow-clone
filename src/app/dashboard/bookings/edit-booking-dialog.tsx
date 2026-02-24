'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { getAvailableTimeSlotsAction, updateBookingAction, updateStatusAction, deleteBookingAction } from '@/lib/actions/booking'
import { staffService } from '@/lib/services/staff'
import { menuService } from '@/lib/services/menu'
import { Service, Staff, ServiceOption } from '@/types/staff'
import { toast } from 'sonner'
import { Loader2, Pencil, Trash2, XCircle, CheckCircle2 } from 'lucide-react'
import { ja } from 'date-fns/locale'

interface EditBookingDialogProps {
    booking: any
    storeId: string
    trigger?: React.ReactNode
    onOpenChange?: (open: boolean) => void
}

export function EditBookingDialog({ booking, storeId, trigger, onOpenChange }: EditBookingDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1)
    const [isStatusUpdating, setIsStatusUpdating] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    // Data
    const [services, setServices] = useState<Service[]>([])
    const [staffList, setStaffList] = useState<Staff[]>([])

    // Form State
    // Simplified: Single Service Edit for now to ensure stability
    const [selectedServiceId, setSelectedServiceId] = useState<string>('')
    const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([])
    const [currentServiceOptions, setCurrentServiceOptions] = useState<ServiceOption[]>([])

    const [selectedStaff, setSelectedStaff] = useState<string>('no-preference')
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [time, setTime] = useState<string>('')
    const [availableSlots, setAvailableSlots] = useState<string[]>([])

    useEffect(() => {
        if (open) {
            loadData()
            initializeForm()
        }
    }, [open, booking])

    function initializeForm() {
        if (!booking) return

        // Date & Time
        const startDate = new Date(booking.start_time)
        setDate(startDate)
        setTime(`${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`)

        // Staff
        setSelectedStaff(booking.staff_id || 'no-preference')

        // Service
        if (booking.service_id) {
            setSelectedServiceId(booking.service_id)
            // Options - try to match by name if IDs not available or mismatched (Mock data doesn't store option IDs in options json)
            // But we need IDs to select checkboxes. 
            // We'll load options first then match.
            // For now just set service ID.
        }
    }

    // Load Data
    async function loadData() {
        try {
            const [s, st] = await Promise.all([
                menuService.getServicesByStoreId(storeId),
                staffService.getStaffByStoreId(storeId)
            ])
            setServices(s)
            setStaffList(st)

            // Load options for the selected service if any
            if (booking.service_id) {
                const opts = await menuService.getOptionsByServiceId(booking.service_id)
                setCurrentServiceOptions(opts)

                // Match existing options
                if (booking.options && Array.isArray(booking.options)) {
                    const matchedIds = opts.filter(o => booking.options.some((bo: any) => bo.name === o.name)).map(o => o.id)
                    setSelectedOptionIds(matchedIds)
                }
            }
        } catch (error) {
            toast.error('Failed to load data')
        }
    }

    // Load Options when Service Changes
    useEffect(() => {
        if (selectedServiceId && selectedServiceId !== booking.service_id) {
            // Only reload if changed from initial
            loadOptions(selectedServiceId)
        }
    }, [selectedServiceId])

    async function loadOptions(serviceId: string) {
        try {
            const opts = await menuService.getOptionsByServiceId(serviceId)
            setCurrentServiceOptions(opts)
            setSelectedOptionIds([]) // Reset options on service change
        } catch (e) { console.error(e) }
    }

    // Load Slots
    useEffect(() => {
        async function loadSlots() {
            if (!date || !selectedServiceId) return
            setLoading(true)
            try {
                const service = services.find(s => s.id === selectedServiceId)
                if (!service) return

                const selectedOpts = currentServiceOptions.filter(o => selectedOptionIds.includes(o.id))
                const totalDuration = service.duration_minutes + selectedOpts.reduce((sum, o) => sum + o.duration_minutes, 0)

                const slots = await getAvailableTimeSlotsAction(
                    storeId,
                    date,
                    totalDuration,
                    selectedStaff === 'no-preference' ? undefined : selectedStaff,
                    service.buffer_time_before || 0,
                    service.buffer_time_after || 0
                )
                setAvailableSlots(slots)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        // Only load if step 2 or (step 1 and we want to allow quick update?) 
        // Let's stick to step flow
        if (step === 2 && date) {
            loadSlots()
        }
    }, [step, date, selectedStaff, selectedServiceId, selectedOptionIds, services, currentServiceOptions])


    const handleSubmit = async () => {
        setLoading(true)
        try {
            const service = services.find(s => s.id === selectedServiceId)
            if (!service || !date || !time) return

            const selectedOpts = currentServiceOptions.filter(o => selectedOptionIds.includes(o.id))
            const totalDuration = service.duration_minutes + selectedOpts.reduce((sum, o) => sum + o.duration_minutes, 0)
            const totalPrice = service.price + selectedOpts.reduce((sum, o) => sum + o.price, 0)

            const startDateTime = new Date(date)
            const [hours, minutes] = time.split(':').map(Number)
            startDateTime.setHours(hours, minutes)

            const endDateTime = new Date(startDateTime)
            endDateTime.setMinutes(endDateTime.getMinutes() + totalDuration)

            await updateBookingAction(booking.id, {
                service_id: service.id,
                staff_id: selectedStaff === 'no-preference' ? null : selectedStaff,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                options: selectedOpts.map(o => ({
                    name: o.name,
                    price: o.price,
                    duration: o.duration_minutes,
                    duration_minutes: o.duration_minutes // Ensure compatibility
                })),
                total_price: totalPrice,
                buffer_minutes_before: service.buffer_time_before || 0,
                buffer_minutes_after: service.buffer_time_after || 0
            })

            toast.success('予約を更新しました')
            setOpen(false)
            if (onOpenChange) onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error('予約更新に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (newStatus: 'completed' | 'cancelled') => {
        setIsStatusUpdating(true)
        try {
            await updateStatusAction(booking.id, newStatus)
            toast.success(`ステータスを更新しました`)
            setOpen(false)
            if (onOpenChange) onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error('ステータスの更新に失敗しました')
        } finally {
            setIsStatusUpdating(false)
        }
    }

    const handleDelete = async () => {
        setIsStatusUpdating(true)
        try {
            await deleteBookingAction(booking.id)
            toast.success('予約データを削除しました')
            setOpen(false)
            setIsDeleteDialogOpen(false)
            if (onOpenChange) onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error('予約データの削除に失敗しました')
        } finally {
            setIsStatusUpdating(false)
        }
    }

    // Calculations
    const currentService = services.find(s => s.id === selectedServiceId)
    const currentOpts = currentServiceOptions.filter(o => selectedOptionIds.includes(o.id))
    const totalDuration = currentService ? (currentService.duration_minutes + currentOpts.reduce((sum, o) => sum + o.duration_minutes, 0)) : 0
    const totalPrice = currentService ? (currentService.price + currentOpts.reduce((sum, o) => sum + o.price, 0)) : 0

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (onOpenChange) onOpenChange(v); }}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Pencil className="h-3 w-3" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>予約の変更</DialogTitle>
                    <DialogDescription>
                        {booking.customer_name} 様の予約内容を変更します。
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>メニュー</Label>
                                <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="メニューを選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {services.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name} (¥{s.price})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {currentServiceOptions.length > 0 && (
                                <div className="space-y-2 pl-2 border-l-2">
                                    <Label className="text-xs text-gray-500">オプション</Label>
                                    {currentServiceOptions.map(opt => (
                                        <div key={opt.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`edit-${opt.id}`}
                                                checked={selectedOptionIds.includes(opt.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setSelectedOptionIds([...selectedOptionIds, opt.id])
                                                    else setSelectedOptionIds(selectedOptionIds.filter(id => id !== opt.id))
                                                }}
                                            />
                                            <Label htmlFor={`edit-${opt.id}`} className="text-sm">{opt.name} (+¥{opt.price})</Label>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>スタッフ指名</Label>
                                <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="指名なし" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="no-preference">指名なし</SelectItem>
                                        {staffList.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button className="w-full mt-4" onClick={() => setStep(2)} disabled={!selectedServiceId}>次へ（日時選択）</Button>

                            <div className="border-t pt-4 mt-6 space-y-2">
                                <Label className="text-muted-foreground block mb-2">ステータス変更</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {booking.status === 'pending' || booking.status === 'confirmed' ? (
                                        <Button variant="outline" className="w-full text-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => handleStatusChange('completed')} disabled={isStatusUpdating}>
                                            <CheckCircle2 className="mr-2 h-4 w-4" /> 来店完了
                                        </Button>
                                    ) : (
                                        <div />
                                    )}

                                    {booking.status !== 'cancelled' ? (
                                        <Button variant="outline" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleStatusChange('cancelled')} disabled={isStatusUpdating}>
                                            <XCircle className="mr-2 h-4 w-4" /> キャンセル
                                        </Button>
                                    ) : (
                                        <div />
                                    )}
                                </div>
                                <div className="flex justify-end pt-2">
                                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800 hover:bg-red-50">
                                                <Trash2 className="mr-2 h-4 w-4" /> 予約データを削除
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    この予約データを完全に削除します。この操作は取り消せません。
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                                                    削除する
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="text-sm font-medium border-b pb-2 mb-2">
                                {currentService?.name} {currentOpts.length > 0 && `(+${currentOpts.map(o => o.name).join(',')})`}
                                <div className="text-gray-500 font-normal">
                                    合計: ¥{totalPrice.toLocaleString()} / {totalDuration}分
                                </div>
                            </div>

                            <div>
                                <Label className="mb-2 block">日時選択</Label>
                                <div className="flex justify-center border rounded-md p-2 mb-2">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        className="rounded-md"
                                        locale={ja}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="mb-2 block">開始時間</Label>
                                <div className="grid grid-cols-4 gap-2 max-h-[150px] overflow-y-auto border p-2 rounded-md">
                                    {availableSlots.length === 0 ? (
                                        <div className="col-span-4 text-center text-sm text-gray-500">
                                            {loading ? '確認中...' : '空き枠なし'}
                                        </div>
                                    ) : (
                                        availableSlots.map(slot => (
                                            <Button
                                                key={slot}
                                                variant={time === slot ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setTime(slot)}
                                                className="text-xs"
                                            >
                                                {slot}
                                            </Button>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">戻る</Button>
                                <Button onClick={handleSubmit} disabled={loading || !time} className="flex-1">
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    確定
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
