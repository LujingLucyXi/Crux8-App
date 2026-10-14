-- Onboarding must be EARNED: `onboarded` becomes true only when the
-- 9-step questionnaire completes (the app writes it in completeOnboarding).
-- The column originally defaulted to true (added that way so pre-existing
-- users weren't forced through orientation) — which also silently blessed
-- every NEW signup and made the orientation gate a no-op.
--
-- 1) New profile rows start un-onboarded from now on. Existing rows keep
--    their stored value, so real onboarded users are untouched.
-- 2) Reset rows stamped true by the old default within the last day
--    (fresh test accounts) so they get prompted on next sign-in.

alter table public.profiles alter column onboarded set default false;

update public.profiles
set onboarded = false
where onboarded is true
  and created_at > now() - interval '24 hours';
