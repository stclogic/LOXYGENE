create table if not exists users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  nickname text not null,
  password_hash text,
  provider text default 'email',
  provider_id text,
  avatar_url text,
  role text default 'user',
  coins integer default 1000,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter publication supabase_realtime add table users;
