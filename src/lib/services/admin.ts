import { createClient } from '@/lib/supabase/client'
import { Organization } from '@/lib/types/organization'

export const adminService = {
    async getAllOrganizations() {
        const supabase = createClient()

        // Real Supabase implementation
        // This will likely fail with current RLS policies for a normal client unless it's an admin user.
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Admin Fetch Error:', error)
            return []
        }
        return data as Organization[]
    },

    async getSystemStats() {
        const orgs = await this.getAllOrganizations()
        const users = await this.getAllUsers()
        // In real app, we would count users, bookings etc via count queries
        return {
            totalOrganizations: orgs.length,
            totalUsers: users.length,
            totalBookings: 0 // Placeholder
        }
    },

    async getAllUsers() {
        // Real Supabase implementation
        // Accessing auth.users is admin only and usually needs service role key.
        // Here we might query a public profiles table if it exists.
        return [] // Placeholder for real env if no profiles table
    }
}
