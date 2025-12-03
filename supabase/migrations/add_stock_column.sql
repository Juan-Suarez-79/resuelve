-- Add stock_quantity column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- Optional: Set a default stock for existing products so they can be purchased
UPDATE public.products SET stock_quantity = 100 WHERE stock_quantity = 0;
