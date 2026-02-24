'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { CalendarIcon, Loader2, Plus, X } from 'lucide-react'
import { VisitRecord } from '@/lib/types/visit-record'
import { visitService } from '@/lib/services/visits'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface VisitRecordDialogProps {
    storeId: string
    customerId: string
    bookingId?: string
    staffId?: string
    onRecordCreated?: () => void
    trigger?: React.ReactNode
}

export function VisitRecordDialog({ storeId, customerId, bookingId, staffId, onRecordCreated, trigger }: VisitRecordDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [content, setContent] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState('')
    const [photos, setPhotos] = useState<string[]>([]) // Mock URLs

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()])
            setTagInput('')
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove))
    }

    const handleSubmit = async () => {
        if (!date || !content) return

        setLoading(true)
        try {
            await visitService.createVisitRecord({
                store_id: storeId,
                customer_id: customerId,
                booking_id: bookingId,
                staff_id: staffId || 'staff-unknown', // Should be current user or selected staff
                visit_date: date.toISOString(),
                content: content,
                photos: photos,
                tags: tags
            })
            toast.success('来店記録を作成しました')
            setOpen(false)
            resetForm()
            if (onRecordCreated) onRecordCreated()
        } catch (error) {
            console.error(error)
            toast.error('作成に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setDate(new Date())
        setContent('')
        setTags([])
        setPhotos([])
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" /> 来店記録を追加
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>来店記録の作成</DialogTitle>
                    <DialogDescription>
                        施術内容や会話のメモを記録します。
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>来店日</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP", { locale: ja }) : <span>日付を選択</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                    locale={ja}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="content">内容・メモ</Label>
                        <Textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="カット、カラー（アッシュグレージュ）。仕事の話で盛り上がった。"
                            className="min-h-[100px]"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>タグ</Label>
                        <div className="flex gap-2">
                            <Input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                placeholder="タグを入力 (Enterで追加)"
                            />
                            <Button type="button" onClick={handleAddTag} variant="outline" size="icon">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {tags.map(tag => (
                                <div key={tag} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                                    <span>#{tag}</span>
                                    <button onClick={() => handleRemoveTag(tag)} className="text-muted-foreground hover:text-foreground">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Photo upload placeholder */}
                    <div className="grid gap-2">
                        <Label>写真 (モック)</Label>
                        <div className="border-2 border-dashed rounded-md p-4 text-center text-sm text-muted-foreground">
                            写真をドラッグ＆ドロップ (未実装)
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={loading || !date || !content}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        記録する
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
