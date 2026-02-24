-- Supabase RLS Patch V6 - Fix Stores Update Policy for Demo Org

-- The existing "Users can manage stores in their org" policy doesn't have a fallback
-- for the demo organization, meaning seeded demo stores cannot be updated by demo users
-- unless they are explicitly in the organization_members table.

DROP POLICY IF EXISTS "Users can manage stores in their org" ON stores;

CREATE POLICY "Users can manage stores in their org" ON stores
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_members.organization_id = stores.organization_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    organization_id = '11111111-1111-1111-1111-111111111111'
);
