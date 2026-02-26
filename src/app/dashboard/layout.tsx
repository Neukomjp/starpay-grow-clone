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
    Ticket,
    Menu
} from 'lucide-react'
import { OrganizationSwitcher } from '@/components/organization-switcher'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from '@/components/ui/sheet'
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
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
            {/* Sidebar (Desktop) */}
            <aside className="w-64 bg-white shadow-md hidden md:flex flex-col shrink-0">
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
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-4 bg-white border-b shrink-0">
                    <Link href="/dashboard" className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        サロン予約システム
                    </Link>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
                            <SheetTitle className="sr-only">ナビゲーションメニュー</SheetTitle>
                            <div className="p-6 pb-2">
                                <Link href="/dashboard" className="flex items-center gap-2 mb-4">
                                    <span className="text-xl font-bold text-gray-800">サロン予約システム</span>
                                </Link>
                                <OrganizationSwitcher currentOrgId={orgId} />
                            </div>
                            <nav className="flex-1 px-4 space-y-2 overflow-y-auto mt-4">
                                <SheetClose asChild>
                                    <Link href="/dashboard" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                                        <LayoutDashboard className="mr-3 h-5 w-5" />
                                        ダッシュボード
                                    </Link>
                                </SheetClose>
                                <SheetClose asChild>
                                    <Link href="/dashboard/stores" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                                        <Store className="mr-3 h-5 w-5" />
                                        店舗管理
                                    </Link>
                                </SheetClose>
                                <SheetClose asChild>
                                    <Link href="/dashboard/bookings" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                                        <Calendar className="mr-3 h-5 w-5" />
                                        予約管理
                                    </Link>
                                </SheetClose>
                                <SheetClose asChild>
                                    <Link href="/dashboard/customers" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                                        <Users className="mr-3 h-5 w-5" />
                                        顧客管理
                                    </Link>
                                </SheetClose>
                                <SheetClose asChild>
                                    <Link href="/dashboard/coupons" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                                        <Ticket className="mr-3 h-5 w-5" />
                                        クーポン管理
                                    </Link>
                                </SheetClose>
                                <SheetClose asChild>
                                    <Link href="/dashboard/payments" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                                        <CreditCard className="mr-3 h-5 w-5" />
                                        決済・売上
                                    </Link>
                                </SheetClose>
                                <SheetClose asChild>
                                    <Link href="/dashboard/settings" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                                        <Settings className="mr-3 h-5 w-5" />
                                        設定
                                    </Link>
                                </SheetClose>
                            </nav>
                            <div className="p-4 border-t mt-auto">
                                <LogoutButton />
                            </div>
                        </SheetContent>
                    </Sheet>
                </header>

                <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
