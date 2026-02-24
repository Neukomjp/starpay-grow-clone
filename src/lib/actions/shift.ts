'use server'

import { shiftService } from '@/lib/services/shifts'
import { Shift } from '@/lib/types/shift'
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
