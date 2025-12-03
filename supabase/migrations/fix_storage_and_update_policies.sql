-- Ensure products bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for products bucket
-- Allow authenticated users to upload (for store logos and products)
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products' AND
  auth.role() = 'authenticated'
);

-- Allow users to update their own images
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'products' AND
  auth.uid()::text = (storage.foldername(name))[1] -- Assuming folder structure user_id/... or just ownership check
);
-- Note: The above update policy is tricky if we don't enforce folder structure. 
-- For now, let's just allow insert. Updates usually involve deleting and re-uploading or just overwriting if name matches.
-- But our file naming strategy uses random numbers, so we are mostly inserting.

-- Allow public read
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'products' );

-- STORES Update Policy Refinement
-- Ensure the update policy is permissive for owners
DROP POLICY IF EXISTS "Owners can update own store" ON public.stores;
CREATE POLICY "Owners can update own store" 
ON public.stores 
FOR UPDATE 
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);
