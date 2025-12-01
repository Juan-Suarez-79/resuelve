-- Create payment_methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('zelle', 'pago_movil', 'binance', 'cash')),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Policies

-- Sellers can manage their own payment methods
CREATE POLICY "Sellers can manage their own payment methods" ON public.payment_methods
    FOR ALL
    USING (auth.uid() IN (SELECT user_id FROM public.stores WHERE id = store_id))
    WITH CHECK (auth.uid() IN (SELECT user_id FROM public.stores WHERE id = store_id));

-- Public can view payment methods (for checkout)
CREATE POLICY "Public can view payment methods" ON public.payment_methods
    FOR SELECT
    USING (true);


-- Update orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_method TEXT;
