-- Supabase Storage Patch for Image Uploads (Phase 9)

-- 1. Create the 'store_assets' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('store_assets', 'store_assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies on this bucket just in case (optional, for idempotency)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;

-- 3. Create RLS Policies for the storage.objects table

-- Allow public read access to all objects in the bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'store_assets' );

-- Allow authenticated users to upload new objects
CREATE POLICY "Authenticated Users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'store_assets' );

-- Allow authenticated users to update objects (if needed)
CREATE POLICY "Users can update their own uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'store_assets' );

-- Allow authenticated users to delete objects
CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'store_assets' );
