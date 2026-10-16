-- Boulder grade (2026-10-16): climbers state a V-scale boulder grade
-- separately from their rope grade (profiles.top_grade). Boulderers had
-- no grade they could pick — Edit profile only offered YDS rope grades.
-- The client writes boulder_grade through the normal profile upsert
-- (degrades gracefully before this runs) and reads it via select *;
-- recreate the directory view so other climbers can see it too.

alter table public.profiles
  add column if not exists boulder_grade text;

create or replace view directory_profiles as
select id, display_name, photo_url, top_grade, home_gym_id, invite_code, boulder_grade
from public.profiles;
