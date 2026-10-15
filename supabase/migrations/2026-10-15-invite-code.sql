-- Personal invite codes (2026-10-15): every climber gets one unique
-- invite code (e.g. LUCY-8K42) printed on their share card and encoded in
-- their personal add link (crux8.app/add/:code).
--
-- The client generates its own code on first need and writes it through
-- the normal profiles upsert (fire-and-forget: the write degrades
-- gracefully when this column doesn't exist yet). Run this migration for
-- full cross-device lookup — without it, a code only resolves on the
-- device that generated it, plus seed users whose codes are deterministic.

alter table public.profiles
  add column if not exists invite_code text;

create unique index if not exists profiles_invite_code_uidx
  on public.profiles (invite_code);

-- directory_profiles is the security-definer view over public.profiles
-- exposing the columns shown next to other users' names; recreate it with
-- invite_code so the client can resolve a code to a public profile without
-- touching the profiles RLS policy. CREATE OR REPLACE keeps the view's
-- owner, grants, and options untouched.
create or replace view directory_profiles as
select id, display_name, photo_url, top_grade, home_gym_id, invite_code
from public.profiles;
