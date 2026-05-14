-- Fix RLS infinite recursion on helper functions.
-- Helper functions queried `coaches`/`athletes` which re-triggered RLS
-- (RLS policies call these same helpers) → infinite loop → 500 errors.
-- Mark them SECURITY DEFINER so they bypass RLS when checking membership.

create or replace function auth_email() returns text
language sql stable security definer set search_path = public as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'email', ''),
    (auth.jwt() ->> 'email')
  );
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from coaches
    where email = auth_email() and is_admin = true
  );
$$;

create or replace function is_coach() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from coaches where email = auth_email());
$$;

create or replace function current_coach_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from coaches where email = auth_email();
$$;

create or replace function current_athlete_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from athletes where email = auth_email();
$$;

create or replace function can_access_athlete(target_athlete_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select
    is_admin()
    or exists (
      select 1 from athletes
      where id = target_athlete_id
        and (
          email = auth_email()
          or coach_id = current_coach_id()
        )
    );
$$;
