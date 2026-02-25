-- Supabase Shift Exceptions Schema (Phase 10)

CREATE TABLE IF NOT EXISTS staff_shift_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME,             -- NULL if holiday
    end_time TIME,               -- NULL if holiday
    break_start_time TIME,
    break_end_time TIME,
    is_holiday BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(staff_id, date)
);

-- Enable RLS
ALTER TABLE staff_shift_exceptions ENABLE ROW LEVEL SECURITY;

-- 1. SELECT Policy (Public Read)
-- Anyone can view shift exceptions for published stores (similar to staff_shifts)
CREATE POLICY "Public can view staff shift exceptions" ON staff_shift_exceptions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        WHERE staff.id = staff_shift_exceptions.staff_id
        AND stores.is_published = true
    )
);

-- 2. INSERT Policy
CREATE POLICY "Users can insert staff shift exceptions for their stores" ON staff_shift_exceptions
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE staff.id = staff_shift_exceptions.staff_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        WHERE staff.id = staff_shift_exceptions.staff_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111' -- Demo org fallback
    )
);

-- 3. UPDATE Policy
CREATE POLICY "Users can update staff shift exceptions for their stores" ON staff_shift_exceptions
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE staff.id = staff_shift_exceptions.staff_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        WHERE staff.id = staff_shift_exceptions.staff_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111' -- Demo org fallback
    )
);

-- 4. DELETE Policy
CREATE POLICY "Users can delete staff shift exceptions for their stores" ON staff_shift_exceptions
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE staff.id = staff_shift_exceptions.staff_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        WHERE staff.id = staff_shift_exceptions.staff_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111' -- Demo org fallback
    )
);
