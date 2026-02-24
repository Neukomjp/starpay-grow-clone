'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createStoreAction } from '@/lib/actions/store'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function NewStorePage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [slug, setSlug] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !slug) return

        setLoading(true)
        try {
            await createStoreAction(name, slug)
            toast.success('店舗を作成しました')
            router.push('/dashboard/stores')
            router.refresh()
        } catch (error) {
            console.error('Failed to create store:', error)
            toast.error('店舗の作成に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight mb-6">新規店舗作成</h2>

            <Card>
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>店舗情報</CardTitle>
                        <CardDescription>
                            新しい店舗の基本情報を入力してください。
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">店舗名</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="例: StarPay Salon"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="slug">URLスラッグ (英数字)</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground whitespace-nowrap">example.com/store/</span>
                                <Input
                                    id="slug"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    placeholder="starpay-salon"
                                    required
                                    pattern="^[a-z0-9-]+$"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">店舗ページのURLになります。半角英数字とハイフンのみ使用可能です。</p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" type="button" onClick={() => router.back()}>
                            キャンセル
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            作成する
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
