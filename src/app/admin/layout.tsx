'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Building2, Users, Settings, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient()
            let userEmail = ''

            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                userEmail = user.email || ''
            } else {
                // Fallback for demo mode: check cookie
                if (typeof document !== 'undefined') {
                    const match = document.cookie.match(new RegExp('(^| )demo-user-email=([^;]+)'))
                    if (match) {
                        userEmail = decodeURIComponent(match[2])
                    }
                }
            }

            if (!userEmail) {
                router.push('/login')
                return
            }

            // TODO: Move this check to middleware or server component for real security
            const adminEmails = ['info@neukom.jp']

            if (!adminEmails.includes(userEmail)) {
                // If logged in but not admin
                if (user) {
                    router.push('/dashboard')
                } else {
                    // If demo user but not admin email
                    toast.error('Access Denied: Not an admin account')
                    router.push('/dashboard')
                }
                return
            }

            setIsAuthorized(true)
            setIsLoading(false)
        }

        checkAuth()
    }, [router])

    if (isLoading) {
        return <div className="flex bg-slate-50 items-center justify-center h-screen">Loading Admin...</div>
    }

    if (!isAuthorized) {
        return null
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Admin Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex-shrink-0">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold">システム管理</h1>
                </div>
                <nav className="p-4 space-y-2">
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                        <LayoutDashboard className="h-5 w-5" />
                        <span>ダッシュボード</span>
                    </Link>
                    <Link href="/admin/organizations" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                        <Building2 className="h-5 w-5" />
                        <span>組織一覧</span>
                    </Link>
                    <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                        <Users className="h-5 w-5" />
                        <span>ユーザー管理</span>
                    </Link>
                    <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                        <Settings className="h-5 w-5" />
                        <span>システム設定</span>
                    </Link>
                </nav>
                <div className="p-4 mt-auto border-t border-slate-800">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                        <span>アプリに戻る</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
