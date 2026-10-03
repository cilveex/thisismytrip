-- Tenerife trip planner: private planner row + public family row.
--
--   tenerife-2026         full plan        → only the admin can read and write
--   tenerife-2026-public  family-facing    → anyone can read, only the admin can write
--
-- BEFORE RUNNING: replace 00000000-0000-0000-0000-000000000000 below with your user id
-- (Authentication → Users → your user → User UID). Then paste into SQL Editor → Run.
-- Safe to run more than once. Run 001_trips.sql first if the table doesn't exist yet.

-- 1. Who is the admin. The only place the user id appears.
create or replace function public.is_trip_admin()
returns boolean
language plpgsql
stable
set search_path = ''
as $$
declare
  admin_id constant uuid := '00000000-0000-0000-0000-000000000000';
begin
  if admin_id = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'Set your admin user id in is_trip_admin() before running this script';
  end if;
  return auth.uid() = admin_id;
end;
$$;

-- Fail now (not later) if the placeholder is still there.
do $$ begin perform public.is_trip_admin(); end $$;

-- 2. Table privileges: visitors may only read; signed-in users may read/insert/update (rows still filtered by RLS).
revoke all on public.trips from anon;
grant select on public.trips to anon;
grant select, insert, update on public.trips to authenticated;
revoke delete on public.trips from anon, authenticated;
grant all on public.trips to service_role;
alter table public.trips enable row level security;

-- 3. Policies. Drop the old open ones and any previous version of these.
drop policy if exists "Shared trip readable"   on public.trips;
drop policy if exists "Shared trip insertable" on public.trips;
drop policy if exists "Shared trip editable"   on public.trips;
drop policy if exists "Public trip readable"   on public.trips;
drop policy if exists "Admin reads trips"      on public.trips;
drop policy if exists "Admin inserts trips"    on public.trips;
drop policy if exists "Admin updates trips"    on public.trips;

create policy "Public trip readable" on public.trips
  for select to anon, authenticated
  using (id = 'tenerife-2026-public');

create policy "Admin reads trips" on public.trips
  for select to authenticated
  using ((select public.is_trip_admin()) and id in ('tenerife-2026', 'tenerife-2026-public'));

create policy "Admin inserts trips" on public.trips
  for insert to authenticated
  with check ((select public.is_trip_admin()) and id in ('tenerife-2026', 'tenerife-2026-public'));

create policy "Admin updates trips" on public.trips
  for update to authenticated
  using ((select public.is_trip_admin()) and id in ('tenerife-2026', 'tenerife-2026-public'))
  with check ((select public.is_trip_admin()) and id in ('tenerife-2026', 'tenerife-2026-public'));

-- 4. The public row exists from the start (the planner fills it on first login).
insert into public.trips (id, data) values ('tenerife-2026-public', '{}'::jsonb)
on conflict (id) do nothing;

-- 5. Realtime (already set up by 001; repeated here so this file works on its own).
alter table public.trips replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trips'
  ) then
    alter publication supabase_realtime add table public.trips;
  end if;
end $$;
