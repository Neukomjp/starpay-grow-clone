'use server'

import { customerService } from '@/lib/services/customers'
import { Customer } from '@/lib/types/customer'
import { revalidatePath } from 'next/cache'

export async function getCustomersAction(storeId: string) {
    return await customerService.getCustomers(storeId)
}

export async function getCustomerByIdAction(id: string) {
    return await customerService.getCustomerById(id)
}

export async function createCustomerAction(data: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'total_visits' | 'total_spent'>) {
    const result = await customerService.createCustomer(data)
    revalidatePath('/dashboard/customers')
    return result
}

export async function updateCustomerAction(id: string, updates: Partial<Customer>) {
    const result = await customerService.updateCustomer(id, updates)
    revalidatePath(`/dashboard/customers/${id}`)
    revalidatePath('/dashboard/customers')
    return result
}
