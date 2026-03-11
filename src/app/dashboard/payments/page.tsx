'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useCurrentOrganization } from '@/hooks/use-current-organization'
import { canViewPayments } from '@/lib/rbac'
import { Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getStoresAction } from '@/lib/actions/store'
import {
    getDashboardSalesSummaryAction,
    getRecentTransactionsAction,
    DashboardSalesSummary,
    RecentTransaction
} from '@/lib/actions/sales'

export default function PaymentsPage() {
    const { organization, loading: orgLoading } = useCurrentOrganization()
    const [salesSummary, setSalesSummary] = useState<DashboardSalesSummary | null>(null)
    const [recentTx, setRecentTx] = useState<RecentTransaction[]>([])
    const [fetching, setFetching] = useState(true)

    useEffect(() => {
        if (!organization) return

        const fetchData = async () => {
            try {
                const stores = await getStoresAction()
                if (stores && stores.length > 0) {
                    const storeId = stores[0].id
                    const [summaryData, txData] = await Promise.all([
                        getDashboardSalesSummaryAction(storeId),
                        getRecentTransactionsAction(storeId)
                    ])
                    setSalesSummary(summaryData)
                    setRecentTx(txData)
                }
            } catch (error) {
                console.error("Failed to fetch payments data", error)
            } finally {
                setFetching(false)
            }
        }

        fetchData()
    }, [organization])

    if (orgLoading || (fetching && organization)) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
        )
    }

    if (organization && !canViewPayments(organization.role)) {
        return (
            <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200 mt-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">アクセス権限がありません</h3>
                <p className="text-gray-500">決済・売上ページを表示する権限がありません。管理者にお問い合わせください。</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">決済・売上</h2>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">本日の売上</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">¥{salesSummary?.todaySales.toLocaleString() || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">決済回数</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{salesSummary?.transactionCount || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">平均客単価</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">¥{salesSummary?.averageTicket.toLocaleString() || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>決済履歴</CardTitle>
                    <CardDescription>すべてのチャネルの最近の決済ログ</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table className="min-w-max">
                        <TableHeader>
                            <TableRow>
                                <TableHead>日時</TableHead>
                                <TableHead>決済方法</TableHead>
                                <TableHead>金額</TableHead>
                                <TableHead>ステータス</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentTx.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                                        決済履歴がありません
                                    </TableCell>
                                </TableRow>
                            ) : (
                                recentTx.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell>{tx.date}</TableCell>
                                        <TableCell>{tx.method}</TableCell>
                                        <TableCell>¥{tx.amount.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={tx.status === 'Success' ? 'default' : 'destructive'}>
                                                {tx.status === 'Success' ? '成功' : '失敗'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
