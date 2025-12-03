-- Enable RLS on payment_methods
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Public read access (so buyers can see payment options)
DROP POLICY IF EXISTS "Payment methods are viewable by everyone" ON public.payment_methods;
CREATE POLICY "Payment methods are viewable by everyone" ON public.payment_methods FOR SELECT USING (true);

-- Store owners can insert payment methods
DROP POLICY IF EXISTS "Store owners can insert payment methods" ON public.payment_methods;
CREATE POLICY "Store owners can insert payment methods" ON public.payment_methods FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
);

-- Store owners can update payment methods
DROP POLICY IF EXISTS "Store owners can update payment methods" ON public.payment_methods;
CREATE POLICY "Store owners can update payment methods" ON public.payment_methods FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
);

-- Store owners can delete payment methods
DROP POLICY IF EXISTS "Store owners can delete payment methods" ON public.payment_methods;
CREATE POLICY "Store owners can delete payment methods" ON public.payment_methods FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
);
