'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { getBookingsByCustomerIdAction } from '@/lib/actions/booking'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, LogOut, User } from 'lucide-react'

import { getCurrentCustomerAction, logoutCustomerAction } from '@/lib/actions/auth'
import { getCustomerTicketsByAuthUserIdAction } from '@/lib/actions/tickets'
import { getBookingsByAuthUserIdAction } from '@/lib/actions/booking'
import { getStoreByIdAction } from '@/lib/actions/store'

export default function MyPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [bookings, setBookings] = useState<any[]>([])
    const [tickets, setTickets] = useState<any[]>([])
    const [store, setStore] = useState<any>(null)

    useEffect(() => {
        checkUser()
    }, [])

    async function checkUser() {
        const authUser = await getCurrentCustomerAction()

        if (!authUser) {
            router.push('/login/customer')
            return
        }

        setUser(authUser)

        // Parallel fetch using auth_user_id
        const [bookingsData, ticketsData] = await Promise.all([
            getBookingsByAuthUserIdAction(authUser.id),
            getCustomerTicketsByAuthUserIdAction(authUser.id)
        ])

        setBookings(bookingsData || [])
        setTickets(ticketsData || [])
        setStore(null) // Mypage doesn't belong to a single store anymore
        setLoading(false)
    }



    async function handleLogout() {
        await logoutCustomerAction()
        router.push('/login/customer')
        toast.success('ログアウトしました')
    }

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                            <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">マイページ</h1>
                            <p className="text-gray-500">{user?.email}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {store && (
                            <Button onClick={() => router.push(`/store/${store.slug}`)}>
                                新規予約
                            </Button>
                        )}
                        <Button variant="outline" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" /> ログアウト
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-bold">保有回数券</h2>
                    {tickets.length === 0 ? (
                        <div className="bg-white p-6 rounded-lg shadow-sm border text-center text-gray-500">
                            <p>保有している回数券はありません</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {tickets.map(ticket => (
                                <Card key={ticket.id} className={ticket.remaining_uses > 0 ? 'bg-white' : 'bg-gray-50 opacity-75'}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-base">{ticket.name}</CardTitle>
                                            <Badge variant={ticket.remaining_uses > 0 ? 'default' : 'secondary'}>
                                                残り {ticket.remaining_uses} 回
                                            </Badge>
                                        </div>
                                        <CardDescription>
                                            有効期限: {new Date(ticket.expires_at).toLocaleDateString()}
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-bold">予約履歴</h2>

                    {bookings.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <Calendar className="h-12 w-12 mb-4 opacity-50" />
                                <p>予約履歴はありません</p>
                                <Button className="mt-4" onClick={() => router.push('/')}>店舗を探す</Button>
                            </CardContent>
                        </Card>
                    ) : (
                        bookings.map((booking) => {
                            const optionsPrice = booking.options?.reduce((sum: number, o: any) => sum + o.price, 0) || 0
                            const totalPrice = (booking.service?.price || 0) + optionsPrice
                            const optionsDuration = booking.options?.reduce((sum: number, o: any) => sum + o.duration_minutes, 0) || 0
                            const totalDuration = (booking.service?.duration_minutes || 0) + optionsDuration

                            return (
                                <Card key={booking.id} className="overflow-hidden">
                                    <div className="border-l-4 border-primary h-full">
                                        <CardHeader className="bg-gray-50/50 pb-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg">
                                                        {booking.store?.name || '店舗名不明'}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        {new Date(booking.start_time).toLocaleDateString()}
                                                    </CardDescription>
                                                </div>
                                                <Badge variant={
                                                    booking.status === 'confirmed' ? 'default' :
                                                        booking.status === 'cancelled' ? 'destructive' :
                                                            booking.status === 'completed' ? 'secondary' : 'outline'
                                                }>
                                                    {booking.status}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-4 grid gap-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Badge variant="outline">メニュー</Badge>
                                                <span className="font-medium">{booking.service?.name}</span>
                                                <span className="text-gray-500">({booking.service?.duration_minutes}分)</span>
                                            </div>
                                            {booking.options && booking.options.length > 0 && (
                                                <div className="flex items-start gap-2 text-sm ml-2">
                                                    <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">OP</Badge>
                                                    <div className="text-gray-600">
                                                        {booking.options.map((o: any) => `${o.name} (+${o.duration_minutes}分)`).join(', ')}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-sm">
                                                <Badge variant="outline">スタッフ</Badge>
                                                <span>{booking.staff?.name || '指名なし'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="h-4 w-4 text-gray-400" />
                                                <span>
                                                    {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {' - '}
                                                    {new Date(new Date(booking.start_time).getTime() + totalDuration * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    <span className="text-gray-400 ml-1">({totalDuration}分)</span>
                                                </span>
                                            </div>
                                            <div className="text-right font-bold text-lg">
                                                ¥{totalPrice.toLocaleString()}
                                            </div>
                                        </CardContent>
                                        {booking.status === 'pending' && (
                                            <CardFooter className="bg-gray-50/50 pt-2 pb-2 justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                    onClick={async () => {
                                                        if (confirm('本当に予約をキャンセルしますか？\n※予約時間の24時間前までキャンセル可能です。')) {
                                                            try {
                                                                const { cancelBookingAction } = await import('@/lib/actions/booking')
                                                                await cancelBookingAction(booking.id)
                                                                toast.success('予約をキャンセルしました')
                                                                checkUser() // Reload
                                                            } catch (e: any) {
                                                                toast.error(e.message || 'キャンセルに失敗しました')
                                                            }
                                                        }
                                                    }}
                                                >
                                                    キャンセル
                                                </Button>
                                            </CardFooter>
                                        )}
                                    </div>
                                </Card>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
