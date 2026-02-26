'use server'

import { createClient } from '@/lib/supabase/server'
import { customerService } from '@/lib/services/customers'
import { revalidatePath } from 'next/cache'

export async function loginCustomerAction(email: string, password?: string) {
    const supabase = await createClient()

    // Assuming we use Supabase Auth for customers
    if (!password) {
        return { success: false, message: 'Password is required' }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { success: false, message: error.message }
    }

    revalidatePath('/', 'layout')

    return { success: true }
}

export async function logoutCustomerAction() {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    revalidatePath('/', 'layout')

    if (error) {
        return { success: false, message: error.message }
    }
    return { success: true }
}

export async function getCurrentCustomerAction() {
    const supabase = await createClient()

    // Get currently logged-in user from Supabase
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    // Return the global auth user for the mypage and other global areas
    return user
}
