'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function UpdatePasswordPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        const formData = new FormData(event.currentTarget)
        const password = formData.get('password') as string
        const confirmPassword = formData.get('confirmPassword') as string

        if (password !== confirmPassword) {
            toast.error('パスワードが一致しません')
            setLoading(false)
            return
        }

        // Validate password: must contain at least one uppercase, one lowercase, and one number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/
        if (!passwordRegex.test(password)) {
            toast.error('パスワードは、大文字・小文字の英字と数字をそれぞれ1文字以上含む必要があります。')
            setLoading(false)
            return
        }

        const supabase = createClient()
        const { error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) {
            toast.error(error.message)
            setLoading(false)
            return
        }

        toast.success('パスワードを更新しました。新しいパスワードでログインしてください。')

        // Try to fetch profile to see if it's a customer or staff to redirect accordingly, but usually reset sessions might just sign them out or leave them signed in.
        // We'll redirect to the main login as a default safe path.
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.user_metadata?.role === 'customer') {
            router.push('/login/customer')
        } else {
            router.push('/login')
        }

        setLoading(false)
        router.refresh()
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">新しいパスワードの設定</CardTitle>
                    <CardDescription className="text-center">
                        新しいパスワードを入力してください
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">新しいパスワード</Label>
                            <Input id="password" name="password" type="password" required />
                            <p className="text-xs text-muted-foreground">大文字・小文字の英字と数字を各1文字以上含めてください</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">新しいパスワード（確認用）</Label>
                            <Input id="confirmPassword" name="confirmPassword" type="password" required />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? '更新中...' : 'パスワードを更新する'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
