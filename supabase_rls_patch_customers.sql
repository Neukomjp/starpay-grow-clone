-- Patch for Customers Table RLS
-- This ensures authenticated users (staff/owners) and public users can create customers.

-- 1. Ensure RLS is enabled
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 2. Allow public to insert customers (needed for public booking page and staff)
DROP POLICY IF EXISTS "Public can insert customers" ON customers;
CREATE POLICY "Public can insert customers" ON customers
FOR INSERT
WITH CHECK (true);

-- 3. Allow authorized users to update customers
DROP POLICY IF EXISTS "Users can update customers for their stores" ON customers;
CREATE POLICY "Users can update customers for their stores" ON customers
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = customers.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = customers.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111' -- Demo org fallback
    )
);

-- 4. Allow authorized users to delete customers
DROP POLICY IF EXISTS "Users can delete customers for their stores" ON customers;
CREATE POLICY "Users can delete customers for their stores" ON customers
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = customers.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = customers.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111' -- Demo org fallback
    )
);

-- 5. Allow authorized users to view customers
DROP POLICY IF EXISTS "Users can view customers for their stores" ON customers;
CREATE POLICY "Users can view customers for their stores" ON customers
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = customers.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = customers.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111' -- Demo org fallback
    )
);

