'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOrganizationAction } from '@/lib/actions/organization'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        const formData = new FormData(event.currentTarget)
        const name = formData.get('name') as string

        try {
            await createOrganizationAction(name)
            toast.success('組織を作成しました！')
            // Organization action automatically sets the cookie context and auth redirects back to dashboard.
            // Let's force a hard navigation or router refresh to hit middleware again.
            router.push('/dashboard')
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || '組織の作成に失敗しました')
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
            <div className="w-full max-w-md mb-8 flex justify-end">
                <Button variant="ghost" className="text-gray-500 hover:text-gray-700" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    ログアウト
                </Button>
            </div>
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">サロン予約システムへようこそ</CardTitle>
                    <CardDescription className="text-center">
                        まずは最初の組織（会社やグループ）を作成しましょう
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">組織名 (例: 株式会社 デモサロン)</Label>
                            <Input id="name" name="name" type="text" required placeholder="会社名または組織名を入力" />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? '作成中...' : '新しく作成して始める'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
