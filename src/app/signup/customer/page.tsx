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

export default function CustomerSignupPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        const formData = new FormData(event.currentTarget)
        const email = formData.get('email') as string
        const password = formData.get('password') as string
        const name = formData.get('name') as string
        const phone = formData.get('phone') as string
        const supabase = createClient()

        // Validate password: must contain at least one uppercase, one lowercase, and one number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/
        if (!passwordRegex.test(password)) {
            toast.error('パスワードは、大文字・小文字の英字と数字をそれぞれ1文字以上含む必要があります。')
            setLoading(false)
            return
        }

        // 1. Sign up
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role: 'customer', // Stored in metadata
                }
            }
        })

        if (authError) {
            toast.error(authError.message)
            setLoading(false)
            return
        }

        if (authData.user) {
            // 2. Create Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    email: email,
                    role: 'customer',
                    full_name: name,
                    phone: phone
                })

            if (profileError) {
                console.error('Profile creation error:', profileError)
                toast.error('アカウント作成中にエラーが発生しました')
            } else {
                toast.success('アカウントを作成しました！')
                router.push('/mypage')
            }
        }
        setLoading(false)
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">顧客アカウント作成</CardTitle>
                    <CardDescription className="text-center">
                        予約履歴の確認やスムーズな予約のためにアカウントを作成しましょう
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">お名前</Label>
                            <Input id="name" name="name" required placeholder="山田 太郎" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">メールアドレス</Label>
                            <Input id="email" name="email" type="email" required placeholder="m@example.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">電話番号</Label>
                            <Input id="phone" name="phone" type="tel" required placeholder="090-1234-5678" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">パスワード</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? '作成中...' : 'アカウント作成'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-500">
                        すでにアカウントをお持ちですか？{' '}
                        <Link href="/login/customer" className="text-blue-600 hover:underline">
                            ログイン
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
