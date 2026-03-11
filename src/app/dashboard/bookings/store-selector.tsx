'use client'

import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface StoreSelectorProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stores: any[]
    currentStoreId: string
}

export function StoreSelector({ stores, currentStoreId }: StoreSelectorProps) {
    const router = useRouter()

    if (stores.length <= 1) return null

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">対象店舗:</span>
            <Select 
                value={currentStoreId} 
                onValueChange={(val) => {
                    router.push(`/dashboard/bookings?store=${val}`)
                }}
            >
                <SelectTrigger className="w-[200px] bg-white">
                    <SelectValue placeholder="店舗を選択" />
                </SelectTrigger>
                <SelectContent>
                    {stores.map(store => (
                        <SelectItem key={store.id} value={store.id}>
                            {store.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
