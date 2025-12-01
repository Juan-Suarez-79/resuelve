-- Add category column to stores table
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'otros';
