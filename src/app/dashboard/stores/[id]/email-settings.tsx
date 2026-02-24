'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StoreData } from '@/lib/types/store'
import { updateStoreAction } from '@/lib/actions/store'
import { toast } from 'sonner'
import { Loader2, Mail } from 'lucide-react'

interface EmailSettingsProps {
    store: StoreData
}

export function EmailSettings({ store }: EmailSettingsProps) {
    const [loading, setLoading] = useState(false)
    const [config, setConfig] = useState(store.email_config || {})

    // Helper to update specific template config
    const updateTemplate = (type: 'booking_confirmation', field: 'subject' | 'body', value: string) => {
        setConfig(prev => {
            const currentConfig = prev[type] || { subject: '', body: '' }
            return {
                ...prev,
                [type]: {
                    ...currentConfig,
                    [field]: value
                }
            }
        })
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            await updateStoreAction(store.id, {
                email_config: config
            })
            toast.success('メール設定を保存しました')
        } catch (error) {
            console.error('Failed to save email settings:', error)
            toast.error('保存に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">メール通知設定</h3>
                    <p className="text-sm text-gray-500">顧客に送信される自動返信メールの内容をカスタマイズします。</p>
                </div>
                <Button onClick={handleSave} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    変更を保存
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        予約確定メール
                    </CardTitle>
                    <CardDescription>
                        予約が確定した際に顧客に送信されるメールです。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="subject">件名</Label>
                        <Input
                            id="subject"
                            placeholder="【{{storeName}}】予約確定のお知らせ"
                            value={config.booking_confirmation?.subject || ''}
                            onChange={(e) => updateTemplate('booking_confirmation', 'subject', e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                            利用可能な変数: <code>{"{{storeName}}"}</code>
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="body">本文テンプレート</Label>
                        <Textarea
                            id="body"
                            className="min-h-[200px] font-mono text-sm"
                            placeholder={`{{customerName}} 様\n\nご予約ありがとうございます。\n以下の内容で予約を承りました。\n\n日時: {{date}} {{time}}\nメニュー: {{serviceName}}\nスタッフ: {{staffName}}\n\nご来店をお待ちしております。\n\n{{storeName}}`}
                            value={config.booking_confirmation?.body || ''}
                            onChange={(e) => updateTemplate('booking_confirmation', 'body', e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                            利用可能な変数: <code>{"{{customerName}}"}</code>, <code>{"{{date}}"}</code>, <code>{"{{time}}"}</code>, <code>{"{{serviceName}}"}</code>, <code>{"{{staffName}}"}</code>, <code>{"{{storeName}}"}</code>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
