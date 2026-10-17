-- ─────────────────────────────────────────────────────────────────
-- 2026-10-17 · Session join mode: Free join vs Approval needed
-- (Lucy: an alt account RSVP'd straight in — hosts must be able to
-- require approval.) Sessions gain join_mode ('open' | 'approval',
-- default 'open'); approval requests reuse session_rsvps.status =
-- 'requested' (participants are only ever the 'going' rows, so every
-- existing read keeps working). Hosts need UPDATE/DELETE rights on
-- RSVP rows for their own sessions to approve / decline.
-- IDEMPOTENT: safe to run more than once.
-- ─────────────────────────────────────────────────────────────────

alter table sessions
  add column if not exists join_mode text not null default 'open';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'sessions_join_mode_check'
  ) then
    alter table sessions
      add constraint sessions_join_mode_check
      check (join_mode in ('open', 'approval'));
  end if;
end $$;

drop policy if exists "hosts update rsvps for own sessions" on session_rsvps;
create policy "hosts update rsvps for own sessions"
  on session_rsvps for update
  using (
    exists (
      select 1 from sessions s
      where s.id = session_rsvps.session_id and s.host_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from sessions s
      where s.id = session_rsvps.session_id and s.host_id = auth.uid()
    )
  );

drop policy if exists "hosts delete rsvps for own sessions" on session_rsvps;
create policy "hosts delete rsvps for own sessions"
  on session_rsvps for delete
  using (
    exists (
      select 1 from sessions s
      where s.id = session_rsvps.session_id and s.host_id = auth.uid()
    )
  );
