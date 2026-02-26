'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { toast } from 'sonner'

import { loginCustomerAction } from '@/lib/actions/auth'

export default function CustomerLoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        const formData = new FormData(event.currentTarget)
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        try {
            const result = await loginCustomerAction(email, password)

            if (!result.success) {
                toast.error(result.message || 'ログインに失敗しました。メールアドレスとパスワードを確認してください。')
                setLoading(false)
            } else {
                toast.success('ログインしました')
                router.push('/mypage')
                router.refresh()
            }
        } catch (error) {
            console.error(error)
            toast.error('エラーが発生しました')
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">顧客ログイン</CardTitle>
                    <CardDescription className="text-center">
                        メールアドレスとパスワードを入力してください
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">メールアドレス</Label>
                            <Input id="email" name="email" type="email" required placeholder="m@example.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">パスワード</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'ログイン中...' : 'ログイン'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-500">
                        アカウントをお持ちではありませんか？{' '}
                        <Link href="/signup/customer" className="text-blue-600 hover:underline">
                            新規作成
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
