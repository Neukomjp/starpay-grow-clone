'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Store, ExternalLink, Edit, Loader2, Users } from 'lucide-react'
import { getStoresAction } from '@/lib/actions/store'
import { StoreData } from '@/lib/types/store'
import { toast } from 'sonner'
import { useCurrentOrganization } from '@/hooks/use-current-organization'
import { canCreateStore } from '@/lib/rbac'

export default function StoresPage() {
    const [stores, setStores] = useState<StoreData[]>([])
    const [loading, setLoading] = useState(true)
    const [isDemo, setIsDemo] = useState(false)
    const { organization, loading: orgLoading } = useCurrentOrganization()

    useEffect(() => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
            setIsDemo(true)
        }
        loadStores()
    }, [])

    async function loadStores() {
        try {
            const data = await getStoresAction()
            setStores(data || [])
        } catch (error: any) {
            console.error('Failed to fetch stores:', error)
            toast.error(`店舗の取得に失敗しました: ${error.message || 'Unknown error'}`)
        } finally {
            setLoading(false)
        }
    }

    if (loading || orgLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {isDemo && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Store className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                <span className="font-bold">Demo Mode Active:</span> You are viewing mock data because Supabase is not configured.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">店舗一覧</h2>
                {organization && canCreateStore(organization.role) && (
                    <Button asChild>
                        <Link href="/dashboard/stores/new" className="flex items-center">
                            <Plus className="mr-2 h-4 w-4" /> 新規店舗作成
                        </Link>
                    </Button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {stores.map((store) => (
                    <Card key={store.id}>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Store className="mr-2 h-5 w-5 text-muted-foreground" />
                                {store.name}
                            </CardTitle>
                            <CardDescription>
                                {/* store.type is not in DB schema yet, omitting or using placeholder */}
                                Salon / Retail
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${store.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {store.is_published ? '公開中' : '下書き'}
                                </span>
                                <span>/{store.slug}</span>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-wrap justify-between items-center gap-2 pt-0">
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="px-2" asChild>
                                    <Link href={`/dashboard/stores/${store.id}`}>
                                        <Edit className="mr-1 h-4 w-4" /> 編集
                                    </Link>
                                </Button>
                                <Button variant="outline" size="sm" className="px-2" asChild>
                                    <Link href={`/dashboard/stores/${store.id}?tab=staff`}>
                                        <Users className="mr-1 h-4 w-4" /> スタッフ
                                    </Link>
                                </Button>
                            </div>
                            <Button variant="ghost" size="sm" className="px-2" asChild>
                                <Link href={`/store/${store.slug}`} target="_blank">
                                    <ExternalLink className="mr-1 h-4 w-4" /> 確認
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}

                {stores.length === 0 && (
                    <Link href="/dashboard/stores/new" className="contents">
                        <Card className="flex flex-col items-center justify-center p-6 border-dashed opacity-75 hover:opacity-100 transition-opacity cursor-pointer h-full">
                            <div className="rounded-full bg-gray-100 p-4 mb-4">
                                <Plus className="h-6 w-6 text-gray-400" />
                            </div>
                            <p className="font-medium text-gray-900">最初の店舗を作成する</p>
                            <p className="text-sm text-gray-500">店舗ページの設定を始めましょう。</p>
                        </Card>
                    </Link>
                )}
            </div>
        </div>
    )
}
