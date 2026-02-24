-- Supabase Seed Data for StarPay Grow Clone

-- Ensure the uuid-ossp extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define predictable UUIDs for testing
DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    store_1_id UUID := '22222222-2222-2222-2222-222222222221';
    store_2_id UUID := '22222222-2222-2222-2222-222222222222';
    staff_1_id UUID := '33333333-3333-3333-3333-333333333331';
    staff_2_id UUID := '33333333-3333-3333-3333-333333333332';
    service_1_id UUID := '44444444-4444-4444-4444-444444444441';
    service_2_id UUID := '44444444-4444-4444-4444-444444444442';
    customer_1_id UUID := '55555555-5555-5555-5555-555555555551';
    master_uuid UUID := '66666666-6666-6666-6666-666666666661';
    user_auth_id UUID := '00000000-0000-0000-0000-000000000000'; -- Replace with your actual auth.users UUID!
BEGIN

    -- IMPORTANT: For 'merchant_id' and 'user_id', these should ideally link to existing users in the auth.users table.
    -- If you encounter foreign key constraints failing on 'auth.users', insert a dummy user there first, or remove the foreign key constraint.

    -- 1. Organizations
    INSERT INTO organizations (id, name, slug, plan)
    VALUES (org_id, 'StarPay Demo Org', 'starpay-demo', 'pro')
    ON CONFLICT (slug) DO NOTHING;

    -- 2. Stores
    INSERT INTO stores (id, merchant_id, organization_id, name, slug, address, phone, is_published)
    VALUES 
        (store_1_id, user_auth_id, org_id, 'Demostore Tokyo', 'demo-tokyo', 'Tokyo Shibuya', '03-1234-5678', true),
        (store_2_id, user_auth_id, org_id, 'Demostore Osaka', 'demo-osaka', 'Osaka Umeda', '06-8765-4321', true)
    ON CONFLICT (slug) DO NOTHING;

    -- 3. Staff
    INSERT INTO staff (id, store_id, name, role, specialties, service_ids)
    VALUES 
        (staff_1_id, store_1_id, '鈴木 一郎', '店長', '["カット", "カラー"]'::jsonb, ('["' || service_1_id || '"]')::jsonb),
        (staff_2_id, store_1_id, '佐藤 花子', 'スタイリスト', '["パーマ"]'::jsonb, ('["' || service_2_id || '"]')::jsonb)
    ON CONFLICT (id) DO NOTHING;

    -- 4. Staff Shifts (Example: working Monday to Friday 09:00 - 18:00)
    INSERT INTO staff_shifts (staff_id, day_of_week, start_time, end_time, is_holiday)
    VALUES 
        (staff_1_id, 1, '09:00:00', '18:00:00', false),
        (staff_1_id, 2, '09:00:00', '18:00:00', false),
        (staff_1_id, 3, '09:00:00', '18:00:00', false),
        (staff_1_id, 4, '09:00:00', '18:00:00', false),
        (staff_1_id, 5, '09:00:00', '18:00:00', false),
        (staff_1_id, 0, '00:00:00', '00:00:00', true),
        (staff_1_id, 6, '00:00:00', '00:00:00', true)
    ON CONFLICT (staff_id, day_of_week) DO NOTHING;

    -- 5. Services
    INSERT INTO services (id, store_id, name, duration_minutes, price, category)
    VALUES 
        (service_1_id, store_1_id, 'スタンダードカット', 60, 5000, 'カット'),
        (service_2_id, store_1_id, 'カラー＆トリートメント', 120, 12000, 'カラー')
    ON CONFLICT (id) DO NOTHING;

    -- 6. Customers
    INSERT INTO customers (id, store_id, name, name_kana, email, phone)
    VALUES 
        (customer_1_id, store_1_id, '田中 太郎', 'タナカ タロウ', 'tanaka@demo.com', '090-0000-0000')
    ON CONFLICT (id) DO NOTHING;

    -- 7. Ticket Masters
    INSERT INTO ticket_masters (id, store_id, name, price, total_uses, valid_days)
    VALUES
        (master_uuid, store_1_id, 'カット5回券', 20000, 5, 180)
    ON CONFLICT (id) DO NOTHING;

    -- 8. Customer Tickets
    INSERT INTO customer_tickets (customer_id, ticket_master_id, name, remaining_uses, purchase_date, expires_at)
    VALUES
        (customer_1_id, master_uuid, 'カット5回券', 4, NOW(), NOW() + interval '180 days');

    -- 9. Bookings (Example Future Booking)
    INSERT INTO bookings (store_id, staff_id, service_id, customer_id, customer_name, total_price, start_time, end_time, status)
    VALUES
        (store_1_id, staff_1_id, service_1_id, customer_1_id, '田中 太郎', 5000, NOW() + interval '1 day', NOW() + interval '1 day' + interval '1 hour', 'confirmed');

END $$;
