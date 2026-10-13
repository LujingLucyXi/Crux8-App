-- Crux8 session lifecycle (2026-10-13)
-- Manual start/finish for sessions, synced across devices.
-- Run once in the Supabase SQL Editor (project Crux8_Climber_DNA).

-- 1) Lifecycle stamps on the session row. NULL = not started / not finished.
alter table public.sessions
  add column if not exists started_at timestamptz,
  add column if not exists finished_at timestamptz;

-- 2) Participant-safe setter.
-- The sessions UPDATE policy is host-scoped, but ANY participant (host or a
-- 'going' RSVP) must be able to start/finish. This SECURITY DEFINER function
-- checks participation, then stamps ONLY the lifecycle columns.
-- coalesce = first tap wins, so simultaneous taps never overwrite each other.
create or replace function public.set_session_lifecycle(
  p_session_id text,
  p_started_at timestamptz default null,
  p_finished_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.sessions s
    where s.id::text = p_session_id
      and (
        s.host_id = auth.uid()
        or exists (
          select 1 from public.session_rsvps r
          where r.session_id = s.id
            and r.user_id = auth.uid()
            and r.status = 'going'
        )
      )
  ) then
    raise exception 'not a participant of this session';
  end if;

  update public.sessions
  set started_at  = coalesce(started_at,  p_started_at),
      finished_at = coalesce(finished_at, p_finished_at)
  where id::text = p_session_id;
end;
$$;

grant execute on function public.set_session_lifecycle(text, timestamptz, timestamptz)
  to authenticated;
