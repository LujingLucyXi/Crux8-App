import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { EyeClosed } from 'iconoir-react';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { AvatarCustomizer } from '@/components/ui/AvatarCustomizer';
import { UsualTimesEditor } from '@/components/profile/UsualTimesEditor';
import { avatarFromSeed, type AvatarConfig } from '@/lib/avatar';
import { CertVerificationSheet } from '@/components/sheets/CertVerificationSheet';
import { AuthSheet } from '@/components/AuthSheet';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { lbsToKg, ftInToCm, kgToLbs } from '@/lib/weight';
import { getPendingIntent, clearPendingIntent, pendingIntentPath } from '@/lib/pendingIntent';
import { inviteLink } from '@/lib/inviteCode';
import { DnaCard } from '@/components/DnaCard';
import type { Style, Activity } from '@/seed/types';
import { gymsForLocation } from '@/seed/gyms';

const GRADE_BANDS = [
  { value: 'V0-5.7', label: 'V0 / 5.7' },
  { value: '5.8-5.9', label: 'V1-2 / 5.8-9' },
  { value: '5.10a-5.10c', label: 'V3-4 / 5.10a-c' },
  { value: '5.10d-5.11b', label: 'V5-6 / 5.10d-5.11b' },
  { value: '5.11c-5.12b', label: 'V7-8 / 5.11c-5.12b' },
  { value: '5.12c+', label: 'V9+ / 5.12c+' },
];

// Slim orientation (Lucy 2026-10-16, relaying tester feedback:
// 'orientation was too long' — drop-off was high even though every
// step was skippable, because the LENGTH itself hesitates people).
// Orientation now asks only what the app needs to function: who you
// are, what you look like, what you climb + where. Everything else —
// signature/bio/tags, grades, body stats, belay skills — is deferred:
// belay is asked just-in-time before a rope invite/join, the rest
// lives in Edit Profile, and a profile-completeness meter on the
// Profile page reminds people to fill it in over time.
const STEP_META = [
  { n: 1, label: 'Basics' },
  { n: 2, label: 'Your look' },
  { n: 3, label: 'Your climbing' },
  { n: 4, label: 'Your DNA' },
] as const;
const TOTAL = STEP_META.length;
type StepN = 1 | 2 | 3 | 4;

const STYLES: { value: Style; label: string }[] = [
  { value: 'top_rope', label: 'Top Rope' },
  { value: 'lead', label: 'Lead' },
  { value: 'boulder', label: 'Boulder' },
  { value: 'outdoor_sport', label: 'Outdoor Sport' },
  { value: 'trad', label: 'Trad' },
  { value: 'events', label: 'Events' },
];

const ACTIVITIES: { value: Activity; emoji: string; label: string; desc: string }[] = [
  { value: 'climb', emoji: '🧗', label: 'Climbing', desc: 'Indoor & outdoor rope + boulder' },
  { value: 'hike', emoji: '🥾', label: 'Hiking / Mountaineering', desc: 'Trails, scrambles, snow & multi-day trips' },
  { value: 'events', emoji: '🎉', label: 'Events', desc: 'Meetups, clinics, socials' },
];

// Fun climbing/hiking flair. Stored as the full label (emoji included) so it
// renders next to the name anywhere with zero lookups. Pick up to MAX_TAGS.
const TAGS = [
  '🧗 Crimp Lord', '🪨 Boulder Bro', '🚀 Dyno Fiend', '🧊 Slab Master',
  '🦶 Heel-Hook Hero', '🔥 Flash Machine', '🎯 Project Junkie', '🧂 Chalk Addict',
  '🌅 Dawn Patrol', '🪢 Belay Bestie', '🤝 Soft Catch', '⛰️ Peak Bagger',
  '🥾 Trail Runner', '🏔️ Alpine Start', '❄️ Snow Plodder', '🌲 Choss Lover',
  '☕ Coffee First', '🚐 Van Life', '😅 Type 2 Fun', '🧭 Scrambler',
  '💪 Weekend Warrior', '🧗‍♀️ Gym Rat',
];
const MAX_TAGS = 5;

// Launch cities (Luma-style availability). Values are stable slugs; labels are
// what users see. Expand this list as new metros open.
const CITIES = [
  { value: 'greater-seattle', label: 'Greater Seattle Area' },
  { value: 'denver', label: 'Denver' },
  { value: 'sf-bay-area', label: 'San Francisco / Bay Area' },
  { value: 'salt-lake-city', label: 'Salt Lake City' },
  { value: 'austin', label: 'Austin' },
];

// Hiking preferences (step 5 · Hike section, skippable).
const HIKE_DISTANCES = [
  { value: 'under-5', label: 'Under 5 mi' },
  { value: '5-10', label: '5–10 mi' },
  { value: '10-15', label: '10–15 mi' },
  { value: '15-plus', label: '15+ mi' },
];
const HIKE_PACES = [
  { value: 'stroll', label: 'Stroll' },
  { value: 'steady', label: 'Steady' },
  { value: 'push', label: 'Push it' },
];

export function Onboarding() {
  const nav = useNavigate();
  const me = useAppStore((s) => s.me);
  const gyms = useAppStore((s) => s.gyms);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const ensureInviteCode = useAppStore((s) => s.ensureInviteCode);

  // Onboarding draft: form state lives in useState and is only committed at
  // Finish. If the user detours (e.g. takes the quiz in a new tab and claims
  // there), an un-persisted draft would be lost. Save/restore via localStorage.
  const draft = (() => {
    try {
      const raw = localStorage.getItem('crux8-onboarding-draft');
      return raw ? (JSON.parse(raw) as Record<string, any>) : null;
    } catch {
      return null;
    }
  })();

  const [step, setStep] = useState<StepN>(() => {
    const raw = (draft?.step as number) ?? 1;
    return (Math.min(4, Math.max(1, raw)) as StepN);
  });
  const [dob, setDob] = useState(draft?.dob ?? me?.dob ?? '');
  const [location, setLocation] = useState(draft?.location ?? me?.location ?? 'greater-seattle');
  const [displayName, setDisplayName] = useState(draft?.displayName ?? me?.display_name ?? '');
  const [hikeDistance, setHikeDistance] = useState(draft?.hikeDistance ?? me?.hike_distance ?? '');
  const [hikePace, setHikePace] = useState(draft?.hikePace ?? me?.hike_pace ?? '');
  const [climbSkipped, setClimbSkipped] = useState(draft?.climbSkipped ?? false);
  const [hikeSkipped, setHikeSkipped] = useState(draft?.hikeSkipped ?? false);
  const [avatar, setAvatar] = useState<AvatarConfig>(draft?.avatar ?? me?.avatar ?? avatarFromSeed(me?.display_name ?? 'anon'));
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(draft?.photoUrl ?? me?.photo_url);
  const [signature, setSignature] = useState(draft?.signature ?? me?.signature ?? '');
  const [bio, setBio] = useState(draft?.bio ?? me?.about ?? '');
  const [tags, setTags] = useState<string[]>(draft?.tags ?? me?.tags ?? []);
  const [activities, setActivities] = useState<Activity[]>(draft?.activities ?? me?.activities ?? ['climb']);
  const [homeGymId, setHomeGymId] = useState<string>(draft?.homeGymId ?? me?.home_gym_id ?? gyms[0]?.id ?? '');
  // Usual climb times + gyms (Lucy 2026-10-19): asked on STEP 1,
  // right with the first home-gym pick, and AUTOSAVED the moment
  // they're answered — most people never finish onboarding, and
  // these two answers are what make a climber FINDABLE by when they
  // climb (people search + timed climb invites). Waiting for the
  // Finish button meant most profiles never got them.
  const [usualTimes, setUsualTimes] = useState<string[]>(draft?.usualTimes ?? me?.usual_times ?? []);
  const [usualGymIds, setUsualGymIds] = useState<string[]>(
    draft?.usualGymIds ?? me?.usual_gym_ids ?? (me?.home_gym_id ? [me.home_gym_id] : []),
  );
  // Home-gym options are scoped to the chosen city (Lucy 2026-10-18:
  // picked Austin, still got Seattle gyms).
  const cityGyms = gymsForLocation(gyms, location);
  // Fall back to a real band when the stored grade isn't one of the band values
  // (e.g. the login default '5.10c', which matches no band → nothing would highlight).
  const [topGrade, setTopGrade] = useState<string>(
    draft?.topGrade ?? (GRADE_BANDS.some((g) => g.value === me?.top_grade) ? (me!.top_grade as string) : '5.10a-5.10c'),
  );
  const [preferredStyles, setPreferredStyles] = useState<Style[]>(draft?.preferredStyles ?? me?.preferred_styles ?? ['top_rope', 'lead']);
  const [certOpen, setCertOpen] = useState(false);
  const [weightLbs, setWeightLbs] = useState<string>(draft?.weightLbs ?? (me?.weight_kg ? String(kgToLbs(me.weight_kg)) : ''));
  const [heightFt, setHeightFt] = useState<string>(draft?.heightFt ?? (me?.height_cm ? String(Math.floor(me.height_cm / 2.54 / 12)) : ''));
  const [heightIn, setHeightIn] = useState<string>(
    draft?.heightIn ?? (me?.height_cm ? String(Math.round(me.height_cm / 2.54 - Math.floor(me.height_cm / 2.54 / 12) * 12)) : ''),
  );


  // Persist the draft as the user types/advances.
  useEffect(() => {
    try {
      localStorage.setItem('crux8-onboarding-draft', JSON.stringify({
        step, dob, location, displayName, hikeDistance, hikePace, climbSkipped, hikeSkipped,
        avatar, photoUrl, signature, bio, tags, activities, homeGymId, topGrade, preferredStyles,
        weightLbs, heightFt, heightIn, usualTimes, usualGymIds,
      }));
    } catch { /* storage full/blocked — draft just won't persist */ }
  }, [step, dob, location, displayName, hikeDistance, hikePace, climbSkipped, hikeSkipped, avatar, photoUrl, signature, bio, tags, activities, homeGymId, topGrade, preferredStyles, weightLbs, heightFt, heightIn, usualTimes, usualGymIds]);

  // When the city changes, a home-gym pick from another metro is dropped
  // for the new city's first gym (or none, when that metro has no gyms
  // yet — the field is optional at Finish).
  useEffect(() => {
    if (homeGymId && !cityGyms.some((g) => g.id === homeGymId)) {
      const next = cityGyms[0]?.id ?? '';
      setHomeGymId(next);
      if (next) updateProfile({ home_gym_id: next });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // Step-1 availability answers autosave on every change (see the
  // state note above): pick a gym or tap a time slot and it's on the
  // profile immediately, finished onboarding or not.
  const handleHomeGymChange = (id: string) => {
    setHomeGymId(id);
    updateProfile({ home_gym_id: id || undefined });
  };
  const handleUsualChange = (next: { times: string[]; gymIds: string[] }) => {
    setUsualTimes(next.times);
    setUsualGymIds(next.gymIds);
    updateProfile({ usual_times: next.times, usual_gym_ids: next.gymIds });
  };


  // The flow NEVER navigates away on its own (Lucy 2026-10-16,
  // fourth report of being "bumped out of orientation"): earlier
  // guards bounced to '/' when the session turned out dead mid-flow
  // — an expired access token whose refresh token was rotated away
  // by another tab/device reads exactly like that. Now the flow
  // degrades IN PLACE: a live session with a lagging profile just
  // waits; a dead session gets an inline sign-in panel, and signing
  // back in resumes the same step (the draft persists every step).
  const [authOpen, setAuthOpen] = useState(false);
  const [sessionGone, setSessionGone] = useState(false);
  useEffect(() => {
    if (me) {
      setSessionGone(false);
      return;
    }
    const t = setTimeout(async () => {
      const { data } = await supabase.auth
        .getSession()
        .catch(() => ({ data: { session: null } }));
      if (!data.session) setSessionGone(true);
    }, 2500);
    return () => clearTimeout(t);
  }, [me]);

  if (!me) {
    if (!sessionGone) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-paper-50 text-sm text-ink-500">
          <span>Loading…</span>
          <button
            onClick={() => nav('/')}
            className="text-xs font-medium text-ink-400 underline underline-offset-4"
          >
            Back to home
          </button>
        </div>
      );
    }
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-paper-50 px-8 text-center">
        <p className="text-base font-bold text-ink-900">Your sign-in expired</p>
        <p className="max-w-xs text-sm leading-relaxed text-ink-500">
          Sessions time out — especially with the app open in a few places at
          once. Sign back in and orientation picks up right where you left it.
        </p>
        <button
          onClick={() => setAuthOpen(true)}
          className="rounded-full bg-brand-600 px-6 py-3 text-sm font-extrabold text-[#161310]"
        >
          Sign in again
        </button>
        <button
          onClick={() => nav('/')}
          className="text-xs font-medium text-ink-400 underline underline-offset-4"
        >
          Back to home
        </button>
        <AuthSheet
          open={authOpen}
          onOpenChange={setAuthOpen}
          onSuccess={() => setAuthOpen(false)}
        />
      </div>
    );
  }

  const go = (n: StepN) => setStep(n);
  const climbs = activities.includes('climb');
  const hikes = activities.includes('hike');

  /** Where to send the user after onboarding ends (finish or skip). */
  const afterOnboarding = () => {
    const intent = getPendingIntent();
    if (intent) {
      clearPendingIntent();
      nav(pendingIntentPath(intent));
    } else {
      nav('/home');
    }
  };

  /**
   * Soft-skip (Lucy, 2026-10-14): orientation is a post-value conversion
   * step, not an entry gate. Skipping keeps whatever the user already
   * typed (name at minimum), marks the account deferred, and sends them
   * on their way — the pending deep-link join (if any) is honored first.
   * They're reminded again after their first finished session.
   */
  const skip = () => {
    // Keep any typed name, but do NOT mark onboarding complete — the
    // account stays in the "nudge me later" state (onboarded stays false).
    // The step-1 availability answers ride along too (they autosaved
    // already; this is belt-and-braces for same-tick skips).
    if (displayName.trim()) updateProfile({ display_name: displayName.trim() });
    updateProfile({
      ...(homeGymId ? { home_gym_id: homeGymId } : {}),
      usual_times: usualTimes,
      usual_gym_ids: usualGymIds,
    });
    try {
      localStorage.setItem('crux8-onboarding-deferred', String(Date.now()));
      localStorage.removeItem('crux8-onboarding-draft');
    } catch {
      /* ok */
    }
    toast('Skipped — you can finish your profile anytime');
    afterOnboarding();
  };

  const finish = () => {
    // Slim payload: only what the 4 steps ask. Grades, body stats,
    // signature/bio/tags and belay skills are NOT collected here any
    // more (see STEP_META note) — they stay unset, which is exactly
    // what the profile-completeness meter reads later.
    completeOnboarding({
      display_name: displayName.trim() || undefined,
      dob: dob || undefined,
      location: location.trim() || undefined,
      avatar,
      photo_url: photoUrl,
      activities,
      ...(homeGymId ? { home_gym_id: homeGymId } : {}),
      ...(climbs ? { preferred_styles: preferredStyles } : {}),
      // Asked on step 1 regardless of activities — saved unconditionally.
      usual_times: usualTimes,
      usual_gym_ids: usualGymIds,
    });
    try { localStorage.removeItem('crux8-onboarding-draft'); } catch { /* ok */ }
    try { localStorage.removeItem('crux8-onboarding-deferred'); } catch { /* ok */ }
    toast('Welcome to Crux8! 🎉');
    afterOnboarding();
  };

  const toggleStyle = (s: Style) =>
    setPreferredStyles((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const toggleActivity = (a: Activity) =>
    setActivities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const toggleTag = (t: string) =>
    setTags((prev) => {
      if (prev.includes(t)) return prev.filter((x) => x !== t);
      if (prev.length >= MAX_TAGS) return prev;
      return [...prev, t];
    });

  const shareInvite = async () => {
    // The REAL personal invite. This used to share a /join?ref= URL —
    // no such route exists, so invitees landed on the bare homepage
    // with no inviter attached. Same destination as Profile's invite
    // (/add/<my code>), link embedded in the text (a separate `url`
    // field becomes an unopenable file in WeChat — 2026-10-16).
    const code = ensureInviteCode();
    const url = code ? inviteLink(code) : 'https://crux8.app';
    const text = `🧗 Join me on Crux8 — find climbing partners, join sessions, and collect climber DNA cards. Use my invite link to join: ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Join me on Crux8', text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast('Invite copied — paste it to your crew!');
    } catch {
      /* share dismissed */
    }
  };

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="mx-auto max-w-[560px] px-6 py-10">
        {/* Labeled progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
              Step {step} of {TOTAL}
            </span>
            <span className="text-xs font-medium text-ink-700">{STEP_META[step - 1].label}</span>
          </div>
          <div className="flex gap-1.5">
            {STEP_META.map(({ n }) => (
              <div
                key={n}
                className={cn('h-1.5 flex-1 rounded-full transition-colors', n <= step ? 'bg-brand-gradient' : 'bg-ink-100')}
              />
            ))}
          </div>
        </div>

        {/* ── Step 1 · Basics ── */}
        {step === 1 && (
          <>
            <h2 className="text-2xl font-semibold text-ink-900">Nice to meet you.</h2>
            <p className="mt-2 text-sm text-ink-500">A couple basics to get started.</p>
            <div className="mt-6 space-y-4">
              <div>
                <Label>Display name</Label>
                <Input
                  value={displayName}
                  maxLength={30}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="What should partners call you?"
                />
              </div>
              <div>
                <Label>Location (optional)</Label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-ink-100 bg-paper-100 px-3.5 py-2.5 text-sm text-ink-900"
                >
                  <option value="">Select a city</option>
                  {CITIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-ink-500">Helps match you with climbers and crags near you.</p>
              </div>
              {/* Highlight section (Lucy 2026-10-19): when + where you
                  climb is THE findability answer of this step — it gets
                  its own gold card instead of blending into the form. */}
              <section className="rounded-3xl border-2 border-brand-500/50 bg-gradient-to-b from-brand-100 to-paper-100 p-4 shadow-[0_10px_36px_rgba(201,162,75,0.18)]">
                <h3 className="text-base font-bold text-ink-900">
                  🧗 When do you climb — and where?
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-600">
                  This is how partners find you: climbers searching these times can invite you
                  right into your usual slots.
                </p>
                <div className="mt-4">
                  <Label>Home gym</Label>
                  <select
                    value={homeGymId}
                    onChange={(e) => handleHomeGymChange(e.target.value)}
                    className="w-full rounded-xl border border-ink-100 bg-paper-50 px-3.5 py-2.5 text-sm text-ink-900"
                  >
                    {cityGyms.length === 0 && (
                      <option value="">No gyms listed for this city yet</option>
                    )}
                    {cityGyms.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-4">
                  <Label>Your usual times</Label>
                  <div className="mt-1.5">
                    <UsualTimesEditor
                      times={usualTimes}
                      gymIds={usualGymIds}
                      gyms={cityGyms}
                      onChange={handleUsualChange}
                    />
                  </div>
                </div>
              </section>
              <div>
                <Label>Date of birth (optional)</Label>
                <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                <p className="mt-1 text-[11px] text-ink-500">Used for age-gated events (e.g. 18+ trips).</p>
              </div>
            </div>
            <Button className="w-full mt-8" onClick={() => go(2)}>Next</Button>
            {/* Soft-skip (Lucy, 2026-10-14): orientation is a post-value
                conversion step, not an entry gate. */}
            <button
              onClick={skip}
              className="mt-3 w-full text-center text-sm font-semibold text-ink-500 underline"
            >
              Skip for now — I'll finish later
            </button>
          </>
        )}

        {/* ── Step 2 · Avatar ── */}
        {step === 2 && (
          <>
            <h2 className="text-2xl font-semibold text-ink-900">Build your climber.</h2>
            <p className="mt-2 text-sm text-ink-500">Customize your avatar, or upload a real photo.</p>
            <div className="mt-6">
              <AvatarCustomizer value={avatar} onChange={setAvatar} photoUrl={photoUrl} onPhotoChange={setPhotoUrl} />
            </div>
            <div className="mt-8 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => go(1)}>Back</Button>
              <Button className="flex-1" onClick={() => go(3)}>Next</Button>
            </div>
          </>
        )}

        {/* ── Step 3 · Activities + styles (gym + usual times live on step 1 now) ── */}
        {step === 3 && (
          <>
            <h2 className="text-2xl font-semibold text-ink-900">What are you into?</h2>
            <p className="mt-2 text-sm text-ink-500">Pick everything that applies — we'll tune your feed to match.</p>
            <div className="mt-6 space-y-3">
              {ACTIVITIES.map((a) => {
                const on = activities.includes(a.value);
                return (
                  <button
                    key={a.value}
                    onClick={() => toggleActivity(a.value)}
                    className={cn(
                      'w-full flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors',
                      on ? 'border-brand-500 bg-brand-100' : 'border-ink-100 bg-paper-100',
                    )}
                  >
                    <span className="text-3xl">{a.emoji}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-ink-900">{a.label}</p>
                      <p className="text-xs text-ink-500">{a.desc}</p>
                    </div>
                    <span
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center text-[11px] text-white',
                        on ? 'bg-brand-600 border-brand-600' : 'border-ink-200',
                      )}
                    >
                      {on && '✓'}
                    </span>
                  </button>
                );
              })}
            </div>
            {climbs && (
              <>
                <div className="mt-7">
                  <Label>Climbing styles</Label>
                  <div className="flex flex-wrap gap-2">
                    {STYLES.map((st) => {
                      const on = preferredStyles.includes(st.value);
                      return (
                        <button
                          key={st.value}
                          onClick={() => toggleStyle(st.value)}
                          className={cn(
                            'rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors',
                            on
                              ? 'bg-brand-600 text-[#161310] border-brand-600'
                              : 'bg-paper-100 text-ink-600 border-ink-100',
                          )}
                        >
                          {st.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* Home gym + usual climb times moved to step 1
                    (Lucy 2026-10-19): too many people never reach
                    step 3, and those answers make them findable. */}
              </>
            )}
            <div className="mt-8 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => go(2)}>Back</Button>
              <Button className="flex-1" disabled={activities.length === 0} onClick={() => go(4)}>
                Next
              </Button>
            </div>
            <p className="mt-3 text-center text-[11px] text-ink-400">
              That&apos;s all we need — grades, belay skills and the rest can wait for your profile.
            </p>
          </>
        )}

        {/* ── Step 9 · The finale: reveal your Climber DNA (Lucy
            2026-10-16: the quiz is the LAST step and it has to be
            TEMPTING — a reward moment with the actual golden cards on
            show, not a form field with a filled "Skip" button competing
            beside it. Skipping is demoted to a quiet text link.) ── */}
        {step === 4 && (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-teal-600">
              Last step 🎉
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-ink-900">Reveal your Climber DNA.</h2>
            <p className="mt-2 text-sm text-ink-500">
              One of these 15 golden cards is you. Take the 60-second quiz
              to find out which — and get sorted into your house.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2.5">
              {['send-machine', 'social-butterfly', 'zen-master'].map((id) => (
                <DnaCard key={id} archetypeId={id} size="mini" />
              ))}
            </div>
            <p className="mt-2 text-center text-[11px] text-ink-400">
              Three of the fifteen. Yours is still face-down.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 text-sm text-ink-700">
              <p>🎴 <span className="font-semibold text-ink-900">Your DNA card</span> — the one cruxmates collect when they climb with you</p>
              <p>🏠 <span className="font-semibold text-ink-900">A house + its crew</span> — your hangout, from day one</p>
              <p>🗄 <span className="font-semibold text-ink-900">The Vault</span> — collect all 15 as you meet climbers</p>
            </div>

            {me?.quiz_result_type ? (
              <Button size="lg" className="mt-6 w-full" onClick={finish}>
                Finish — welcome in 🎉
              </Button>
            ) : (
              <>
                <Button
                  variant="punch"
                  size="lg"
                  className="mt-6 w-full"
                  onClick={() => window.open(`https://play.crux8.app?name=${encodeURIComponent((displayName.trim() || me?.display_name || '').trim())}`, '_blank')}
                >
                  Reveal my DNA 🧬
                </Button>
                <p className="mt-2 text-center text-[11px] text-ink-400">
                  Finish the quiz, then tap "Continue to the Crux8 app" to claim your card here.
                </p>
              </>
            )}

            <Button variant="outline" className="mt-3 w-full" onClick={shareInvite}>
              🤝 Share your invite link instead
            </Button>
            <div className="mt-8 flex items-center gap-2">
              <Button variant="outline" className="flex-1" onClick={() => go(3)}>Back</Button>
              <button
                className="flex-1 text-sm font-medium text-ink-500 underline underline-offset-2"
                onClick={finish}
              >
                Skip — finish without it
              </button>
            </div>
          </>
        )}
      </div>

      <CertVerificationSheet open={certOpen} onOpenChange={setCertOpen} />
    </div>
  );
}
