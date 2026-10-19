-- Usual climb times + gyms (Lucy 2026-10-19): every climber publishes
-- the weekly slots they usually climb (text[] of `${dow}:${part}`
-- keys) and the gyms they usually climb at, so others can search by
-- time and send climb invites that land in those slots.
--
-- The client degrades gracefully before this runs (the directory
-- select falls back to the pre-availability rung; profile writes log
-- and keep local state), so this is safe to run any time.
-- Safe to re-run.

alter table public.profiles
  add column if not exists usual_times text[] not null default '{}';

alter table public.profiles
  add column if not exists usual_gym_ids text[] not null default '{}';

create or replace view directory_profiles as
select id, display_name, photo_url, top_grade, home_gym_id, invite_code, boulder_grade, usual_times, usual_gym_ids
from public.profiles;
