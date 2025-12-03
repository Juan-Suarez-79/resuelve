-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- PROFILES
-- Public read access (needed for reviews, etc.)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- STORES
-- Public read access
DROP POLICY IF EXISTS "Stores are viewable by everyone" ON public.stores;
CREATE POLICY "Stores are viewable by everyone" ON public.stores FOR SELECT USING (true);

-- Authenticated users can create a store
DROP POLICY IF EXISTS "Authenticated users can create store" ON public.stores;
CREATE POLICY "Authenticated users can create store" ON public.stores FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Owners can update their store
DROP POLICY IF EXISTS "Owners can update own store" ON public.stores;
CREATE POLICY "Owners can update own store" ON public.stores FOR UPDATE USING (auth.uid() = owner_id);

-- PRODUCTS
-- Public read access
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);

-- Store owners can insert products
DROP POLICY IF EXISTS "Store owners can insert products" ON public.products;
CREATE POLICY "Store owners can insert products" ON public.products FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
);

-- Store owners can update products
DROP POLICY IF EXISTS "Store owners can update products" ON public.products;
CREATE POLICY "Store owners can update products" ON public.products FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
);

-- Store owners can delete products
DROP POLICY IF EXISTS "Store owners can delete products" ON public.products;
CREATE POLICY "Store owners can delete products" ON public.products FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
);

-- ORDERS
-- Buyers can view their own orders
DROP POLICY IF EXISTS "Buyers can view own orders" ON public.orders;
CREATE POLICY "Buyers can view own orders" ON public.orders FOR SELECT USING (
    auth.uid() = buyer_id
);

-- Sellers can view orders for their store
DROP POLICY IF EXISTS "Sellers can view store orders" ON public.orders;
CREATE POLICY "Sellers can view store orders" ON public.orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
);

-- Authenticated users can create orders (as buyers)
DROP POLICY IF EXISTS "Buyers can create orders" ON public.orders;
CREATE POLICY "Buyers can create orders" ON public.orders FOR INSERT WITH CHECK (
    auth.uid() = buyer_id
);

-- Sellers can update order status
DROP POLICY IF EXISTS "Sellers can update order status" ON public.orders;
CREATE POLICY "Sellers can update order status" ON public.orders FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
);

-- ORDER ITEMS
-- Inherit access from orders (simplified for read)
DROP POLICY IF EXISTS "Order items viewable by buyer and seller" ON public.order_items;
CREATE POLICY "Order items viewable by buyer and seller" ON public.order_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE id = order_items.order_id 
        AND (
            buyer_id = auth.uid() 
            OR EXISTS (SELECT 1 FROM public.stores WHERE id = orders.store_id AND owner_id = auth.uid())
        )
    )
);

-- Buyers can insert order items (during checkout)
DROP POLICY IF EXISTS "Buyers can insert order items" ON public.order_items;
CREATE POLICY "Buyers can insert order items" ON public.order_items FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE id = order_id 
        AND buyer_id = auth.uid()
    )
);

-- REVIEWS
-- Public read access
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);

-- Authenticated users can create reviews
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (
    auth.uid() = user_id
);

-- ADDRESSES
-- Users can view their own addresses
DROP POLICY IF EXISTS "Users can view own addresses" ON public.addresses;
CREATE POLICY "Users can view own addresses" ON public.addresses FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own addresses
DROP POLICY IF EXISTS "Users can insert own addresses" ON public.addresses;
CREATE POLICY "Users can insert own addresses" ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own addresses
DROP POLICY IF EXISTS "Users can update own addresses" ON public.addresses;
CREATE POLICY "Users can update own addresses" ON public.addresses FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own addresses
DROP POLICY IF EXISTS "Users can delete own addresses" ON public.addresses;
CREATE POLICY "Users can delete own addresses" ON public.addresses FOR DELETE USING (auth.uid() = user_id);
