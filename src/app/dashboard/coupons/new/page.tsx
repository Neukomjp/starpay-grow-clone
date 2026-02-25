'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { createCouponAction } from '@/lib/actions/coupon'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useEffect } from 'react'

export default function NewCouponPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [storeId, setStoreId] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        discount_type: 'fixed' as 'fixed' | 'percent',
        discount_amount: '',
        expires_at: ''
    })

    useEffect(() => {
        const loadStore = async () => {
            try {
                const { getStoresAction } = await import('@/lib/actions/store')
                const stores = await getStoresAction()
                if (stores && stores.length > 0) {
                    setStoreId(stores[0].id)
                }
            } catch (err) {
                console.error(err)
            }
        }
        loadStore()

        // Default expiry 1 month later
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        setFormData(prev => ({ ...prev, expires_at: nextMonth.toISOString().split('T')[0] }))
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name || !formData.code || !formData.discount_amount) return

        setLoading(true)
        try {
            await createCouponAction({
                store_id: storeId,
                name: formData.name,
                code: formData.code.toUpperCase(),
                discount_type: formData.discount_type,
                discount_amount: Number(formData.discount_amount),
                starts_at: new Date().toISOString(),
                expires_at: new Date(formData.expires_at).toISOString(),
                is_active: true
            })
            toast.success('クーポンを作成しました')
            router.push('/dashboard/coupons')
        } catch (error) {
            console.error('Failed to create coupon:', error)
            toast.error('作成に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/coupons">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">新規クーポン作成</h2>
                    <p className="text-muted-foreground">新しいクーポンを発行します。</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>クーポン情報</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name">クーポン名</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="例: 初回限定割引"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="code">クーポンコード (英数字)</Label>
                            <Input
                                id="code"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="例: WELCOME2024"
                                className="font-mono uppercase"
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>割引タイプ</Label>
                            <RadioGroup
                                value={formData.discount_type}
                                onValueChange={(val: 'fixed' | 'percent') => setFormData({ ...formData, discount_type: val })}
                                className="flex gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="fixed" id="fixed" />
                                    <Label htmlFor="fixed">金額割引 (円)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="percent" id="percent" />
                                    <Label htmlFor="percent">定率割引 (%)</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="amount">割引額 / 率</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={formData.discount_amount}
                                onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                                placeholder={formData.discount_type === 'fixed' ? '1000' : '10'}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                {formData.discount_type === 'fixed' ? '円引きになります' : '%OFFになります'}
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="expires">有効期限</Label>
                            <Input
                                id="expires"
                                type="date"
                                value={formData.expires_at}
                                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button variant="outline" type="button" asChild>
                                <Link href="/dashboard/coupons">キャンセル</Link>
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                作成する
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
