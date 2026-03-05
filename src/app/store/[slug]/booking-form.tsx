/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

import { WeeklyCalendar } from './weekly-calendar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { menuService } from '@/lib/services/menu'
import { staffService } from '@/lib/services/staff'
import { createBookingAction, getAvailableTimeSlotsAction } from '@/lib/actions/booking'
import { paymentService, PaymentMethod } from '@/lib/services/payment'
import { Service, Staff, ServiceOption } from '@/types/staff'
import { toast } from 'sonner'
import { Loader2, Ticket } from 'lucide-react'
import { validateCouponAction } from '@/lib/actions/coupon'

import { useRouter } from 'next/navigation'


interface BookingFormProps {
    storeId: string
    storeName: string
    slug: string
    themeColor?: string
    isOpen?: boolean
    onOpenChange?: (open: boolean) => void
    initialDate?: Date
    initialTime?: string
    triggerLabel?: string
}

export function BookingForm({ storeId, storeName, slug, themeColor, isOpen, onOpenChange, initialDate, initialTime, triggerLabel }: BookingFormProps) {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [services, setServices] = useState<Service[]>([])
    const [staffList, setStaffList] = useState<Staff[]>([])
    const [loading, setLoading] = useState(false)
    const [internalOpen, setInternalOpen] = useState(false)

    // Derived state for controlled/uncontrolled
    const open = isOpen !== undefined ? isOpen : internalOpen
    const setOpen = onOpenChange || setInternalOpen

    // Form State
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    // Map serviceId -> selected options
    const [selectedOptions, setSelectedOptions] = useState<Record<string, ServiceOption[]>>({})
    // Map serviceId -> available options
    const [availableOptions, setAvailableOptions] = useState<Record<string, ServiceOption[]>>({})
    const [selectedStaff, setSelectedStaff] = useState<string>('')
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [time, setTime] = useState<string>('')
    const [customerName, setCustomerName] = useState('')
    const [customerEmail, setCustomerEmail] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [lineNotify, setLineNotify] = useState(false)

    // Global Options State
    const [selectedGlobalOptions, setSelectedGlobalOptions] = useState<ServiceOption[]>([])
    const [globalOptions, setGlobalOptions] = useState<ServiceOption[]>([])

    // Payment State
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('local')
     
    const [paymentInProgress, setPaymentInProgress] = useState(false)
    const [couponCode, setCouponCode] = useState('')
     
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
    const [discountAmount, setDiscountAmount] = useState(0)
    const [couponError, setCouponError] = useState('')

    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const checkUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUser(user)
                // Fetch profile for pre-fill
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (profile) {
                    setCustomerName(profile.full_name || '')
                    setCustomerEmail(profile.email || user.email || '')
                    setCustomerPhone(profile.phone || '')
                }
            }
        }
        checkUser()
    }, [])

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const [fetchedServices, fetchedStaff, fetchedGlobalOptions] = await Promise.all([
                menuService.getServicesByStoreId(storeId),
                staffService.getStaffByStoreId(storeId),
                menuService.getGlobalOptionsByStoreId(storeId)
            ])
            setServices(fetchedServices)
            setStaffList(fetchedStaff)
            setGlobalOptions(fetchedGlobalOptions)
        } catch (error) {
            console.error('Failed to load booking data:', error)
            toast.error('データの読み込みに失敗しました')
        } finally {
            setLoading(false)
        }
    }, [storeId]) // Add storeId to dependencies

    useEffect(() => {
        if (open) {
            loadData()
            if (initialDate) {
                setDate(initialDate)
            }
            if (initialTime) {
                setTime(initialTime)
            }
        }
    }, [open, initialDate, initialTime, loadData]) // Add loadData to dependencies

    useEffect(() => {
        if (selectedServices.length > 0) {
            loadOptionsForServices(selectedServices)
        } else {
            setAvailableOptions({})
            // Clean up options for unselected services
            setSelectedOptions(prev => {
                const newOptions = { ...prev }
                Object.keys(newOptions).forEach(key => {
                    if (!selectedServices.includes(key)) {
                        delete newOptions[key]
                    }
                })
                return newOptions
            })
        }
    }, [selectedServices])

    async function loadOptionsForServices(serviceIds: string[]) {
        try {
            // Fetch options for all services in parallel
            const optionsPromises = serviceIds.map(async id => {
                const options = await menuService.getOptionsByServiceId(id)
                return { id, options }
            })
            const results = await Promise.all(optionsPromises)

            const newAvailableOptions: Record<string, ServiceOption[]> = {}
            results.forEach(res => {
                newAvailableOptions[res.id] = res.options
            })

            setAvailableOptions(prev => ({ ...prev, ...newAvailableOptions }))
        } catch (error) {
            console.error('Failed to load options:', error)
        }
    }

    const handleNext = () => setStep(step + 1)
    const handleBack = () => setStep(step - 1)

    const handleSubmit = async () => {
        if (!date || !time || selectedServices.length === 0 || !customerName) return

        setLoading(true)
        setPaymentInProgress(true)
        try {
            // Calculate totals
            const selectedServiceObjects = services.filter(s => selectedServices.includes(s.id))
            if (selectedServiceObjects.length === 0) return

            const primaryService = selectedServiceObjects[0]
            const secondaryServices = selectedServiceObjects.slice(1)

            // Flatten service options and add global options
            const allServiceOptions = Object.values(selectedOptions).flat()
            const allOptions = [...allServiceOptions, ...selectedGlobalOptions]

            // Calculate total duration (sum of all services + options)
            const servicesDuration = selectedServiceObjects.reduce((sum, s) => sum + s.duration_minutes, 0)
            const optionsDuration = allOptions.reduce((sum, opt) => sum + opt.duration_minutes, 0)
            const totalDuration = servicesDuration + optionsDuration

            // Calculate subtotal
            const servicesPrice = selectedServiceObjects.reduce((sum, s) => sum + s.price, 0)
            const optionsPrice = allOptions.reduce((sum, opt) => sum + opt.price, 0)
            const subtotal = servicesPrice + optionsPrice

            const totalPrice = Math.max(0, subtotal - discountAmount) // Apply discount

            // Process Payment if not local
            let paymentStatus: 'unpaid' | 'paid' = 'unpaid'

            if (paymentMethod !== 'local') {
                try {
                    // Simulate payment flow
                    await paymentService.createPaymentIntent(totalPrice, paymentMethod)
                    paymentStatus = 'paid'
                    toast.success('決済が完了しました')
                } catch (paymentError) {
                    toast.error('決済に失敗しました。もう一度お試しください。')
                    setLoading(false)
                    setPaymentInProgress(false)
                    return
                }
            }

            // Calculate end time
            const [hours, minutes] = time.split(':').map(Number)
            const bookingDate = new Date(date)
            bookingDate.setHours(hours, minutes)

            const endDate = new Date(bookingDate)
            endDate.setMinutes(endDate.getMinutes() + totalDuration)

            // Construct options array including secondary services as "options"
            const bookingOptions = [
                ...secondaryServices.map(s => ({
                    name: `追加メニュー: ${s.name} `,
                    price: s.price,
                    duration_minutes: s.duration_minutes
                })),
                ...allOptions.map(o => ({
                    name: o.name,
                    price: o.price,
                    duration_minutes: o.duration_minutes
                }))
            ]

            await createBookingAction({
                store_id: storeId,
                service_id: primaryService.id, // Use primary service ID
                staff_id: selectedStaff === 'no-preference' ? null : selectedStaff,
                auth_user_id: user?.id || null, // Pass auth_user_id separate from customer_id
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
                start_time: bookingDate.toISOString(),
                end_time: endDate.toISOString(),
                options: bookingOptions,
                total_price: totalPrice,
                payment_status: paymentStatus,
                payment_method: paymentMethod,
                buffer_minutes_before: primaryService.buffer_time_before || 0,
                buffer_minutes_after: primaryService.buffer_time_after || 0,
                status: 'confirmed'
            })

            // Send Confirmation Email
            const serviceName = services.filter(s => selectedServices.includes(s.id)).map(s => s.name).join(', ')
            const staffName = selectedStaff === 'no-preference' ? '指定なし' : staffList.find(s => s.id === selectedStaff)?.name

            await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: customerEmail || 'customer@example.com', // Fallback for demo if email not provided
                    subject: `【${storeName}】予約確定のお知らせ`,
                    storeId, // Add this
                    type: 'booking_confirmation',
                    data: {
                        customerName,
                        serviceName: optionsSummary(serviceName, allOptions),
                        staffName,
                        date: bookingDate.toLocaleDateString(),
                        time: time,
                        paymentMethod: paymentMethod === 'local' ? '現地決済' : paymentMethod === 'card' ? 'クレジットカード' : 'PayPay',
                        totalPrice: totalPrice,
                        storeName: storeName // Add this
                    }
                })
            })

            // Simulate LINE Notification
            if (lineNotify) {
                toast.success('LINEにも通知を送信しました (Demo)')
            }

            toast.success('予約が完了しました！確認メールを送信しました。')
            setOpen(false)
            resetForm()
            router.push(`/ store / ${slug}/thanks`)
        } catch (error) {
            console.error('Booking failed:', error)
            toast.error('予約に失敗しました。もう一度お試しください。')
        } finally {
            setLoading(false)
            setPaymentInProgress(false)
        }
    }

    const optionsSummary = (serviceName: string, options: ServiceOption[]) => {
        if (options.length === 0) return serviceName
        const opts = options.map(o => o.name).join(', ')
        return `${serviceName} (+${opts})`
    }






    const resetForm = () => {
        setStep(1)
        setSelectedServices([])
        setSelectedOptions({})
        setSelectedGlobalOptions([])
        setAvailableOptions({})
        setSelectedStaff('')
        setDate(initialDate || new Date())
        setTime('')
        setCustomerName('')
        setCustomerEmail('')
        setCustomerPhone('')
        setLineNotify(false)
        setPaymentMethod('local')
        setCouponCode('')
        setAppliedCoupon(null)
        setDiscountAmount(0)
        setCouponError('')
    }

    const handleApplyCoupon = async () => {
        if (!couponCode) return
        setCouponError('')
        setAppliedCoupon(null)
        setDiscountAmount(0)

        // Calculate current subtotal to check if applicable needed?
        // Basic check
        setLoading(true)
        try {
            // Use a temporary coupon code input for now, or integrate with a coupon selection UI
            const coupon = await validateCouponAction(storeId, couponCode)
            if (!coupon) {
                setCouponError('無効なクーポンコードです')
                return
            }

            // Calculate discount
            const selectedServiceObjects = services.filter(s => selectedServices.includes(s.id))
            const allServiceOptions = Object.values(selectedOptions).flat()
            const allOptions = [...allServiceOptions, ...selectedGlobalOptions]

            const servicesPrice = selectedServiceObjects.reduce((sum, s) => sum + s.price, 0)
            const subtotal = servicesPrice + allOptions.reduce((sum, opt) => sum + opt.price, 0)

            let discount = 0
            if (coupon.discount_type === 'fixed') {
                discount = coupon.discount_amount
            } else {
                discount = Math.floor(subtotal * (coupon.discount_amount / 100))
            }

            // Ensure discount doesn't exceed total
            if (discount > subtotal) discount = subtotal

            setAppliedCoupon(coupon)
            setDiscountAmount(discount)
            toast.success('クーポンを適用しました')
        } catch (error) {
            console.error(error)
            setCouponError('クーポンの確認中にエラーが発生しました')
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="lg"
                    className="text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: themeColor || '#78350f' }}
                >
                    {triggerLabel || '予約する'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] md:max-w-4xl transition-all duration-300">
                <DialogHeader>
                    <DialogTitle>{storeName} - 予約</DialogTitle>
                    <DialogDescription>
                        以下のステップに従って予約を完了してください。
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {/* Progress Indicator */}
                    <div className="flex justify-between mb-6 text-sm text-gray-500">
                        <span className={step >= 1 ? 'font-bold' : ''} style={{ color: step >= 1 ? (themeColor || '#78350f') : undefined }}>1. メニュー</span>
                        <span className={step >= 2 ? 'font-bold' : ''} style={{ color: step >= 2 ? (themeColor || '#78350f') : undefined }}>2. スタッフ</span>
                        <span className={step >= 3 ? 'font-bold' : ''} style={{ color: step >= 3 ? (themeColor || '#78350f') : undefined }}>3. 日時</span>
                        <span className={step >= 4 ? 'font-bold' : ''} style={{ color: step >= 4 ? (themeColor || '#78350f') : undefined }}>4. 確認</span>
                    </div>

                    {step === 1 && (
                        <div className="space-y-4">
                            <Label>メニューとオプションを選択してください</Label>
                            <div className="space-y-4">
                                {services.map((service) => (
                                    <div key={service.id} className="border p-4 rounded-md">
                                        <div className="flex items-center space-x-3">
                                            <Checkbox
                                                id={service.id}
                                                checked={selectedServices.includes(service.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedServices([...selectedServices, service.id])
                                                    } else {
                                                        setSelectedServices(selectedServices.filter(id => id !== service.id))
                                                        // Also remove selected options for this service
                                                        setSelectedOptions(prev => {
                                                            const next = { ...prev }
                                                            delete next[service.id]
                                                            return next
                                                        })
                                                    }
                                                }}
                                            />
                                            {service.image_url && (
                                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md">
                                                    <img src={service.image_url} alt={service.name} className="h-full w-full object-cover" />
                                                </div>
                                            )}
                                            <Label htmlFor={service.id} className="flex-1 cursor-pointer flex justify-between font-medium">
                                                <span>{service.name}</span>
                                                <div className="text-right">
                                                    <div>¥{service.price}</div>
                                                    <div className="text-xs text-gray-500">{service.duration_minutes}分</div>
                                                </div>
                                            </Label>
                                        </div>

                                        {/* Render Options for this Service if selected */}
                                        {selectedServices.includes(service.id) && availableOptions[service.id]?.length > 0 && (
                                            <div className="ml-8 mt-3 space-y-2 border-l-2 pl-3 border-gray-100">
                                                <Label className="text-xs text-muted-foreground mb-1 block">オプション</Label>
                                                {availableOptions[service.id].map((option) => (
                                                    <div key={option.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={option.id}
                                                            checked={selectedOptions[service.id]?.some(o => o.id === option.id) || false}
                                                            onCheckedChange={(checked) => {
                                                                setSelectedOptions(prev => {
                                                                    const currentOptions = prev[service.id] || []
                                                                    let newOptions: ServiceOption[]
                                                                    if (checked) {
                                                                        newOptions = [...currentOptions, option]
                                                                    } else {
                                                                        newOptions = currentOptions.filter(o => o.id !== option.id)
                                                                    }
                                                                    return { ...prev, [service.id]: newOptions }
                                                                })
                                                            }}
                                                        />
                                                        <Label htmlFor={option.id} className="text-sm cursor-pointer flex-1 flex justify-between">
                                                            <span>{option.name}</span>
                                                            <span className="text-muted-foreground">+{option.price}円 / +{option.duration_minutes}分</span>
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 border-t pt-4">
                                <Label className="text-base font-semibold mb-3 block">全体オプション</Label>
                                <div className="space-y-2">
                                    {globalOptions.map((option) => (
                                        <div key={option.id} className="flex items-center space-x-2 border p-3 rounded-md bg-slate-50">
                                            <Checkbox
                                                id={option.id}
                                                checked={selectedGlobalOptions.some(o => o.id === option.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedGlobalOptions([...selectedGlobalOptions, option])
                                                    } else {
                                                        setSelectedGlobalOptions(selectedGlobalOptions.filter(o => o.id !== option.id))
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={option.id} className="text-sm cursor-pointer flex-1 flex justify-between">
                                                <span>{option.name}</span>
                                                <span className="text-muted-foreground">+{option.price}円</span>
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <Label>スタッフを選択してください（指名なし可）</Label>
                            <RadioGroup value={selectedStaff} onValueChange={setSelectedStaff}>
                                <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50 cursor-pointer">
                                    <RadioGroupItem value="no-preference" id="no-preference" />
                                    <Label htmlFor="no-preference" className="flex-1 cursor-pointer">指定なし</Label>
                                </div>
                                {staffList.map((staff) => (
                                    <div key={staff.id} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50 cursor-pointer">
                                        <RadioGroupItem value={staff.id} id={staff.id} />
                                        <Label htmlFor={staff.id} className="flex-1 cursor-pointer">
                                            {staff.name} <span className="text-xs text-gray-500">({staff.role})</span>
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <Label>日時を選択してください</Label>

                            {/* Calculate parameters for WeeklyCalendar */}
                            {(() => {
                                const selectedServiceObjects = services.filter(s => selectedServices.includes(s.id))
                                const primaryService = selectedServiceObjects[0]
                                const allServiceOptions = Object.values(selectedOptions).flat()
                                const allOptions = [...allServiceOptions, ...selectedGlobalOptions]

                                const servicesDuration = selectedServiceObjects.reduce((sum, s) => sum + s.duration_minutes, 0)
                                const optionsDuration = allOptions.reduce((sum, opt) => sum + opt.duration_minutes, 0)
                                const totalDuration = servicesDuration + optionsDuration

                                return (
                                    <div className="border rounded-md p-2">
                                        <WeeklyCalendar
                                            storeId={storeId}
                                            onSelect={(d, t) => {
                                                setDate(d)
                                                if (t) setTime(t)
                                            }}
                                            durationMinutes={totalDuration}
                                            staffId={selectedStaff === 'no-preference' ? undefined : selectedStaff}
                                            bufferBefore={primaryService?.buffer_time_before || 0}
                                            bufferAfter={primaryService?.buffer_time_after || 0}
                                        />
                                        <div className="mt-4 text-center">
                                            {date && time ? (
                                                <div className="text-lg font-bold text-stone-800">
                                                    選択日時: {date.toLocaleDateString()} {time}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-500">
                                                    ◎ の付いている時間帯をクリックしてください
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })()}
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4">
                            <Label>お客様情報を入力してください</Label>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="customerName">お名前</Label>
                                    <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="山田 太郎" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="customerEmail">メールアドレス（任意）</Label>
                                    <Input id="customerEmail" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="taro@example.com" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="customerPhone">電話番号（任意）</Label>
                                    <Input id="customerPhone" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="090-1234-5678" />
                                </div>
                            </div>

                            <div className="space-y-2 mt-4">
                                <Label>お支払い方法</Label>
                                <RadioGroup value={paymentMethod} onValueChange={(val: PaymentMethod) => setPaymentMethod(val)} className="grid grid-cols-3 gap-2">
                                    <div>
                                        <RadioGroupItem value="local" id="local" className="peer sr-only" />
                                        <Label
                                            htmlFor="local"
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                        >
                                            <span className="text-xl mb-1">🏠</span>
                                            現地決済
                                        </Label>
                                    </div>
                                    <div>
                                        <RadioGroupItem value="card" id="card" className="peer sr-only" />
                                        <Label
                                            htmlFor="card"
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                        >
                                            <span className="text-xl mb-1">💳</span>
                                            カード
                                        </Label>
                                    </div>
                                    <div>
                                        <RadioGroupItem value="paypay" id="paypay" className="peer sr-only" />
                                        <Label
                                            htmlFor="paypay"
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                        >
                                            <span className="text-xl mb-1">📱</span>
                                            PayPay
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-2 mt-4">
                                <Label>クーポンコード</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Ticket className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            placeholder="クーポンコードを入力"
                                            className="pl-8"
                                            disabled={!!appliedCoupon}
                                        />
                                    </div>
                                    {appliedCoupon ? (
                                        <Button variant="outline" onClick={() => {
                                            setAppliedCoupon(null)
                                            setDiscountAmount(0)
                                            setCouponCode('')
                                        }}>クリア</Button>
                                    ) : (
                                        <Button variant="secondary" onClick={handleApplyCoupon} disabled={!couponCode}>適用</Button>
                                    )}
                                </div>
                                {couponError && <p className="text-xs text-red-500">{couponError}</p>}
                                {appliedCoupon && (
                                    <p className="text-xs text-green-600 font-medium">
                                        {appliedCoupon.name}が適用されました (-¥{discountAmount})
                                    </p>
                                )}
                            </div>

                            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                                <h4 className="font-semibold mb-2">予約内容の確認</h4>
                                <ul className="text-sm space-y-1">
                                    <li><strong>メニュー:</strong> {services.filter(s => selectedServices.includes(s.id)).map(s => s.name).join(', ')}</li>
                                    {Object.values(selectedOptions).flat().length > 0 && (
                                        <li><strong>オプション:</strong> {Object.values(selectedOptions).flat().map((o: any) => o.name).join(', ')}</li>
                                    )}
                                    {selectedGlobalOptions.length > 0 && (
                                        <li><strong>全体オプション:</strong> {selectedGlobalOptions.map((o: any) => o.name).join(', ')}</li>
                                    )}
                                    <li><strong>小計:</strong> ¥{services.filter(s => selectedServices.includes(s.id)).reduce((sum, s) => sum + s.price, 0) + Object.values(selectedOptions).flat().reduce((sum: any, o: any) => sum + o.price, 0) + selectedGlobalOptions.reduce((sum: any, o: any) => sum + o.price, 0)}</li>
                                    {appliedCoupon && (
                                        <li className="text-red-600"><strong>クーポン割引:</strong> -¥{discountAmount} ({appliedCoupon.code})</li>
                                    )}
                                    <li className="text-lg mt-2 border-t pt-2"><strong>合計支払額:</strong> ¥{services.filter(s => selectedServices.includes(s.id)).reduce((sum, s) => sum + s.price, 0) + Object.values(selectedOptions).flat().reduce((sum: any, o: any) => sum + o.price, 0) + selectedGlobalOptions.reduce((sum: any, o: any) => sum + o.price, 0) - discountAmount}</li>
                                    <li><strong>合計時間:</strong> {services.filter(s => selectedServices.includes(s.id)).reduce((sum, s) => sum + s.duration_minutes, 0) + Object.values(selectedOptions).flat().reduce((sum: any, o: any) => sum + o.duration_minutes, 0) + selectedGlobalOptions.reduce((sum: any, o: any) => sum + o.duration_minutes, 0)}分</li>
                                    <li><strong>スタッフ:</strong> {selectedStaff === 'no-preference' ? '指定なし' : staffList.find(s => s.id === selectedStaff)?.name}</li>
                                    <li><strong>日時:</strong> {date?.toLocaleDateString()} {time}</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between sm:justify-between">
                    {step > 1 ? (
                        <Button variant="outline" onClick={handleBack}>戻る</Button>
                    ) : (
                        <div></div>
                    )}

                    {step < 4 ? (
                        <Button
                            onClick={handleNext}
                            disabled={
                                (step === 1 && selectedServices.length === 0) ||
                                (step === 2 && !selectedStaff) ||
                                (step === 3 && (!date || !time))
                            }
                            style={{ backgroundColor: themeColor || '#78350f' }}
                            className="text-white hover:opacity-90"
                        >
                            次へ
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || !customerName}
                            style={{ backgroundColor: themeColor || '#78350f' }}
                            className="text-white hover:opacity-90"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {paymentMethod === 'local' ? '予約を確定する' : '支払って予約する'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
