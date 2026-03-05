import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Plus, Ticket } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getCouponsAction } from '@/lib/actions/coupon'
import { getStoresAction } from '@/lib/actions/store'
import { CouponToggle } from './coupon-toggle'
import { cookies } from 'next/headers'
import { canViewCoupons } from '@/lib/rbac'

export default async function CouponsPage() {
    const stores = await getStoresAction()
    const storeId = stores.length > 0 ? stores[0].id : ''

    const cookieStore = await cookies()
    const orgId = cookieStore.get('organization-id')?.value

    let hasAccess = false
    if (orgId) {
        const { getUserOrganizationsAction } = await import('@/lib/actions/organization')
        const orgs = await getUserOrganizationsAction()
        const currentOrg = orgs.find(o => o.id === orgId) || orgs[0]
        hasAccess = currentOrg ? canViewCoupons(currentOrg.role as any) : false
    } else {
        // Fallback or demo
        hasAccess = true;
    }

    if (!hasAccess) {
        return (
            <div className="space-y-6">
                <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200 mt-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">アクセス権限がありません</h3>
                    <p className="text-gray-500">クーポン管理ページを表示する権限がありません。管理者にお問い合わせください。</p>
                </div>
            </div>
        )
    }

    const coupons = storeId ? await getCouponsAction(storeId) : []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">クーポン管理</h2>
                    <p className="text-muted-foreground">集客用のクーポンを発行・管理できます。</p>
                </div>
                <Button>
                    <Link href="/dashboard/coupons/new" className="flex items-center">
                        <Plus className="mr-2 h-4 w-4" /> クーポン作成
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {coupons.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed">
                        <Ticket className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">クーポンがありません</h3>
                        <p className="text-gray-500 mb-6">新しいクーポンを作成して集客に活用しましょう。</p>
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/coupons/new">クーポンを作成する</Link>
                        </Button>
                    </div>
                ) : (
                    coupons.map((coupon) => (
                        <Card key={coupon.id} className={coupon.is_active ? '' : 'opacity-60'}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg">{coupon.name}</CardTitle>
                                        <CardDescription className="font-mono text-xs bg-slate-100 p-1 rounded w-fit">
                                            {coupon.code}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                                        {coupon.is_active ? '有効' : '停止中'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">割引内容:</span>
                                        <span className="font-bold text-red-600">
                                            {coupon.discount_type === 'fixed'
                                                ? `¥${coupon.discount_amount.toLocaleString()} OFF`
                                                : `${coupon.discount_amount}% OFF`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">有効期限:</span>
                                        <span>{new Date(coupon.expires_at).toLocaleDateString()}</span>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <CouponToggle id={coupon.id} isActive={coupon.is_active} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
