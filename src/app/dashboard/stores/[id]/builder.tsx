'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { StoreData } from '@/lib/types/store'
import { updateStoreAction } from '@/lib/actions/store'
import { Loader2 } from 'lucide-react'

interface StorePageBuilderProps {
    store: StoreData
}

export function StorePageBuilder({ store }: StorePageBuilderProps) {
    const [loading, setLoading] = useState(false)

    // Parse existing theme_config
    const existingConfig = store.theme_config as any || {}

    const [designConfig, setDesignConfig] = useState({
        theme: existingConfig.theme || 'modern',
        primaryColor: store.theme_color || '#78350f', // amber-900
        heroImage: store.cover_image_url || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop',
        logoUrl: store.logo_url || '',
        fontFamily: existingConfig.fontFamily || 'sans',
        welcomeMessage: existingConfig.welcomeMessage || '',
        showTitle: existingConfig.showTitle !== false, // default true
        showMenu: true, // always true for now?
        showMap: true,
        about: existingConfig.about || {
            title: '私たちについて',
            content: '当店はお客様に最高のリラックス空間とサービスを提供することを目指しています。厳選された素材と確かな技術で、あなたの日常を少しだけ豊かにするお手伝いをさせてください。',
            imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop'
        },
        gallery: existingConfig.gallery || [
            'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1560066984-35d09450c110?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1000&auto=format&fit=crop'
        ],
        seo: existingConfig.seo || {
            title: '',
            description: '',
            ogImage: ''
        }
    })

    const handleSave = async () => {
        setLoading(true)
        try {
            await updateStoreAction(store.id, {
                theme_color: designConfig.primaryColor,
                cover_image_url: designConfig.heroImage,
                logo_url: designConfig.logoUrl,
                theme_config: {
                    theme: designConfig.theme,
                    fontFamily: designConfig.fontFamily,
                    welcomeMessage: designConfig.welcomeMessage,
                    showTitle: designConfig.showTitle,
                    about: designConfig.about,
                    gallery: designConfig.gallery,
                    seo: designConfig.seo,
                    // Preserve other keys if any
                    ...existingConfig,
                    // Overwrites
                    updatedAt: new Date().toISOString()
                }
            })
            toast.success('デザイン設定を保存しました')
        } catch (error) {
            console.error('Failed to save design:', error)
            toast.error('保存に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
                <div className="grid gap-2">
                    <Label>デザインテンプレート</Label>
                    <Select
                        value={designConfig.theme}
                        onValueChange={(val) => setDesignConfig({ ...designConfig, theme: val })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="テンプレートを選択" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="modern">モダンカフェ</SelectItem>
                            <SelectItem value="minimal">ミニマリスト（小売）</SelectItem>
                            <SelectItem value="vibrant">ポップ（サロン）</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label>メインカラー</Label>
                    <div className="flex gap-2">
                        <Input
                            type="color"
                            value={designConfig.primaryColor}
                            onChange={(e) => setDesignConfig({ ...designConfig, primaryColor: e.target.value })}
                            className="w-12 h-10 p-1"
                        />
                        <Input
                            value={designConfig.primaryColor}
                            onChange={(e) => setDesignConfig({ ...designConfig, primaryColor: e.target.value })}
                            className="flex-1"
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label>フォント</Label>
                    <Select
                        value={designConfig.fontFamily}
                        onValueChange={(val) => setDesignConfig({ ...designConfig, fontFamily: val })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="フォントを選択" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sans">ゴシック体 (モダン)</SelectItem>
                            <SelectItem value="serif">明朝体 (クラシック)</SelectItem>
                            <SelectItem value="mono">等幅フォント (テクニカル)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label>ウェルカムメッセージ</Label>
                    <Textarea
                        value={designConfig.welcomeMessage}
                        onChange={(e) => setDesignConfig({ ...designConfig, welcomeMessage: e.target.value })}
                        placeholder="当店へようこそ！最高のサービスを提供します..."
                        rows={3}
                    />
                    <p className="text-xs text-muted-foreground">ヒーロー画像の下に表示されます。</p>
                </div>

                <div className="flex items-center space-x-2">
                    <Switch
                        id="show-title"
                        checked={designConfig.showTitle}
                        onCheckedChange={(checked) => setDesignConfig({ ...designConfig, showTitle: checked })}
                    />
                    <Label htmlFor="show-title">ストア名を表示する</Label>
                </div>

                <div className="grid gap-2">
                    <Label>カバー画像URL</Label>
                    <Input
                        value={designConfig.heroImage}
                        onChange={(e) => setDesignConfig({ ...designConfig, heroImage: e.target.value })}
                        placeholder="https://..."
                    />
                    <p className="text-xs text-muted-foreground">バナー画像の直接リンクを入力してください。</p>
                </div>

                <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold">About Us セクション</h3>
                    <div className="grid gap-2">
                        <Label>タイトル</Label>
                        <Input
                            value={designConfig.about.title}
                            onChange={(e) => setDesignConfig({ ...designConfig, about: { ...designConfig.about, title: e.target.value } })}
                            placeholder="私たちについて"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>説明文</Label>
                        <Textarea
                            value={designConfig.about.content}
                            onChange={(e) => setDesignConfig({ ...designConfig, about: { ...designConfig.about, content: e.target.value } })}
                            placeholder="お店のストーリーやこだわりを入力..."
                            rows={4}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>画像URL (任意)</Label>
                        <Input
                            value={designConfig.about.imageUrl}
                            onChange={(e) => setDesignConfig({ ...designConfig, about: { ...designConfig.about, imageUrl: e.target.value } })}
                            placeholder="https://..."
                        />
                    </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold">ギャラリー画像</h3>
                    <div className="grid gap-2">
                        <Label>画像URL (カンマ区切りで複数入力)</Label>
                        <Textarea
                            value={designConfig.gallery.join(',\n')}
                            onChange={(e) => setDesignConfig({ ...designConfig, gallery: e.target.value.split(/[,\n]+/).map(s => s.trim()).filter(Boolean) })}
                            placeholder="https://example.com/image1.jpg,&#13;&#10;https://example.com/image2.jpg"
                            rows={4}
                        />
                        <p className="text-xs text-muted-foreground">複数の画像URLをカンマまたは改行で区切って入力してください。</p>
                    </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold">SEO & SNSシェア設定</h3>
                    <div className="grid gap-2">
                        <Label>ページタイトル (Title)</Label>
                        <Input
                            value={designConfig.seo?.title || ''}
                            onChange={(e) => setDesignConfig({ ...designConfig, seo: { ...designConfig.seo, title: e.target.value } })}
                            placeholder={store.name}
                        />
                        <p className="text-xs text-muted-foreground">ブラウザのタブや検索結果のタイトルとして表示されます。未入力の場合は店舗名が使用されます。</p>
                    </div>
                    <div className="grid gap-2">
                        <Label>説明文 (Meta Description)</Label>
                        <Textarea
                            value={designConfig.seo?.description || ''}
                            onChange={(e) => setDesignConfig({ ...designConfig, seo: { ...designConfig.seo, description: e.target.value } })}
                            placeholder="店舗の魅力や特徴を100文字程度で入力してください..."
                            rows={3}
                        />
                        <p className="text-xs text-muted-foreground">検索結果のスニペットとして表示される説明文です。</p>
                    </div>
                    <div className="grid gap-2">
                        <Label>シェア用画像 (OGP Image)</Label>
                        <Input
                            value={designConfig.seo?.ogImage || ''}
                            onChange={(e) => setDesignConfig({ ...designConfig, seo: { ...designConfig.seo, ogImage: e.target.value } })}
                            placeholder="https://..."
                        />
                        <p className="text-xs text-muted-foreground">SNSでシェアされた際に表示される画像URL。未入力の場合はカバー画像が使用されます。</p>
                    </div>
                </div>

                <Button onClick={handleSave} className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    保存する
                </Button>
            </div>

            {/* Preview Area */}
            <div className="border rounded-lg overflow-hidden bg-gray-50 h-[600px] relative">
                <div className="absolute top-0 w-full bg-gray-800 text-white text-xs px-2 py-1 flex justify-between items-center z-10">
                    <span>プレビュー: モバイル表示</span>
                </div>
                <div className="h-full overflow-y-auto pt-6 pb-12 px-4">
                    {/* Simulation of the Store Page */}
                    <div className={`bg-white shadow-sm rounded-md overflow-hidden min-h-[500px] ${designConfig.fontFamily === 'serif' ? 'font-serif' : designConfig.fontFamily === 'mono' ? 'font-mono' : 'font-sans'}`}>
                        <div className="h-40 bg-gray-200 bg-cover bg-center relative" style={{ backgroundImage: `url(${designConfig.heroImage})` }}>
                            <div className="absolute inset-0 bg-black/20" />
                            {designConfig.showTitle && (
                                <div className="absolute bottom-4 left-4 text-white font-bold text-xl drop-shadow-md">{store.name}</div>
                            )}
                        </div>
                        <div className="p-4 space-y-4">
                            {designConfig.welcomeMessage && (
                                <div className="bg-stone-50 p-3 rounded text-sm text-gray-600 mb-4 whitespace-pre-wrap">
                                    {designConfig.welcomeMessage}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <div className="h-8 flex-1 rounded text-white text-xs flex items-center justify-center font-bold" style={{ backgroundColor: designConfig.primaryColor }}>
                                    予約する
                                </div>
                                <div className="h-8 flex-1 bg-gray-100 rounded text-gray-800 text-xs flex items-center justify-center font-bold">
                                    メニュー
                                </div>
                            </div>

                            {/* Info Cards Preview */}
                            <div className="grid grid-cols-3 gap-1">
                                <div className="h-10 bg-gray-50 rounded border flex items-center justify-center text-[10px]">営業時間</div>
                                <div className="h-10 bg-gray-50 rounded border flex items-center justify-center text-[10px]">アクセス</div>
                                <div className="h-10 bg-gray-50 rounded border flex items-center justify-center text-[10px]">連絡先</div>
                            </div>

                            {/* About Us Preview */}
                            {(designConfig.about.title || designConfig.about.content) && (
                                <div className="space-y-2 border-t pt-2">
                                    <div className="font-bold text-sm text-center">{designConfig.about.title || '私たちについて'}</div>
                                    <div className="flex gap-2">
                                        {designConfig.about.imageUrl && (
                                            <div className="w-1/3 aspect-square bg-gray-200 rounded bg-cover bg-center" style={{ backgroundImage: `url(${designConfig.about.imageUrl})` }} />
                                        )}
                                        <div className={`text-[10px] text-gray-600 ${designConfig.about.imageUrl ? 'w-2/3' : 'w-full'}`}>
                                            {designConfig.about.content.slice(0, 100)}...
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Gallery Preview */}
                            {designConfig.gallery.length > 0 && (
                                <div className="space-y-2 border-t pt-2">
                                    <div className="font-bold text-sm text-center">ギャラリー</div>
                                    <div className="grid grid-cols-3 gap-1">
                                        {designConfig.gallery.slice(0, 3).map((img: string, i: number) => (
                                            <div key={i} className="aspect-square bg-gray-200 rounded bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 border-t pt-2">
                                <div className="h-4 w-3/4 bg-gray-100 rounded" />
                                <div className="h-4 w-full bg-gray-100 rounded" />
                                <div className="h-4 w-5/6 bg-gray-100 rounded" />
                            </div>
                            <div className="h-32 bg-gray-50 rounded border-dashed border-2 flex items-center justify-center text-gray-400 text-sm">
                                メニューリスト表示エリア
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
