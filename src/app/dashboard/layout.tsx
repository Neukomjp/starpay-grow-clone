import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    LayoutDashboard,
    Store,
    Calendar,
    Settings,
    LogOut,
    CreditCard,
    Users,
    Ticket
} from 'lucide-react'
import { OrganizationSwitcher } from '@/components/organization-switcher'
import { LogoutButton } from '@/components/logout-button'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserOrganizationsAction } from '@/lib/actions/organization'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const orgs = await getUserOrganizationsAction()

    if (orgs.length === 0) {
        redirect('/onboarding')
    }

    const orgId = (await cookies()).get('organization-id')?.value || orgs[0]?.id

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md hidden md:flex flex-col">
                <div className="p-6">
                    <Link href="/dashboard" className="flex items-center gap-2 mb-4">
                        <h1 className="text-xl font-bold text-gray-800">サロン予約システム</h1>
                    </Link>
                    <OrganizationSwitcher currentOrgId={orgId} />
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    <Link href="/dashboard" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                        <LayoutDashboard className="mr-3 h-5 w-5" />
                        ダッシュボード
                    </Link>
                    <Link href="/dashboard/stores" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                        <Store className="mr-3 h-5 w-5" />
                        店舗管理
                    </Link>
                    <Link href="/dashboard/bookings" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                        <Calendar className="mr-3 h-5 w-5" />
                        予約管理
                    </Link>
                    <Link href="/dashboard/customers" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                        <Users className="mr-3 h-5 w-5" />
                        顧客管理
                    </Link>
                    <Link href="/dashboard/coupons" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                        <Ticket className="mr-3 h-5 w-5" />
                        クーポン管理
                    </Link>

                    <Link href="/dashboard/payments" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                        <CreditCard className="mr-3 h-5 w-5" />
                        決済・売上
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                        <Settings className="mr-3 h-5 w-5" />
                        設定
                    </Link>
                </nav>
                <div className="p-4 border-t">
                    <LogoutButton />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
