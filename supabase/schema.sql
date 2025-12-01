-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Storage Bucket for Products
insert into storage.buckets (id, name, public) 
values ('products', 'products', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "Public Access to Product Images"
on storage.objects for select
using ( bucket_id = 'products' );

create policy "Sellers can upload Product Images"
on storage.objects for insert
with check ( bucket_id = 'products' and auth.role() = 'authenticated' );

-- Create profiles table
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text check (role in ('buyer', 'seller')) default 'buyer',
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create stores table
create table public.stores (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) not null,
  name text not null,
  slug text unique not null,
  description text,
  image_url text,
  lat double precision,
  lng double precision,
  address text,
  exchange_rate_bs double precision default 0,
  is_open boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create products table
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references public.stores(id) not null,
  title text not null,
  description text,
  price_usd double precision not null,
  image_url text,
  in_stock boolean default true,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;

-- Policies (Basic examples, refine as needed)
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

create policy "Stores are viewable by everyone."
  on stores for select
  using ( true );

create policy "Sellers can insert their own store."
  on stores for insert
  with check ( auth.uid() = owner_id );

create policy "Sellers can update their own store."
  on stores for update
  using ( auth.uid() = owner_id );

create policy "Products are viewable by everyone."
  on products for select
  using ( true );

create policy "Sellers can insert products for their store."
  on products for insert
  with check ( exists ( select 1 from stores where id = store_id and owner_id = auth.uid() ) );

-- Add new columns to stores
alter table public.stores 
add column if not exists phone_number text,
add column if not exists payment_info text;

-- Create orders table
create table if not exists public.orders (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references public.stores(id) not null,
  buyer_name text not null,
  buyer_phone text,
  buyer_address text,
  total_usd double precision not null,
  total_bs double precision not null,
  status text check (status in ('pending', 'paid', 'delivered', 'cancelled')) default 'pending',
  payment_ref text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create order items table
create table if not exists public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) not null,
  product_id uuid references public.products(id) not null,
  quantity integer not null,
  price_at_time_usd double precision not null,
  title text not null
);

-- RLS for Orders
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "Sellers can view orders for their store"
  on orders for select
  using ( exists ( select 1 from stores where id = store_id and owner_id = auth.uid() ) );

create policy "Sellers can update orders for their store"
  on orders for update
  using ( exists ( select 1 from stores where id = store_id and owner_id = auth.uid() ) );

create policy "Buyers can insert orders"
  on orders for insert
  with check ( true );

-- RLS for Order Items
create policy "Sellers can view order items for their store"
  on order_items for select
  using ( exists ( select 1 from orders where id = order_id and exists ( select 1 from stores where id = orders.store_id and owner_id = auth.uid() ) ) );

create policy "Buyers can insert order items"
  on order_items for insert
  with check ( true );

