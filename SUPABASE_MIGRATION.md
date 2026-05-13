# Supabase Migration Guide

## What changed

- **Backend**: Google Apps Script + Sheets → Supabase (Postgres + Auth)
- **Auth**: Google Identity Services + custom OAuth flow → Supabase Auth with Google provider
- **Data model**: per-athlete Sheets → single multi-tenant DB with RLS by `athlete_id`
- **Removed**: `api/proxy.js`, `datalogger.js`, `router.js`, env vars `VITE_GOOGLE_CLIENT_ID`, `VITE_ROUTER_SCRIPT_URL`, `VITE_SHARED_TOKEN`

## Architecture

One Postgres DB. Every data table has `athlete_id`. Row-Level Security policies isolate:
- Athletes see only their own rows.
- Coaches see rows of athletes assigned to them (`athletes.coach_id`).
- Admin coaches (`coaches.is_admin = true`) see everything.

Goals can only be written by coaches.

## Setup steps

### 1. Create a Supabase project

1. Go to https://supabase.com, create new project.
2. Save the project URL and `anon` public key (Settings → API).

### 2. Run the schema

1. Open SQL Editor.
2. Paste contents of `supabase/schema.sql` and run.
3. Adjust the seed at the bottom: change `diegojp2005@gmail.com` to your admin email if different.

### 3. Enable Google OAuth

1. Authentication → Providers → Google → Enable.
2. Create a Google OAuth client (Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID, type Web app).
3. **Authorized JavaScript origins**: your Vercel URL (e.g. `https://trac-system.vercel.app`) and `http://localhost:5173`.
4. **Authorized redirect URIs**: `https://<project-ref>.supabase.co/auth/v1/callback`.
5. Paste the Google Client ID + Secret into Supabase Google provider settings.
6. In Supabase Authentication → URL Configuration:
   - Site URL: your Vercel URL
   - Redirect URLs: add `https://trac-system.vercel.app/login` and `http://localhost:5173/login`.

### 4. Set Vercel env vars

In Vercel → Project → Settings → Environment Variables, add:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```

Remove old vars: `VITE_GOOGLE_CLIENT_ID`, `VITE_ROUTER_SCRIPT_URL`, `VITE_SHARED_TOKEN`.

For local dev, put the same values in a `.env.local` file.

### 5. Seed athletes

Add athletes to the database. SQL Editor:

```sql
-- Replace with real data. coach_id is the admin coach inserted by the seed.
insert into athletes (email, name, coach_id)
values
  ('athlete1@gmail.com', 'Atleta Uno',
   (select id from coaches where email = 'diegojp2005@gmail.com')),
  ('athlete2@gmail.com', 'Atleta Dos',
   (select id from coaches where email = 'diegojp2005@gmail.com'));
```

Each athlete must sign in once with Google so Supabase creates their auth user; RLS resolves their data by email match against the `athletes` table.

### 6. (Optional) Import historical data

Existing Google Sheets data can be imported via SQL Editor (CSV upload). For each athlete:

1. Export `TRAC_database` and `Nutrition_database` tabs as CSV.
2. Use Table Editor → Import data via CSV, mapping columns to the snake_case names in `schema.sql`.
3. Set `athlete_id` on all imported rows manually (or import to a staging table then `update ... set athlete_id = ...`).

For goals: pick the latest snapshot and insert one row in `nutrition_goals` per athlete.

### 7. Deploy

```
git push
```

Vercel auto-deploys. After deploy, log in with the admin Google account.

## Local dev

```
npm install
echo "VITE_SUPABASE_URL=..." > .env.local
echo "VITE_SUPABASE_ANON_KEY=..." >> .env.local
npm run dev
```

## RLS sanity checks

In SQL Editor, run as anon to verify isolation:

```sql
-- Should return rows only when JWT email matches
select set_config('request.jwt.claims', '{"email":"athlete1@gmail.com"}', true);
select * from trac_entries;  -- only athlete1's rows
```

## Adding a new athlete (post-migration)

1. Insert row in `athletes` with their gmail + assign `coach_id`.
2. They sign in with Google. Supabase Auth creates the user.
3. RLS matches their email to `athletes.email` and grants access.

## Promoting/demoting admins

```sql
update coaches set is_admin = true where email = 'someone@gmail.com';
```
