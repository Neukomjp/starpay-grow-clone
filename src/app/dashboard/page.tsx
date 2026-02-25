import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Users, ShoppingBag, Activity } from 'lucide-react'

// ... imports
import { SalesChart } from './sales-chart'
import { storeService } from '@/lib/services/stores'
import { salesService } from '@/lib/services/sales'
import { bookingService } from '@/lib/services/bookings'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'

export default async function DashboardPage() {
    // Fetch data
    let stores: any[] = []

    const cookieStore = await cookies()
    let orgId = cookieStore.get('organization-id')?.value
    if (!orgId) {
        const { getUserOrganizationsAction } = await import('@/lib/actions/organization')
        const orgs = await getUserOrganizationsAction()
        orgId = orgs[0]?.id
    }

    if (orgId) {
        try {
            stores = await storeService.getStores(orgId)
        } catch (e) {
            // Using console.log instead of console.error because Turbopack crashes when trying to serialize fetch errors to the dev overlay from Server Components
            console.log('Failed to fetch stores on dashboard, likely due to missing Supabase setup.')
        }
    }

    let salesSummary = {
        totalSales: 0,
        totalBookings: 0,
        salesGrowth: 0,
        bookingsGrowth: 0
    }
    let monthlySales: any[] = []
    let todayBookings: any[] = []

    if (stores && stores.length > 0) {
        const storeId = stores[0].id
        try {
            const todayStart = new Date()
            todayStart.setHours(0, 0, 0, 0)
            const todayEnd = new Date()
            todayEnd.setHours(23, 59, 59, 999)

            const [summary, monthly, bookingsList] = await Promise.all([
                salesService.getSalesSummary(storeId),
                salesService.getMonthlySales(storeId),
                bookingService.getBookingsByDateRange(storeId, todayStart.toISOString(), todayEnd.toISOString())
            ])
            salesSummary = summary
            monthlySales = monthly
            todayBookings = bookingsList || []
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
        }
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">ダッシュボード</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">総売上 (今月)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">¥{salesSummary.totalSales.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            先月比 {salesSummary.salesGrowth > 0 ? '+' : ''}{salesSummary.salesGrowth}%
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">予約数 (今月)</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{salesSummary.totalBookings}件</div>
                        <p className="text-xs text-muted-foreground">
                            先月比 {salesSummary.bookingsGrowth > 0 ? '+' : ''}{salesSummary.bookingsGrowth}%
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">販売数</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--</div>
                        <p className="text-xs text-muted-foreground">データ収集中</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">現在のアクティブ</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--</div>
                        <p className="text-xs text-muted-foreground">データ収集中</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>最近の売上推移</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <SalesChart data={monthlySales} />
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>本日の予約</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {todayBookings.length === 0 ? (
                            <div className="flex items-center justify-center h-[300px] text-gray-400">
                                <p>本日の予約はありません</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                {todayBookings.map((booking) => (
                                    <div key={booking.id} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                                        <div>
                                            <p className="font-medium text-sm">
                                                {format(new Date(booking.start_time), 'HH:mm')} - {booking.customer_name}様
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {booking.service?.name || '指定なし'} ・ 担当: {booking.staff?.name || '指名なし'}
                                            </p>
                                        </div>
                                        <Badge variant={
                                            booking.status === 'confirmed' ? 'default' :
                                                booking.status === 'cancelled' ? 'destructive' :
                                                    booking.status === 'completed' ? 'outline' : 'secondary'
                                        } className="ml-2 scale-90">
                                            {booking.status === 'confirmed' ? '確定' :
                                                booking.status === 'cancelled' ? 'キャンセル' :
                                                    booking.status === 'completed' ? '完了' : '保留'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
