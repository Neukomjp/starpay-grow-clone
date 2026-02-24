'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Mail } from 'lucide-react'

interface BulkEmailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    recipientCount: number
    recipientEmails: string[]
    storeId?: string
    onSuccess?: () => void
}

export function BulkEmailDialog({
    open,
    onOpenChange,
    recipientCount,
    recipientEmails,
    storeId,
    onSuccess
}: BulkEmailDialogProps) {
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [sending, setSending] = useState(false)

    const handleSend = async () => {
        if (!subject || !message) {
            toast.error('件名と本文を入力してください')
            return
        }

        if (recipientEmails.length === 0) {
            toast.error('送信先が選択されていません')
            return
        }

        setSending(true)
        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: recipientEmails,
                    subject,
                    data: { message: message.replace(/\n/g, '<br/>') },
                    storeId
                })
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to send email')
            }

            toast.success(`${recipientCount}件のメールを送信しました`)
            setSubject('')
            setMessage('')
            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            console.error('Failed to send email:', error)
            toast.error('メールの送信に失敗しました')
        } finally {
            setSending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>一斉メール送信</DialogTitle>
                    <DialogDescription>
                        選択された{recipientCount}人の顧客にメールを送信します。
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="subject">件名</Label>
                        <Input
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="キャンペーンのお知らせ"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="message">本文</Label>
                        <Textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="メールの本文を入力してください..."
                            className="min-h-[200px]"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
                        キャンセル
                    </Button>
                    <Button onClick={handleSend} disabled={sending || !subject || !message}>
                        {sending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                送信中...
                            </>
                        ) : (
                            <>
                                <Mail className="mr-2 h-4 w-4" />
                                送信する
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
