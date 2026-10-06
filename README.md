# Tenerife 2026 trip planner

Mobile-first family trip planner for Tenerife (8–15 Dec 2026, 7 travellers).

- `/` — public, read-only trip page for the family (no login)
- `/plan` — the private planner (Map, Stay, Budget, Days, Info), behind a password

The public page's text lives in `src/public/i18n.ts` (Latvian is the default; any key missing in Latvian shows the English text). Day descriptions and good-to-know tips are written in both languages in the planner.
Vite + React + TypeScript SPA, Tailwind CSS 4, Supabase (shared live state), Leaflet. Deploys to Vercel.

## Run locally

Requires Node 20+ and npm.

```sh
npm install
cp .env.example .env   # then fill in the values below
npm run dev            # http://localhost:5173
```

Other scripts: `npm run build` (typecheck + production build), `npm run preview`, `npm run lint`.


## Environment variables

| Variable | Where it's used | Where to find it |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Browser | Supabase → Project settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Browser | Supabase → Project settings → API → anon / publishable key |
| `VITE_ADMIN_EMAIL` | Browser (login) | The email of the planner user you create in Supabase → Authentication → Users |

All three are bundled into the client and are public by design; access is enforced by Supabase Auth and the row-level security policies. The password is never in the code. Never commit `.env` anyway.

## Supabase setup

1. Create a Supabase project.
2. **SQL Editor:** run `supabase/migrations/001_trips.sql` (creates the `trips` table and realtime).
3. **Authentication → Users → Add user → Create new user:** your email and a strong password, with "Auto Confirm User" on.
4. **Authentication → Sign In / Providers:** turn off "Allow new users to sign up".
5. **Authentication → Users → your user:** copy the User UID.
6. **SQL Editor:** open `supabase/migrations/002_admin_and_public.sql`, replace the zero UUID in `is_trip_admin()` (it appears once) with your UID, and run it. Safe to run again. If the zeros are left in, nobody is admin and nothing can be saved.
7. **SQL Editor:** run `supabase/migrations/003_place_photos.sql` (the public `place-photos` Storage bucket: anyone can view, only the admin can upload and delete). Safe to run again.
8. Put the URL, anon key and admin email in `.env` (and in Vercel), then log in at `/plan`.

The `trips` table has two rows. `tenerife-2026` is the full plan: only the admin can read or write it. `tenerife-2026-public` is the family copy: anyone can read it, only the admin can write it. The planner rebuilds the public copy on every save, so it only ever contains flights, places marked "show to family" (with their price, photos and family note, never the private notes), the family day texts, good-to-know tips and traveller names.

Place photos (up to 5 per place) are resized in the browser to at most 1600px wide WebP (JPEG where WebP can't be encoded) and stored under `place-photos/<place id>/`. Removing a photo or deleting the place deletes its files. Pasted image links are stored as they are. Without Supabase, uploads are kept in the browser as data URLs.

Without the Supabase variables the planner opens without a login and saves to this browser only (handy for development).

## Keeping Supabase awake

Free Supabase projects pause after 7 days without activity. `vercel.json` schedules a daily Vercel cron (06:00 UTC) that calls `api/keepalive.ts`, which does one read of the public trip row with the same `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` env vars. It never writes, and always answers 200 (failures are only logged).

Optional: set `CRON_SECRET` in Vercel to any random string. Vercel's cron sends it automatically, and the endpoint then refuses other callers.

## Backups

Planner → Info → Backup: **Download backup** saves the whole shared trip as `tenerife-trip-YYYY-MM-DD.json`. **Restore from backup** checks the file, shows what's in it next to the current plan, and replaces the shared trip only after you confirm.
