export type Shift = {
    id: string
    store_id: string // Identifies which store the shift is for
    staff_id: string
    day_of_week: number // 0-6
    start_time: string // HH:mm:ss
    end_time: string // HH:mm:ss
    break_start_time?: string | null // HH:mm:ss
    break_end_time?: string | null // HH:mm:ss
    is_holiday: boolean
}

export type ShiftException = {
    id: string
    store_id: string
    staff_id: string
    date: string // YYYY-MM-DD
    start_time?: string | null // HH:mm:ss
    end_time?: string | null // HH:mm:ss
    break_start_time?: string | null // HH:mm:ss
    break_end_time?: string | null // HH:mm:ss
    is_holiday: boolean
}

