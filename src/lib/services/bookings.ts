import { createClient } from '@/lib/supabase/client'
import { Booking } from '@/types/booking'

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
        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : JSON.stringify(error))
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
        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : JSON.stringify(error))
        }
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async createBooking(booking: any, customClient?: any) {
        try {
            const supabase = customClient || createClient()
            
            // 1. Check for double booking
            if (booking.staff_id) {
                // Fetch current store to get buffer settings
                const { data: storeData, error: storeError } = await supabase
                    .from('stores')
                    .select('cross_store_buffers')
                    .eq('id', booking.store_id)
                    .single()
                    
                if (storeError) throw new Error(storeError.message)
                const crossStoreBuffers = storeData.cross_store_buffers || {}

                // Fetch bookings for this staff on this day across ALL stores
                const checkDateStart = new Date(booking.start_time)
                checkDateStart.setHours(0, 0, 0, 0)
                const checkDateEnd = new Date(booking.start_time)
                checkDateEnd.setHours(23, 59, 59, 999)

                const { data: existingBookings, error: fetchError } = await supabase
                    .from('bookings')
                    .select('start_time, end_time, buffer_minutes_before, buffer_minutes_after, store_id')
                    .eq('staff_id', booking.staff_id)
                    .neq('status', 'cancelled')
                    .gte('start_time', checkDateStart.toISOString())
                    .lte('start_time', checkDateEnd.toISOString())

                if (fetchError) throw new Error(fetchError.message)

                if (existingBookings && existingBookings.length > 0) {
                    const newStart = new Date(booking.start_time)
                    const newEnd = new Date(booking.end_time)
                    
                    const newEffectiveStartMin = newStart.getHours() * 60 + newStart.getMinutes() - (booking.buffer_minutes_before || 0)
                    const newEffectiveEndMin = newEnd.getHours() * 60 + newEnd.getMinutes() + (booking.buffer_minutes_after || 0)

                    const hasOverlap = existingBookings.some((b: any) => {
                        const bStart = new Date(b.start_time)
                        const bEnd = new Date(b.end_time || b.start_time) // fallback
                        
                        let extraBuffer = 0
                        if (b.store_id !== booking.store_id) {
                            // Apply travel buffer for different store
                            extraBuffer = crossStoreBuffers[b.store_id] !== undefined ? crossStoreBuffers[b.store_id] : 60
                        }
                        
                        const bEffectiveStartMin = bStart.getHours() * 60 + bStart.getMinutes() - (b.buffer_minutes_before || 0) - extraBuffer
                        const bEffectiveEndMin = bEnd.getHours() * 60 + bEnd.getMinutes() + (b.buffer_minutes_after || 0) + extraBuffer

                        // Overlap condition: (StartA < EndB) && (EndA > StartB)
                        return (newEffectiveStartMin < bEffectiveEndMin) && (newEffectiveEndMin > bEffectiveStartMin)
                    })

                    if (hasOverlap) {
                        throw new Error('指定された日時は別の予約が入ってしまいました。お手数ですが、別の日時を再度お選びください。')
                    }
                }
            }

            const { data, error } = await supabase
                .from('bookings')
                .insert([booking])
                .select()
                .single()

            if (error) throw new Error(error.message)
            return data as Booking
        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : JSON.stringify(error))
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
        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : JSON.stringify(error))
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
        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : JSON.stringify(error))
        }
    },

    async deleteBooking(id: string, serverClient?: any) {
        try {
            const supabase = serverClient || createClient()
            const { error } = await supabase
                .from('bookings')
                .delete()
                .eq('id', id)

            if (error) throw new Error(error.message)
        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : JSON.stringify(error))
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
        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : JSON.stringify(error))
        }
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                    .from('store_staff')
                    .select('staff_id')
                    .eq('store_id', storeId)

                if (staffError) throw staffError
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                staffIds = staff?.map((s: any) => s.staff_id) || []
            }

            if (staffIds.length === 0) return []

            // 2. Get shifts for this day of week
            // Vercel node.js servers run in UTC, so .getDay() returns UTC day. We must offset to JST (+9h)
            const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000)
            const dayOfWeek = jstDate.getUTCDay()
            const { data: shifts, error: shiftsError } = await supabase
                .from('staff_shifts')
                .select('*')
                .in('staff_id', staffIds)
                .eq('store_id', storeId)
                .eq('day_of_week', dayOfWeek)
                .eq('is_holiday', false)

            if (shiftsError) throw shiftsError
            
            // 2.5 Get exceptions for this day
            const year = jstDate.getUTCFullYear()
            const month = String(jstDate.getUTCMonth() + 1).padStart(2, '0')
            const day = String(jstDate.getUTCDate()).padStart(2, '0')
            const dateStr = `${year}-${month}-${day}`
            
            const { data: exceptions, error: exceptionsError } = await supabase
                .from('staff_shift_exceptions')
                .select('*')
                .in('staff_id', staffIds)
                .eq('store_id', storeId)
                .eq('date', dateStr)
                
            if (exceptionsError) throw exceptionsError

            // 3. Get existing bookings for this date and these staff
            // Assuming `date` is a Date object representing the start of the day in JST (e.g. 15:00 UTC)
            const startOfDayMs = date.getTime();
            const startOfDayStr = new Date(startOfDayMs).toISOString(); // e.g. 15:00 UTC
            const endOfDayStr = new Date(startOfDayMs + 24 * 60 * 60 * 1000 - 1).toISOString(); // e.g. 14:59:59.999 UTC next day

            const { data: bookings, error: bookingsError } = await supabase
                .from('bookings')
                .select('start_time, end_time, staff_id, status, buffer_minutes_before, buffer_minutes_after, store_id')
                .in('staff_id', staffIds)
                .gte('start_time', startOfDayStr)
                .lte('start_time', endOfDayStr)
                .neq('status', 'cancelled')

            if (bookingsError) throw bookingsError

            const crossStoreBuffers = store.cross_store_buffers || {}

            return this._calculateSlots(shifts || [], exceptions || [], bookings || [], durationMinutes, staffIds, interval, bufferBefore, bufferAfter, businessDays, date, storeId, crossStoreBuffers)

        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : JSON.stringify(error))
        }
    },

    _calculateSlots(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        shifts: any[],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        exceptions: any[],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bookings: any[],
        durationMinutes: number,
        staffIds: string[],
        interval: number,
        bufferBefore: number = 0,
        bufferAfter: number = 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        businessDays?: any[],
        targetDate?: Date,
        currentStoreId?: string,
        crossStoreBuffers?: Record<string, number>
    ) {
        const slots: string[] = []

        // Determine business hours for this day
        let openHour = 0
        let openMin = 0
        let closeHour = 24
        let closeMin = 0
        let isClosed = false

        if (businessDays && targetDate) {
            // Force JST calculation for business day matching to avoid Vercel UTC issues
            const jstTarget = new Date(targetDate.getTime() + 9 * 60 * 60 * 1000)
            const dayOfWeek = jstTarget.getUTCDay() // 0-6
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                    const staffExceptions = exceptions.filter(e => e.staff_id === sId)
                    let activeShifts = shifts.filter(sh => sh.staff_id === sId)
                    
                    if (staffExceptions.length > 0) {
                        if (staffExceptions.every(e => e.is_holiday)) return false
                        activeShifts = staffExceptions.filter(e => !e.is_holiday)
                    } else if (activeShifts.length === 0) {
                        return false
                    }

                    const isWithinShift = activeShifts.some(shift => {
                        if (!shift.start_time || !shift.end_time) return false

                        const shiftStartParts = shift.start_time.split(':')
                        const shiftEndParts = shift.end_time.split(':')
                        const shiftStartMin = parseInt(shiftStartParts[0]) * 60 + parseInt(shiftStartParts[1])
                        const shiftEndMin = parseInt(shiftEndParts[0]) * 60 + parseInt(shiftEndParts[1])

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
                        
                        return true
                    })
                    
                    if (!isWithinShift) return false

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
                            bEnd = new Date(bEnd.getTime() + 60 * 60 * 1000)
                        }

                        // Apply buffer of EXISTING booking if present
                        let extraBuffer = 0
                        if (currentStoreId && b.store_id !== currentStoreId) {
                            extraBuffer = (crossStoreBuffers && crossStoreBuffers[b.store_id] !== undefined) ? crossStoreBuffers[b.store_id] : 60
                        }

                        const bBufferBefore = (b.buffer_minutes_before || 0) + extraBuffer
                        const bBufferAfter = (b.buffer_minutes_after || 0) + extraBuffer

                        const bEffectiveStartTime = bStart.getTime() - (bBufferBefore * 60 * 1000)
                        const bEffectiveEndTime = bEnd.getTime() + (bBufferAfter * 60 * 1000)

                        // Compare using actual absolute time instead of local day minutes
                        // First construct the absolute Date object for the proposed slot
                        // targetDate is exactly midnight JST, so we can just add the milliseconds for hour and min
                        const proposedStartDateMs = targetDate!.getTime() + (hour * 60 * 60 * 1000) + (min * 60 * 1000)
                        const proposedStartDate = new Date(proposedStartDateMs)
                        const proposedEndDate = new Date(proposedStartDateMs + (durationMinutes * 60 * 1000))

                        const effectiveStartTime = proposedStartDate.getTime() - (bufferBefore * 60 * 1000)
                        const effectiveEndTime = proposedEndDate.getTime() + (bufferAfter * 60 * 1000)

                        // Overlap condition: (StartA < EndB) && (EndA > StartB)
                        return (effectiveStartTime < bEffectiveEndTime) && (effectiveEndTime > bEffectiveStartTime)
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return data as any[]
        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : JSON.stringify(error))
        }
    },

    async getBookingsByAuthUserId(authUserId: string) {
        try {
            const supabase = createClient()

            // First get all customer IDs linked to this auth_user_id
            const { data: customers, error: customerError } = await supabase
                .from('customers')
                .select('id')
                .eq('auth_user_id', authUserId)

            if (customerError) throw new Error(customerError.message)

            const customerIds = customers?.map(c => c.id) || []

            if (customerIds.length === 0) return []

            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    store:store_id(name, slug),
                    staff:staff_id(name),
                    service:service_id(name, price, duration_minutes)
                `)
                .in('customer_id', customerIds)
                .order('start_time', { ascending: false })

            if (error) throw new Error(error.message)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return data as any[]
        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : JSON.stringify(error))
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        customClient?: any
    ): Promise<Record<string, string[]>> {
        const availability: Record<string, string[]> = {}
        const promises = []

        for (let i = 0; i < days; i++) {
            // startDate is assumed to be 00:00:00 JST for the first day (e.g. 15:00:00.000Z the previous day)
            const absoluteStartMs = startDate.getTime()
            const date = new Date(absoluteStartMs + i * 24 * 60 * 60 * 1000)

            promises.push(
                this.getAvailableTimeSlots(storeId, date, durationMinutes, staffId, bufferBefore, bufferAfter, customClient)
                    .then(slots => {
                        // Force JST calculation for the dictionary key
                        // Add 9 hours to the absolute ms so UTC standard methods return JST values
                        const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000)
                        const y = jstDate.getUTCFullYear()
                        const m = (jstDate.getUTCMonth() + 1).toString().padStart(2, '0')
                        const d = jstDate.getUTCDate().toString().padStart(2, '0')
                        const key = `${y}-${m}-${d}`
                        availability[key] = slots
                    })
            )
        }

        await Promise.all(promises)
        return availability
    }
}
