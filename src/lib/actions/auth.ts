'use server'

import { cookies } from 'next/headers'
import { customerService } from '@/lib/services/customers'
import { revalidatePath } from 'next/cache'

export async function loginCustomerAction(email: string) {
    const customer = await customerService.getCustomerByEmail(email)

    if (!customer) {
        return { success: false, message: 'Customer not found' }
    }

    const cookieStore = await cookies()
    cookieStore.set('customer-session-email', email, {
        path: '/',
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    return { success: true, customer }
}

export async function logoutCustomerAction() {
    const cookieStore = await cookies()
    cookieStore.delete('customer-session-email')
    return { success: true }
}

export async function getCurrentCustomerAction() {
    const cookieStore = await cookies()
    const email = cookieStore.get('customer-session-email')?.value

    if (!email) {
        return null
    }

    const customer = await customerService.getCustomerByEmail(email)
    return customer
}
