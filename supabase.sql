create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists updated_at timestamptz not null default now();
alter table public.orders add column if not exists customer jsonb not null default '{}'::jsonb;
alter table public.orders add column if not exists items jsonb not null default '[]'::jsonb;
alter table public.orders add column if not exists subtotal numeric(10,2) not null default 0;
alter table public.orders add column if not exists delivery_fee numeric(10,2) not null default 0;
alter table public.orders add column if not exists discount numeric(10,2) not null default 0;
alter table public.orders add column if not exists coupon jsonb;
alter table public.orders add column if not exists extra numeric(10,2) not null default 0;
alter table public.orders add column if not exists total numeric(10,2) not null default 0;
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists change_for text;
alter table public.orders add column if not exists order_type text default 'retirada';
alter table public.orders add column if not exists source text default 'verbo-hub';
alter table public.orders add column if not exists status text default 'novo';
alter table public.orders add column if not exists fiado boolean not null default false;
alter table public.orders add column if not exists order_number bigint;

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  code text not null unique,
  percent numeric(5,2) not null default 0,
  active boolean not null default true
);

create table if not exists public.store_settings (
  id text primary key default 'main',
  is_open boolean not null default true,
  estimated_minutes integer not null default 25,
  message text default 'Estamos recebendo pedidos normalmente.',
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id, is_open, estimated_minutes, message)
values ('main', true, 25, 'Estamos recebendo pedidos normalmente.')
on conflict (id) do nothing;

alter table public.orders enable row level security;
alter table public.store_settings enable row level security;
alter table public.coupons enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_insert_public') then
    create policy "orders_insert_public" on public.orders for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_read_public') then
    create policy "orders_read_public" on public.orders for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_update_public') then
    create policy "orders_update_public" on public.orders for update using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='store_settings' and policyname='store_settings_read_public') then
    create policy "store_settings_read_public" on public.store_settings for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='store_settings' and policyname='store_settings_write_public') then
    create policy "store_settings_write_public" on public.store_settings for all using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='coupons' and policyname='coupons_read_public') then
    create policy "coupons_read_public" on public.coupons for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='coupons' and policyname='coupons_write_public') then
    create policy "coupons_write_public" on public.coupons for all using (true) with check (true);
  end if;
end $$;


create table if not exists public.menu_items (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  category_id text not null,
  category_name text not null,
  icon text default '🍽️',
  addons text,
  name text not null,
  description text default '',
  price numeric(10,2) not null default 0,
  active boolean not null default true,
  tags jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0
);

alter table public.menu_items enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='menu_items' and policyname='menu_items_read_public') then
    create policy "menu_items_read_public" on public.menu_items for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='menu_items' and policyname='menu_items_write_public') then
    create policy "menu_items_write_public" on public.menu_items for all using (true) with check (true);
  end if;
end $$;

insert into public.menu_items (id, category_id, category_name, icon, addons, name, description, price, active, sort_order)
values
('x-burguer', 'burgers', 'Burgers', '🍔', 'burger', 'X-Burguer', 'Pão, carne, queijo, alface, tomate e maionese.', 21.90, true, 0),
('x-salada', 'burgers', 'Burgers', '🍔', 'burger', 'X-Salada', 'Pão, carne, queijo, alface, tomate, milho, ervilha e maionese.', 26.90, true, 1),
('x-bacon', 'burgers', 'Burgers', '🍔', 'burger', 'X-Bacon', 'Pão, carne, queijo, bacon e maionese.', 28.90, true, 2),
('x-egg-bacon', 'burgers', 'Burgers', '🍔', 'burger', 'X-Egg Bacon', 'Pão, carne, queijo, ovo, bacon e maionese.', 30.90, true, 3),
('duplo-bacon-bbq', 'burgers', 'Burgers', '🍔', 'burger', 'Duplo Bacon BBQ 🔥', 'Pão, 2 carnes, queijo, bacon, molho BBQ e maionese.', 35.90, true, 4),
('x-tudo', 'burgers', 'Burgers', '🍔', 'burger', 'X-Tudo', 'Pão, carne, queijo, presunto, ovo, bacon, alface, tomate, milho, ervilha e maionese.', 37.90, true, 5),
('cuscuz-base', 'cuscuz', 'Cuscuz', '🍲', 'cuscuz', 'Cuscuz Base', 'Escolha até 3 adicionais comuns inclusos. Extras comuns +R$5,00. Premium +R$8,00.', 24.90, true, 6),
('cuscuz-premium', 'cuscuz', 'Cuscuz', '🍲', 'cuscuz', 'Cuscuz Premium', 'Carne seca, mussarela e queijo coalho inclusos. Produto normal, sem adicionais.', 32.90, true, 7),
('tap-frango-requeijao', 'tapiocas-salgadas', 'Tapiocas Salgadas', '🥟', 'savory', 'Frango + Mussarela + Requeijão', 'Tapioca salgada recheada.', 25.90, true, 8),
('tap-frango-bacon', 'tapiocas-salgadas', 'Tapiocas Salgadas', '🥟', 'savory', 'Frango + Presunto + Bacon + Requeijão', 'Tapioca salgada recheada.', 28.90, true, 9),
('tap-carne-calabresa', 'tapiocas-salgadas', 'Tapiocas Salgadas', '🥟', 'savory', 'Carne + Calabresa + Tomate + Mussarela', 'Tapioca salgada recheada.', 28.90, true, 10),
('tap-carne-ovo', 'tapiocas-salgadas', 'Tapiocas Salgadas', '🥟', 'savory', 'Carne + Ovo + Bacon + Requeijão', 'Tapioca salgada recheada.', 29.90, true, 11),
('tap-mussarela-bacon', 'tapiocas-salgadas', 'Tapiocas Salgadas', '🥟', 'savory', 'Mussarela + Bacon + Requeijão', 'Tapioca salgada recheada.', 25.90, true, 12),
('tap-presunto-ovo', 'tapiocas-salgadas', 'Tapiocas Salgadas', '🥟', 'savory', 'Presunto + Mussarela + Tomate + Ovo', 'Tapioca salgada recheada.', 26.90, true, 13),
('tap-completa', 'tapiocas-salgadas', 'Tapiocas Salgadas', '🥟', 'savory', 'Completa (Frango + Tudo) 🔥', 'A queridinha da casa.', 31.90, true, 14),
('tap-banana-bacon', 'tapiocas-salgadas', 'Tapiocas Salgadas', '🥟', 'savory', 'Banana + Bacon + Mussarela + Canela', 'Agridoce especial da casa.', 25.90, true, 15),
('tap-carne-seca', 'tapiocas-salgadas', 'Tapiocas Salgadas', '🥟', 'savory', 'Carne Seca + Mussarela + Queijo Coalho', 'Tapioca premium.', 37.90, true, 16),
('doce-nutella-morango', 'tapiocas-doces', 'Tapiocas Doces', '🍫', 'sweet', 'Nutella com Morango', '', 19.90, true, 17),
('doce-leite-coco', 'tapiocas-doces', 'Tapiocas Doces', '🍫', 'sweet', 'Leite Condensado com Coco', '', 19.90, true, 18),
('doce-churros', 'tapiocas-doces', 'Tapiocas Doces', '🍫', 'sweet', 'Tapioca de Churros', 'Doce de leite com canela e açúcar.', 19.90, true, 19),
('doce-romeu', 'tapiocas-doces', 'Tapiocas Doces', '🍫', 'sweet', 'Romeu e Julieta', 'Queijo com goiabada.', 19.90, true, 20),
('suco-limao', 'sucos', 'Sucos Naturais', '🥤', null, 'Limão', 'Suco natural feito na hora.', 7.90, true, 21),
('suco-laranja', 'sucos', 'Sucos Naturais', '🥤', null, 'Laranja', 'Suco natural feito na hora.', 8.90, true, 22),
('suco-abacaxi', 'sucos', 'Sucos Naturais', '🥤', null, 'Abacaxi', 'Suco natural feito na hora.', 8.90, true, 23),
('suco-abacaxi-hortela', 'sucos', 'Sucos Naturais', '🥤', null, 'Abacaxi com Hortelã', 'Suco natural feito na hora.', 9.90, true, 24),
('detox-1', 'detox', 'Detox', '🌿', null, 'Detox 1', 'Couve, limão e gengibre.', 11.90, true, 25),
('detox-2', 'detox', 'Detox', '🌿', null, 'Detox 2', 'Abacaxi, hortelã e gengibre.', 11.90, true, 26),
('coca-lata', 'refrigerantes', 'Refrigerantes e Água', '🥫', null, 'Coca-Cola Lata', '', 6.50, true, 27),
('guarana-lata', 'refrigerantes', 'Refrigerantes e Água', '🥫', null, 'Guaraná Lata', '', 6.50, true, 28),
('fanta-lata', 'refrigerantes', 'Refrigerantes e Água', '🥫', null, 'Fanta Lata', '', 6.50, true, 29),
('coca-1l', 'refrigerantes', 'Refrigerantes e Água', '🥫', null, 'Coca-Cola 1L', '', 10.00, true, 30),
('guarana-1l', 'refrigerantes', 'Refrigerantes e Água', '🥫', null, 'Guaraná 1L', '', 10.00, true, 31),
('agua-gas', 'refrigerantes', 'Refrigerantes e Água', '🥫', null, 'Água com Gás', '', 4.50, true, 32),
('agua', 'refrigerantes', 'Refrigerantes e Água', '🥫', null, 'Água Mineral', '', 3.50, true, 33),
('coca-600', 'refrigerantes', 'Refrigerantes e Água', '🥫', null, 'Coca-Cola 600ml', '', 7.50, true, 34),
('milk-choc-nutella', 'milkshakes', 'Milkshakes', '🥛', null, 'Chocolate com Nutella', '', 20.00, true, 35),
('milk-morango-nutella', 'milkshakes', 'Milkshakes', '🥛', null, 'Morango com Nutella', '', 20.00, true, 36),
('milk-chocolate', 'milkshakes', 'Milkshakes', '🥛', null, 'Chocolate', '', 18.00, true, 37),
('milk-morango', 'milkshakes', 'Milkshakes', '🥛', null, 'Morango', '', 18.00, true, 38)
on conflict (id) do update set
  category_id = excluded.category_id,
  category_name = excluded.category_name,
  icon = excluded.icon,
  addons = excluded.addons,
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  active = excluded.active,
  sort_order = excluded.sort_order,
  updated_at = now();

-- =========================================================
-- VERBO HUB - CAMADA DE SEGURANCA PARA PRODUCAO
-- Rode este SQL UMA VEZ no Supabase depois do deploy final.
-- O cardapio publico so pode ler produtos/cupons ativos e criar pedidos.
-- O painel usa funcoes administrativas com ADMIN_KEY.
-- Para trocar a senha administrativa, altere '2026' abaixo e tambem configure
-- VITE_ADMIN_SECRET com o mesmo valor no projeto do painel na Vercel.
-- =========================================================

create or replace function public.is_verbo_admin(admin_key text)
returns boolean
language sql
stable
as $$
  select coalesce(admin_key, '') = '2026';
$$;

-- Remove politicas antigas abertas demais, caso ja existam
DROP POLICY IF EXISTS orders_insert_public ON public.orders;
DROP POLICY IF EXISTS orders_read_public ON public.orders;
DROP POLICY IF EXISTS orders_update_public ON public.orders;
DROP POLICY IF EXISTS store_settings_read_public ON public.store_settings;
DROP POLICY IF EXISTS store_settings_write_public ON public.store_settings;
DROP POLICY IF EXISTS coupons_read_public ON public.coupons;
DROP POLICY IF EXISTS coupons_write_public ON public.coupons;
DROP POLICY IF EXISTS menu_items_read_public ON public.menu_items;
DROP POLICY IF EXISTS menu_items_write_public ON public.menu_items;
DROP POLICY IF EXISTS menu_items_read_active_public ON public.menu_items;
DROP POLICY IF EXISTS coupons_read_active_public ON public.coupons;

alter table public.orders enable row level security;
alter table public.store_settings enable row level security;
alter table public.coupons enable row level security;
alter table public.menu_items enable row level security;

-- Cardapio publico: pode criar pedido, ler configuracao da loja, ler produtos/cupons ativos.
create policy orders_insert_public on public.orders
  for insert to anon, authenticated
  with check (true);

create policy store_settings_read_public on public.store_settings
  for select to anon, authenticated
  using (true);

create policy coupons_read_active_public on public.coupons
  for select to anon, authenticated
  using (active = true);

create policy menu_items_read_active_public on public.menu_items
  for select to anon, authenticated
  using (active = true);

-- Produto mais vendido do dia sem expor lista completa de pedidos ao cliente
create or replace function public.get_best_seller_today()
returns table(item_id text, name text, qty numeric)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(item->>'id', item->>'name') as item_id,
    coalesce(item->>'name', 'Produto') as name,
    sum(coalesce((item->>'qty')::numeric, (item->>'quantity')::numeric, 1)) as qty
  from public.orders o,
       lateral jsonb_array_elements(coalesce(o.items, '[]'::jsonb)) as item
  where o.created_at >= date_trunc('day', now())
    and coalesce(o.status, 'novo') <> 'cancelado'
  group by coalesce(item->>'id', item->>'name'), coalesce(item->>'name', 'Produto')
  order by qty desc
  limit 1;
$$;

grant execute on function public.get_best_seller_today() to anon, authenticated;

-- Funcoes administrativas usadas pelo painel
create or replace function public.admin_list_orders(admin_key text)
returns setof public.orders
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_verbo_admin(admin_key) then
    raise exception 'Acesso negado';
  end if;
  return query select * from public.orders order by created_at desc limit 1000;
end;
$$;

create or replace function public.admin_insert_order(admin_key text, order_data jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare new_id uuid;
begin
  if not public.is_verbo_admin(admin_key) then raise exception 'Acesso negado'; end if;
  insert into public.orders(customer, items, subtotal, delivery_fee, discount, coupon, extra, total, payment_method, change_for, order_type, source, status, fiado)
  values (
    coalesce(order_data->'customer', '{}'::jsonb),
    coalesce(order_data->'items', '[]'::jsonb),
    coalesce((order_data->>'subtotal')::numeric, 0),
    coalesce((order_data->>'delivery_fee')::numeric, 0),
    coalesce((order_data->>'discount')::numeric, 0),
    order_data->'coupon',
    coalesce((order_data->>'extra')::numeric, 0),
    coalesce((order_data->>'total')::numeric, 0),
    order_data->>'payment_method',
    order_data->>'change_for',
    coalesce(order_data->>'order_type', 'balcao'),
    coalesce(order_data->>'source', 'verbo-hub-painel'),
    coalesce(order_data->>'status', 'novo'),
    coalesce((order_data->>'fiado')::boolean, false)
  ) returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.admin_update_order(admin_key text, order_id uuid, patch jsonb)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare updated public.orders;
begin
  if not public.is_verbo_admin(admin_key) then raise exception 'Acesso negado'; end if;
  update public.orders set
    status = coalesce(patch->>'status', status),
    discount = coalesce((patch->>'discount')::numeric, discount),
    extra = coalesce((patch->>'extra')::numeric, extra),
    payment_method = coalesce(patch->>'payment_method', payment_method),
    fiado = coalesce((patch->>'fiado')::boolean, fiado)
  where id = order_id
  returning * into updated;
  return updated;
end;
$$;

create or replace function public.admin_list_menu_items(admin_key text)
returns setof public.menu_items
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_verbo_admin(admin_key) then raise exception 'Acesso negado'; end if;
  return query select * from public.menu_items order by sort_order asc, created_at asc;
end;
$$;

create or replace function public.admin_upsert_menu_item(admin_key text, item jsonb)
returns public.menu_items
language plpgsql
security definer
set search_path = public
as $$
declare saved public.menu_items;
begin
  if not public.is_verbo_admin(admin_key) then raise exception 'Acesso negado'; end if;
  insert into public.menu_items(id, category_id, category_name, icon, addons, name, description, price, active, tags, sort_order, updated_at)
  values (
    item->>'id',
    coalesce(item->>'category_id', 'cardapio'),
    coalesce(item->>'category_name', 'Cardápio'),
    coalesce(item->>'icon', '🍽️'),
    item->>'addons',
    coalesce(item->>'name', 'Produto'),
    coalesce(item->>'description', ''),
    coalesce((item->>'price')::numeric, 0),
    coalesce((item->>'active')::boolean, true),
    coalesce(item->'tags', '[]'::jsonb),
    coalesce((item->>'sort_order')::integer, 0),
    now()
  )
  on conflict (id) do update set
    category_id = excluded.category_id,
    category_name = excluded.category_name,
    icon = excluded.icon,
    addons = excluded.addons,
    name = excluded.name,
    description = excluded.description,
    price = excluded.price,
    active = excluded.active,
    tags = excluded.tags,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning * into saved;
  return saved;
end;
$$;

create or replace function public.admin_delete_menu_item(admin_key text, item_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_verbo_admin(admin_key) then raise exception 'Acesso negado'; end if;
  delete from public.menu_items where id = item_id;
  return true;
end;
$$;

create or replace function public.admin_list_coupons(admin_key text)
returns setof public.coupons
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_verbo_admin(admin_key) then raise exception 'Acesso negado'; end if;
  return query select * from public.coupons order by created_at desc;
end;
$$;

create or replace function public.admin_upsert_coupon(admin_key text, coupon jsonb)
returns public.coupons
language plpgsql
security definer
set search_path = public
as $$
declare saved public.coupons;
begin
  if not public.is_verbo_admin(admin_key) then raise exception 'Acesso negado'; end if;
  insert into public.coupons(code, percent, active)
  values (upper(trim(coupon->>'code')), coalesce((coupon->>'percent')::numeric, 0), coalesce((coupon->>'active')::boolean, true))
  on conflict (code) do update set
    percent = excluded.percent,
    active = excluded.active
  returning * into saved;
  return saved;
end;
$$;

create or replace function public.admin_delete_coupon(admin_key text, coupon_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_verbo_admin(admin_key) then raise exception 'Acesso negado'; end if;
  delete from public.coupons where id = coupon_id;
  return true;
end;
$$;

create or replace function public.admin_save_store_settings(admin_key text, settings jsonb)
returns public.store_settings
language plpgsql
security definer
set search_path = public
as $$
declare saved public.store_settings;
begin
  if not public.is_verbo_admin(admin_key) then raise exception 'Acesso negado'; end if;
  insert into public.store_settings(id, is_open, estimated_minutes, message, updated_at)
  values (
    'main',
    coalesce((settings->>'is_open')::boolean, true),
    coalesce((settings->>'estimated_minutes')::integer, 25),
    coalesce(settings->>'message', 'Estamos recebendo pedidos normalmente.'),
    now()
  )
  on conflict(id) do update set
    is_open = excluded.is_open,
    estimated_minutes = excluded.estimated_minutes,
    message = excluded.message,
    updated_at = now()
  returning * into saved;
  return saved;
end;
$$;

grant execute on function public.admin_list_orders(text) to anon, authenticated;
grant execute on function public.admin_insert_order(text, jsonb) to anon, authenticated;
grant execute on function public.admin_update_order(text, uuid, jsonb) to anon, authenticated;
grant execute on function public.admin_list_menu_items(text) to anon, authenticated;
grant execute on function public.admin_upsert_menu_item(text, jsonb) to anon, authenticated;
grant execute on function public.admin_delete_menu_item(text, text) to anon, authenticated;
grant execute on function public.admin_list_coupons(text) to anon, authenticated;
grant execute on function public.admin_upsert_coupon(text, jsonb) to anon, authenticated;
grant execute on function public.admin_delete_coupon(text, uuid) to anon, authenticated;
grant execute on function public.admin_save_store_settings(text, jsonb) to anon, authenticated;
