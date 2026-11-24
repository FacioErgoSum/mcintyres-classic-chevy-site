-- Run once in the Supabase SQL editor (after the scraper's schema files).
-- Customer accounts: saved orders with tracking, and wish lists.
-- Sign-in itself is Supabase Auth (Authentication → Providers); see SETUP-ACCOUNTS.md.

-- ---------- Orders ----------
-- The Stripe webhook saves every paid order here (guest or signed in).
create table if not exists orders (
  id text primary key,                       -- Stripe checkout session id (cs_…)
  user_id uuid references auth.users(id) on delete set null,
  email text,                                -- guests' orders show up once they make an account with this email
  created_at timestamptz not null default now(),
  status text not null default 'paid',       -- paid / ordered / shipped / delivered / cancelled  (edit by hand)
  customer_name text,
  phone text,
  ship_to jsonb,
  shipping_label text,
  items_total numeric,
  shipping_total numeric,
  tax_total numeric,
  total numeric,
  live boolean not null default true          -- false for Stripe test orders
);
create index if not exists orders_user_idx on orders (user_id);
create index if not exists orders_email_idx on orders (lower(email));

create table if not exists order_items (
  id bigint generated always as identity primary key,
  order_id text not null references orders(id) on delete cascade,
  handle text,
  name text not null,
  part_number text,
  qty integer not null,
  unit_price numeric not null,
  kind text,                                 -- part / mailer / printed
  supplier text                              -- golden_star / mcintyre
);
create index if not exists order_items_order_idx on order_items (order_id);

-- Add a row here when a package ships (Table Editor → order_tracking → Insert row).
-- An order can have several: Golden Star, Scranton and Printful each ship their own.
create table if not exists order_tracking (
  id bigint generated always as identity primary key,
  order_id text not null references orders(id) on delete cascade,
  created_at timestamptz not null default now(),
  carrier text,                              -- USPS / UPS / FedEx / the freight company's name
  tracking_number text not null,
  note text                                  -- e.g. "Quarter panels, by truck"
);
create index if not exists order_tracking_order_idx on order_tracking (order_id);

-- A signed-in customer may read an order that is theirs, or that was placed as a
-- guest with their email address once they've confirmed that email.
create or replace function public.owns_order(o orders) returns boolean
language sql stable security definer set search_path = '' as $$
  select o.user_id = auth.uid()
      or exists (select 1 from auth.users u
                 where u.id = auth.uid() and u.email_confirmed_at is not null
                   and o.email is not null and lower(u.email) = lower(o.email));
$$;

alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_tracking enable row level security;
drop policy if exists "customers read their orders" on orders;
create policy "customers read their orders" on orders for select to authenticated using (public.owns_order(orders));
drop policy if exists "customers read their order items" on order_items;
create policy "customers read their order items" on order_items for select to authenticated
  using (exists (select 1 from orders o where o.id = order_items.order_id));
drop policy if exists "customers read their tracking" on order_tracking;
create policy "customers read their tracking" on order_tracking for select to authenticated
  using (exists (select 1 from orders o where o.id = order_tracking.order_id));
-- Only the site's server (secret key) and the Supabase dashboard write orders.

-- ---------- Wish lists ----------
create table if not exists wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null default 'My wish list' check (length(name) between 1 and 80),
  share_id text not null unique default replace(gen_random_uuid()::text, '-', ''), -- the secret part of the share link
  shared boolean not null default false,     -- anyone with the link can see it when true
  created_at timestamptz not null default now()
);
create index if not exists wishlists_user_idx on wishlists (user_id);

create table if not exists wishlist_items (
  wishlist_id uuid not null references wishlists(id) on delete cascade,
  handle text not null,
  qty integer not null default 1 check (qty between 1 and 50),
  added_at timestamptz not null default now(),
  primary key (wishlist_id, handle)
);

alter table wishlists enable row level security;
alter table wishlist_items enable row level security;
drop policy if exists "owners manage their lists" on wishlists;
create policy "owners manage their lists" on wishlists for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "owners manage their list items" on wishlist_items;
create policy "owners manage their list items" on wishlist_items for all to authenticated
  using (exists (select 1 from wishlists w where w.id = wishlist_items.wishlist_id and w.user_id = auth.uid()))
  with check (exists (select 1 from wishlists w where w.id = wishlist_items.wishlist_id and w.user_id = auth.uid()));
-- Shared lists are read by the site's server with the secret key, only when shared = true.
