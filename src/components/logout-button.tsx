'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useState } from 'react'

export function LogoutButton() {
    const router = useRouter()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const handleLogout = async () => {
        setIsLoggingOut(true)
        const supabase = createClient()
        const { error } = await supabase.auth.signOut()

        if (error) {
            toast.error(error.message)
            setIsLoggingOut(false)
            return
        }

        // Clear any leftover demo session cookies manually just in case
        document.cookie = 'demo-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        document.cookie = 'demo-user-email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        document.cookie = 'organization-id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        document.cookie = 'store-id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

        router.push('/login')
        router.refresh()
    }

    return (
        <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
            disabled={isLoggingOut}
        >
            <LogOut className="mr-3 h-5 w-5" />
            {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
        </Button>
    )
}
