-- Rich directory (2026-10-16): the profile card you see when you tap
-- a friend / someone you follow needs more than a name and grades —
-- it needs their avatar, story, styles and Climber DNA. Recreate the
-- directory view with those public fields appended (existing columns
-- keep their order; weight/height and other private fields stay OUT).
-- The client degrades gracefully until this runs (it tries the rich
-- select first, then falls back), so order vs. the app deploy is free.

create or replace view directory_profiles as
select id, display_name, photo_url, top_grade, home_gym_id, invite_code, boulder_grade,
       avatar, about, signature, preferred_styles, quiz_result_type, quiz_house_id, location
from public.profiles;
