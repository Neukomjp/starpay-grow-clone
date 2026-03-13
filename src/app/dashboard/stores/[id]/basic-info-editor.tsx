'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { StoreData } from '@/lib/types/store'
import { updateStoreAction } from '@/lib/actions/store'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface BasicInfoEditorProps {
    store: StoreData
    allStores?: any[]
}

export function BasicInfoEditor({ store, allStores = [] }: BasicInfoEditorProps) {
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState(store.name)
    const [slug, setSlug] = useState(store.slug)
    const [description, setDescription] = useState(store.description || '')
    const [address, setAddress] = useState(store.address || '')
    const [phone, setPhone] = useState(store.phone || '')
    const [bookingInterval, setBookingInterval] = useState(store.booking_interval_minutes?.toString() || '30')
    const [crossStoreBuffers, setCrossStoreBuffers] = useState<Record<string, number>>(store.cross_store_buffers || {})

    // Initialize business days (default 10:00-19:00 if not set)
    const [businessDays, setBusinessDays] = useState(() => {
        if (store.business_days && store.business_days.length > 0) return store.business_days
        return Array.from({ length: 7 }).map((_, i) => ({
            day_of_week: i, // 0=Sun
            start_time: '10:00',
            end_time: '19:00',
            is_closed: i === 0 || i === 6 ? false : false // Default open usage? Let's say all open by default
        }))
    })

    const handleTimeChange = (index: number, field: 'start_time' | 'end_time', value: string) => {
        const newDays = [...businessDays]
        newDays[index] = { ...newDays[index], [field]: value }
        setBusinessDays(newDays)
    }

    const handleClosedChange = (index: number, isClosed: boolean) => {
        const newDays = [...businessDays]
        newDays[index] = { ...newDays[index], is_closed: isClosed }
        setBusinessDays(newDays)
    }

    const handleBufferChange = (otherStoreId: string, minutes: number) => {
        setCrossStoreBuffers(prev => ({
            ...prev,
            [otherStoreId]: minutes
        }))
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            await updateStoreAction(store.id, {
                name,
                slug,
                description,
                address,
                phone,
                booking_interval_minutes: parseInt(bookingInterval),
                business_days: businessDays,
                cross_store_buffers: crossStoreBuffers
            })
            toast.success('店舗情報を更新しました')
        } catch (error) {
            console.error(error)
            toast.error('更新に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">店舗名</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="slug">URLスラッグ</Label>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">example.com/store/</span>
                        <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="description">説明文</Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="店舗の説明を入力してください"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="address">住所（アクセス）</Label>
                    <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="東京都渋谷区..." />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="phone">電話番号</Label>
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03-XXXX-XXXX" />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="interval">予約受付間隔</Label>
                    <Select value={bookingInterval} onValueChange={setBookingInterval}>
                        <SelectTrigger id="interval">
                            <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10分刻み</SelectItem>
                            <SelectItem value="15">15分刻み</SelectItem>
                            <SelectItem value="20">20分刻み</SelectItem>
                            <SelectItem value="30">30分刻み</SelectItem>
                            <SelectItem value="60">60分刻み</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                        予約枠の生成間隔を設定します（例：30分刻みの場合、10:00, 10:30, 11:00...）
                    </p>
                </div>

                <div className="grid gap-4 border-t pt-4">
                    <h3 className="font-semibold text-lg">営業時間設定</h3>
                    <div className="space-y-4">
                        {businessDays.map((dayConfig, index) => (
                            <div key={dayConfig.day_of_week} className="flex items-center gap-4 p-3 bg-stone-50 rounded-md">
                                <div className="w-16 font-medium">
                                    {['日', '月', '火', '水', '木', '金', '土'][dayConfig.day_of_week]}
                                </div>
                                <div className="flex items-center gap-2 flex-1">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="time"
                                            value={dayConfig.start_time}
                                            onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                                            disabled={dayConfig.is_closed}
                                            className="w-32"
                                        />
                                        <span>~</span>
                                        <Input
                                            type="time"
                                            value={dayConfig.end_time}
                                            onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                                            disabled={dayConfig.is_closed}
                                            className="w-32"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <Checkbox
                                            id={`closed-${dayConfig.day_of_week}`}
                                            checked={dayConfig.is_closed}
                                            onCheckedChange={(checked) => handleClosedChange(index, checked === true)}
                                        />
                                        <Label htmlFor={`closed-${dayConfig.day_of_week}`} className="cursor-pointer">
                                            定休日
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {allStores.length > 1 && (
                    <div className="grid gap-4 border-t pt-4">
                        <h3 className="font-semibold text-lg">他店舗からの移動時間設定</h3>
                        <p className="text-sm text-muted-foreground">
                            スタッフが同日に別店舗でシフトや予約を持っている場合、その店舗との間に自動で確保する予約不可時間（移動バッファ）を分単位で設定します。未設定の場合はデフォルトで60分が適用されます。
                        </p>
                        <div className="space-y-3">
                            {allStores.filter(s => s.id !== store.id).map(otherStore => (
                                <div key={otherStore.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-md">
                                    <div className="font-medium text-sm">
                                        {otherStore.name} <span className="text-muted-foreground text-xs font-normal">との移動バッファ</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min="0"
                                            step="10"
                                            className="w-24 text-right"
                                            placeholder="60"
                                            value={crossStoreBuffers[otherStore.id] !== undefined ? crossStoreBuffers[otherStore.id] : ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '') {
                                                    // Remove the key if empty
                                                    const newBuffers = { ...crossStoreBuffers }
                                                    delete newBuffers[otherStore.id]
                                                    setCrossStoreBuffers(newBuffers)
                                                } else {
                                                    handleBufferChange(otherStore.id, parseInt(val) || 0)
                                                }
                                            }}
                                        />
                                        <span className="text-sm">分</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    保存
                </Button>
            </div>
        </div>
    )
}
