-- ==============================================================================
-- Supabase RLS Patch V5 - Bookings Management
-- ==============================================================================
-- This patch adds UPDATE and DELETE privileges for bookings so that
-- organization members (store owners/staff) can manage booking statuses.

-- 1. Bookings UPDATE
DROP POLICY IF EXISTS "Users can update bookings in their stores" ON bookings;
CREATE POLICY "Users can update bookings in their stores" ON bookings
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = bookings.store_id
        AND organization_members.user_id = auth.uid()
    )
);

-- 2. Bookings DELETE
DROP POLICY IF EXISTS "Users can delete bookings in their stores" ON bookings;
CREATE POLICY "Users can delete bookings in their stores" ON bookings
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = bookings.store_id
        AND organization_members.user_id = auth.uid()
    )
);
