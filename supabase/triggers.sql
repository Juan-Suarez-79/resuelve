-- 1. Create the function that runs when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Insert into profiles
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'buyer')
  );
  
  -- If seller, create a default store
  if (new.raw_user_meta_data ->> 'role' = 'seller') then
    insert into public.stores (owner_id, name, slug)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', 'My Store') || '''s Store',
      lower(regexp_replace(coalesce(new.raw_user_meta_data ->> 'full_name', 'store'), '\s+', '-', 'g')) || '-' || floor(random() * 1000)::text
    );
  end if;
  
  return new;
end;
$$;

-- 2. Create the trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
