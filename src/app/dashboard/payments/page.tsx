import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

// Mock Data
const transactions = [
    { id: 'tx_1', date: '2024-02-18 10:30', amount: 1200, method: 'PayPay', status: 'Success' },
    { id: 'tx_2', date: '2024-02-18 11:15', amount: 550, method: 'LINE Pay', status: 'Success' },
    { id: 'tx_3', date: '2024-02-18 12:00', amount: 3000, method: 'Credit Card', status: 'Failed' },
]

export default function PaymentsPage() {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">決済・売上</h2>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">本日の売上</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">¥15,450</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">決済回数</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">平均客単価</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">¥1,287</div>
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
                            {transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell>{tx.date}</TableCell>
                                    <TableCell>{tx.method}</TableCell>
                                    <TableCell>¥{tx.amount}</TableCell>
                                    <TableCell>
                                        <Badge variant={tx.status === 'Success' ? 'default' : 'destructive'}>
                                            {tx.status === 'Success' ? '成功' : '失敗'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
