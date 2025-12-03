-- Comprehensive RLS Fix for Store Registration

-- 1. PROFILES: Ensure users can update their own role
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);


-- 2. STORES: Ensure authenticated users can create stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can create store" ON public.stores;
CREATE POLICY "Authenticated users can create store" ON public.stores FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owners can update own store" ON public.stores;
CREATE POLICY "Owners can update own store" ON public.stores FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Stores are viewable by everyone" ON public.stores;
CREATE POLICY "Stores are viewable by everyone" ON public.stores FOR SELECT USING (true);


-- 3. PAYMENT METHODS: Ensure store owners can manage them
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Payment methods are viewable by everyone" ON public.payment_methods;
CREATE POLICY "Payment methods are viewable by everyone" ON public.payment_methods FOR SELECT USING (true);

DROP POLICY IF EXISTS "Store owners can insert payment methods" ON public.payment_methods;
CREATE POLICY "Store owners can insert payment methods" ON public.payment_methods FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Store owners can update payment methods" ON public.payment_methods;
CREATE POLICY "Store owners can update payment methods" ON public.payment_methods FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Store owners can delete payment methods" ON public.payment_methods;
CREATE POLICY "Store owners can delete payment methods" ON public.payment_methods FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
);
