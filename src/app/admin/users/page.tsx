import { adminService } from '@/lib/services/admin'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from 'date-fns'

export default async function AdminUsersPage() {
    const users = await adminService.getAllUsers()

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">ユーザー管理</h2>
                <p className="text-muted-foreground">システム内の全ユーザーを表示します（デモ版は簡易表示）</p>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>ロール</TableHead>
                            <TableHead>組織ID</TableHead>
                            <TableHead>参加日</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    ユーザーが見つかりません。
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user: any) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        <div>{user.email}</div>
                                        <div className="text-xs text-muted-foreground">{user.id}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{user.role}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-muted-foreground text-sm">{user.organization_id}</span>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(user.created_at), 'yyyy-MM-dd')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {/* Actions */}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
