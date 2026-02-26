'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Mail } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { BulkEmailDialog } from './bulk-email-dialog'

// Type definition for Customer (should match what's returned from getCustomersAction)
// In a real app, import from types file
interface Customer {
    id: string
    name: string
    email?: string | null
    phone?: string | null
    is_registered: boolean
    last_visit_date?: string | null
    total_visits: number
    total_spent: number
    avatar_url?: string | null
}

interface CustomerListClientProps {
    initialCustomers: Customer[]
    storeId: string
}

export function CustomerListClient({ initialCustomers, storeId }: CustomerListClientProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([])
    const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)

    // Filter customers
    const filteredCustomers = initialCustomers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Selection logic
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            // Select all filtered customers that have an email
            const verifyableCustomers = filteredCustomers.filter(c => c.email)
            setSelectedCustomerIds(verifyableCustomers.map(c => c.id))
        } else {
            setSelectedCustomerIds([])
        }
    }

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedCustomerIds(prev => [...prev, id])
        } else {
            setSelectedCustomerIds(prev => prev.filter(cid => cid !== id))
        }
    }

    // Get selected emails
    const selectedCustomers = initialCustomers.filter(c => selectedCustomerIds.includes(c.id))
    const selectedEmails = selectedCustomers.map(c => c.email).filter(Boolean) as string[]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">顧客管理</h2>
                    <p className="text-muted-foreground">登録されている顧客情報の閲覧・編集ができます。</p>
                </div>
                <div className="flex gap-2">
                    {selectedCustomerIds.length > 0 && (
                        <Button variant="outline" onClick={() => setIsEmailDialogOpen(true)}>
                            <Mail className="mr-2 h-4 w-4" />
                            メール送信 ({selectedCustomerIds.length})
                        </Button>
                    )}
                    <Button asChild>
                        <Link href="/dashboard/customers/new" className="flex items-center">
                            <Plus className="mr-2 h-4 w-4" /> 顧客登録
                        </Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>顧客リスト</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="名前で検索..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table className="min-w-max">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={
                                            filteredCustomers.length > 0 &&
                                            filteredCustomers.filter(c => c.email).every(c => selectedCustomerIds.includes(c.id))
                                        }
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead>顧客名</TableHead>
                                <TableHead>連絡先</TableHead>
                                <TableHead>最終来店日</TableHead>
                                <TableHead>来店回数</TableHead>
                                <TableHead className="text-right">総利用額</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCustomers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        顧客が見つかりません
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <TableRow key={customer.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedCustomerIds.includes(customer.id)}
                                                onCheckedChange={(checked) => handleSelectOne(customer.id, !!checked)}
                                                disabled={!customer.email} // Disable if no email
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={customer.avatar_url || undefined} />
                                                    <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{customer.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {customer.is_registered ? '会員' : 'ゲスト'}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                <span>{customer.email || '-'}</span>
                                                <span className="text-muted-foreground">{customer.phone || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{customer.last_visit_date ? new Date(customer.last_visit_date).toLocaleDateString() : '-'}</TableCell>
                                        <TableCell>{customer.total_visits}回</TableCell>
                                        <TableCell className="text-right">¥{customer.total_spent.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/dashboard/customers/${customer.id}`}>詳細</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <BulkEmailDialog
                open={isEmailDialogOpen}
                onOpenChange={setIsEmailDialogOpen}
                recipientCount={selectedCustomerIds.length}
                recipientEmails={selectedEmails}
                storeId={storeId}
                onSuccess={() => setSelectedCustomerIds([])}
            />
        </div>
    )
}
