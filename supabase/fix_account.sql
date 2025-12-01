-- 1. Create the Profile first (Required for Foreign Key)
insert into public.profiles (id, email, role, full_name)
values (
  'a694d7d6-d5ca-455c-b544-91e2f399dee3', -- Your User ID
  'tu_email@ejemplo.com', -- Placeholder email
  'seller',
  'Vendedor Manual'
)
on conflict (id) do nothing; -- Prevent error if it already exists

-- 2. Then Create the Store
insert into public.stores (owner_id, name, slug)
values (
  'a694d7d6-d5ca-455c-b544-91e2f399dee3', -- Same User ID
  'Mi Tienda Manual',
  'mi-tienda-manual-001'
)
on conflict do nothing;
