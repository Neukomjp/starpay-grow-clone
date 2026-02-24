'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { TicketMaster } from '@/lib/types/ticket'
import { getTicketMastersAction, createTicketMasterAction, updateTicketMasterAction } from '@/lib/actions/tickets'
import { toast } from 'sonner'
import { Loader2, Plus, Pencil, Ticket } from 'lucide-react'

interface TicketManagerProps {
    storeId: string
}

export function TicketManager({ storeId }: TicketManagerProps) {
    const [tickets, setTickets] = useState<TicketMaster[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingTicket, setEditingTicket] = useState<TicketMaster | null>(null)

    // Form State
    const [name, setName] = useState('')
    const [price, setPrice] = useState('')
    const [totalUses, setTotalUses] = useState('')
    const [validDays, setValidDays] = useState('')
    const [description, setDescription] = useState('')
    const [isActive, setIsActive] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadTickets()
    }, [storeId])

    const loadTickets = async () => {
        setLoading(true)
        try {
            const data = await getTicketMastersAction(storeId)
            setTickets(data)
        } catch (error) {
            console.error(error)
            toast.error('回数券データの読み込みに失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenDialog = (ticket?: TicketMaster) => {
        if (ticket) {
            setEditingTicket(ticket)
            setName(ticket.name)
            setPrice(ticket.price.toString())
            setTotalUses(ticket.total_uses.toString())
            setValidDays(ticket.valid_days.toString())
            setDescription(ticket.description || '')
            setIsActive(ticket.is_active)
        } else {
            setEditingTicket(null)
            setName('')
            setPrice('')
            setTotalUses('')
            setValidDays('180') // Default 6 months
            setDescription('')
            setIsActive(true)
        }
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!name || !price || !totalUses || !validDays) {
            toast.error('必須項目を入力してください')
            return
        }

        setSaving(true)
        try {
            const ticketData = {
                store_id: storeId,
                name,
                price: parseInt(price),
                total_uses: parseInt(totalUses),
                valid_days: parseInt(validDays),
                description,
                is_active: isActive
            }

            if (editingTicket) {
                await updateTicketMasterAction(editingTicket.id, ticketData)
                toast.success('回数券を更新しました')
            } else {
                await createTicketMasterAction(ticketData)
                toast.success('回数券を作成しました')
            }
            setIsDialogOpen(false)
            loadTickets()
        } catch (error) {
            console.error(error)
            toast.error('保存に失敗しました')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">登録済み回数券</h3>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    新規作成
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : tickets.length === 0 ? (
                <div className="text-center p-8 border rounded-lg bg-slate-50">
                    <Ticket className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                    <p className="text-muted-foreground">回数券が登録されていません</p>
                </div>
            ) : (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>回数券名</TableHead>
                                <TableHead>価格</TableHead>
                                <TableHead>回数</TableHead>
                                <TableHead>有効期限</TableHead>
                                <TableHead>状態</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tickets.map((ticket) => (
                                <TableRow key={ticket.id}>
                                    <TableCell className="font-medium">{ticket.name}</TableCell>
                                    <TableCell>¥{ticket.price.toLocaleString()}</TableCell>
                                    <TableCell>{ticket.total_uses}回</TableCell>
                                    <TableCell>{ticket.valid_days}日</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${ticket.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {ticket.is_active ? '販売中' : '停止中'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(ticket)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingTicket ? '回数券を編集' : '新規回数券を作成'}</DialogTitle>
                        <DialogDescription>
                            顧客に販売する回数券の設定を行います。
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">回数券名</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="例：カット5回券" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="price">価格 (円)</Label>
                                <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="15000" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="uses">利用可能回数</Label>
                                <Input id="uses" type="number" value={totalUses} onChange={(e) => setTotalUses(e.target.value)} placeholder="5" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="days">有効期限 (日)</Label>
                            <div className="flex items-center gap-2">
                                <Input id="days" type="number" value={validDays} onChange={(e) => setValidDays(e.target.value)} placeholder="180" />
                                <span className="text-sm text-muted-foreground">日</span>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="desc">説明</Label>
                            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="回数券の詳細や条件など" />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                            <Label htmlFor="active">販売中にする</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>キャンセル</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            保存
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
