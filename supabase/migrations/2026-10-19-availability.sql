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

-- View recipe MUST stay complete (the short version that shipped
-- here on 2026-10-19 dropped quiz/avatar/about columns and broke
-- DNA display until the 2026-10-20 bolt migration restored them).
drop view if exists public.directory_profiles;

create view public.directory_profiles
with (security_invoker = false)
as
select id, display_name, photo_url, top_grade, boulder_grade,
       home_gym_id, invite_code, usual_times, usual_gym_ids,
       quiz_result_type, quiz_house_id, avatar, about, signature,
       preferred_styles, location, verifications
  from public.profiles;
