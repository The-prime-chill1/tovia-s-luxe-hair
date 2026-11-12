create extension if not exists "pgcrypto";
create extension if not exists "pg_net";
create extension if not exists "supabase_vault";

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_name text not null,
  email text not null,
  phone text not null,
  address text not null,
  city text not null,
  state text not null,
  notes text,
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  total numeric(12,2) not null check (total >= 0),
  payment_method text not null default 'admin_contact',
  payment_status text not null default 'pending',
  order_status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders alter column payment_method set default 'admin_contact';

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  topic text not null,
  message text not null,
  status text not null default 'unread' check (status in ('unread', 'read')),
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_number text not null,
  customer_name text not null,
  rating smallint not null check (rating between 1 and 5),
  review text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,
  description text not null,
  badge text not null default 'NEW',
  lace_type text,
  density text,
  image_paths text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'active', 'sold_out')),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  length text not null,
  normal_price numeric(12,2) not null check (normal_price >= 0),
  sale_price numeric(12,2) not null check (sale_price >= 0 and sale_price <= normal_price),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, length)
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'orders_payment_status_check' and conrelid = 'public.orders'::regclass) then
    alter table public.orders add constraint orders_payment_status_check check (payment_status in ('pending', 'paid', 'failed', 'refunded'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_order_status_check' and conrelid = 'public.orders'::regclass) then
    alter table public.orders add constraint orders_order_status_check check (order_status in ('new', 'contacted', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled'));
  end if;
end $$;

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists messages_status_created_at_idx on public.messages (status, created_at desc);
create index if not exists reviews_status_created_at_idx on public.reviews (status, created_at desc);
create index if not exists products_status_created_at_idx on public.products (status, created_at desc);
create index if not exists product_variants_product_id_idx on public.product_variants (product_id, sort_order);

create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function private.set_updated_at() from public, anon, authenticated;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders for each row execute function private.set_updated_at();
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products for each row execute function private.set_updated_at();

alter table public.orders enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;

grant insert on public.orders, public.messages, public.reviews to anon, authenticated;
grant select on public.reviews, public.products, public.product_variants to anon, authenticated;
grant select, insert, update, delete on public.orders, public.messages, public.reviews, public.products, public.product_variants to authenticated;

drop policy if exists "Customers can create orders" on public.orders;
create policy "Customers can create orders" on public.orders for insert to anon, authenticated with check (payment_status = 'pending' and order_status = 'new');
drop policy if exists "Visitors can send messages" on public.messages;
create policy "Visitors can send messages" on public.messages for insert to anon, authenticated with check (status = 'unread');
drop policy if exists "Visitors can submit reviews" on public.reviews;
create policy "Visitors can submit reviews" on public.reviews for insert to anon, authenticated with check (status = 'pending');
drop policy if exists "Anyone can read approved reviews" on public.reviews;
create policy "Anyone can read approved reviews" on public.reviews for select to anon, authenticated using (status = 'approved');
drop policy if exists "Anyone can read active products" on public.products;
create policy "Anyone can read active products" on public.products for select to anon, authenticated using (status = 'active');
drop policy if exists "Anyone can read active product variants" on public.product_variants;
create policy "Anyone can read active product variants" on public.product_variants for select to anon, authenticated using (
  exists (select 1 from public.products where products.id = product_variants.product_id and products.status = 'active')
);

drop policy if exists "Admins can read orders" on public.orders;
create policy "Admins can read orders" on public.orders for select to authenticated using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders" on public.orders for update to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin') with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins can read messages" on public.messages;
create policy "Admins can read messages" on public.messages for select to authenticated using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins can update messages" on public.messages;
create policy "Admins can update messages" on public.messages for update to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin') with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins can read all reviews" on public.reviews;
create policy "Admins can read all reviews" on public.reviews for select to authenticated using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins can update reviews" on public.reviews;
create policy "Admins can update reviews" on public.reviews for update to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin') with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can read all products" on public.products;
create policy "Admins can read all products" on public.products for select to authenticated using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins can create products" on public.products;
create policy "Admins can create products" on public.products for insert to authenticated
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin' and created_by = (select auth.uid()));
drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products" on public.products for update to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin') with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products" on public.products for delete to authenticated using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins can read all product variants" on public.product_variants;
create policy "Admins can read all product variants" on public.product_variants for select to authenticated using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins can create product variants" on public.product_variants;
create policy "Admins can create product variants" on public.product_variants for insert to authenticated with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins can update product variants" on public.product_variants;
create policy "Admins can update product variants" on public.product_variants for update to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin') with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins can delete product variants" on public.product_variants;
create policy "Admins can delete product variants" on public.product_variants for delete to authenticated using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can view product images" on storage.objects;
create policy "Anyone can view product images" on storage.objects for select to anon, authenticated using (bucket_id = 'product-images');
drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images" on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images" on storage.objects for update to authenticated
using (bucket_id = 'product-images' and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (bucket_id = 'product-images' and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images" on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

create or replace function private.notify_admin_by_email()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  project_url text;
  secret_key text;
begin
  select decrypted_secret into project_url from vault.decrypted_secrets where name = 'project_url' limit 1;
  select decrypted_secret into secret_key from vault.decrypted_secrets where name = 'secret_key' limit 1;
  if project_url is null or secret_key is null then return new; end if;
  perform net.http_post(
    url := project_url || '/functions/v1/notify-admin',
    headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', secret_key),
    body := jsonb_build_object('type', tg_op, 'table', tg_table_name, 'schema', tg_table_schema, 'record', to_jsonb(new), 'old_record', null)
  );
  return new;
end;
$$;

revoke execute on function private.notify_admin_by_email() from public, anon, authenticated;
drop trigger if exists notify_admin_new_order on public.orders;
create trigger notify_admin_new_order after insert on public.orders for each row execute function private.notify_admin_by_email();
drop trigger if exists notify_admin_new_message on public.messages;
create trigger notify_admin_new_message after insert on public.messages for each row execute function private.notify_admin_by_email();

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where lower(email) in ('toviasluxehairs@gmail.com', 'lamidiabdulhameedolawale21@gmail.com');

-- After the Edge Function is deployed, add these Vault secrets separately.
-- Replace YOUR_SUPABASE_SECRET_KEY with the secret key from Supabase Settings > API Keys.
-- select vault.create_secret('https://peolkpovoreuigrxfoyc.supabase.co', 'project_url');
-- select vault.create_secret('YOUR_SUPABASE_SECRET_KEY', 'secret_key');
