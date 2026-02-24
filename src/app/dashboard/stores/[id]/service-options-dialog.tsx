import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2 } from 'lucide-react'
import { Service, ServiceOption } from '@/types/staff'
import { menuService } from '@/lib/services/menu'
import { toast } from 'sonner'

interface ServiceOptionsDialogProps {
    storeId: string
    service?: Service | null
}

export function ServiceOptionsDialog({ storeId, service }: ServiceOptionsDialogProps) {
    const [options, setOptions] = useState<ServiceOption[]>([])
    const [newOption, setNewOption] = useState({ name: '', price: '0', duration_minutes: '0' })
    const [loading, setLoading] = useState(false)

    const isGlobal = !service
    const title = isGlobal ? '全体オプション設定' : `${service.name} - オプション設定`
    const description = isGlobal
        ? '店舗全体のオプション（深夜料金・指名料など）を設定します。'
        : 'このメニューのオプション（トッピングや延長など）を設定します。'

    useEffect(() => {
        loadOptions()
    }, [storeId, service?.id])

    async function loadOptions() {
        try {
            let data: ServiceOption[]
            if (isGlobal) {
                data = await menuService.getGlobalOptionsByStoreId(storeId)
            } else if (service?.id) {
                data = await menuService.getOptionsByServiceId(service.id)
            } else {
                return
            }
            setOptions(data)
        } catch (error) {
            console.error('Failed to load options', error)
            toast.error('オプションの読み込みに失敗しました')
        }
    }

    const handleAddOption = async () => {
        if (!newOption.name) return
        setLoading(true)
        try {
            const added = await menuService.addOption({
                store_id: storeId,
                service_id: isGlobal ? null : service!.id,
                name: newOption.name,
                price: parseInt(newOption.price) || 0,
                duration_minutes: parseInt(newOption.duration_minutes) || 0
            })
            setOptions([...options, added])
            setNewOption({ name: '', price: '0', duration_minutes: '0' })
            toast.success('オプションを追加しました')
        } catch (error) {
            console.error('Failed to add option', error)
            toast.error('オプションの追加に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteOption = async (id: string) => {
        try {
            await menuService.deleteOption(id)
            setOptions(options.filter(o => o.id !== id))
            toast.success('オプションを削除しました')
        } catch (error) {
            console.error('Failed to delete option', error)
            toast.error('オプションの削除に失敗しました')
        }
    }

    return (
        <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>
                    {description}
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
                {/* Add New Option Form */}
                <div className="grid grid-cols-4 gap-2 items-end">
                    <div className="col-span-2">
                        <Label htmlFor="optName">オプション名</Label>
                        <Input
                            id="optName"
                            value={newOption.name}
                            onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
                            placeholder="指名料、延長10分など"
                        />
                    </div>
                    <div>
                        <Label htmlFor="optPrice">追加価格</Label>
                        <Input
                            id="optPrice"
                            type="number"
                            value={newOption.price}
                            onChange={(e) => setNewOption({ ...newOption, price: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="optDuration">追加時間(分)</Label>
                        <Input
                            id="optDuration"
                            type="number"
                            value={newOption.duration_minutes}
                            onChange={(e) => setNewOption({ ...newOption, duration_minutes: e.target.value })}
                        />
                    </div>
                </div>
                <Button onClick={handleAddOption} disabled={loading || !newOption.name} className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> 追加
                </Button>

                {/* Options List */}
                <div className="border rounded-md mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>オプション名</TableHead>
                                <TableHead>価格</TableHead>
                                <TableHead>時間</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {options.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-gray-500">
                                        オプションは設定されていません
                                    </TableCell>
                                </TableRow>
                            ) : (
                                options.map((opt) => (
                                    <TableRow key={opt.id}>
                                        <TableCell>{opt.name}</TableCell>
                                        <TableCell>+{opt.price}円</TableCell>
                                        <TableCell>+{opt.duration_minutes}分</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteOption(opt.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

        </DialogContent>
    )
}
