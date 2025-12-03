-- Add cedula_photo_url to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS cedula_photo_url TEXT;

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for kyc-documents
-- Allow users to upload their own documents
CREATE POLICY "Users can upload their own KYC documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own documents
CREATE POLICY "Users can view their own KYC documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow Super Admins to view all KYC documents
CREATE POLICY "Super Admins can view all KYC documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents' AND
  (SELECT is_super_admin FROM profiles WHERE id = auth.uid()) = TRUE
);
