'use server'

import { couponService } from '@/lib/services/coupons'
import { Coupon } from '@/lib/types/coupon'
import { revalidatePath } from 'next/cache'

export async function getCouponsAction(storeId: string) {
    return await couponService.getCoupons(storeId)
}

export async function createCouponAction(data: Omit<Coupon, 'id' | 'created_at'>) {
    const result = await couponService.createCoupon(data)
    revalidatePath('/dashboard/coupons')
    return result
}

export async function toggleCouponStatusAction(id: string) {
    const result = await couponService.toggleCouponStatus(id)
    revalidatePath('/dashboard/coupons')
    return result
}

export async function validateCouponAction(storeId: string, code: string) {
    return await couponService.getCouponByCode(storeId, code)
}
