-- Add KYC fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS cedula TEXT;

-- Add approval status to stores
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending'; -- 'pending', 'approved', 'rejected'

-- Update existing stores to approved (optional, to avoid breaking existing users)
UPDATE stores SET approval_status = 'approved' WHERE approval_status = 'pending';

-- RLS Policy: Only approved stores can insert products (optional enforcement)
-- This is tricky because the user inserts, not the store directly in RLS context usually.
-- But we can check the store's status.
-- Assuming products has store_id.

CREATE POLICY "Users can only insert products if store is approved"
ON products
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE id = products.store_id 
    AND approval_status = 'approved'
    AND owner_id = auth.uid()
  )
);
