'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { canViewPayments } from '@/lib/rbac'
import { organizationService } from '@/lib/services/organizations'

export type DashboardSalesSummary = {
    todaySales: number
    transactionCount: number
    averageTicket: number
}

export type RecentTransaction = {
    id: string
    date: string
    amount: number
    method: string
    status: 'Success' | 'Failed'
}

export async function getDashboardSalesSummaryAction(storeId: string): Promise<DashboardSalesSummary> {
    try {
        const supabase = await createClient()

        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

        const { data, error } = await supabase
            .from('bookings')
            .select('total_price')
            .eq('store_id', storeId)
            .gte('start_time', startOfDay)
            .neq('status', 'cancelled')

        if (error) {
            console.error('getDashboardSalesSummaryAction Error:', error)
            return { todaySales: 0, transactionCount: 0, averageTicket: 0 }
        }

        const todaySales = data?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0
        const transactionCount = data?.length || 0
        const averageTicket = transactionCount > 0 ? todaySales / transactionCount : 0

        return {
            todaySales,
            transactionCount,
            averageTicket: Math.round(averageTicket)
        }
    } catch (error) {
        console.error('getDashboardSalesSummaryAction Exception:', error)
        return { todaySales: 0, transactionCount: 0, averageTicket: 0 }
    }
}

export async function getRecentTransactionsAction(storeId: string): Promise<RecentTransaction[]> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('bookings')
            .select('id, start_time, total_price, payment_method, status')
            .eq('store_id', storeId)
            .neq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(10)

        if (error) {
            console.error('getRecentTransactionsAction Error:', error)
            return []
        }

        return data?.map((b) => ({
            id: b.id,
            // Format to YYYY-MM-DD HH:mm without external libs for simplicity, or just local string
            date: new Date(b.start_time).toLocaleString('ja-JP', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
            }),
            amount: b.total_price || 0,
            method: b.payment_method === 'card' ? 'クレジットカード (Stripe)' : (b.payment_method === 'paypay' ? 'PayPay' : '現地決済'),
            status: b.status === 'cancelled' ? 'Failed' : 'Success'
        })) || []
    } catch (error) {
        console.error('getRecentTransactionsAction Exception:', error)
        return []
    }
}
