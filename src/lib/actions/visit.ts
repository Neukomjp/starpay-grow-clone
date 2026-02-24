'use server'

import { visitService } from '@/lib/services/visits'
import { revalidatePath } from 'next/cache'
import { VisitRecord } from '@/lib/types/visit-record'

export async function createVisitRecordAction(record: any) {
    const result = await visitService.createVisitRecord(record)
    revalidatePath('/dashboard/customers') // Revalidate customers list/details
    // If we have a storeId param in global context we could be more specific
    return result
}

export async function getVisitRecordsAction(storeId: string, customerId: string) {
    return await visitService.getVisitRecordsAndTagsByCustomerId(storeId, customerId)
}
