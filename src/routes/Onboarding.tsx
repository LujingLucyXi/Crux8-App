import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { EyeClosed } from 'iconoir-react';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { AvatarCustomizer } from '@/components/ui/AvatarCustomizer';
import { avatarFromSeed, type AvatarConfig } from '@/lib/avatar';
import { CertVerificationSheet } from '@/components/sheets/CertVerificationSheet';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { lbsToKg, ftInToCm, kgToLbs } from '@/lib/weight';
import type { Style, Activity } from '@/seed/types';

const GRADE_BANDS = [
  { value: 'V0-5.7', label: 'V0 / 5.7' },
  { value: '5.8-5.9', label: 'V1-2 / 5.8-9' },
  { value: '5.10a-5.10c', label: 'V3-4 / 5.10a-c' },
  { value: '5.10d-5.11b', label: 'V5-6 / 5.10d-5.11b' },
  { value: '5.11c-5.12b', label: 'V7-8 / 5.11c-5.12b' },
  { value: '5.12c+', label: 'V9+ / 5.12c+' },
];

const STEP_META = [
  { n: 1, label: 'Basics' },
  { n: 2, label: 'Your avatar' },
  { n: 3, label: 'Your profile' },
  { n: 4, label: 'Activities' },
  { n: 5, label: 'Climbing' },
  { n: 6, label: 'Body (private)' },
  { n: 7, label: 'Belay skills' },
  { n: 8, label: 'Invite crew' },
] as const;
const TOTAL = STEP_META.length;
type StepN = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

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
  { value: 'hike', emoji: '🥾', label: 'Hiking', desc: 'Trails, scrambles, snow, backpacking' },
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

export function Onboarding() {
  const nav = useNavigate();
  const me = useAppStore((s) => s.me);
  const gyms = useAppStore((s) => s.gyms);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const [step, setStep] = useState<StepN>(1);
  const [dob, setDob] = useState(me?.dob ?? '');
  const [location, setLocation] = useState(me?.location ?? '');
  const [avatar, setAvatar] = useState<AvatarConfig>(me?.avatar ?? avatarFromSeed(me?.display_name ?? 'anon'));
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(me?.photo_url);
  const [signature, setSignature] = useState(me?.signature ?? '');
  const [bio, setBio] = useState(me?.about ?? '');
  const [tags, setTags] = useState<string[]>(me?.tags ?? []);
  const [activities, setActivities] = useState<Activity[]>(me?.activities ?? ['climb']);
  const [homeGymId, setHomeGymId] = useState<string>(me?.home_gym_id ?? gyms[0]?.id ?? '');
  // Fall back to a real band when the stored grade isn't one of the band values
  // (e.g. signUp seeds '5.10c', which matches no band → nothing would highlight).
  const [topGrade, setTopGrade] = useState<string>(
    GRADE_BANDS.some((g) => g.value === me?.top_grade) ? (me!.top_grade as string) : '5.10a-5.10c',
  );
  const [preferredStyles, setPreferredStyles] = useState<Style[]>(me?.preferred_styles ?? ['top_rope', 'lead']);
  const [certOpen, setCertOpen] = useState(false);
  const [weightLbs, setWeightLbs] = useState<string>(me?.weight_kg ? String(kgToLbs(me.weight_kg)) : '');
  const [heightFt, setHeightFt] = useState<string>(me?.height_cm ? String(Math.floor(me.height_cm / 2.54 / 12)) : '');
  const [heightIn, setHeightIn] = useState<string>(
    me?.height_cm ? String(Math.round(me.height_cm / 2.54 - Math.floor(me.height_cm / 2.54 / 12) * 12)) : '',
  );

  if (!me) {
    nav('/');
    return null;
  }

  const go = (n: StepN) => setStep(n);
  const climbs = activities.includes('climb');

  const finish = () => {
    const weightKg = weightLbs ? lbsToKg(Number(weightLbs)) : undefined;
    const heightCm = heightFt || heightIn ? ftInToCm(Number(heightFt || 0), Number(heightIn || 0)) : undefined;
    completeOnboarding({
      dob: dob || undefined,
      location: location.trim() || undefined,
      avatar,
      photo_url: photoUrl,
      signature: signature.trim() || undefined,
      about: bio.trim() || undefined,
      tags: tags.length ? tags : undefined,
      activities,
      home_gym_id: homeGymId,
      top_grade: topGrade,
      preferred_styles: preferredStyles,
      weight_kg: weightKg,
      height_cm: heightCm,
    });
    toast('Welcome to Crux8! 🎉');
    nav('/home');
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
    const url = `https://crux8.app/join?ref=${encodeURIComponent(me.id)}`;
    const text = `Climb with me on Crux8 — find partners, join sessions, send stronger.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Crux8', text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast('Invite link copied — paste it to your crew!');
    } catch {
      toast('Invite link: ' + url);
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
                <Input value={me.display_name} disabled />
              </div>
              <div>
                <Label>Location (optional)</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Seattle, WA" />
                <p className="mt-1 text-[11px] text-ink-500">Helps match you with climbers and crags near you.</p>
              </div>
              <div>
                <Label>Date of birth (optional)</Label>
                <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                <p className="mt-1 text-[11px] text-ink-500">Used for age-gated events (e.g. 18+ trips).</p>
              </div>
            </div>
            <Button className="w-full mt-8" onClick={() => go(2)}>Next</Button>
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

        {/* ── Step 3 · Profile (signature + bio + tags) ── */}
        {step === 3 && (
          <>
            <h2 className="text-2xl font-semibold text-ink-900">Say hi.</h2>
            <p className="mt-2 text-sm text-ink-500">A signature + a few tags help people know you at a glance.</p>
            <div className="mt-6 space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <Label>Signature</Label>
                  <span className="text-[11px] text-ink-400">{signature.length}/40</span>
                </div>
                <Input
                  value={signature}
                  maxLength={40}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="e.g. Slab curious, always down to belay"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Short bio (optional)</Label>
                  <span className="text-[11px] text-ink-400">{bio.length}/160</span>
                </div>
                <Textarea
                  value={bio}
                  maxLength={160}
                  rows={3}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="What you're psyched on, how long you've climbed, what you're looking for…"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Flair tags</Label>
                  <span className="text-[11px] text-ink-400">{tags.length}/{MAX_TAGS}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((t) => {
                    const on = tags.includes(t);
                    const full = !on && tags.length >= MAX_TAGS;
                    return (
                      <button
                        key={t}
                        onClick={() => toggleTag(t)}
                        disabled={full}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                          on ? 'enamel text-white border-transparent' : 'bg-white text-ink-700 border-ink-100',
                          full && 'opacity-40',
                        )}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live preview: how it reads next to your name */}
              <div className="rounded-2xl bg-white border border-ink-100 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 mb-2">Preview</p>
                <div className="flex items-center gap-3">
                  <Avatar photoUrl={photoUrl} config={avatar} alt={me.display_name} size={44} fallback={me.display_name} />
                  <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span className="font-semibold text-ink-900">{me.display_name}</span>
                      {tags.slice(0, 2).map((t) => (
                        <span key={t} className="rounded-full bg-brand-100 text-brand-600 text-[10px] font-semibold px-2 py-0.5">
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-ink-500 truncate">{signature || 'Your signature shows here'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => go(2)}>Back</Button>
              <Button className="flex-1" onClick={() => go(4)}>Next</Button>
            </div>
          </>
        )}

        {/* ── Step 4 · Activities ── */}
        {step === 4 && (
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
                      on ? 'border-brand-500 bg-brand-100' : 'border-ink-100 bg-white',
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
            <div className="mt-8 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => go(3)}>Back</Button>
              <Button className="flex-1" disabled={activities.length === 0} onClick={() => go(climbs ? 5 : 8)}>
                Next
              </Button>
            </div>
            {!climbs && (
              <p className="mt-3 text-center text-[11px] text-ink-400">
                No climbing selected — we'll skip the belay + grade steps.
              </p>
            )}
          </>
        )}

        {/* ── Step 5 · Climbing (only if 'climb') ── */}
        {step === 5 && (
          <>
            <h2 className="text-2xl font-semibold text-ink-900">Your climbing shape.</h2>
            <p className="mt-2 text-sm text-ink-500">Home gym, level, and styles power your matches.</p>
            <div className="mt-6 space-y-5">
              <div>
                <Label>Home gym</Label>
                <select
                  value={homeGymId}
                  onChange={(e) => setHomeGymId(e.target.value)}
                  className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900"
                >
                  {gyms.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Top grade band</Label>
                <div className="grid grid-cols-2 gap-2">
                  {GRADE_BANDS.map((band) => (
                    <button
                      key={band.value}
                      onClick={() => setTopGrade(band.value)}
                      className={cn(
                        'rounded-xl border py-2.5 text-sm text-center',
                        topGrade === band.value ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-700 border-ink-100',
                      )}
                    >
                      {band.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Preferred styles</Label>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => toggleStyle(s.value)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium',
                        preferredStyles.includes(s.value) ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-700 border-ink-100',
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-8 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => go(4)}>Back</Button>
              <Button className="flex-1" onClick={() => go(6)}>Next</Button>
            </div>
          </>
        )}

        {/* ── Step 6 · Body (private) ── */}
        {step === 6 && (
          <>
            <h2 className="text-2xl font-semibold text-ink-900">Height & weight.</h2>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 text-teal-600 text-[10px] font-semibold px-2 py-0.5 mt-2 mb-3">
              <EyeClosed width={11} height={11} />
              HIDDEN FROM OTHERS
            </div>
            <p className="text-sm text-ink-500">
              Used only to compute the <b>weight-safe</b> chip on belay pairings. Never shown to other users. Skip if you'd rather not.
            </p>
            <div className="mt-6 space-y-5">
              <div>
                <Label>Weight (lbs)</Label>
                <Input type="number" inputMode="numeric" min={60} max={400} value={weightLbs} onChange={(e) => setWeightLbs(e.target.value)} placeholder="e.g. 145" />
              </div>
              <div>
                <Label>Height</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" inputMode="numeric" min={3} max={8} value={heightFt} onChange={(e) => setHeightFt(e.target.value)} placeholder="ft" />
                  <Input type="number" inputMode="numeric" min={0} max={11} value={heightIn} onChange={(e) => setHeightIn(e.target.value)} placeholder="in" />
                </div>
              </div>
            </div>
            <div className="mt-8 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => go(5)}>Back</Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setWeightLbs('');
                  setHeightFt('');
                  setHeightIn('');
                  go(7);
                }}
              >
                Skip
              </Button>
              <Button className="flex-1" onClick={() => go(7)}>Next</Button>
            </div>
          </>
        )}

        {/* ── Step 7 · Belay skills ── */}
        {step === 7 && (
          <>
            <h2 className="text-2xl font-semibold text-ink-900">Belay skills.</h2>
            <p className="mt-2 text-sm text-ink-500">
              Tell us what you can belay. No cert upload — partners confirm it after real sessions.
            </p>
            <div className="mt-6 rounded-2xl bg-white border border-ink-100 p-5">
              <p className="text-sm text-ink-700">
                Self-report Top Rope, Lead, or Trad. A few partner confirmations turn “self-reported” into “peer-confirmed.” Always do an in-person buddy check first.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <Button variant="outline" onClick={() => setCertOpen(true)}>Self-report belay skills</Button>
            </div>
            <div className="mt-8 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => go(6)}>Back</Button>
              <Button className="flex-1" onClick={() => go(8)}>Next</Button>
            </div>
          </>
        )}

        {/* ── Step 8 · Invite crew ── */}
        {step === 8 && (
          <>
            <h2 className="text-2xl font-semibold text-ink-900">Climb with your crew.</h2>
            <p className="mt-2 text-sm text-ink-500">
              Crux8 is better with friends. Invite a belay partner or two to get started.
            </p>
            <div className="mt-6 rounded-2xl p-5 text-white shadow-brand" style={{ background: 'linear-gradient(135deg,#7C3AED,#EC4899)' }}>
              <p className="text-3xl">🤝</p>
              <p className="mt-2 font-semibold">Share your invite link</p>
              <p className="text-sm text-white/80">
                They land straight in the app — no account hunting. Bring a partner and you both start with a crew.
              </p>
              <Button variant="punch" className="mt-4 w-full" onClick={shareInvite}>
                Share invite link
              </Button>
            </div>
            <div className="mt-8 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => go(climbs ? 7 : 4)}>Back</Button>
              <Button className="flex-1" onClick={finish}>Finish</Button>
            </div>
          </>
        )}
      </div>

      <CertVerificationSheet open={certOpen} onOpenChange={setCertOpen} />
    </div>
  );
}
