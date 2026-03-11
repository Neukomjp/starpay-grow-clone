'use client'

import { useState } from 'react'
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
import { createVisitRecordAction } from '@/lib/actions/visit'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

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
    const [photos, setPhotos] = useState<string[]>([])
    const [uploadingImage, setUploadingImage] = useState(false)

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploadingImage(true)
            const supabase = createClient()
            const fileExt = file.name.split('.').pop()
            const fileName = `${customerId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('customer_records')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('customer_records')
                .getPublicUrl(fileName)

            setPhotos([...photos, publicUrl])
            toast.success('画像をアップロードしました')
        } catch (error: any) {
            console.error('Upload Error:', error)
            toast.error(error.message || '画像のアップロードに失敗しました')
        } finally {
            setUploadingImage(false)
            // Reset input
            e.target.value = ''
        }
    }

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
            await createVisitRecordAction({
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

                    <div className="grid gap-2">
                        <Label>写真</Label>
                        <div className="flex flex-col gap-2">
                            <Input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageUpload} 
                                disabled={uploadingImage}
                            />
                            {uploadingImage && <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-3 w-3 animate-spin"/> アップロード中...</p>}
                            
                            {photos.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto py-2">
                                    {photos.map((url, i) => (
                                        <div key={i} className="relative aspect-square h-20 bg-muted rounded overflow-hidden">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={url} alt="カルテ画像" className="object-cover w-full h-full" />
                                            <button 
                                                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"
                                                onClick={() => setPhotos(photos.filter(p => p !== url))}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
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
