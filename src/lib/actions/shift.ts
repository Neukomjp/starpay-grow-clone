'use server'

import { shiftService } from '@/lib/services/shifts'
import { Shift, ShiftException } from '@/lib/types/shift'
import { revalidatePath } from 'next/cache'

export async function getShiftsByStaffIdAction(staffId: string) {
    return await shiftService.getShiftsByStaffId(staffId)
}

export async function getShiftsByStoreIdAction(storeId: string) {
    return await shiftService.getShiftsByStoreId(storeId)
}

export async function upsertShiftAction(shiftConfig: Omit<Shift, 'id'>) {
    const result = await shiftService.upsertShift(shiftConfig)
    revalidatePath('/dashboard/stores/[id]')
    return result
}

// --- Shift Exceptions ---

export async function getShiftExceptionsByStoreIdAction(storeId: string, startDate?: string, endDate?: string) {
    return await shiftService.getShiftExceptionsByStoreId(storeId, startDate, endDate)
}

export async function upsertShiftExceptionAction(exceptionConfig: Omit<ShiftException, 'id'>) {
    const result = await shiftService.upsertShiftException(exceptionConfig)
    // Note: Revalidation occurs for dynamic paths, usually dashboard route is enough or the layout handles it
    revalidatePath('/dashboard/stores/[id]')
    return result
}

export async function deleteShiftExceptionAction(staffId: string, date: string) {
    const result = await shiftService.deleteShiftException(staffId, date)
    revalidatePath('/dashboard/stores/[id]')
    return result
}
