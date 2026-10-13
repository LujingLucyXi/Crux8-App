-- Crux8 peer-confirmed belay verification (2026-10-13)
-- Design: self-report writes profiles.verifications ('self_attested').
-- After real sessions, partners answer the recap belay question; each answer
-- syncs via submit_belay_confirm into belay_confirms (insert-only, private).
-- When 2 DISTINCT partners have confirmed 'has_cert' for a skill (and fewer
-- than 2 distinct partners said 'no_cert'), the server flips that skill to
-- 'verified' — the peer-confirmed badge. Individual answers are never exposed
-- to the subject; only the badge and the positive count are public.
-- Run once in the Supabase SQL Editor (project Crux8_Climber_DNA).

-- 1) Public verification status on the profile row.
--    Shape: {"top_rope": "self_attested" | "verified", "lead": ..., "trad": ...}
alter table public.profiles
  add column if not exists verifications jsonb not null default '{}'::jsonb;

-- 2) Private partner confirms. No SELECT policy for users: the table is
--    write-via-RPC / read-via-aggregate-RPC only.
create table if not exists public.belay_confirms (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  reporter_id uuid not null,
  subject_id uuid not null,
  category text not null check (category in ('top_rope', 'lead', 'trad')),
  value text not null check (value in ('has_cert', 'no_cert', 'unsure')),
  created_at timestamptz not null default now(),
  unique (session_id, reporter_id, subject_id)
);
alter table public.belay_confirms enable row level security;

-- 3) Recompute one subject's peer-confirmed status from all confirms.
create or replace function public.recompute_peer_verification(p_subject uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cat text;
  yes_count int;
  no_count int;
  cur jsonb;
  newv jsonb;
begin
  select verifications into cur from public.profiles where id = p_subject;
  if cur is null then
    cur := '{}'::jsonb;
  end if;
  newv := cur;
  foreach cat in array array['top_rope', 'lead', 'trad'] loop
    select
      count(distinct reporter_id) filter (where value = 'has_cert'),
      count(distinct reporter_id) filter (where value = 'no_cert')
    into yes_count, no_count
    from public.belay_confirms
    where subject_id = p_subject and category = cat;

    if yes_count >= 2 and no_count < 2 then
      newv := jsonb_set(newv, array[cat], '"verified"');
    elsif no_count >= 2 and (cur ->> cat) = 'verified' then
      -- A pattern of "No"s revokes a previously earned badge.
      newv := jsonb_set(newv, array[cat], '"self_attested"');
    end if;
  end loop;
  if newv <> cur then
    update public.profiles set verifications = newv where id = p_subject;
  end if;
end;
$$;

-- 4) Submit one confirm. The category is derived from the SESSION's type
--    (rope session -> top_rope, lead/sport -> lead, trad/multi-pitch -> trad),
--    and the reporter must actually be part of that session.
create or replace function public.submit_belay_confirm(
  p_session_id uuid,
  p_subject_id uuid,
  p_value text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sess_category text;
  vcat text;
begin
  if p_value not in ('has_cert', 'no_cert', 'unsure') then
    raise exception 'invalid value';
  end if;
  if p_subject_id = auth.uid() then
    raise exception 'cannot confirm yourself';
  end if;

  select category into sess_category from public.sessions where id = p_session_id;
  if sess_category is null then
    raise exception 'session not found';
  end if;
  vcat := case sess_category
    when 'top_rope' then 'top_rope'
    when 'lead' then 'lead'
    when 'outdoor_sport' then 'lead'
    when 'trad' then 'trad'
    when 'multi_pitch' then 'trad'
    else null
  end;
  if vcat is null then
    return; -- boulder/hiking sessions carry no belay verification
  end if;

  if not exists (
    select 1 from public.sessions s
    where s.id = p_session_id
      and (
        s.host_id = auth.uid()
        or exists (
          select 1 from public.session_rsvps r
          where r.session_id = s.id and r.user_id = auth.uid() and r.status = 'going'
        )
      )
  ) then
    raise exception 'not a participant of this session';
  end if;

  insert into public.belay_confirms (session_id, reporter_id, subject_id, category, value)
  values (p_session_id, auth.uid(), p_subject_id, vcat, p_value)
  on conflict (session_id, reporter_id, subject_id)
  do update set value = excluded.value, category = excluded.category;

  perform public.recompute_peer_verification(p_subject_id);
end;
$$;

-- 5) Public read of verification status for a batch of users (directory).
create or replace function public.get_public_verifications(p_ids uuid[])
returns table (id uuid, verifications jsonb)
language sql
security definer
set search_path = public
as $$
  select p.id, p.verifications from public.profiles p where p.id = any(p_ids);
$$;

-- 6) Positive confirm counts for one user (the "confirmed by N cruxmates" line).
create or replace function public.get_belay_confirm_counts(p_subject uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_object_agg(category, yes_count),
    '{}'::jsonb
  )
  from (
    select category, count(distinct reporter_id) as yes_count
    from public.belay_confirms
    where subject_id = p_subject and value = 'has_cert'
    group by category
  ) t;
$$;

grant execute on function public.submit_belay_confirm(uuid, uuid, text) to authenticated;
grant execute on function public.get_public_verifications(uuid[]) to authenticated;
grant execute on function public.get_belay_confirm_counts(uuid) to authenticated;
