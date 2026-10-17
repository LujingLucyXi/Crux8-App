-- Invite → automatic friendship (Lucy 2026-10-17): the follow
-- flow felt complicated; when someone JOINS Crux8 through another
-- person's invite link, the two should simply be cruxmates —
-- no separate follow step. The joiner's client can only insert
-- cruxmate_requests rows with from_id = auth.uid() (RLS), so the
-- mutual pair is created by this SECURITY DEFINER function, called
-- by the joiner right after the join completes. It also stamps
-- profiles.invited_by for attribution. Idempotent: safe to re-run,
-- safe to call twice.

alter table public.profiles
  add column if not exists invited_by uuid;

create or replace function public.befriend_inviter(p_inviter uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or p_inviter is null or p_inviter = auth.uid() then
    return;
  end if;

  update public.profiles
    set invited_by = p_inviter
    where id = auth.uid()
      and invited_by is distinct from p_inviter;

  insert into public.cruxmate_requests (from_id, to_id, status)
  values (auth.uid(), p_inviter, 'pending')
  on conflict (from_id, to_id) do update set status = 'pending';

  insert into public.cruxmate_requests (from_id, to_id, status)
  values (p_inviter, auth.uid(), 'pending')
  on conflict (from_id, to_id) do update set status = 'pending';
end;
$$;

grant execute on function public.befriend_inviter(uuid) to authenticated;
