BEGIN;

-- Drop existing policies to be safe (handling potential name variations)
DROP POLICY IF EXISTS "Users can upload their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Super Admins can view all KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own KYC documents" ON storage.objects;

-- Re-create policies using a more direct path check
-- INSERT
CREATE POLICY "Users can upload their own KYC documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  name LIKE auth.uid() || '/%'
);

-- UPDATE
CREATE POLICY "Users can update their own KYC documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'kyc-documents' AND
  name LIKE auth.uid() || '/%'
);

-- DELETE
CREATE POLICY "Users can delete their own KYC documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'kyc-documents' AND
  name LIKE auth.uid() || '/%'
);

-- SELECT
CREATE POLICY "Users can view their own KYC documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents' AND
  name LIKE auth.uid() || '/%'
);

-- Super Admin SELECT
CREATE POLICY "Super Admins can view all KYC documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents' AND
  (SELECT is_super_admin FROM profiles WHERE id = auth.uid()) = TRUE
);

COMMIT;
