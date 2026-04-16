-- 채팅 메시지
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  room_id text not null,
  user_id text not null,
  nickname text not null,
  content text not null,
  type text default 'chat',
  created_at timestamp with time zone default now()
);

-- 룸 참여자
create table if not exists room_participants (
  id uuid default gen_random_uuid() primary key,
  room_id text not null,
  user_id text not null,
  nickname text not null,
  role text default 'guest',
  membership text default 'free',
  is_mic_active boolean default false,
  is_camera_active boolean default false,
  is_singing boolean default false,
  joined_at timestamp with time zone default now()
);

-- 노래 대기열
create table if not exists song_queue (
  id uuid default gen_random_uuid() primary key,
  room_id text not null,
  song_title text not null,
  artist text not null,
  youtube_id text,
  singer_id text,
  singer_nickname text,
  status text default 'waiting',
  position integer not null,
  created_at timestamp with time zone default now()
);

-- 선물 이벤트
create table if not exists gift_events (
  id uuid default gen_random_uuid() primary key,
  room_id text not null,
  sender_id text not null,
  sender_nickname text not null,
  receiver_id text,
  gift_type text not null,
  amount integer default 1,
  created_at timestamp with time zone default now()
);

-- 룸 정보
create table if not exists rooms (
  id text primary key,
  title text not null,
  host_id text not null,
  host_nickname text not null,
  room_type text default 'colosseum',
  is_active boolean default true,
  current_song_id uuid,
  max_participants integer default 50,
  ticket_price integer default 0,
  created_at timestamp with time zone default now()
);

-- Enable realtime on all tables
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table room_participants;
alter publication supabase_realtime add table song_queue;
alter publication supabase_realtime add table gift_events;

-- ── Revenue & Settlement Schema ─────────────────────────────────────────────

-- 유저 지갑 (User Wallets)
create table if not exists wallets (
  id uuid default gen_random_uuid() primary key,
  user_id text unique not null,
  nickname text not null,
  balance integer default 0 not null,
  pending_balance integer default 0 not null,
  total_earned integer default 0 not null,
  total_spent integer default 0 not null,
  role text default 'user',
  membership text default 'free',
  trust_score integer default 50,
  is_frozen boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 충전 주문 (Charge Orders)
create table if not exists charge_orders (
  id uuid default gen_random_uuid() primary key,
  order_id text unique not null,
  user_id text not null,
  amount_krw integer not null,
  amount_credits integer not null,
  pg_provider text not null,
  pg_transaction_id text,
  status text default 'pending',
  idempotency_key text unique not null,
  vat_amount integer default 0,
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

-- 트랜잭션 원장 (Transaction Ledger)
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  order_id text unique not null,
  idempotency_key text unique not null,
  room_id text not null,
  sender_id text not null,
  receiver_id text not null,
  director_id text,
  item_type text not null,
  item_amount integer not null,
  total_credits integer not null,
  platform_cut integer not null,
  director_cut integer not null,
  host_cut integer not null,
  status text default 'pending',
  created_at timestamp with time zone default now(),
  settled_at timestamp with time zone
);

-- 정산 요청 (Payout Requests)
create table if not exists payout_requests (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  nickname text not null,
  amount_credits integer not null,
  amount_krw integer not null,
  bank_name text,
  account_number text,
  account_holder text,
  status text default 'pending',
  admin_note text,
  tax_withheld integer default 0,
  final_amount_krw integer not null,
  created_at timestamp with time zone default now(),
  processed_at timestamp with time zone
);

-- 플랫폼 지갑 (Platform Treasury)
create table if not exists platform_treasury (
  id uuid default gen_random_uuid() primary key,
  total_platform_cut integer default 0,
  total_charged_krw integer default 0,
  total_payout_krw integer default 0,
  updated_at timestamp with time zone default now()
);

-- 이상거래 로그 (Fraud Detection Log)
create table if not exists fraud_logs (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  event_type text not null,
  description text not null,
  risk_level text default 'low',
  is_resolved boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable RLS (Row Level Security)
alter table wallets enable row level security;
alter table transactions enable row level security;
alter table charge_orders enable row level security;
alter table payout_requests enable row level security;

-- Enable realtime
alter publication supabase_realtime add table wallets;
alter publication supabase_realtime add table transactions;

-- Indexes for performance
create index if not exists idx_transactions_sender on transactions(sender_id);
create index if not exists idx_transactions_receiver on transactions(receiver_id);
create index if not exists idx_transactions_room on transactions(room_id);
create index if not exists idx_charge_orders_user on charge_orders(user_id);
create index if not exists idx_charge_orders_idempotency on charge_orders(idempotency_key);
