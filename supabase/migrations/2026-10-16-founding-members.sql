-- Founding members (Lucy 2026-10-16): the first 88 accounts ever
-- created carry Founding Member status forever, shown on the profile.
-- Ranked by profiles.created_at. A view keeps the rule honest and
-- server-side — no client can fake its number.
create or replace view public.founding_members as
with ranked as (
  select id, row_number() over (order by created_at asc) as rn
  from public.profiles
)
select id, rn as founding_no
from ranked
where rn <= 88;

grant select on public.founding_members to anon, authenticated;
