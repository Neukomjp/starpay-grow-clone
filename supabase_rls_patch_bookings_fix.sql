-- ==============================================================================
-- Supabase RLS Patch - Fix Bookings Management
-- ==============================================================================
-- This patch corrects an invalid RLS policy applied earlier that referenced
-- a non-existent `organization_members` table, which caused booking deletions
-- to silently fail.

-- 1. Bookings UPDATE
DROP POLICY IF EXISTS "Users can update bookings in their stores" ON bookings;
CREATE POLICY "Users can update bookings in their stores" ON bookings
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = bookings.store_id
        AND stores.merchant_id = auth.uid()
    )
);

-- 2. Bookings DELETE
DROP POLICY IF EXISTS "Users can delete bookings in their stores" ON bookings;
CREATE POLICY "Users can delete bookings in their stores" ON bookings
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = bookings.store_id
        AND stores.merchant_id = auth.uid()
    )
);

-- Additionally, check the INSERT policy. It should already be public or checked properly.
-- From previous patches, it seems it was Public or checking something else.
