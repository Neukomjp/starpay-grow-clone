-- Supabase RLS Patch V7 - Fix Store Creation (Insert Policy)

-- By default, FOR ALL policy uses the USING clause for both read permissions and insert checks.
-- However, "auth.uid()" might be checking the user correctly, but an explicit WITH CHECK
-- on the demo organization is sometimes clearer, OR the issue is the merchant_id matching.
-- Let's make a dedicated INSERT policy for stores to be safe.

DROP POLICY IF EXISTS "Users can insert stores in their org" ON stores;

CREATE POLICY "Users can insert stores in their org" ON stores
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_members.organization_id = stores.organization_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    organization_id = '11111111-1111-1111-1111-111111111111'
);

-- Additionally, check if we need to let the merchant_id match auth.uid():
-- In stores.ts we insert `merchant_id: user.id`. This is fine.
