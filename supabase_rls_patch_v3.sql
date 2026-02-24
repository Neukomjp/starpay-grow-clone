-- Supabase RLS Patch V3 (Phase 5) - Menu & Services Management
-- This patch grants store owners and authorized staff the ability to manage services and service_options.

-- Note: SELECT policies for public access are already handled in v2.
-- We are now adding INSERT, UPDATE, and DELETE policies based on organization membership.

-- 1. Services Policies (Manage)
-- Users can insert services if they belong to the store's organization
CREATE POLICY "Users can insert services for their stores" ON services
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = services.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = services.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111' -- Demo org fallback
    )
);

-- Users can update services if they belong to the store's organization
CREATE POLICY "Users can update services for their stores" ON services
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = services.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = services.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111' -- Demo org fallback
    )
);

-- Users can delete services if they belong to the store's organization
CREATE POLICY "Users can delete services for their stores" ON services
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = services.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = services.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111' -- Demo org fallback
    )
);


-- 2. Service Options Policies (Manage)
-- Users can insert service options if they belong to the store's organization
CREATE POLICY "Users can insert service options for their stores" ON service_options
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = service_options.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = service_options.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111' -- Demo org fallback
    )
);

-- Users can update service options if they belong to the store's organization
CREATE POLICY "Users can update service options for their stores" ON service_options
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = service_options.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = service_options.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111' -- Demo org fallback
    )
);

-- Users can delete service options if they belong to the store's organization
CREATE POLICY "Users can delete service options for their stores" ON service_options
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = service_options.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = service_options.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111' -- Demo org fallback
    )
);
