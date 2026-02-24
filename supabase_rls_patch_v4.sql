-- Supabase RLS Patch V4 (Phase 6) - Staff & Shift Management
-- This patch grants store owners and authorized staff the ability to manage staff and staff_shifts.

-- 1. Staff Policies (Manage)
-- Users can insert staff if they belong to the store's organization
CREATE POLICY "Users can insert staff for their stores" ON staff
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = staff.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = staff.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111' -- Demo org fallback
    )
);

-- Users can update staff if they belong to the store's organization
CREATE POLICY "Users can update staff for their stores" ON staff
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = staff.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = staff.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111' -- Demo org fallback
    )
);

-- Users can delete staff if they belong to the store's organization
CREATE POLICY "Users can delete staff for their stores" ON staff
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = staff.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = staff.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111' -- Demo org fallback
    )
);


-- 2. Staff Shifts Policies (Manage)
-- Users can insert staff shifts if they belong to the store's organization that the staff belongs to
CREATE POLICY "Users can insert staff shifts for their stores" ON staff_shifts
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE staff.id = staff_shifts.staff_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        WHERE staff.id = staff_shifts.staff_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111' -- Demo org fallback
    )
);

-- Users can update staff shifts if they belong to the store's organization that the staff belongs to
CREATE POLICY "Users can update staff shifts for their stores" ON staff_shifts
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE staff.id = staff_shifts.staff_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        WHERE staff.id = staff_shifts.staff_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111' -- Demo org fallback
    )
);

-- Users can delete staff shifts if they belong to the store's organization that the staff belongs to
CREATE POLICY "Users can delete staff shifts for their stores" ON staff_shifts
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE staff.id = staff_shifts.staff_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        WHERE staff.id = staff_shifts.staff_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111' -- Demo org fallback
    )
);
