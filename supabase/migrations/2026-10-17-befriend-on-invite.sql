-- Invite → automatic friendship (Lucy 2026-10-17): anyone I invite
-- — to a session, a climb call, or my crew — becomes my cruxmate
-- automatically. No separate follow step, no waiting for a
-- follow-back: the follow-step redundancy in the invite flow is the
-- bug this removes (her field case: a man she invited and who
-- already followed her still wasn't in her friend list).
--
-- The inviter's client can only insert cruxmate_requests rows with
-- from_id = auth.uid() (RLS), so the mutual pair is created by this
-- SECURITY DEFINER function, called by the inviter at invite-send
-- time. Same shape as befriend_inviter (2026-10-17-invite-
-- autofriend.sql) minus the profiles.invited_by stamp — that one
-- attributes link joins; this one carries no attribution.
-- The upserts also revive a 'denied' leftover row from the brief
-- request/accept era (SECURITY DEFINER bypasses the sender-side
-- revive policy), so a stuck one-way state heals on the next invite.
-- Idempotent: safe to re-run, safe to call twice.

create or replace function public.befriend_user(p_other uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or p_other is null or p_other = auth.uid() then
    return;
  end if;

  insert into public.cruxmate_requests (from_id, to_id, status)
  values (auth.uid(), p_other, 'pending')
  on conflict (from_id, to_id) do update set status = 'pending';

  insert into public.cruxmate_requests (from_id, to_id, status)
  values (p_other, auth.uid(), 'pending')
  on conflict (from_id, to_id) do update set status = 'pending';
end;
$$;

grant execute on function public.befriend_user(uuid) to authenticated;
