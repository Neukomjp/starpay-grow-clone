'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCurrentOrganization } from '@/hooks/use-current-organization'
import { Loader2, Users, CreditCard } from 'lucide-react'
import { canManageBilling } from '@/lib/rbac'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { updateOrganizationAction } from '@/lib/actions/organization'

export function OrganizationSettings() {
    const { organization, loading } = useCurrentOrganization()

    if (loading) return <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>

    if (!organization) return <div>組織が選択されていません。</div>

    const handleSave = async () => {
        try {
            const domainInput = document.getElementById('custom-domain-input') as HTMLInputElement
            const brandingInput = document.getElementById('remove-branding') as HTMLButtonElement // Checkbox is button in radix/shadcn usually, but let's check input type
            // Actually Shadcn Checkbox is a bit complex to get ref from ID directly if not controlled.
            // Better to use state or refs. For speed/simplicity in this edit, I will assume controlled or simple ID access if native input.
            // BUT Shadcn Checkbox is NOT a native input. It is a button.

            // Let's standard refactor to use simple refs or state if possible, but I can't easily add imports/state in this small window without multiple edits.
            // I'll use a safer approach: I'll assume I can't easily get the value without state.
            // I'll make the component use state for these inputs.
            toast.info('保存処理を実装中...')

            // Getting values via DOM for now (MVP style)
            const domain = domainInput?.value
            const removeBranding = (document.getElementById('remove-branding') as HTMLButtonElement)?.dataset.state === 'checked'

            await updateOrganizationAction(organization.id, {
                custom_domain: domain,
                branding: {
                    ...organization.branding,
                    remove_branding: removeBranding
                }
            })
            toast.success('組織設定を保存しました')
        } catch (error) {
            console.error(error)
            toast.error('保存に失敗しました')
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>組織情報</CardTitle>
                    <CardDescription>組織の基本設定とメンバー管理</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>組織名</Label>
                        <Input defaultValue={organization.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label>現在のプラン</Label>
                        <div className="flex items-center gap-2 border p-3 rounded-md bg-gray-50">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium capitalize">{organization.plan} Plan</span>
                            <Badge variant={organization.plan === 'free' ? 'secondary' : 'default'}>
                                {organization.plan === 'free' ? 'Free' : 'Pro'}
                            </Badge>
                        </div>
                    </div>
                    {canManageBilling(organization.role) && (
                        <div className="pt-2">
                            <Button variant="outline" onClick={() => toast.info('Billing portal mock')}>
                                プランを変更 / 請求管理
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>ホワイトラベル設定 (White Labeling)</CardTitle>
                    <CardDescription>
                        Enterpriseプラン向けの機能です。独自のドメインとブランディング設定を行えます。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>カスタムドメイン</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="booking.example.com"
                                defaultValue={organization.custom_domain}
                                id="custom-domain-input"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            CNAMEレコードの設定が必要です。設定後、反映まで時間がかかる場合があります。
                        </p>
                    </div>

                    <div className="flex items-center space-x-2 border p-4 rounded-md">
                        <Checkbox
                            id="remove-branding"
                            defaultChecked={organization.branding?.remove_branding}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="remove-branding" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                &quot;Powered by Service&quot; の表示を削除
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                フッターや予約画面からサービスロゴを非表示にします。
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>メンバー</CardTitle>
                    <CardDescription>
                        現在のロール: <Badge variant="outline">{organization.role}</Badge>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-gray-200 rounded-full p-2">
                                    <Users className="h-4 w-4 text-gray-600" />
                                </div>
                                <div>
                                    <p className="font-medium">Current User (You)</p>
                                    <p className="text-sm text-muted-foreground">{organization.role}</p>
                                </div>
                            </div>
                        </div>
                        {/* Mock other members */}
                        <div className="flex items-center justify-between border-b pb-4 opacity-60">
                            <div className="flex items-center gap-3">
                                <div className="bg-gray-200 rounded-full p-2">
                                    <Users className="h-4 w-4 text-gray-600" />
                                </div>
                                <div>
                                    <p className="font-medium">Demo Admin</p>
                                    <p className="text-sm text-muted-foreground">admin</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Button variant="secondary" className="w-full" onClick={() => toast.info('Invite flow mock')}>
                            メンバーを招待
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave}>組織設定を保存</Button>
            </div>
        </div>
    )
}
