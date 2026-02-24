'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerTicket, TicketMaster } from '@/lib/types/ticket'
import { Customer } from '@/lib/types/customer'
import { consumeTicketAction, issueTicketToCustomerAction } from '@/lib/actions/tickets'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Ticket, History, User } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface CustomerDetailsProps {
    customer: Customer
    initialTickets: CustomerTicket[]
    ticketMasters: TicketMaster[]
}

export function CustomerDetails({ customer, initialTickets, ticketMasters }: CustomerDetailsProps) {
    const router = useRouter()
    const [tickets, setTickets] = useState<CustomerTicket[]>(initialTickets)
    const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false)
    const [selectedMasterId, setSelectedMasterId] = useState<string>('')
    const [granting, setGranting] = useState(false)

    const handleGrantTicket = async () => {
        if (!selectedMasterId) return
        setGranting(true)
        try {
            const newTicket = await issueTicketToCustomerAction(customer.id, selectedMasterId)
            toast.success('回数券を付与しました')
            setTickets([newTicket, ...tickets])
            setIsGrantDialogOpen(false)
            setSelectedMasterId('')
        } catch (error) {
            console.error(error)
            toast.error('回数券の付与に失敗しました')
        } finally {
            setGranting(false)
        }
    }

    const handleConsumeTicket = async (ticketId: string) => {
        if (!confirm('この回数券を1回分消化しますか？')) return
        try {
            const updatedTicket = await consumeTicketAction(ticketId)
            toast.success('回数券を消化しました')
            setTickets(tickets.map(t => t.id === ticketId ? updatedTicket : t))
        } catch (error) {
            console.error(error)
            toast.error('消化に失敗しました')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/customers">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${customer.is_registered ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {customer.is_registered ? '会員' : 'ゲスト'}
                </span>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">基本情報</TabsTrigger>
                    <TabsTrigger value="tickets">保有回数券</TabsTrigger>
                    {/* <TabsTrigger value="history">来店履歴</TabsTrigger> */}
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>お客様情報</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">メールアドレス</dt>
                                    <dd className="mt-1 text-sm">{customer.email || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">電話番号</dt>
                                    <dd className="mt-1 text-sm">{customer.phone || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">登録日</dt>
                                    <dd className="mt-1 text-sm">{new Date(customer.created_at).toLocaleDateString()}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">最終来店日</dt>
                                    <dd className="mt-1 text-sm">{customer.last_visit_date ? new Date(customer.last_visit_date).toLocaleDateString() : '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">総来店回数</dt>
                                    <dd className="mt-1 text-sm">{customer.total_visits}回</dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>顧客メモ</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="min-h-[100px] p-2 bg-slate-50 text-sm rounded">
                                {customer.notes || 'メモはありません'}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="tickets" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">保有回数券 ({tickets.length})</h3>
                        <Dialog open={isGrantDialogOpen} onOpenChange={setIsGrantDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Ticket className="mr-2 h-4 w-4" />
                                    回数券を付与
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>回数券の付与</DialogTitle>
                                    <DialogDescription>
                                        お客様に回数券を販売・付与します。
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>回数券を選択</Label>
                                        <Select value={selectedMasterId} onValueChange={setSelectedMasterId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="回数券を選択..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ticketMasters
                                                    .filter(m => m.is_active)
                                                    .map(m => (
                                                        <SelectItem key={m.id} value={m.id}>
                                                            {m.name} ({m.total_uses}回 / ¥{m.price.toLocaleString()})
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsGrantDialogOpen(false)}>キャンセル</Button>
                                    <Button onClick={handleGrantTicket} disabled={!selectedMasterId || granting}>付与する</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {tickets.map(ticket => (
                            <Card key={ticket.id} className={ticket.remaining_uses === 0 ? 'opacity-60 bg-slate-50' : ''}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-base">{ticket.name}</CardTitle>
                                            <CardDescription className="text-xs mt-1">
                                                有効期限: {new Date(ticket.expires_at).toLocaleDateString()}
                                            </CardDescription>
                                        </div>
                                        <div className="text-2xl font-bold">
                                            {ticket.remaining_uses}
                                            <span className="text-sm font-normal text-muted-foreground ml-1">回</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center mt-2">
                                        <div className="text-xs text-muted-foreground">
                                            購入日: {new Date(ticket.purchase_date).toLocaleDateString()}
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleConsumeTicket(ticket.id)}
                                            disabled={ticket.remaining_uses === 0}
                                        >
                                            {ticket.remaining_uses > 0 ? '1回消化' : '消化済み'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {tickets.length === 0 && (
                            <div className="col-span-2 text-center py-8 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                                保有している回数券はありません
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
