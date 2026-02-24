'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createCustomerAction } from '@/lib/actions/customer'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useEffect } from 'react'

export default function NewCustomerPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [storeId, setStoreId] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        notes: ''
    })

    useEffect(() => {
        // Fetch current store (simplified for demo)
        const loadStore = async () => {
            // In client component we can't call server service directly if it uses fs?
            // Actually storeService uses fs only for mocks. getStoresAction would be better.
            // For now assume we can get it via standard action or just hardcode for demo
            setStoreId('22222222-2222-2222-2222-222222222221')
        }
        loadStore()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name) return

        setLoading(true)
        try {
            await createCustomerAction({
                store_id: storeId || '22222222-2222-2222-2222-222222222221',
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                notes: formData.notes,
                is_registered: false
            })
            toast.success('顧客登録が完了しました')
            router.push('/dashboard/customers')
        } catch (error) {
            console.error('Failed to create customer:', error)
            toast.error('登録に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/customers">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">新規顧客登録</h2>
                    <p className="text-muted-foreground">新しい顧客情報を登録します。</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>基本情報</CardTitle>
                    <CardDescription>
                        必須項目を入力してください。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">氏名 <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="山田 太郎"
                                required
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="email">メールアドレス</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="taro@example.com"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">電話番号</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="090-1234-5678"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="notes">管理者メモ</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="顧客に関するメモ..."
                                className="min-h-[100px]"
                            />
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button variant="outline" type="button" asChild>
                                <Link href="/dashboard/customers">キャンセル</Link>
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                登録する
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
