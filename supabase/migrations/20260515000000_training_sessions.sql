-- Training sessions table: one row per athlete per day.
-- sRPE = RPE × duration_min (Foster session-RPE method).
-- Rest day = rpe=0, duration_min=0, srpe=0.
-- Athletes can insert sessions up to 7 days back, but can only update/delete today's.
-- Coaches (admins) can do anything on their athletes' rows.

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
