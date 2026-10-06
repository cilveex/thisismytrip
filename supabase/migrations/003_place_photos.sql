-- Place photos: a public Storage bucket "place-photos".
--
--   anyone           → can view and list the photos (the family page shows them)
--   the admin only   → can upload and delete (is_trip_admin() from 002)
--
-- Run 002_admin_and_public.sql first. Paste into SQL Editor → Run. Safe to run more than once.

-- 1. The bucket. Photos are resized in the browser to ≤1600px wide WebP/JPEG, so 5 MB is plenty.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('place-photos', 'place-photos', true, 5242880, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. Policies on storage.objects, limited to this bucket.
drop policy if exists "Place photos readable"   on storage.objects;
drop policy if exists "Admin uploads place photos" on storage.objects;
drop policy if exists "Admin deletes place photos" on storage.objects;

create policy "Place photos readable" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'place-photos');

create policy "Admin uploads place photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'place-photos' and (select public.is_trip_admin()));

create policy "Admin deletes place photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'place-photos' and (select public.is_trip_admin()));

-- No update policy: the planner never overwrites a photo, it uploads a new file and deletes the old one.
