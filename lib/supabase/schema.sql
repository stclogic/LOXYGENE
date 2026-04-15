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
