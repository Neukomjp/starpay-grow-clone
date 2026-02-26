import { customerService } from '@/lib/services/customers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { Search, UserPlus } from 'lucide-react'
import { cookies } from 'next/headers'

import { CustomerSearch } from './customer-search'

type Props = {
    searchParams: Promise<{ q?: string }>
}

export default async function CustomersPage(props: Props) {
    const searchParams = await props.searchParams
    const query = searchParams.q

    const cookieStore = await cookies()

    // Get organization ID
    let orgId = cookieStore.get('organization-id')?.value
    if (!orgId) {
        const { getUserOrganizationsAction } = await import('@/lib/actions/organization')
        const orgs = await getUserOrganizationsAction()
        orgId = orgs[0]?.id
    }

    let storeId: string | null = cookieStore.get('store-id')?.value || null

    // Validate that the storeId actually belongs to this organization
    if (orgId) {
        const { storeService } = await import('@/lib/services/stores')
        const stores = await storeService.getStores(orgId)
        const validStoreIds = stores.map(s => s.id)

        // If the cookie's storeId is missing or doesn't belong to this org, use the org's first store
        if (!storeId || !validStoreIds.includes(storeId)) {
            storeId = stores.length > 0 ? stores[0].id : null
        }
    } else {
        storeId = null
    }

    const customers = storeId ? await customerService.getCustomers(storeId, query) : []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">顧客管理</h1>
                <Button asChild>
                    <Link href="/dashboard/customers/new">
                        <UserPlus className="mr-2 h-4 w-4" />
                        顧客登録
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>顧客一覧</CardTitle>
                    <CardDescription>
                        登録されている顧客情報を管理します。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-6">
                        <CustomerSearch />
                    </div>

                    <div className="rounded-md border overflow-x-auto">
                        <Table className="min-w-max">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>名前</TableHead>
                                    <TableHead>連絡先</TableHead>
                                    <TableHead>会員状態</TableHead>
                                    <TableHead>最終来店日</TableHead>
                                    <TableHead className="text-right">来店回数</TableHead>
                                    <TableHead className="text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.map((customer) => (
                                    <TableRow key={customer.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                                    {customer.avatar_url ? (
                                                        <img src={customer.avatar_url} alt={customer.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-medium text-slate-500">{customer.name.slice(0, 1)}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div>{customer.name}</div>
                                                    {customer.name_kana && <div className="text-xs text-muted-foreground">{customer.name_kana}</div>}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{customer.email}</div>
                                            <div className="text-sm text-muted-foreground">{customer.phone}</div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${customer.is_registered ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {customer.is_registered ? '会員' : 'ゲスト'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {customer.last_visit_date ? new Date(customer.last_visit_date).toLocaleDateString('ja-JP') : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">{customer.total_visits}回</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/dashboard/customers/${customer.id}`}>
                                                    詳細
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {customers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            顧客データが見つかりません
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
