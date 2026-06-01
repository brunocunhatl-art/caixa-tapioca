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
