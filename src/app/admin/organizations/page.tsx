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

export default async function AdminOrganizationsPage() {
    const organizations = await adminService.getAllOrganizations()

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">組織管理</h2>
                <p className="text-muted-foreground">登録されている全ての組織を管理します。</p>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>組織名</TableHead>
                            <TableHead>プラン</TableHead>
                            <TableHead>ステータス</TableHead>
                            <TableHead>作成日</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {organizations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    組織が見つかりません。
                                </TableCell>
                            </TableRow>
                        ) : (
                            organizations.map((org) => (
                                <TableRow key={org.id}>
                                    <TableCell className="font-medium">
                                        <div>{org.name}</div>
                                        <div className="text-xs text-muted-foreground">{org.slug}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{org.plan}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={org.is_white_labeled ? "default" : "secondary"}>
                                            {org.is_white_labeled ? 'White Label' : 'Standard'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(org.created_at), 'yyyy-MM-dd')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {/* Add actions later */}
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
