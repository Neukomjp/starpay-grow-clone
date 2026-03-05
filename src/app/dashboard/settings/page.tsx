'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OrganizationSettings } from './organization-settings'
import { useCurrentOrganization } from '@/hooks/use-current-organization'
import { canManageSettings } from '@/lib/rbac'

export default function SettingsPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(true)
    const { organization, loading: orgLoading } = useCurrentOrganization()

    useEffect(() => {
        const supabase = createClient()
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user && user.email) {
                setEmail(user.email)
            }
            setLoading(false)
        }
        getUser()
    }, [])

    const handleUpdateProfile = () => {
        toast.info('プロフィールの更新機能は現在開発中です')
    }

    if (loading || orgLoading) {
        return <div className="p-8">読み込み中...</div>
    }

    if (organization && !canManageSettings(organization.role)) {
        return (
            <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200 mt-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">アクセス権限がありません</h3>
                <p className="text-gray-500">設定ページを表示する権限がありません。管理者にお問い合わせください。</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">設定</h2>

            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="profile">アカウント</TabsTrigger>
                    <TabsTrigger value="organization">組織設定</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>アカウント設定</CardTitle>
                            <CardDescription>あなたのアカウント情報を管理します。</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">メールアドレス</Label>
                                <Input id="email" value={email} disabled />
                                <p className="text-xs text-muted-foreground">メールアドレスの変更は現在サポートされていません。</p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={handleUpdateProfile}>変更を保存</Button>
                    </div>
                </TabsContent>

                <TabsContent value="organization">
                    <OrganizationSettings />
                </TabsContent>
            </Tabs>
        </div>
    )
}
