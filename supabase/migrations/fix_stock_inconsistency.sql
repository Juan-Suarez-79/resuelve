-- Fix stock inconsistency
-- Update products that are marked as 'in_stock' but have 0 quantity.
-- Set them to a default of 100 (or any number you prefer) to allow purchases.

UPDATE public.products 
SET stock_quantity = 100 
WHERE in_stock = true AND stock_quantity = 0;
