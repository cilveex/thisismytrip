-- Tenerife trip planner: one shared row holding the whole trip as JSON.
-- Paste into Supabase → SQL Editor → Run. Safe to run more than once.

create table if not exists public.trips (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.trips to anon, authenticated;
grant all on public.trips to service_role;

alter table public.trips enable row level security;

-- Anyone with the app link can read and edit this one trip (no login). No deletes.
drop policy if exists "Shared trip readable"   on public.trips;
drop policy if exists "Shared trip insertable" on public.trips;
drop policy if exists "Shared trip editable"   on public.trips;
create policy "Shared trip readable"   on public.trips for select to anon, authenticated using (id = 'tenerife-2026');
create policy "Shared trip insertable" on public.trips for insert to anon, authenticated with check (id = 'tenerife-2026');
create policy "Shared trip editable"   on public.trips for update to anon, authenticated using (id = 'tenerife-2026') with check (id = 'tenerife-2026');

-- Realtime: send full rows on change.
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
