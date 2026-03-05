/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner' // Assuming 'sonner' for toast notifications

interface ImageUploadProps {
    value?: string
    onChange: (url: string) => void
    onRemove?: () => void
    className?: string
}

export function ImageUpload({ value, onChange, onRemove, className = '' }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    // const [error, setError] = useState<string | null>(null) // Replaced by toast
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        // setError(null) // Replaced by toast

        try {
            const supabase = createClient()

            // Create a unique file name to avoid collisions
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
            const filePath = `uploads/${fileName}`

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('store_assets')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) {
                console.error('Storage upload error:', uploadError)
                throw uploadError
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('store_assets')
                .getPublicUrl(filePath)

            onChange(publicUrl)
        } catch (error: any) { // Fixed explicit any
            console.error('Error uploading image:', error)
            toast.error('アップロードに失敗しました') // Replaced setError
        } finally {
            setIsUploading(false)
            // Reset input so the same file can be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {value ? (
                <div className="relative rounded-md overflow-hidden border bg-muted group w-full max-w-sm aspect-video">
                    <Image // Replaced img with Next.js Image component
                        src={value}
                        alt="Uploaded image"
                        fill
                        className="object-cover"
                        unoptimized // Add unoptimized if you don't want Next.js to optimize the image
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : '変更'}
                        </Button>
                        {onRemove && (
                            <Button type="button" variant="destructive" size="sm" onClick={onRemove} disabled={isUploading}>
                                <X className="h-4 w-4 mr-1" /> 削除
                            </Button>
                        )}
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => { if (!isUploading) fileInputRef.current?.click() }}
                    className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground w-full max-w-sm transition-colors ${isUploading ? 'bg-muted opacity-70 cursor-not-allowed' : 'hover:bg-muted/50 cursor-pointer'
                        }`}
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="text-sm">アップロード中...</span>
                        </>
                    ) : (
                        <>
                            <ImagePlus className="h-8 w-8" />
                            <span className="text-sm">クリックして画像を選択</span>
                        </>
                    )}
                </div>
            )}

            {/* {error && <p className="text-sm text-destructive">{error}</p>} */} {/* Replaced by toast */}

            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />
        </div>
    )
}
