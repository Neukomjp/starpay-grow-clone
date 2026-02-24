'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'
import { Staff, Service } from '@/types/staff'
import { staffService } from '@/lib/services/staff'
import { menuService } from '@/lib/services/menu'
import { toast } from 'sonner'
import { ShiftDialog } from './shift-dialog'

interface StaffManagerProps {
    storeId: string
}

export function StaffManager({ storeId }: StaffManagerProps) {
    const [staffList, setStaffList] = useState<Staff[]>([])
    const [availableServices, setAvailableServices] = useState<Service[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
    const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        bio: '',
        specialties: '', // Comma separated for input
        serviceIds: [] as string[]
    })
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        loadStaff()
        loadServices()
    }, [storeId])

    useEffect(() => {
        if (!isDialogOpen) {
            setEditingStaff(null)
            setFormData({ name: '', role: '', bio: '', specialties: '', serviceIds: [] })
        }
    }, [isDialogOpen])

    async function loadStaff() {
        try {
            const data = await staffService.getStaffByStoreId(storeId)
            setStaffList(data)
        } catch (error) {
            console.error('Error loading staff:', error)
            toast.error('スタッフ情報の取得に失敗しました')
        }
    }

    async function loadServices() {
        try {
            const data = await menuService.getServicesByStoreId(storeId)
            setAvailableServices(data)
        } catch (error) {
            console.error('Error loading services:', error)
        }
    }

    const handleEditClick = (staff: Staff) => {
        setEditingStaff(staff)
        setFormData({
            name: staff.name,
            role: staff.role,
            bio: staff.bio || '',
            specialties: staff.specialties?.join(', ') || '',
            serviceIds: staff.serviceIds || []
        })
        setIsDialogOpen(true)
    }

    const handleSaveStaff = async () => {
        if (!formData.name || !formData.role) return

        setIsLoading(true)
        try {
            const specialtiesArray = formData.specialties.split(',').map(s => s.trim()).filter(Boolean)

            if (editingStaff) {
                // Update
                const updated = await staffService.updateStaff(editingStaff.id, {
                    name: formData.name,
                    role: formData.role,
                    bio: formData.bio,
                    specialties: specialtiesArray,
                    serviceIds: formData.serviceIds
                })
                setStaffList(staffList.map(s => s.id === updated.id ? updated : s))
                toast.success('スタッフ情報を更新しました')
            } else {
                // Add
                const added = await staffService.addStaff({
                    storeId: storeId,
                    name: formData.name,
                    role: formData.role,
                    bio: formData.bio,
                    specialties: specialtiesArray,
                    serviceIds: formData.serviceIds,
                    avatarUrl: ''
                })
                setStaffList([added, ...staffList])
                toast.success('スタッフを追加しました')
            }
            setIsDialogOpen(false)
        } catch (error) {
            console.error('Error saving staff:', error)
            toast.error('保存に失敗しました')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteStaffConfirm = async () => {
        if (!staffToDelete) return
        try {
            await staffService.deleteStaff(staffToDelete.id)
            setStaffList(staffList.filter(s => s.id !== staffToDelete.id))
            toast.success('スタッフを削除しました')
        } catch (error) {
            console.error('Error deleting staff:', error)
            toast.error('スタッフの削除に失敗しました')
        } finally {
            setStaffToDelete(null)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">スタッフ一覧</h3>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> スタッフを追加</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingStaff ? 'スタッフ情報の編集' : '新しいスタッフを追加'}</DialogTitle>
                            <DialogDescription>
                                スタッフの基本情報を入力してください。
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">名前 <span className="text-red-500">*</span></Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="col-span-3"
                                    placeholder="山田 太郎"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="role" className="text-right">役割 <span className="text-red-500">*</span></Label>
                                <Input
                                    id="role"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="col-span-3"
                                    placeholder="例: スタイリスト"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="specialties" className="text-right">得意施術</Label>
                                <Input
                                    id="specialties"
                                    value={formData.specialties}
                                    onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                                    className="col-span-3"
                                    placeholder="カット, カラー, パーマ (カンマ区切り)"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="bio" className="text-right mt-2">自己紹介</Label>
                                <textarea
                                    id="bio"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 col-span-3"
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="スタッフの自己紹介文を入力してください"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right mt-2">対応メニュー</Label>
                                <div className="col-span-3 space-y-2 border rounded-md p-3 max-h-[150px] overflow-y-auto">
                                    {availableServices.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">メニューが登録されていません</p>
                                    ) : (
                                        availableServices.map((service) => (
                                            <div key={service.id} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`service-${service.id}`}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                    checked={formData.serviceIds.includes(service.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData({
                                                                ...formData,
                                                                serviceIds: [...formData.serviceIds, service.id]
                                                            })
                                                        } else {
                                                            setFormData({
                                                                ...formData,
                                                                serviceIds: formData.serviceIds.filter(id => id !== service.id)
                                                            })
                                                        }
                                                    }}
                                                />
                                                <label htmlFor={`service-${service.id}`} className="text-sm cursor-pointer select-none">
                                                    {service.name}
                                                </label>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSaveStaff} disabled={isLoading}>
                                {isLoading ? '保存中...' : '保存する'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {staffList.map((staff) => (
                    <Card key={staff.id}>
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                            <Avatar>
                                <AvatarImage src={staff.avatarUrl} alt={staff.name} />
                                <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <CardTitle className="text-base">{storeId ? staff.name : 'Sample'}</CardTitle>
                                <p className="text-sm text-muted-foreground">{staff.role}</p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-1 mb-4 h-6 overflow-hidden">
                                {staff.specialties?.map((spec) => (
                                    <Badge key={spec} variant="secondary" className="text-xs">{spec}</Badge>
                                ))}
                            </div>
                            <div className="space-y-2">
                                <Button variant="outline" size="sm" className="w-full" onClick={() => handleEditClick(staff)}>
                                    情報の編集
                                </Button>
                                <ShiftDialog staffId={staff.id} staffName={staff.name} />
                                <Button variant="ghost" size="sm" className="w-full text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setStaffToDelete(staff)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> 削除
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!staffToDelete} onOpenChange={(open) => !open && setStaffToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
                        <AlertDialogDescription>
                            「{staffToDelete?.name}」のスタッフ情報を削除します。この操作は取り消せません。設定されていたシフト情報も同時に削除される場合があります。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteStaffConfirm} className="bg-red-500 hover:bg-red-600 text-white">
                            削除する
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

