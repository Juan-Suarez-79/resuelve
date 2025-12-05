-- Add product_id to reviews table
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE CASCADE;

-- Update RLS policy to allow update/delete if needed (though existing policies might cover it based on user_id)
-- The existing policies in add_reviews.sql are:
-- CREATE POLICY "Users can insert their own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
-- This is fine.

-- We might want to ensure product_id is indexed for performancee
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
