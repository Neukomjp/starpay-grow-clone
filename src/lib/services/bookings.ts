import { createClient } from '@/lib/supabase/client'

export type Booking = {
    id: string
    store_id: string
    staff_id: string | null
    service_id: string | null
    customer_id: string | null
    customer_name: string
    options?: { name: string, price: number, duration_minutes: number }[]
    total_price: number
    payment_status: 'unpaid' | 'paid' | 'refunded'
    payment_method: 'local' | 'card' | 'paypay' | null
    start_time: string
    end_time: string
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
    buffer_minutes_before?: number
    buffer_minutes_after?: number
}

export const bookingService = {
    async getBookingsByDateRange(storeId: string, startDate: string, endDate: string) {
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    staff:staff_id(name),
                    service:service_id(name, duration_minutes, price)
                `)
                .eq('store_id', storeId)
                .gte('start_time', startDate)
                .lte('start_time', endDate)
                .order('start_time', { ascending: true })

            if (error) throw new Error(error.message)
            return data
        } catch (error: any) {
            throw new Error(error.message || JSON.stringify(error))
        }
    },

    async getBookingsByStoreId(storeId: string) {
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('bookings')
                .select(`
            *,
            staff:staff_id(name),
            service:service_id(name)
          `)
                .eq('store_id', storeId)
                .order('start_time', { ascending: true })

            if (error) throw new Error(error.message)
            return data
        } catch (error: any) {
            throw new Error(error.message || JSON.stringify(error))
        }
    },

    async createBooking(booking: Omit<Booking, 'id' | 'status'>, customClient?: any) {
        try {
            const supabase = customClient || createClient()
            const { data, error } = await supabase
                .from('bookings')
                .insert([booking])
                .select()
                .single()

            if (error) throw new Error(error.message)
            return data as Booking
        } catch (error: any) {
            throw new Error(error.message || JSON.stringify(error))
        }
    },

    async updateStatus(id: string, status: Booking['status']) {
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('bookings')
                .update({ status })
                .eq('id', id)

            if (error) throw new Error(error.message)
        } catch (error: any) {
            throw new Error(error.message || JSON.stringify(error))
        }
    },

    async updateBooking(id: string, updates: Partial<Booking>) {
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('bookings')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw new Error(error.message)
            return data as Booking
        } catch (error: any) {
            throw new Error(error.message || JSON.stringify(error))
        }
    },

    async deleteBooking(id: string) {
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('bookings')
                .delete()
                .eq('id', id)

            if (error) throw new Error(error.message)
        } catch (error: any) {
            throw new Error(error.message || JSON.stringify(error))
        }
    },

    async getBookingById(id: string) {
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw new Error(error.message)
            return data as Booking
        } catch (error: any) {
            throw new Error(error.message || JSON.stringify(error))
        }
    },

    async getAvailableTimeSlots(storeId: string, date: Date, durationMinutes: number, staffId?: string, bufferBefore: number = 0, bufferAfter: number = 0, customClient?: any): Promise<string[]> {
        try {
            const supabase = customClient || createClient()

            // 0. Get store settings for interval
            // We need to import storeService to get the config. 
            // To avoid circular deps if any, we keep it simple or assume we can import it.
            // But storeService is in another file, should be fine.
            const { storeService } = await import('./stores')
            const store = await storeService.getStoreById(storeId)
            const interval = store.booking_interval_minutes || 30
            const businessDays = store.business_days

            // 1. Get relevant staff
            let staffIds: string[] = []
            if (staffId && staffId !== 'no-preference') {
                staffIds = [staffId]
            } else {
                const { data: staff, error: staffError } = await supabase
                    .from('staff')
                    .select('id')
                    .eq('store_id', storeId)

                if (staffError) throw staffError
                staffIds = staff?.map((s: any) => s.id) || []
            }

            if (staffIds.length === 0) return []

            // 2. Get shifts for this day of week
            const dayOfWeek = date.getDay()
            const { data: shifts, error: shiftsError } = await supabase
                .from('staff_shifts')
                .select('*')
                .in('staff_id', staffIds)
                .eq('day_of_week', dayOfWeek)
                .eq('is_holiday', false)

            if (shiftsError) throw shiftsError

            if (!shifts || shifts.length === 0) return []

            // 3. Get existing bookings for this date and these staff
            const startOfDay = new Date(date)
            startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date(date)
            endOfDay.setHours(23, 59, 59, 999)

            const { data: bookings, error: bookingsError } = await supabase
                .from('bookings')
                .select('start_time, end_time, staff_id, status, buffer_minutes_before, buffer_minutes_after')
                .in('staff_id', staffIds)
                .gte('start_time', startOfDay.toISOString())
                .lte('start_time', endOfDay.toISOString())
                .neq('status', 'cancelled')

            if (bookingsError) throw bookingsError

            return this._calculateSlots(shifts, bookings, durationMinutes, staffIds, interval, bufferBefore, bufferAfter, businessDays, date)

        } catch (error: any) {
            throw new Error(error.message || JSON.stringify(error))
        }
    },

    // Extracted for potential reuse/testing, though simple mock bypasses it
    _calculateSlots(
        shifts: any[],
        bookings: any[],
        durationMinutes: number,
        staffIds: string[],
        interval: number,
        bufferBefore: number = 0,
        bufferAfter: number = 0,
        businessDays?: any[],
        // We need the date to know which day of week applies, but date is not passed to _calculateSlots currently?
        // Ah, loops 0-24h, so it's day-agnostic unless we know the day config.
        // We'll pass the target date.
        targetDate?: Date
    ) {
        const slots: string[] = []

        // Determine business hours for this day
        let openHour = 0
        let openMin = 0
        let closeHour = 24
        let closeMin = 0
        let isClosed = false

        if (businessDays && targetDate) {
            const dayOfWeek = targetDate.getDay() // 0-6
            const config = businessDays.find((d: any) => d.day_of_week === dayOfWeek)
            if (config) {
                if (config.is_closed) {
                    isClosed = true
                } else {
                    const [sh, sm] = config.start_time.split(':').map(Number)
                    const [eh, em] = config.end_time.split(':').map(Number)
                    openHour = sh
                    openMin = sm
                    closeHour = eh
                    closeMin = em
                }
            }
        } else if (!businessDays) {
            // Fallback default if not set? Or assume 24h?
            // Let's assume standard 9-19 if nothing set for now to avoid breaking existing logic too much,
            // OR default to 0-24 if shifts control it?
            // Previous behavior was controlled by shifts ONLY (0-24 loop).
            // But let's keep it wide open (0-24) if no business settings, and let shifts dictate.
            openHour = 0
            closeHour = 24
        }

        if (isClosed) return []

        // Convert open/close to minutes
        const businessOpenMin = openHour * 60 + openMin
        const businessCloseMin = closeHour * 60 + closeMin

        for (let hour = 0; hour < 24; hour++) {
            for (let min = 0; min < 60; min += interval) {
                // Optimization: Skip loop steps outside global range
                // But we need to calculate strict minutes.

                const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`

                const proposedStartMin = hour * 60 + min
                const proposedEndMin = proposedStartMin + durationMinutes

                // CHECK STORE HOURS
                if (proposedStartMin < businessOpenMin || proposedEndMin > businessCloseMin) {
                    continue
                }

                // Effective blocked range for NEW booking
                const effectiveStartMin = proposedStartMin - bufferBefore
                const effectiveEndMin = proposedEndMin + bufferAfter

                // Check if any staff is available for this slot
                const isSlotAvailable = staffIds.some(sId => {
                    // Check shift
                    const shift = shifts.find(sh => sh.staff_id === sId)
                    if (!shift) return false

                    const shiftStartParts = shift.start_time.split(':')
                    const shiftEndParts = shift.end_time.split(':')
                    const shiftStartMin = parseInt(shiftStartParts[0]) * 60 + parseInt(shiftStartParts[1])
                    const shiftEndMin = parseInt(shiftEndParts[0]) * 60 + parseInt(shiftEndParts[1])

                    // Shift check: Service must happen within shift?
                    // Typically buffers can be outside shift (polishing/prep), but usually staff must be there.
                    // Let's assume strict shift adherence: effective range must be within shift.
                    if (effectiveStartMin < shiftStartMin || effectiveEndMin > shiftEndMin) return false

                    // Check break time
                    if (shift.break_start_time && shift.break_end_time) {
                        const breakStartParts = shift.break_start_time.split(':')
                        const breakEndParts = shift.break_end_time.split(':')
                        const breakStartMin = parseInt(breakStartParts[0]) * 60 + parseInt(breakStartParts[1])
                        const breakEndMin = parseInt(breakEndParts[0]) * 60 + parseInt(breakEndParts[1])

                        // If effective slot overlaps with break: (StartA < EndB) && (EndA > StartB)
                        if (effectiveStartMin < breakEndMin && effectiveEndMin > breakStartMin) return false
                    }

                    // Check existing bookings overlap
                    const hasOverlap = bookings?.some(b => {
                        if (b.staff_id !== sId) return false
                        const bStart = new Date(b.start_time)

                        // Handle potential missing end_time in legacy data by assuming 60 mins
                        let bEnd: Date
                        if (b.end_time) {
                            bEnd = new Date(b.end_time)
                        } else {
                            bEnd = new Date(b.start_time)
                            bEnd.setMinutes(bEnd.getMinutes() + 60)
                        }

                        let bStartMin = bStart.getHours() * 60 + bStart.getMinutes()
                        let bEndMin = bEnd.getHours() * 60 + bEnd.getMinutes()

                        // Apply buffer of EXISTING booking if present
                        const bBufferBefore = b.buffer_minutes_before || 0
                        const bBufferAfter = b.buffer_minutes_after || 0

                        const bEffectiveStartMin = bStartMin - bBufferBefore
                        const bEffectiveEndMin = bEndMin + bBufferAfter

                        // Overlap: (StartA < EndB) && (EndA > StartB)
                        return (effectiveStartMin < bEffectiveEndMin) && (effectiveEndMin > bEffectiveStartMin)
                    })

                    return !hasOverlap
                })

                if (isSlotAvailable) {
                    slots.push(timeString)
                }
            }
        }
        return slots
    },

    async getBookingsByCustomerId(customerId: string) {
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    store:store_id(name, slug),
                    staff:staff_id(name),
                    service:service_id(name, price, duration_minutes)
                `)
                .eq('customer_id', customerId)
                .order('start_time', { ascending: false })

            if (error) throw new Error(error.message)
            return data as any[]
        } catch (error: any) {
            throw new Error(error.message || JSON.stringify(error))
        }
    },

    async getWeeklyAvailability(
        storeId: string,
        startDate: Date,
        durationMinutes: number = 30,
        staffId?: string,
        bufferBefore: number = 0,
        bufferAfter: number = 0,
        days: number = 7,
        customClient?: any
    ): Promise<Record<string, string[]>> {
        const availability: Record<string, string[]> = {}
        const promises = []

        for (let i = 0; i < days; i++) {
            const date = new Date(startDate)
            date.setDate(date.getDate() + i)

            promises.push(
                this.getAvailableTimeSlots(storeId, date, durationMinutes, staffId, bufferBefore, bufferAfter, customClient)
                    .then(slots => {
                        // normalize dateStr to YYYY-MM-DD for easier key usage
                        const y = date.getFullYear()
                        const m = (date.getMonth() + 1).toString().padStart(2, '0')
                        const d = date.getDate().toString().padStart(2, '0')
                        const key = `${y}-${m}-${d}`
                        availability[key] = slots
                    })
            )
        }

        await Promise.all(promises)
        return availability
    }
}
