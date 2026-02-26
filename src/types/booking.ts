export interface BookingOption {
    name: string;
    price: number;
    duration_minutes: number;
}

export interface Booking {
    id: string;
    store_id: string;
    staff_id: string | null;
    service_id: string | null;
    customer_id: string | null;
    customer_name: string;
    options?: BookingOption[];
    total_price: number;
    payment_status: 'unpaid' | 'paid' | 'refunded';
    payment_method: 'local' | 'card' | 'paypay' | null;
    start_time: string;
    end_time: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    buffer_minutes_before?: number;
    buffer_minutes_after?: number;

    // Joined relations (optional since they come from Supabase joins)
    staff?: { name: string };
    service?: { name: string; duration_minutes: number; price: number };
    store?: { name: string; slug: string };
}
