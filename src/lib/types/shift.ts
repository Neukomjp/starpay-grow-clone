export type Shift = {
    id: string
    staff_id: string
    day_of_week: number // 0-6
    start_time: string // HH:mm:ss
    end_time: string // HH:mm:ss
    break_start_time?: string | null // HH:mm:ss
    break_end_time?: string | null // HH:mm:ss
    is_holiday: boolean
}
