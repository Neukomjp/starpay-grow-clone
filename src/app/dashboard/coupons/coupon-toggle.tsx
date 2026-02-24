'use client'

import { Button } from '@/components/ui/button'
import { Power, PowerOff, Loader2 } from 'lucide-react'
import { toggleCouponStatusAction } from '@/lib/actions/coupon'
import { useState } from 'react'
import { toast } from 'sonner'

export function CouponToggle({ id, isActive }: { id: string, isActive: boolean }) {
    const [loading, setLoading] = useState(false)

    const handleToggle = async () => {
        setLoading(true)
        try {
            await toggleCouponStatusAction(id)
            toast.success(isActive ? 'クーポンを停止しました' : 'クーポンを有効にしました')
        } catch (error) {
            toast.error('ステータスの変更に失敗しました')
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
