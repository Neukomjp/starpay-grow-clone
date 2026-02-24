export type Staff = {
    id: string
    storeId: string
    name: string
    role: string
    bio: string
    avatarUrl?: string
    specialties: string[]
    serviceIds?: string[] // IDs of services this staff can perform
}

export type Service = {
    id: string
    name: string
    duration_minutes: number
    price: number
    category?: string
    buffer_time_before?: number // minutes
    buffer_time_after?: number // minutes
    image_url?: string
}

export type ServiceOption = {
    id: string
    service_id?: string | null // Nullable for global options
    store_id: string // New field for global scope
    name: string
    price: number
    duration_minutes: number
}
