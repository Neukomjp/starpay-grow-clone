import { createClient } from '@/lib/supabase/client'

export type SalesSummary = {
    totalSales: number
    totalBookings: number
    salesGrowth: number // Percentage vs last period
    bookingsGrowth: number // Percentage vs last period
}

export type MonthlySales = {
    month: string // YYYY-MM
    sales: number
    bookings: number
}

export const salesService = {
    async getSalesSummary(storeId: string): Promise<SalesSummary> {
        const supabase = createClient()
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString()

        // Fetch current month bookings
        const { data: currentMonthData, error: currentError } = await supabase
            .from('bookings')
            .select('total_price, id')
            .eq('store_id', storeId)
            .gte('start_time', startOfMonth)
            .neq('status', 'cancelled')

        if (currentError) throw currentError

        // Fetch last month bookings for growth calc
        const { data: lastMonthData, error: lastError } = await supabase
            .from('bookings')
            .select('total_price, id')
            .eq('store_id', storeId)
            .gte('start_time', startOfLastMonth)
            .lte('start_time', endOfLastMonth)
            .neq('status', 'cancelled')

        if (lastError) throw lastError

        const currentSales = currentMonthData?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0
        const currentBookings = currentMonthData?.length || 0

        const lastSales = lastMonthData?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0
        const lastBookings = lastMonthData?.length || 0

        // Calculate growth
        const salesGrowth = lastSales === 0 ? 100 : ((currentSales - lastSales) / lastSales) * 100
        const bookingsGrowth = lastBookings === 0 ? 100 : ((currentBookings - lastBookings) / lastBookings) * 100

        return {
            totalSales: currentSales,
            totalBookings: currentBookings,
            salesGrowth: Math.round(salesGrowth * 10) / 10,
            bookingsGrowth: Math.round(bookingsGrowth * 10) / 10
        }
    },

    async getMonthlySales(storeId: string): Promise<MonthlySales[]> {
        // In a real app, uses database aggregation or RPC
        // For now, fetch last 6 months raw and aggregate in JS
        const supabase = createClient()
        const now = new Date()
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()

        const { data, error } = await supabase
            .from('bookings')
            .select('start_time, total_price')
            .eq('store_id', storeId)
            .gte('start_time', sixMonthsAgo)
            .neq('status', 'cancelled')
            .order('start_time', { ascending: true })

        if (error) throw new Error(error.message)

        const aggregation: Record<string, MonthlySales> = {}

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`
            aggregation[key] = { month: key, sales: 0, bookings: 0 }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data?.forEach((b: any) => {
            const date = new Date(b.start_time)
            const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
            if (aggregation[key]) {
                aggregation[key].sales += (b.total_price || 0)
                aggregation[key].bookings += 1
            }
        })

        return Object.values(aggregation)
    }
}
