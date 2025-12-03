BEGIN;

-- Drop existing policies
DROP POLICY IF EXISTS "kyc_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "kyc_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "kyc_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "kyc_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "kyc_admin_select_policy" ON storage.objects;

-- Also drop the old ones just in case
DROP POLICY IF EXISTS "Users can upload their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Super Admins can view all KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own KYC documents" ON storage.objects;

-- Create a SIMPLE policy for debugging
-- Allow ANY authenticated user to insert/update/select in this bucket
-- We will refine this later once it works

CREATE POLICY "Allow authenticated uploads simple"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated updates simple"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'kyc-documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated selects simple"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents' AND
  auth.role() = 'authenticated'
);

COMMIT;
