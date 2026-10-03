# Tenerife 2026 trip planner

Mobile-first family trip planner for Tenerife (8–15 Dec 2026, 7 travellers).
Vite + React + TypeScript SPA, Tailwind CSS 4, Supabase (shared live state), Leaflet. Deploys to Vercel.

## Run locally

Requires Node 20+ and npm.

```sh
npm install
cp .env.example .env   # then fill in the values below
npm run dev            # http://localhost:5173
```

Other scripts: `npm run build` (typecheck + production build), `npm run preview`, `npm run lint`.

Without the Supabase variables the app still runs, but saves only to this browser's localStorage (the sync status says "This device only").

## Environment variables

| Variable | Where it's used | Where to find it |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Browser | Supabase → Project settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Browser | Supabase → Project settings → API → anon / publishable key |

Both are bundled into the client and are public by design (access is limited by the row-level security policies in the migration). Never commit `.env` anyway.

## Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor**, paste the contents of `supabase/migrations/001_trips.sql`, and click **Run**. It is safe to run more than once.
3. Put the project URL and anon key in `.env`.

The migration creates a `trips` table with one shared row (`id = 'tenerife-2026'`) that holds the whole trip as JSON, and enables realtime for it. The app seeds that row on first load.

There is no login: anyone with the app URL can read and edit this one trip (but not delete it).
