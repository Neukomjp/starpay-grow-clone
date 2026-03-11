'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StoreData } from '@/lib/types/store'
import { updateStoreAction } from '@/lib/actions/store'
import { addCustomDomainAction, checkDomainStatusAction, verifyDomainAction } from '@/lib/actions/email-domain'
import { toast } from 'sonner'
import { Loader2, Mail, CheckCircle, AlertCircle, RefreshCw, Copy } from 'lucide-react'

interface EmailSettingsProps {
    store: StoreData
}

export function EmailSettings({ store }: EmailSettingsProps) {
    const [loading, setLoading] = useState(false)
    const [domainLoading, setDomainLoading] = useState(false)
    const [config, setConfig] = useState(store.email_config || {})

    const customDomain = config.custom_domain;
    const domainMatch = config.sender_email?.match(/@(.+)$/);
    const targetDomain = domainMatch ? domainMatch[1] : null;

    // Default domain checks to avoid triggering custom domain flow for normal emails or resend subdomains
    const isCustomDomainCandidate = targetDomain && !targetDomain.includes('resend.dev') && !targetDomain.includes('localhost');

    // Helper to update specific template config
    const updateTemplate = (type: 'booking_confirmation', field: 'subject' | 'body', value: string) => {
        setConfig((prev: any) => {
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

    const handleAddDomain = async () => {
        if (!targetDomain) return;
        setDomainLoading(true)
        try {
            const domainData = await addCustomDomainAction(store.id, targetDomain)
            setConfig((prev: any) => ({
                ...prev,
                custom_domain: {
                    id: domainData.id,
                    name: domainData.name,
                    status: domainData.status,
                    records: domainData.records,
                    region: domainData.region
                }
            }))
            toast.success('ドメインを登録しました。DNSレコードを設定してください。')
        } catch (error: any) {
            toast.error(error.message || 'ドメインの登録に失敗しました')
        } finally {
            setDomainLoading(false)
        }
    }

    const handleCheckStatus = async () => {
        if (!customDomain?.id) return;
        setDomainLoading(true)
        try {
            const statusData = await checkDomainStatusAction(store.id, customDomain.id)
            setConfig((prev: any) => ({
                ...prev,
                custom_domain: {
                    ...prev.custom_domain,
                    status: statusData.status
                }
            }))
            if (statusData.status === 'verified') {
                toast.success('ドメイン認証が完了しました！')
            } else {
                toast.info(`現在のステータス: ${statusData.status}`)
            }
        } catch (error: any) {
            toast.error('ステータスの確認に失敗しました')
        } finally {
            setDomainLoading(false)
        }
    }

    const handleVerify = async () => {
        if (!customDomain?.id) return;
        setDomainLoading(true)
        try {
            await verifyDomainAction(customDomain.id)
            toast.success('認証リクエストを送信しました。再度ステータスを確認してください。')
            await handleCheckStatus()
        } catch (error: any) {
            toast.error(error.message || '認証リクエストに失敗しました')
        } finally {
            setDomainLoading(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('コピーしました')
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
                    <div className="grid gap-4 border-b pb-6 mb-2">
                        <div>
                            <h4 className="font-semibold text-sm">基本設定</h4>
                            <p className="text-xs text-muted-foreground">メールの送信元として表示される情報です。</p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="sender_name">送信元名 (From名)</Label>
                            <Input
                                id="sender_name"
                                placeholder="StarPay Salon"
                                value={config.sender_name || ''}
                                onChange={(e) => setConfig((prev: any) => ({ ...prev, sender_name: e.target.value }))}
                            />
                            <p className="text-xs text-gray-500">お客様に表示される送信者の名前です。</p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="sender_email">送信元メールアドレス</Label>
                            <Input
                                id="sender_email"
                                type="email"
                                placeholder="info@yourdomain.com"
                                value={config.sender_email || ''}
                                onChange={(e) => setConfig((prev: any) => ({ ...prev, sender_email: e.target.value }))}
                            />
                            <p className="text-xs text-gray-500">
                                指定しない場合はシステムのデフォルトアドレスが使用されます。<br />
                                独自ドメインを使用する場合は、入力後にドメイン認証設定を行ってください。
                            </p>
                        </div>

                        {/* --- Domain Verification UI --- */}
                        {isCustomDomainCandidate && !customDomain && (
                            <div className="mt-4 p-4 border rounded-lg bg-blue-50">
                                <p className="text-sm mb-3">
                                    <strong>{targetDomain}</strong> を独自ドメインとして使用するには、ドメインの所有権を証明（DNS認証）する必要があります。
                                </p>
                                <Button size="sm" onClick={handleAddDomain} disabled={domainLoading || loading}>
                                    {domainLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    ドメイン認証を開始する
                                </Button>
                            </div>
                        )}

                        {customDomain && (
                            <div className="mt-4 p-4 border rounded-lg bg-slate-50">
                                <div className="flex justify-between items-center mb-4">
                                    <h5 className="font-semibold flex items-center gap-2">
                                        ドメイン認証ステータス: 
                                        {customDomain.status === 'verified' ? (
                                            <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4"/> 認証済み</span>
                                        ) : (
                                            <span className="text-amber-600 flex items-center gap-1"><AlertCircle className="w-4 h-4"/> 未認証 ({customDomain.status})</span>
                                        )}
                                    </h5>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={handleCheckStatus} disabled={domainLoading}>
                                            <RefreshCw className={`w-4 h-4 mr-2 ${domainLoading ? 'animate-spin' : ''}`} />
                                            ステータス更新
                                        </Button>
                                        {customDomain.status !== 'verified' && (
                                            <Button size="sm" onClick={handleVerify} disabled={domainLoading}>
                                                再検証リクエスト
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {customDomain.status !== 'verified' && customDomain.records && (
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-600">お使いのドメイン管理サービス（お名前.com等）のDNS設定に、以下のレコードを追加してください。</p>
                                        <div className="overflow-x-auto text-sm border rounded bg-white">
                                            <table className="w-full text-left">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="p-2 border-b">Type</th>
                                                        <th className="p-2 border-b">Name</th>
                                                        <th className="p-2 border-b">Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {customDomain.records.map((r: any, i: number) => (
                                                        <tr key={i} className="border-b">
                                                            <td className="p-2 font-mono whitespace-nowrap">{r.record}</td>
                                                            <td className="p-2 font-mono">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="truncate max-w-[150px]" title={r.name}>{r.name}</span>
                                                                    <button onClick={() => copyToClipboard(r.name)} className="text-gray-400 hover:text-gray-800"><Copy className="w-3 h-3"/></button>
                                                                </div>
                                                            </td>
                                                            <td className="p-2 font-mono">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="truncate max-w-[200px]" title={r.value}>{r.value}</span>
                                                                    <button onClick={() => copyToClipboard(r.value)} className="text-gray-400 hover:text-gray-800"><Copy className="w-3 h-3"/></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <p className="text-xs text-gray-500">設定後、反映までに数分〜48時間かかる場合があります。「ステータス更新」を定期的に押して確認してください。</p>
                                    </div>
                                )}
                            </div>
                        )}
                        {/* --- End Domain Verification UI --- */}
                    </div>

                    <div className="grid gap-2 pt-2">
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
