'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2 } from 'lucide-react'
import { Service } from '@/types/staff'
import { menuService } from '@/lib/services/menu'
import { toast } from 'sonner'
import { ServiceOptionsDialog } from './service-options-dialog'
import { ImageUpload } from '@/components/image-upload'

interface MenuManagerProps {
    storeId: string
}

export function MenuManager({ storeId }: MenuManagerProps) {
    const [menuList, setMenuList] = useState<Service[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newItem, setNewItem] = useState({ name: '', price: '', category: '', duration: '60', bufferBefore: '', bufferAfter: '', imageUrl: '' })
    const [isLoading, setIsLoading] = useState(false)
    const [selectedServiceForOptions, setSelectedServiceForOptions] = useState<Service | null>(null)
    const [editingService, setEditingService] = useState<Service | null>(null)

    useEffect(() => {
        loadMenu()
    }, [storeId])

    async function loadMenu() {
        try {
            const data = await menuService.getServicesByStoreId(storeId)
            setMenuList(data)
        } catch (error) {
            console.error('Error loading menu:', error)
            toast.error('メニューの取得に失敗しました')
        }
    }

    const handleSaveItem = async () => {
        if (!newItem.name || !newItem.price) return

        setIsLoading(true)
        try {
            if (editingService) {
                const updatedItem = await menuService.updateService(editingService.id, {
                    name: newItem.name,
                    price: parseInt(newItem.price),
                    category: newItem.category,
                    duration_minutes: parseInt(newItem.duration) || 60,
                    buffer_time_before: parseInt(newItem.bufferBefore) || 0,
                    buffer_time_after: parseInt(newItem.bufferAfter) || 0,
                    image_url: newItem.imageUrl
                })
                setMenuList(menuList.map(item => item.id === editingService.id ? updatedItem : item))
                toast.success('メニューを更新しました')
            } else {
                const addedItem = await menuService.addService({
                    store_id: storeId,
                    name: newItem.name,
                    price: parseInt(newItem.price),
                    category: newItem.category,
                    duration_minutes: parseInt(newItem.duration) || 60,
                    buffer_time_before: parseInt(newItem.bufferBefore) || 0,
                    buffer_time_after: parseInt(newItem.bufferAfter) || 0,
                    image_url: newItem.imageUrl
                })
                setMenuList([addedItem, ...menuList])
                toast.success('メニューを追加しました')
            }
            setNewItem({ name: '', price: '', category: '', duration: '60', bufferBefore: '', bufferAfter: '', imageUrl: '' })
            setEditingService(null)
            setIsDialogOpen(false)
        } catch (error) {
            console.error('Error saving item:', error)
            toast.error(editingService ? 'メニューの更新に失敗しました' : 'メニューの追加に失敗しました')
        } finally {
            setIsLoading(false)
        }
    }

    const openAddDialog = () => {
        setEditingService(null)
        setNewItem({ name: '', price: '', category: '', duration: '60', bufferBefore: '', bufferAfter: '', imageUrl: '' })
        setIsDialogOpen(true)
    }

    const openEditDialog = (service: Service) => {
        setEditingService(service)
        setNewItem({
            name: service.name,
            price: service.price.toString(),
            category: service.category || '',
            duration: service.duration_minutes.toString(),
            bufferBefore: service.buffer_time_before?.toString() || '',
            bufferAfter: service.buffer_time_after?.toString() || '',
            imageUrl: service.image_url || ''
        })
        setIsDialogOpen(true)
    }

    const handleDeleteItem = async (id: string) => {
        try {
            await menuService.deleteService(id)
            setMenuList(menuList.filter(item => item.id !== id))
            toast.success('メニューを削除しました')
        } catch (error) {
            console.error('Error deleting item:', error)
            toast.error('メニューの削除に失敗しました')
        }
    }

    const [showGlobalOptions, setShowGlobalOptions] = useState(false)

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">メニュー一覧</h3>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowGlobalOptions(true)}>
                        全体オプション設定
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" onClick={openAddDialog}><Plus className="mr-2 h-4 w-4" /> 商品を追加</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingService ? '商品の編集' : '新しい商品を追加'}</DialogTitle>
                                <DialogDescription>
                                    {editingService ? '商品の詳細を編集してください。' : 'メニューに追加する商品・サービスの詳細を入力してください。'}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">商品名</Label>
                                    <Input
                                        id="name"
                                        value={newItem.name}
                                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="price" className="text-right">価格</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={newItem.price}
                                        onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label className="text-right pt-2">画像</Label>
                                    <div className="col-span-3">
                                        <ImageUpload
                                            value={newItem.imageUrl}
                                            onChange={(url) => setNewItem({ ...newItem, imageUrl: url })}
                                            onRemove={() => setNewItem({ ...newItem, imageUrl: '' })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="category" className="text-right">カテゴリ</Label>
                                    <Input
                                        id="category"
                                        value={newItem.category}
                                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                        className="col-span-3"
                                        placeholder="例: ドリンク, フード, サービス"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="duration" className="text-right">所要時間(分)</Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        value={newItem.duration}
                                        onChange={(e) => setNewItem({ ...newItem, duration: e.target.value })}
                                        className="col-span-3"
                                        placeholder="60"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="bufferBefore" className="text-right">前バッファ(分)</Label>
                                    <Input
                                        id="bufferBefore"
                                        type="number"
                                        value={newItem.bufferBefore || ''}
                                        onChange={(e) => setNewItem({ ...newItem, bufferBefore: e.target.value })}
                                        className="col-span-3"
                                        placeholder="0 (準備時間など)"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="bufferAfter" className="text-right">後バッファ(分)</Label>
                                    <Input
                                        id="bufferAfter"
                                        type="number"
                                        value={newItem.bufferAfter || ''}
                                        onChange={(e) => setNewItem({ ...newItem, bufferAfter: e.target.value })}
                                        className="col-span-3"
                                        placeholder="0 (片付け時間など)"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSaveItem} disabled={isLoading}>
                                    {isLoading ? '保存中...' : (editingService ? '更新する' : '追加する')}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>商品名</TableHead>
                            <TableHead>カテゴリ</TableHead>
                            <TableHead>価格</TableHead>
                            <TableHead>時間</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {menuList.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.category}</TableCell>
                                <TableCell>¥{item.price}</TableCell>
                                <TableCell>{item.duration_minutes}分</TableCell>
                                <TableCell className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                                        編集
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setSelectedServiceForOptions(item)}>
                                        OP設定
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteItem(item.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Service Options Dialog (Individual) */}
            <Dialog open={!!selectedServiceForOptions} onOpenChange={(open) => !open && setSelectedServiceForOptions(null)}>
                {selectedServiceForOptions && <ServiceOptionsDialog storeId={storeId} service={selectedServiceForOptions} />}
            </Dialog>

            {/* Global Options Dialog */}
            <Dialog open={showGlobalOptions} onOpenChange={setShowGlobalOptions}>
                {showGlobalOptions && <ServiceOptionsDialog storeId={storeId} service={null} />}
            </Dialog>
        </div >
    )
}
