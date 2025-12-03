-- Create store_reports table
CREATE TABLE IF NOT EXISTS public.store_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.store_reports ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow authenticated users to insert reports
CREATE POLICY "Users can insert reports"
    ON public.store_reports
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow admins to view reports (assuming an admin role or similar, for now just service_role or specific users)
-- For now, we won't expose a public select policy to avoid leaking reports.
-- Only database admins or dashboard with service_role can read.
