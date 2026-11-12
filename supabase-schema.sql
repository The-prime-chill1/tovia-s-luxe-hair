create extension if not exists "pgcrypto";

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
  items jsonb not null,
  subtotal numeric not null,
  delivery_fee numeric not null default 0,
  total numeric not null,
  payment_method text not null default 'bank_transfer',
  payment_status text not null default 'pending',
  order_status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Customers can create orders"
on public.orders for insert
to anon
with check (true);

-- Order records contain customer details, so public read access is intentionally disabled.
