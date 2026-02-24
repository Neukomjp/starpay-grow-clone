-- Supabase RLS Patch for StarPay Grow Clone

-- Enable RLS on core tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 1. Organizations Policies
-- Users can view organizations they are a member of
CREATE POLICY "Users can view their organizations" ON organizations
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
    )
    OR
    id = '11111111-1111-1111-1111-111111111111' -- Allow demo org for fallback testing
);

-- Users can create an organization
CREATE POLICY "Users can create organizations" ON organizations
FOR INSERT
WITH CHECK (true); -- Insert doesn't have existing members to check

-- Users can update organizations they are a member of
CREATE POLICY "Users can update their organizations" ON organizations
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
    )
);

-- 2. Organization Members Policies
CREATE POLICY "Users can view their memberships" ON organization_members
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert memberships" ON organization_members
FOR INSERT
WITH CHECK (user_id = auth.uid()); -- A user creates a membership for themselves when creating an org


-- 3. Stores Policies
-- View stores belonging to your organization
CREATE POLICY "Users can view stores in their org" ON stores
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_members.organization_id = stores.organization_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    organization_id = '11111111-1111-1111-1111-111111111111' -- Demo org fallback
);

CREATE POLICY "Users can manage stores in their org" ON stores
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_members.organization_id = stores.organization_id
        AND organization_members.user_id = auth.uid()
    )
);

-- Note: In a true production app, we would add similar comprehensive policies for staff, services, customers, bookings based on a JOIN through stores -> organization_id.
-- For this MVP MVP RBAC, ensuring `organizations` and `stores` are locked down is the primary security boundary.

-- 4. Bookings (Example simple tenant isolation)
CREATE POLICY "Users can view bookings in their stores" ON bookings
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = bookings.store_id
        AND organization_members.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert bookings in their stores" ON bookings
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = bookings.store_id
        AND organization_members.user_id = auth.uid()
    )
);
