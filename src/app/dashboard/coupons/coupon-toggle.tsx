'use client'

import { Button } from '@/components/ui/button'
import { Power, PowerOff, Loader2 } from 'lucide-react'
import { toggleCouponStatusAction } from '@/lib/actions/coupon'
import { useState } from 'react'
import { toast } from 'sonner'

export function CouponToggle({ id: couponId, isActive: initialIsActive }: { id: string, isActive: boolean }) {
    const [loading, setLoading] = useState(false)
    const [isActive, setIsActive] = useState(initialIsActive)

    const handleToggle = async () => {
        setLoading(true)
        const newStatus = !isActive
        try {
            await toggleCouponStatusAction(couponId)
            setIsActive(newStatus)
            toast.success(newStatus ? 'クーポンを有効にしました' : 'クーポンを無効にしました')
        } catch {
            toast.error('状態の更新に失敗しました')
            // Revert the UI state if the action fails
            setIsActive(isActive)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant={isActive ? "outline" : "default"}
            size="sm"
            onClick={handleToggle}
            disabled={loading}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                isActive ? <><PowerOff className="mr-2 h-4 w-4" /> 停止する</> : <><Power className="mr-2 h-4 w-4" /> 有効にする</>
            )}
        </Button>
    )
}
