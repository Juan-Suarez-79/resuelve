-- Add delivery_fee to stores table
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS delivery_fee DOUBLE PRECISION DEFAULT 0;
