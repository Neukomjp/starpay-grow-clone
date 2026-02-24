'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

export default function AdminSettingsPage() {
    const [maintenanceMode, setMaintenanceMode] = useState(false)
    const [systemAnnouncement, setSystemAnnouncement] = useState('')

    const handleSave = () => {
        // In a real app, this would save to a database or config file
        console.log('Saving settings:', { maintenanceMode, systemAnnouncement })
        toast.success('システム設定を保存しました')
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">システム設定</h2>
                <p className="text-muted-foreground">システム全体の動作設定を行います。</p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>メンテナンスモード</CardTitle>
                        <CardDescription>
                            有効にすると、管理者以外の全ユーザーのアクセスを制限します。
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="maintenance-mode" className="flex flex-col space-y-1">
                                <span>メンテナンスモードを有効化</span>
                                <span className="font-normal text-muted-foreground">現在: {maintenanceMode ? '有効' : '無効'}</span>
                            </Label>
                            <Switch
                                id="maintenance-mode"
                                checked={maintenanceMode}
                                onCheckedChange={setMaintenanceMode}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>システムアナウンス</CardTitle>
                        <CardDescription>
                            全ユーザーのダッシュボードに表示するお知らせメッセージを設定します。
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="announcement">メッセージ内容</Label>
                            <Input
                                id="announcement"
                                placeholder="例: 2月20日 2:00〜4:00 メンテナンスを実施します"
                                value={systemAnnouncement}
                                onChange={(e) => setSystemAnnouncement(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button onClick={handleSave}>設定を保存</Button>
                </div>
            </div>
        </div>
    )
}
