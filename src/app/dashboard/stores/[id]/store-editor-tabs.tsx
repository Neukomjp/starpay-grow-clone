'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StorePageBuilder } from './builder'
import { BasicInfoEditor } from './basic-info-editor'
import { StaffManager } from './staff-manager'
import { MenuManager } from './menu-manager'
import { ShiftManager } from './shift-manager'
import { EmailSettings } from './email-settings'
import { TicketManager } from './ticket-manager'
import { StoreData } from '@/lib/types/store'

interface StoreEditorTabsProps {
    store: StoreData
    initialTab?: string
}

export function StoreEditorTabs({ store, initialTab = 'basic' }: StoreEditorTabsProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">{store.name}</h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        プレビュー
                    </Button>
                    <Button>
                        変更を保存
                    </Button>
                </div>
            </div>

            <Tabs defaultValue={initialTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="basic">基本情報</TabsTrigger>
                    <TabsTrigger value="design">ページデザイン</TabsTrigger>
                    <TabsTrigger value="menu">メニュー管理</TabsTrigger>
                    <TabsTrigger value="staff">スタッフ管理</TabsTrigger>
                    <TabsTrigger value="shift">シフト管理</TabsTrigger>
                    <TabsTrigger value="ticket">回数券管理</TabsTrigger>
                    <TabsTrigger value="notifications">通知設定</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>店舗基本情報</CardTitle>
                            <CardDescription>
                                店舗の基本的な情報を管理します。
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <BasicInfoEditor store={store} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="design" className="space-y-4">
                    <StorePageBuilder store={store} />
                </TabsContent>

                <TabsContent value="menu" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>メニュー・サービス管理</CardTitle>
                            <CardDescription>
                                提供するメニューやサービスを管理します。
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <MenuManager storeId={store.id} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="staff" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>スタッフ管理</CardTitle>
                            <CardDescription>
                                スタッフの登録・編集を行います。
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <StaffManager storeId={store.id} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="shift" className="space-y-4">
                    <ShiftManager storeId={store.id} />
                </TabsContent>

                <TabsContent value="ticket" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>回数券管理</CardTitle>
                            <CardDescription>
                                販売する回数券の作成・編集を行います。
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TicketManager storeId={store.id} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                    <EmailSettings store={store} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
