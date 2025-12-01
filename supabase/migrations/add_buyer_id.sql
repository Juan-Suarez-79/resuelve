-- Add buyer_id to orders table
alter table public.orders 
add column if not exists buyer_id uuid references auth.users(id);

-- Update RLS policies for Orders
drop policy if exists "Buyers can view their own orders" on orders;
create policy "Buyers can view their own orders"
  on orders for select
  using ( auth.uid() = buyer_id );

-- Update RLS policies for Order Items (to allow buyers to see items of their orders)
drop policy if exists "Buyers can view their own order items" on order_items;
create policy "Buyers can view their own order items"
  on order_items for select
  using ( exists ( select 1 from orders where id = order_id and buyer_id = auth.uid() ) );
