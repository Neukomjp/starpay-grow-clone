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
}

export function BasicInfoEditor({ store }: BasicInfoEditorProps) {
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState(store.name)
    const [slug, setSlug] = useState(store.slug)
    const [description, setDescription] = useState(store.description || '')
    const [bookingInterval, setBookingInterval] = useState(store.booking_interval_minutes?.toString() || '30')

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

    const handleSave = async () => {
        setLoading(true)
        try {
            await updateStoreAction(store.id, {
                name,
                slug,
                description,
                booking_interval_minutes: parseInt(bookingInterval),
                business_days: businessDays
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
