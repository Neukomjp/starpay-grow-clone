import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, Clock } from 'lucide-react'
import { storeService } from '@/lib/services/stores'
import { organizationService } from '@/lib/services/organizations'
import { menuService } from '@/lib/services/menu'
import { ticketService } from '@/lib/services/tickets'
import { Service } from '@/types/staff'
import { BookingSection } from './booking-section'
import { TicketSection } from './ticket-section'

// Force dynamic rendering as we rely on DB data that changes
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const params = await props.params
    const store = await storeService.getStoreBySlug(params.slug)

    if (!store) {
        return {
            title: 'Store Not Found',
        }
    }

    const theme = store.theme_config as any || {}
    const seo = theme.seo || {}

    return {
        title: seo.title || store.name,
        description: seo.description || store.description || `Welcome to ${store.name}`,
        openGraph: {
            title: seo.title || store.name,
            description: seo.description || store.description || `Welcome to ${store.name}`,
            images: seo.ogImage ? [{ url: seo.ogImage }] : store.cover_image_url ? [{ url: store.cover_image_url }] : [],
        }
    }
}

import { createClient } from '@/lib/supabase/server'

export default async function StorePublicPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params
    let store
    let organization
    let menuItems: Service[] = []
    let tickets: any[] = []

    try {
        const supabase = await createClient()
        store = await storeService.getStoreBySlug(params.slug, supabase)
        if (store) {
            menuItems = await menuService.getServicesByStoreId(store.id, supabase)
            tickets = await ticketService.getTicketMasters(store.id, supabase)
            if (store.organization_id) {
                organization = await organizationService.getOrganizationById(store.organization_id, supabase)
            }
        }
    } catch (error) {
        console.error('Error fetching store data:', error)
    }

    if (!store) {
        notFound()
    }

    const theme = store.theme_config as any || { primaryColor: store.theme_color || 'bg-stone-900', textColor: 'text-stone-900' }
    const heroImage = store.cover_image_url || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop'
    const logoUrl = store.logo_url

    const fontFamily = theme.fontFamily || 'sans'
    const welcomeMessage = theme.welcomeMessage || ''
    const showTitle = theme.showTitle !== false

    return (
        <div className={`min-h-screen bg-stone-50 ${fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans'}`}>
            {/* Hero Section */}
            <div className="relative h-96 w-full">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${heroImage})` }}
                >
                    <div className="absolute inset-0 bg-black/40" />
                </div>
                <div className="relative h-full flex flex-col items-center justify-center text-white text-center px-4">
                    <div className="absolute top-4 right-4">
                        <Button variant="outline" size="sm" className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20" asChild>
                            <Link href="/login/customer">ログイン / マイページ</Link>
                        </Button>
                    </div>
                    {logoUrl && (
                        <img src={logoUrl} alt="Store Logo" className="w-24 h-24 rounded-full border-4 border-white mb-4 object-cover" />
                    )}
                    {showTitle && <h1 className="text-5xl font-bold mb-4">{store.name}</h1>}
                    <p className="text-xl max-w-2xl">{store.description}</p>

                    {welcomeMessage && (
                        <div className="mt-6 max-w-2xl bg-black/30 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                            <p className="text-white whitespace-pre-wrap">{welcomeMessage}</p>
                        </div>
                    )}

                    <div className="mt-8 flex gap-4">
                        <Button size="lg" className="bg-white text-black hover:bg-gray-100" asChild>
                            <Link href="#menu">メニューを見る</Link>
                        </Button>
                        <BookingSection
                            storeId={store.id}
                            storeName={store.name}
                            slug={params.slug}
                            themeColor={store.theme_color}
                        />
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="max-w-4xl mx-auto py-12 px-4 grid md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm">
                    <Clock className="h-8 w-8 mb-4 text-emerald-600" />
                    <h3 className="font-semibold mb-2">営業時間</h3>
                    <p className="text-gray-600">{store.address ? '月〜日: 9:00 - 20:00' : '営業時間未設定'}</p>
                </div>
                <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm">
                    <MapPin className="h-8 w-8 mb-4 text-red-600" />
                    <h3 className="font-semibold mb-2">アクセス</h3>
                    <p className="text-gray-600">{store.address || '住所未設定'}</p>
                </div>
                <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm">
                    <Phone className="h-8 w-8 mb-4 text-blue-600" />
                    <h3 className="font-semibold mb-2">お問い合わせ</h3>
                    <p className="text-gray-600">{store.phone || '電話番号未設定'}</p>
                </div>
            </div>

            {/* About Us Section */}
            {(theme.about?.title || theme.about?.content) && (
                <div className="max-w-4xl mx-auto py-12 px-4 bg-white my-8 rounded-lg shadow-sm">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        {theme.about.imageUrl && (
                            <div className="aspect-video md:aspect-square relative rounded-lg overflow-hidden">
                                <img
                                    src={theme.about.imageUrl}
                                    alt="About Us"
                                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                        )}
                        <div className={theme.about.imageUrl ? '' : 'md:col-span-2 text-center'}>
                            <h2 className={`text-3xl font-bold mb-6 ${theme.textColor || 'text-stone-900'}`}>
                                {theme.about.title || '私たちについて'}
                            </h2>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                {theme.about.content}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Gallery Section */}
            {theme.gallery && theme.gallery.length > 0 && (
                <div className="max-w-6xl mx-auto py-12 px-4">
                    <h2 className={`text-3xl font-bold text-center mb-12 ${theme.textColor || 'text-stone-900'}`}>ギャラリー</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {theme.gallery.map((img: string, i: number) => (
                            <div key={i} className="aspect-square relative rounded-lg overflow-hidden group">
                                <img
                                    src={img}
                                    alt={`Gallery ${i + 1}`}
                                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Ticket Section */}
            <TicketSection
                tickets={tickets.filter(t => t.is_active)}
                storeId={store.id}
                themeColor={store.theme_color}
            />

            {/* Menu Preview Section */}
            <div id="menu" className="max-w-4xl mx-auto py-8 px-4">
                <h2 className={`text-3xl font-bold text-center mb-8 ${theme.textColor || 'text-stone-900'}`}>メニュー & サービス</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    {menuItems.length > 0 ? (
                        menuItems.map((item) => (
                            <div key={item.id} className="flex gap-4 items-center p-4 bg-white rounded-lg shadow-sm border border-stone-100">
                                {item.image_url && (
                                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md">
                                        <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="font-medium text-lg">{item.name}</div>
                                    <div className="text-sm text-gray-500">{item.category}</div>
                                    <div className="text-sm text-gray-400 mt-1">{item.duration_minutes}分</div>
                                </div>
                                <span className="font-bold text-lg">¥{item.price}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-center col-span-2 text-gray-500">表示できるメニューがありません。</p>
                    )}
                </div>
            </div>

            {/* Footer */}
            {!organization?.branding?.remove_branding && (
                <footer className="bg-gray-900 text-white py-8 mt-12 text-center">
                    <p>&copy; 2024 {store.name}. Powered by サロン予約システム.</p>
                </footer>
            )}
        </div>
    )
}
