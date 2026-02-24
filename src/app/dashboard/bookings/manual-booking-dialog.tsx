'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getAvailableTimeSlotsAction, createBookingAction } from '@/lib/actions/booking'
import { getCustomersAction } from '@/lib/actions/customer'
import { staffService } from '@/lib/services/staff'
import { menuService } from '@/lib/services/menu'
import { Service, Staff, ServiceOption } from '@/types/staff'
import { Customer } from '@/lib/types/customer'
import { toast } from 'sonner'
import { Loader2, Plus, Search, User } from 'lucide-react'
import { ja } from 'date-fns/locale'

interface ManualBookingDialogProps {
    storeId: string
    onBookingCreated?: () => void
}

export function ManualBookingDialog({ storeId, onBookingCreated }: ManualBookingDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1)

    // Data
    const [services, setServices] = useState<Service[]>([])
    const [staffList, setStaffList] = useState<Staff[]>([])
    const [customers, setCustomers] = useState<Customer[]>([])

    // Form State
    const [selectedServices, setSelectedServices] = useState<{
        serviceId: string;
        optionIds: string[];
        serviceName: string;
        options: { name: string; price: number; duration: number }[];
        totalDuration: number;
        totalPrice: number;
        service: Service; // Store full service object for buffers etc
    }[]>([])
    // We keep these for the "current selection" being added
    const [currentServiceId, setCurrentServiceId] = useState<string>('')
    const [currentOptionIds, setCurrentOptionIds] = useState<string[]>([])

    // Derived state for current selection options
    const [currentServiceOptions, setCurrentServiceOptions] = useState<ServiceOption[]>([])

    const [selectedStaff, setSelectedStaff] = useState<string>('no-preference')
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [time, setTime] = useState<string>('')
    const [availableSlots, setAvailableSlots] = useState<string[]>([])

    // Customer State
    const [customerMode, setCustomerMode] = useState<'existing' | 'guest'>('existing')
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
    const [guestName, setGuestName] = useState('')
    const [guestEmail, setGuestEmail] = useState('')
    const [guestPhone, setGuestPhone] = useState('')
    const [guestNotes, setGuestNotes] = useState('')

    useEffect(() => {
        if (open) {
            loadData()
            resetForm()
        }
    }, [open, storeId])

    useEffect(() => {
        if (currentServiceId) {
            loadOptions(currentServiceId)
        } else {
            setCurrentServiceOptions([])
            setCurrentOptionIds([])
        }
    }, [currentServiceId])

    // Load Available Slots
    useEffect(() => {
        async function loadSlots() {
            if (!date || selectedServices.length === 0) return
            setLoading(true)
            try {
                // Calculate total duration from ALL selected services
                let totalDuration = 0

                for (const item of selectedServices) {
                    const service = services.find(s => s.id === item.serviceId)
                    if (!service) continue

                    // We need options for this service. 
                    // Since we don't have all options loaded at once, we might need to fetch them or assume we have them if we cache them.
                    // Ideally, loadOptions should cache. For now, we'll iterate and fetch if needed or use a simpler approach.
                    // Optimization: fetch all options for store or fetch on selection. 

                    // QUICK FIX: For now, we only have 'currentServiceOptions' which is for the *currently being added* service.
                    // We need to fetch options for already added services to calculate duration correctly if we don't have them.
                    // However, 'allOptions' state was replaced.

                    // Better approach: When adding a service to 'selectedServices', store the duration/price snapshot so we don't need to re-fetch.
                }

                // REVISION: Let's store full details in selectedServices to avoid re-fetching
                // See 'handleAddService'

                // Redoing calculation using detailed state (see below)
                const duration = selectedServices.reduce((sum, item: any) => sum + item.totalDuration, 0)

                const bufferBefore = selectedServices.length > 0 ? (selectedServices[0].service.buffer_time_before || 0) : 0
                const bufferAfter = selectedServices.length > 0 ? (selectedServices[selectedServices.length - 1].service.buffer_time_after || 0) : 0

                const slots = await getAvailableTimeSlotsAction(
                    storeId,
                    date,
                    duration,
                    selectedStaff === 'no-preference' ? undefined : selectedStaff,
                    bufferBefore,
                    bufferAfter
                )
                setAvailableSlots(slots)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        if (step === 2 && date) {
            loadSlots()
        }
    }, [step, date, selectedStaff, selectedServices])

    async function loadData() {
        try {
            const [s, st, c] = await Promise.all([
                menuService.getServicesByStoreId(storeId),
                staffService.getStaffByStoreId(storeId),
                getCustomersAction(storeId)
            ])
            setServices(s)
            setStaffList(st)
            setCustomers(c)
        } catch (error) {
            toast.error('Failed to load data')
        }
    }

    async function loadOptions(serviceId: string) {
        try {
            const opts = await menuService.getOptionsByServiceId(serviceId)
            setCurrentServiceOptions(opts)
        } catch (e) { console.error(e) }
    }

    const handleAddService = () => {
        const service = services.find(s => s.id === currentServiceId)
        if (!service) return

        const selectedOpts = currentServiceOptions.filter(o => currentOptionIds.includes(o.id))
        const itemDuration = service.duration_minutes + selectedOpts.reduce((sum, o) => sum + o.duration_minutes, 0)
        const itemPrice = service.price + selectedOpts.reduce((sum, o) => sum + o.price, 0)

        const newItem = {
            serviceId: service.id,
            serviceName: service.name,
            optionIds: currentOptionIds,
            options: selectedOpts.map(o => ({ name: o.name, price: o.price, duration: o.duration_minutes })), // Store details
            totalDuration: itemDuration,
            totalPrice: itemPrice,
            service: service
        }

        setSelectedServices([...selectedServices, newItem])
        setCurrentServiceId('')
        setCurrentOptionIds([])
    }

    const handleRemoveService = (index: number) => {
        const newServices = [...selectedServices]
        newServices.splice(index, 1)
        setSelectedServices(newServices)
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            if (selectedServices.length === 0 || !date || !time) return

            // Primary service is the first one
            const primaryItem = selectedServices[0]

            // Collect all "options"
            // Start with options of the primary service
            const combinedOptions = [...primaryItem.options]

            // Add other services as options
            for (let i = 1; i < selectedServices.length; i++) {
                const item: any = selectedServices[i]
                // Add the service itself as an option
                combinedOptions.push({
                    name: item.serviceName,
                    price: services.find(s => s.id === item.serviceId)?.price || 0,
                    duration: services.find(s => s.id === item.serviceId)?.duration_minutes || 0
                })
                // Add its options
                combinedOptions.push(...item.options)
            }

            // Recalculate totals
            const totalDuration = selectedServices.reduce((sum, item: any) => sum + item.totalDuration, 0)
            const totalPrice = selectedServices.reduce((sum, item: any) => sum + item.totalPrice, 0)

            // Calculate dates
            const startDateTime = new Date(date)
            const [hours, minutes] = time.split(':').map(Number)
            startDateTime.setHours(hours, minutes)

            const endDateTime = new Date(startDateTime)
            endDateTime.setMinutes(endDateTime.getMinutes() + totalDuration)

            // Customer Info
            let customerId = null
            let customerName = guestName

            if (customerMode === 'existing') {
                const existing = customers.find(c => c.id === selectedCustomerId)
                if (existing) {
                    customerId = existing.id
                    customerName = existing.name
                }
            }

            // Create Booking
            // Create Booking
            await createBookingAction({
                store_id: storeId,
                service_id: primaryItem.serviceId, // Main Service
                staff_id: selectedStaff === 'no-preference' ? null : selectedStaff,
                customer_id: customerId,
                customer_name: customerName,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                options: combinedOptions.map(o => ({
                    name: o.name,
                    price: o.price,
                    duration_minutes: o.duration
                })),
                total_price: totalPrice,
                payment_status: 'unpaid',
                payment_method: 'local',
                buffer_minutes_before: selectedServices.length > 0 ? (selectedServices[0].service.buffer_time_before || 0) : 0,
                buffer_minutes_after: selectedServices.length > 0 ? (selectedServices[selectedServices.length - 1].service.buffer_time_after || 0) : 0,
                status: 'confirmed'
            })

            toast.success('予約を作成しました')
            setOpen(false)
            resetForm()
            if (onBookingCreated) onBookingCreated()

        } catch (error) {
            console.error(error)
            toast.error('予約作成に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setStep(1)
        setSelectedServices([])
        setCurrentServiceId('')
        setCurrentOptionIds([])
        setSelectedStaff('no-preference')
        setDate(new Date())
        setTime('')
        setCustomerMode('existing')
        setSelectedCustomerId('')
        setGuestName('')
        setGuestEmail('')
        setGuestPhone('')
    }

    // Calculate total for display
    const grandTotal = selectedServices.reduce((sum, item: any) => sum + item.totalPrice, 0)
    const totalMinutes = selectedServices.reduce((sum, item: any) => sum + item.totalDuration, 0)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> 新規予約
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>管理者予約作成（代理予約）</DialogTitle>
                    <DialogDescription>
                        電話や来店での予約を登録します。複数のメニューを選択可能です。
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="flex gap-2 mb-4">
                        <Button variant={step === 1 ? 'default' : 'outline'} size="sm" onClick={() => setStep(1)} className="flex-1">1. メニュー・顧客</Button>
                        <Button variant={step === 2 ? 'default' : 'outline'} size="sm" onClick={() => setStep(2)} disabled={selectedServices.length === 0} className="flex-1">2. 日時・確認</Button>
                    </div>

                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div className="border p-4 rounded-md bg-stone-50 space-y-3">
                                        <Label>メニュー追加</Label>
                                        <div className="flex gap-2">
                                            <Select value={currentServiceId} onValueChange={setCurrentServiceId}>
                                                <SelectTrigger className="flex-1">
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
                                            <div className="pl-2 space-y-2">
                                                <Label className="text-xs">オプション</Label>
                                                {currentServiceOptions.map(opt => (
                                                    <div key={opt.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={opt.id}
                                                            checked={currentOptionIds.includes(opt.id)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) setCurrentOptionIds([...currentOptionIds, opt.id])
                                                                else setCurrentOptionIds(currentOptionIds.filter(id => id !== opt.id))
                                                            }}
                                                        />
                                                        <Label htmlFor={opt.id} className="text-sm">{opt.name} (+¥{opt.price})</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <Button
                                            size="sm"
                                            className="w-full"
                                            variant="secondary"
                                            disabled={!currentServiceId}
                                            onClick={handleAddService}
                                        >
                                            リストに追加
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>選択済みメニュー ({selectedServices.length})</Label>
                                        <div className="border rounded-md min-h-[100px] p-2 space-y-2">
                                            {selectedServices.length === 0 ? (
                                                <div className="text-sm text-gray-400 text-center py-4">メニューが選択されていません</div>
                                            ) : (
                                                selectedServices.map((item: any, idx) => (
                                                    <div key={idx} className="flex justify-between items-start text-sm bg-white p-2 rounded border">
                                                        <div>
                                                            <div className="font-medium">{item.serviceName}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {item.options.map((o: any) => o.name).join(', ')}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                ¥{item.totalPrice} / {item.totalDuration}分
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 text-red-500"
                                                            onClick={() => handleRemoveService(idx)}
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

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

                                <div className="space-y-4 border-l pl-4">
                                    <Label>顧客情報</Label>
                                    <Tabs value={customerMode} onValueChange={(v) => setCustomerMode(v as any)} className="w-full">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="existing">既存顧客</TabsTrigger>
                                            <TabsTrigger value="guest">ゲスト (新規)</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="existing" className="space-y-2">
                                            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="顧客を検索・選択" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {customers.length === 0 && <SelectItem value="none" disabled>顧客がいません</SelectItem>}
                                                    {customers.map(c => (
                                                        <SelectItem key={c.id} value={c.id}>
                                                            {c.name} <span className="text-xs text-gray-400">({c.phone || 'Telなし'})</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TabsContent>
                                        <TabsContent value="guest" className="space-y-2">
                                            <Input placeholder="お名前 (必須)" value={guestName} onChange={e => setGuestName(e.target.value)} />
                                            <Input placeholder="電話番号" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} />
                                            <Input placeholder="メールアドレス" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} />
                                            <Input placeholder="管理者メモ" value={guestNotes} onChange={e => setGuestNotes(e.target.value)} />
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <Label className="mb-2 block">日時選択</Label>
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        className="rounded-md border mx-auto"
                                        locale={ja}
                                    />
                                </div>
                                <div>
                                    <Label className="mb-2 block">時間選択</Label>
                                    <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                                        {availableSlots.length === 0 ? (
                                            <div className="col-span-3 text-center text-sm text-gray-500 py-4">
                                                {loading ? '確認中...' : '予約可能な枠がありません'}
                                            </div>
                                        ) : (
                                            availableSlots.map(slot => (
                                                <Button
                                                    key={slot}
                                                    variant={time === slot ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setTime(slot)}
                                                >
                                                    {slot}
                                                </Button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-lg text-sm">
                                <h4 className="font-bold mb-2">予約内容確認</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="col-span-2 space-y-1">
                                        {selectedServices.map((item: any, i) => (
                                            <div key={i}>• {item.serviceName} {item.options.length > 0 && `(+${item.options.map((o: any) => o.name).join(',')})`}</div>
                                        ))}
                                    </div>
                                    <div className="col-span-2 border-t pt-2 mt-2 font-bold flex justify-between">
                                        <span>合計</span>
                                        <span>¥{grandTotal} ({totalMinutes}分)</span>
                                    </div>
                                    <div className="col-span-2">顧客: {customerMode === 'existing'
                                        ? customers.find(c => c.id === selectedCustomerId)?.name
                                        : guestName}</div>
                                    <div className="col-span-2">日時: {date?.toLocaleDateString()} {time}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {step === 1 ? (
                        <Button onClick={() => setStep(2)} disabled={selectedServices.length === 0 || (customerMode === 'existing' && !selectedCustomerId) || (customerMode === 'guest' && !guestName)}>次へ</Button>
                    ) : (
                        <div className="flex gap-2 w-full justify-between items-center">
                            <Button variant="ghost" onClick={() => setStep(1)}>戻る</Button>
                            <Button onClick={handleSubmit} disabled={!time || loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                予約を確定する
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
