import { createClient } from '@/lib/supabase/client'
import { Coupon } from '@/lib/types/coupon'

export const couponService = {
    async getCoupons(storeId: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false })

        if (error) throw new Error(error.message)
        return data as Coupon[]
    },

    async getCouponByCode(storeId: string, code: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('store_id', storeId)
            .eq('code', code)
            .eq('is_active', true)
            .single()

        if (error) throw new Error(error.message)
        return data as Coupon
    },

    async createCoupon(coupon: Omit<Coupon, 'id' | 'created_at'>) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('coupons')
            .insert([coupon])
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as Coupon
    },

    async toggleCouponStatus(id: string) {
        const supabase = createClient()
        // First get current status
        const { data: coupon, error: fetchError } = await supabase
            .from('coupons')
            .select('is_active')
            .eq('id', id)
            .single()

        if (fetchError) throw fetchError

        const { data, error } = await supabase
            .from('coupons')
            .update({ is_active: !coupon.is_active })
            .eq('id', id)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as Coupon
    }
}
