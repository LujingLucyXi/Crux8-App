-- Discord-style deferred email verification (Lucy, 2026-10-16):
-- signup never waits for email confirmation (project autoconfirm on);
-- this app-level flag records whether the user has PROVEN the inbox
-- is theirs (in-app code). It's what makes password resets reachable.
-- Existing accounts whose auth email is already confirmed count as
-- verified — they proved it under the old flow.

alter table public.profiles
  add column if not exists email_verified boolean not null default false;

update public.profiles p
set email_verified = true
from auth.users u
where u.id = p.id
  and u.email_confirmed_at is not null
  and p.email_verified = false;
