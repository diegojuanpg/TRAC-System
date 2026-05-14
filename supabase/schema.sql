-- ════════════════════════════════════════════════════════════════════════
-- TRAC SYSTEM — Supabase Schema
-- Multi-tenant via athlete_id + RLS. One DB, isolation per athlete.
-- ════════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ───── COACHES ─────────────────────────────────────────────────────────
create table if not exists coaches (
  id          uuid primary key default uuid_generate_v4(),
  email       text unique not null,
  name        text,
  is_admin    boolean default false,
  created_at  timestamptz default now()
);

-- ───── ATHLETES ────────────────────────────────────────────────────────
create table if not exists athletes (
  id          uuid primary key default uuid_generate_v4(),
  email       text unique not null,
  name        text,
  coach_id    uuid references coaches(id) on delete set null,
  created_at  timestamptz default now()
);

create index if not exists athletes_coach_idx on athletes(coach_id);

-- ───── TRAC ENTRIES (daily morning survey + computed metrics) ─────────
create table if not exists trac_entries (
  id                  uuid primary key default uuid_generate_v4(),
  athlete_id          uuid not null references athletes(id) on delete cascade,
  date                date not null,
  measurement_time    text,
  protocol_confirmed  text,
  context_flag        text,

  -- raw inputs
  bodyweight          numeric,
  tap_speed_test      numeric,
  tap_variance        numeric,
  tap_pauses          numeric,
  hr1                 numeric,
  hr2                 numeric,
  hr3                 numeric,
  hr4                 numeric,
  ortho_response      numeric,
  vagal_recovery      numeric,
  postural_cost       numeric,
  pots_flag           text,
  push_soreness       numeric,
  pull_soreness       numeric,
  legs_soreness       numeric,
  injury              numeric,
  fatigue_input       numeric,
  workload            numeric,
  recovery            numeric,
  sleep_hours         numeric,
  sleep_quality       numeric,
  nutrition_quality   numeric,
  motivation          numeric,

  -- z-scores
  z_tap_speed         numeric,
  z_tap_var           numeric,
  z_hr1               numeric,
  z_hr2               numeric,
  z_hr3               numeric,
  z_hr4               numeric,
  z_ortho             numeric,
  z_vagal             numeric,
  z_postural          numeric,
  z_push              numeric,
  z_pull              numeric,
  z_legs              numeric,
  z_injury            numeric,
  z_fatigue           numeric,
  z_workload          numeric,
  z_recovery          numeric,
  z_sleep_h           numeric,
  z_sleep_q           numeric,
  z_nutrition         numeric,
  z_motivation        numeric,

  -- composites
  fatigue             numeric,
  fitness             numeric,
  readiness           numeric,
  z_readiness         numeric,
  peripheral_stress   numeric,
  central_stress      numeric,
  stf                 numeric,
  ltf                 numeric,
  stf_ltf_ratio       numeric,
  ans_profile         text,
  trend_7d            text,
  alert_level         numeric,
  trac_action         text,

  created_at          timestamptz default now(),
  unique (athlete_id, date)
);

create index if not exists trac_entries_athlete_date_idx
  on trac_entries(athlete_id, date desc);

-- ───── NUTRITION ENTRIES (daily nutrition log) ────────────────────────
create table if not exists nutrition_entries (
  id          uuid primary key default uuid_generate_v4(),
  athlete_id  uuid not null references athletes(id) on delete cascade,
  date        date not null,
  bodyweight  numeric,
  calories    numeric,
  protein     numeric,
  carbs       numeric,
  fat         numeric,
  fiber       numeric,
  water       numeric,
  steps       integer,
  cardio      text,
  created_at  timestamptz default now(),
  unique (athlete_id, date)
);

create index if not exists nutrition_entries_athlete_date_idx
  on nutrition_entries(athlete_id, date desc);

-- ───── NUTRITION GOALS (current goals, 1 row per athlete) ─────────────
create table if not exists nutrition_goals (
  athlete_id            uuid primary key references athletes(id) on delete cascade,
  mode                  text check (mode in ('cut','maintenance','bulk')),
  start_weight          numeric,
  start_weight_mode     text,
  target_weight         numeric,
  target_rate_per_week  numeric,
  target_date           date,
  maintenance_kcal      numeric,
  maintenance_mode      text,
  kcal_adj_per_day      numeric,
  balance_kcal          numeric,
  protein_per_kg        numeric,
  protein_pct           numeric,
  protein_target        numeric,
  protein_unit          text,
  fat_per_kg            numeric,
  fat_pct               numeric,
  fat_target            numeric,
  fat_unit              text,
  carbs_per_kg          numeric,
  carbs_pct             numeric,
  carbs_target          numeric,
  carbs_unit            text,
  kcal_target           numeric,
  fiber_target          numeric,
  cardio_target         numeric,
  water_target          numeric,
  steps_target          numeric,
  updated_at            timestamptz default now(),
  prescribed_by         text,
  note                  text
);

-- ───── NUTRITION GOALS HISTORY (append-only audit) ────────────────────
create table if not exists nutrition_goals_history (
  id           uuid primary key default uuid_generate_v4(),
  athlete_id   uuid not null references athletes(id) on delete cascade,
  changed_at   timestamptz default now(),
  changed_by   text,
  snapshot     jsonb not null,
  note         text
);

create index if not exists goals_history_athlete_idx
  on nutrition_goals_history(athlete_id, changed_at desc);

-- ───── REFEEDS ────────────────────────────────────────────────────────
create table if not exists refeeds (
  id          uuid primary key default uuid_generate_v4(),
  athlete_id  uuid not null references athletes(id) on delete cascade,
  date        date not null,
  note        text,
  created_at  timestamptz default now(),
  unique (athlete_id, date)
);

create index if not exists refeeds_athlete_date_idx
  on refeeds(athlete_id, date desc);

-- ───── TRAINING SESSIONS (sRPE Foster method) ─────────────────────────
create table if not exists training_sessions (
  id            uuid primary key default uuid_generate_v4(),
  athlete_id    uuid not null references athletes(id) on delete cascade,
  date          date not null,
  rpe           numeric not null check (rpe >= 0 and rpe <= 10),
  duration_min  numeric not null check (duration_min >= 0),
  srpe          numeric generated always as (rpe * duration_min) stored,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (athlete_id, date)
);

create index if not exists training_sessions_athlete_date_idx
  on training_sessions(athlete_id, date desc);


-- ════════════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS (used by RLS policies)
-- ════════════════════════════════════════════════════════════════════════

-- All helpers run SECURITY DEFINER so they bypass RLS on inner queries.
-- Otherwise RLS policies that call these helpers would re-trigger the
-- policies recursively → infinite loop → 500 errors.

create or replace function auth_email() returns text
language sql stable security definer set search_path = public as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'email', ''),
    (auth.jwt() ->> 'email')
  );
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from coaches where email = auth_email() and is_admin = true);
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
  select is_admin() or exists (
    select 1 from athletes where id = target_athlete_id
      and (email = auth_email() or coach_id = current_coach_id())
  );
$$;


-- ════════════════════════════════════════════════════════════════════════
-- ROW-LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════════════

alter table coaches                 enable row level security;
alter table athletes                enable row level security;
alter table trac_entries            enable row level security;
alter table nutrition_entries       enable row level security;
alter table nutrition_goals         enable row level security;
alter table nutrition_goals_history enable row level security;
alter table refeeds                 enable row level security;

-- ─── COACHES ─────────────────────────────────────────────────────────
drop policy if exists coaches_select on coaches;
create policy coaches_select on coaches for select
  using (email = auth_email() or is_admin());

drop policy if exists coaches_admin_write on coaches;
create policy coaches_admin_write on coaches for all
  using (is_admin()) with check (is_admin());

-- ─── ATHLETES ────────────────────────────────────────────────────────
drop policy if exists athletes_select on athletes;
create policy athletes_select on athletes for select
  using (
    email = auth_email()
    or coach_id = current_coach_id()
    or is_admin()
  );

drop policy if exists athletes_coach_write on athletes;
create policy athletes_coach_write on athletes for all
  using (is_coach()) with check (is_coach());

-- ─── TRAC ENTRIES ────────────────────────────────────────────────────
drop policy if exists trac_select on trac_entries;
create policy trac_select on trac_entries for select
  using (can_access_athlete(athlete_id));

drop policy if exists trac_write on trac_entries;
create policy trac_write on trac_entries for all
  using (can_access_athlete(athlete_id))
  with check (can_access_athlete(athlete_id));

-- ─── NUTRITION ENTRIES ───────────────────────────────────────────────
drop policy if exists nutrition_select on nutrition_entries;
create policy nutrition_select on nutrition_entries for select
  using (can_access_athlete(athlete_id));

drop policy if exists nutrition_write on nutrition_entries;
create policy nutrition_write on nutrition_entries for all
  using (can_access_athlete(athlete_id))
  with check (can_access_athlete(athlete_id));

-- ─── NUTRITION GOALS ─────────────────────────────────────────────────
drop policy if exists goals_select on nutrition_goals;
create policy goals_select on nutrition_goals for select
  using (can_access_athlete(athlete_id));

-- Only coaches can write goals
drop policy if exists goals_write on nutrition_goals;
create policy goals_write on nutrition_goals for all
  using (is_coach() and can_access_athlete(athlete_id))
  with check (is_coach() and can_access_athlete(athlete_id));

-- ─── NUTRITION GOALS HISTORY ─────────────────────────────────────────
drop policy if exists goals_history_select on nutrition_goals_history;
create policy goals_history_select on nutrition_goals_history for select
  using (can_access_athlete(athlete_id));

drop policy if exists goals_history_insert on nutrition_goals_history;
create policy goals_history_insert on nutrition_goals_history for insert
  with check (is_coach() and can_access_athlete(athlete_id));

-- ─── REFEEDS ─────────────────────────────────────────────────────────
drop policy if exists refeeds_select on refeeds;
create policy refeeds_select on refeeds for select
  using (can_access_athlete(athlete_id));

drop policy if exists refeeds_write on refeeds;
create policy refeeds_write on refeeds for all
  using (can_access_athlete(athlete_id))
  with check (can_access_athlete(athlete_id));

-- ─── TRAINING SESSIONS ───────────────────────────────────────────────
alter table training_sessions enable row level security;

drop policy if exists training_sessions_select on training_sessions;
create policy training_sessions_select on training_sessions for select
  using (can_access_athlete(athlete_id));

drop policy if exists training_sessions_insert on training_sessions;
create policy training_sessions_insert on training_sessions for insert
  with check (
    is_coach()
    or (current_athlete_id() = athlete_id and date >= current_date - 7 and date <= current_date)
  );

drop policy if exists training_sessions_update on training_sessions;
create policy training_sessions_update on training_sessions for update
  using (
    is_coach()
    or (current_athlete_id() = athlete_id and date = current_date)
  )
  with check (
    is_coach()
    or (current_athlete_id() = athlete_id and date = current_date)
  );

drop policy if exists training_sessions_delete on training_sessions;
create policy training_sessions_delete on training_sessions for delete
  using (
    is_coach()
    or (current_athlete_id() = athlete_id and date = current_date)
  );


-- ════════════════════════════════════════════════════════════════════════
-- SEED — initial admin coach
-- Adjust before running. Athletes are added later via the admin panel.
-- ════════════════════════════════════════════════════════════════════════

insert into coaches (email, name, is_admin)
values ('diegojp2005@gmail.com', 'Diego', true)
on conflict (email) do update set is_admin = true;
