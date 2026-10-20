-- Bolt leaderboard (Lucy 2026-10-20): Charge (the bolt meter) is
-- earned and decayed on-device; for a daily leaderboard the current
-- value syncs up to the profile. bolt_day is the owner's last
-- active day ('YYYY-MM-DD', their local day) — readers apply the
-- same decay rule (2 grace days, then -8/day) at read time, so a
-- stale high score fades on the board exactly like it does in the
-- owner's app.
--
-- IMPORTANT: this also RESTORES the full directory_profiles column
-- set. The 2026-10-19 availability migration recreated the view
-- with a short column list, which silently dropped quiz_result_type
-- / quiz_house_id / avatar / about / verifications from the public
-- directory — climbers' DNA archetypes (Lucy: "I still don't see
-- my DNA on profile") and custom avatars stopped showing for other
-- people. The recipe below is the complete one; every future view
-- recreation must carry ALL of these columns.
-- Run in the Supabase SQL editor. Safe to re-run.

alter table public.profiles add column if not exists bolt_charge int not null default 0;
alter table public.profiles add column if not exists bolt_day text;

create or replace view public.directory_profiles
with (security_invoker = false)
as
select id, display_name, photo_url, top_grade, boulder_grade,
       home_gym_id, invite_code, usual_times, usual_gym_ids,
       quiz_result_type, quiz_house_id, avatar, about, signature,
       preferred_styles, location, verifications,
       bolt_charge, bolt_day
  from public.profiles;
