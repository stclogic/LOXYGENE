-- Super Admin RLS bypass + action logging
-- Run this migration in Supabase SQL editor

-- ── admin_action_logs table ──────────────────────────────────────────────────
create table if not exists public.admin_action_logs (
  id              uuid primary key default gen_random_uuid(),
  admin_id        text not null,
  action          text not null,           -- 'force_close' | 'kick'
  target_room_id  text,
  metadata        jsonb default '{}',
  created_at      timestamptz default now()
);

-- Only super admin can read logs (enforced at API layer too)
alter table public.admin_action_logs enable row level security;

create policy "admin_logs_insert" on public.admin_action_logs
  for insert with check (true);             -- API route already validates isSuperAdmin

create policy "admin_logs_select" on public.admin_action_logs
  for select using (false);                 -- never expose via client

-- ── RLS bypass helper: allow service role full access to all tables ───────────
-- The API routes use SUPABASE_SECRET_KEY (service role) which already bypasses RLS.
-- These policies allow the admin API routes to operate without errors even when
-- the calling client would otherwise be blocked.

-- rooms: admin can force-close any room
create policy "admin_force_close_rooms" on public.rooms
  for update using (true) with check (true);

-- room_participants: admin can kick any participant
create policy "admin_kick_participants" on public.room_participants
  for update using (true) with check (true);
