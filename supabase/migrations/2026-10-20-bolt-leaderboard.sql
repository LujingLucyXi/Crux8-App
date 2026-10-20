-- Bolt leaderboard (Lucy 2026-10-20): Charge (the bolt meter) is
-- earned and decayed on-device; for a daily leaderboard the current
-- value syncs up to the profile. bolt_day is the owner's last
-- active day ('YYYY-MM-DD', their local day) — readers apply the
-- same decay rule (2 grace days, then -8/day) at read time, so a
-- stale high score fades on the board exactly like it does in the
-- owner's app.
-- Run in the Supabase SQL editor. Safe to re-run.

alter table public.profiles add column if not exists bolt_charge int not null default 0;
alter table public.profiles add column if not exists bolt_day text;

-- directory_profiles view: recreated WITH the bolt columns (same
-- recipe as the availability migration).
create or replace view public.directory_profiles
with (security_invoker = false)
as
select id, display_name, handle, photo_url, avatar, grade_system,
       boulder_grade, top_grade, home_gym_id, styles, city,
       founding_no, quiz_result_type, quiz_house_id, usual_times,
       usual_gym_ids, bolt_charge, bolt_day
  from public.profiles;
