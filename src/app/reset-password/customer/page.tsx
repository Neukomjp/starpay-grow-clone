'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import Link from 'next/link'
import { toast } from 'sonner'

export default function CustomerResetPasswordPage() {
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        const formData = new FormData(event.currentTarget)
        const email = formData.get('email') as string
        const supabase = createClient()

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${location.origin}/auth/callback?next=/update-password`,
        })

        if (error) {
            toast.error(error.message)
            setLoading(false)
            return
        }

        setSubmitted(true)
        setLoading(false)
    }

    if (submitted) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">メールを送信しました</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-sm text-gray-500">
                            ご入力いただいたメールアドレスに、パスワード再設定用のリンクを送信いたしました。
                            メールの受信ボックスをご確認ください。
                        </p>
                        <Button asChild className="w-full" variant="outline">
                            <Link href="/login/customer">ログイン画面に戻る</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">顧客パスワードの再設定</CardTitle>
                    <CardDescription className="text-center">
                        パスワードをリセットするメールアドレスを入力してください
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">メールアドレス</Label>
                            <Input id="email" name="email" type="email" required placeholder="m@example.com" />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? '送信中...' : 'リセットリンクを送信'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-500">
                        <Link href="/login/customer" className="text-blue-600 hover:underline">
                            ログイン画面に戻る
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
