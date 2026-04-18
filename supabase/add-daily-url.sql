-- Add Daily.co room fields to existing rooms table
alter table rooms add column if not exists daily_room_name text;
alter table rooms add column if not exists daily_room_url text;
