'use client'

import { useState } from 'react'
import { TicketMaster } from '@/lib/types/ticket'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Ticket } from 'lucide-react'
import { purchaseTicketAction } from '@/lib/actions/tickets' // We'll need to create this
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface TicketSectionProps {
    tickets: TicketMaster[]
    storeId: string
    themeColor?: string
}

export function TicketSection({ tickets, storeId, themeColor }: TicketSectionProps) {
    const [selectedTicket, setSelectedTicket] = useState<TicketMaster | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [purchasing, setPurchasing] = useState(false)

    // Form State
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')

    const handlePurchaseClick = (ticket: TicketMaster) => {
        setSelectedTicket(ticket)
        setIsDialogOpen(true)
    }

    const handlePurchase = async () => {
        if (!selectedTicket || !name || !email || !phone) {
            toast.error('必須項目を入力してください')
            return
        }

        setPurchasing(true)
        try {
            await purchaseTicketAction(storeId, selectedTicket.id, { name, email, phone })
            toast.success('回数券を購入しました！')
            setIsDialogOpen(false)
            // Reset form
            setName('')
            setEmail('')
            setPhone('')
        } catch (error) {
            console.error(error)
            toast.error('購入に失敗しました')
        } finally {
            setPurchasing(false)
        }
    }

    if (tickets.length === 0) return null

    return (
        <div id="tickets" className="max-w-4xl mx-auto py-8 px-4">
            <h2 className="text-3xl font-bold text-center mb-8 text-stone-900">お得な回数券</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tickets.map((ticket) => (
                    <Card key={ticket.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Ticket className="h-5 w-5 text-amber-500" />
                                {ticket.name}
                            </CardTitle>
                            <CardDescription>{ticket.total_uses}回分 / 有効期限 {ticket.valid_days}日</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <p className="text-2xl font-bold mb-2">¥{ticket.price.toLocaleString()}</p>
                            <p className="text-muted-foreground text-sm">{ticket.description}</p>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                style={{ backgroundColor: themeColor }}
                                onClick={() => handlePurchaseClick(ticket)}
                            >
                                購入する
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>回数券の購入</DialogTitle>
                        <DialogDescription>
                            {selectedTicket?.name} (¥{selectedTicket?.price.toLocaleString()}) を購入します。
                            お客様情報を入力してください。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">お名前</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="山田 太郎" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">メールアドレス</Label>
                            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="taro@example.com" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">電話番号</Label>
                            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="090-1234-5678" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={purchasing}>キャンセル</Button>
                        <Button onClick={handlePurchase} disabled={purchasing} style={{ backgroundColor: themeColor }}>
                            {purchasing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            購入を確定する
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
