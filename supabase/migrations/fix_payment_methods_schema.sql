-- Create payment_methods table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'pago_movil', 'zelle', 'binance', 'cash', etc.
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. View: Public (so buyers can see them)
DROP POLICY IF EXISTS "Payment methods are viewable by everyone" ON public.payment_methods;
CREATE POLICY "Payment methods are viewable by everyone" ON public.payment_methods FOR SELECT USING (true);

-- 2. Insert: Store Owners
DROP POLICY IF EXISTS "Store owners can insert payment methods" ON public.payment_methods;
CREATE POLICY "Store owners can insert payment methods" ON public.payment_methods FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
);

-- 3. Update: Store Owners
DROP POLICY IF EXISTS "Store owners can update payment methods" ON public.payment_methods;
CREATE POLICY "Store owners can update payment methods" ON public.payment_methods FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
);

-- 4. Delete: Store Owners
DROP POLICY IF EXISTS "Store owners can delete payment methods" ON public.payment_methods;
CREATE POLICY "Store owners can delete payment methods" ON public.payment_methods FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
);

-- Grant access to authenticated users (just in case)
GRANT ALL ON public.payment_methods TO authenticated;
GRANT SELECT ON public.payment_methods TO anon;
