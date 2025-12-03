BEGIN;

-- Enable the pg_net extension if not enabled (standard for Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure the bucket exists and is private
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Drop ALL existing policies for this bucket to ensure a clean slate
DROP POLICY IF EXISTS "Users can upload their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Super Admins can view all KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 2" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 3" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 4" ON storage.objects;

-- Create comprehensive policies using the standard storage.foldername() approach
-- This is the most reliable way to check folder ownership in Supabase Storage

-- 1. INSERT: Allow upload if the root folder name matches the user's ID
CREATE POLICY "kyc_insert_policy"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. UPDATE: Allow update if the root folder name matches the user's ID
CREATE POLICY "kyc_update_policy"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. DELETE: Allow delete if the root folder name matches the user's ID
CREATE POLICY "kyc_delete_policy"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. SELECT: Allow select if the root folder name matches the user's ID
CREATE POLICY "kyc_select_policy"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. ADMIN: Allow Super Admins to view everything
CREATE POLICY "kyc_admin_select_policy"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

COMMIT;
