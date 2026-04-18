-- F&B menu items
create table if not exists fnb_items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  price_coins integer not null,
  category text check (category in ('drinks','food','premium')),
  image_url text,
  is_available boolean default true,
  delivery_minutes integer default 15,
  created_at timestamptz default now()
);

-- F&B orders (user_id/room_id stored as text for compatibility with existing schema)
create table if not exists fnb_orders (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  room_id text,
  item_id uuid references fnb_items(id) not null,
  item_name text not null,
  quantity integer default 1,
  total_coins integer not null,
  status text default 'pending' check (status in ('pending','confirmed','delivering','delivered','cancelled')),
  delivery_address text,
  created_at timestamptz default now(),
  delivered_at timestamptz
);

-- Enable Realtime
alter publication supabase_realtime add table fnb_orders;

-- Indexes
create index if not exists idx_fnb_orders_user on fnb_orders(user_id);
create index if not exists idx_fnb_orders_status on fnb_orders(status);
create index if not exists idx_fnb_items_category on fnb_items(category);

-- Seed mock F&B items
insert into fnb_items (name, description, price_coins, category, delivery_minutes) values
('Dom Pérignon L.', '최고급 샴페인, 파티의 품격을 높이세요', 4500, 'premium', 15),
('Signature Cocktails', '시그니처 칵테일 세트 (3종)', 1200, 'drinks', 10),
('Hennessy XO', '프리미엄 코냑', 3800, 'premium', 15),
('스파클링 워터 세트', '페리에 6병 세트', 450, 'drinks', 10),
('파티 스낵 플래터', '치즈, 크래커, 과일 모둠', 850, 'food', 20),
('프리미엄 위스키', '발렌타인 17년', 2800, 'premium', 15)
on conflict do nothing;
