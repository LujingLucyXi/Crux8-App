import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck, WarningTriangle, Calendar, MapPin, Check } from 'iconoir-react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useAppStore } from '@/store/useAppStore';
import { REACTIONS } from '@/lib/reactions';
import { formatSessionWhen } from '@/lib/date';
import type { Session, PartnerFlag, SessionRecap, Vibe } from '@/seed/types';
import { cn } from '@/lib/utils';
import { resolveUser, type ResolvedUser } from '@/lib/resolveUser';
import {
  SessionCardArtwork,
  type CardChip,
  type CardCrewMember,
} from '@/components/SessionCardArtwork';
import { ShareableCardFrame } from '@/components/ShareableCardFrame';
import { shareCardImage } from '@/lib/shareCardImage';
import { getSessionNumber, formatCardDate, initialsOf } from '@/lib/sessionCard';

interface Props {
  session: Session | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FLAG_REASONS: { value: PartnerFlag['reason']; label: string }[] = [
  { value: 'unsafe_belay', label: 'Unsafe belaying' },
  { value: 'no_show', label: "Didn't show up" },
  { value: 'uncomfortable', label: 'Made me uncomfortable' },
  { value: 'other', label: 'Something else' },
];

/** "Your session" summary options — every answer optional. */
const FELT_OPTIONS = [
  { v: 1, emoji: '😖', label: 'Rough' },
  { v: 2, emoji: '😕', label: 'Meh' },
  { v: 3, emoji: '🙂', label: 'Good' },
  { v: 4, emoji: '😄', label: 'Great' },
  { v: 5, emoji: '🤩', label: 'Best ever' },
] as const;
const VIBE_OPTIONS: { v: Vibe; emoji: string; label: string }[] = [
  { v: 'chill', emoji: '🧘', label: 'Chill' },
  { v: 'projecting', emoji: '🧗', label: 'Projecting' },
  { v: 'training', emoji: '🏋️', label: 'Training' },
  { v: 'social', emoji: '🎉', label: 'Social' },
] as const;
const DURATION_OPTIONS: { v: NonNullable<SessionRecap['duration_bucket']>; label: string }[] = [
  { v: 'lt1h', label: '< 1h' },
  { v: '1to2h', label: '1–2h' },
  { v: '2to3h', label: '2–3h' },
  { v: 'gt3h', label: '3h+' },
] as const;

const BOULDER_GRADES = ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8+'];
const ROPE_GRADES = ['5.8', '5.9', '5.10', '5.11', '5.12', '5.13+'];

/**
 * Post-session recap. NOT a 1–5 rating.
 *  - Props: positive-only climbing-emoji kudos (public).
 *  - Partner check: one-tap "All good" default; "Something felt off" opens a
 *    PRIVATE flag never shown to the flagged person. Only patterns matter.
 */
export function SessionRecapSheet({ session, open, onOpenChange }: Props) {
  const nav = useNavigate();
  const me = useAppStore((s) => s.me);
  const users = useAppStore((s) => s.users);
  const directory = useAppStore((s) => s.directory);
  const gyms = useAppStore((s) => s.gyms);
  const recaps = useAppStore((s) => s.recaps);
  const claimGuestAccount = useAppStore((s) => s.claimGuestAccount);
  const logSessionRecap = useAppStore((s) => s.logSessionRecap);
  const togglePartnerProp = useAppStore((s) => s.togglePartnerProp);
  const setPartnerCheck = useAppStore((s) => s.setPartnerCheck);
  const setBelayConfirm = useAppStore((s) => s.setBelayConfirm);
  const setRecapSummary = useAppStore((s) => s.setRecapSummary);

  const [flagFor, setFlagFor] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState<PartnerFlag['reason']>('unsafe_belay');
  const [flagNote, setFlagNote] = useState('');
  // After Done: the shareable finish card step.
  const [showCard, setShowCard] = useState(false);
  // Card artwork capture + image share state.
  const artRef = useRef<HTMLDivElement | null>(null);
  const [photoOn, setPhotoOn] = useState(true);
  const [sharingCard, setSharingCard] = useState(false);
  const sessions = useAppStore((s) => s.sessions);
  // Guest claim-by-email inline form (front door, 2026-10-14).
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimEmail, setClaimEmail] = useState('');
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const groups = useAppStore((s) => s.groups);
  const myGroupMemberships = useAppStore((s) => s.myGroupMemberships);
  const shareSessionToGroup = useAppStore((s) => s.shareSessionToGroup);

  if (!session || !me) return null;

  const gym = session.gym_id ? gyms.find((g) => g.id === session.gym_id) : undefined;
  const recap = recaps[session.id];
  const gradeSet =
    session.category === 'boulder' || session.category === 'outdoor_boulder'
      ? BOULDER_GRADES
      : ROPE_GRADES;
  const sendsLog = recap?.sends_log ?? {};
  const sendsTotal = Object.values(sendsLog).reduce((a, b) => a + b, 0);
  const bumpSend = (grade: string, delta: number) => {
    const next = { ...sendsLog };
    const v = (next[grade] ?? 0) + delta;
    if (v <= 0) delete next[grade];
    else next[grade] = v;
    setRecapSummary(session.id, { sends_log: next });
  };
  const partners = session.participant_ids
    .filter((id) => id !== me.id)
    .map((id) => resolveUser(id, me, users, directory))
    .filter((u): u is ResolvedUser => !!u);

  const close = () => {
    // Logging on close guarantees the recap exists (feeds badges/history)
    logSessionRecap(session.id);
    setFlagFor(null);
    setFlagNote('');
    setShowCard(false);
    setClaimOpen(false);
    setClaimEmail('');
    setClaimError(null);
    onOpenChange(false);
  };

  const submitFlag = () => {
    if (!flagFor) return;
    setPartnerCheck(session.id, flagFor, 'flagged', { reason: flagReason, note: flagNote.trim() || undefined });
    toast('Thanks — this stays private', {
      description: 'Only our trust team sees it, and only if a pattern emerges.',
    });
    setFlagFor(null);
    setFlagNote('');
  };

  // ── Finish card step ──────────────────────────────────────────────────
  // Tapping Done on the summary lands here: a Strava-style finisher card
  // for the session, shareable to the crew chat, the system share sheet,
  // or as a link.
  if (showCard) {
    const url = `https://crux8.app/session/${session.id}`;
    const felt = FELT_OPTIONS.find((f) => f.v === recap?.felt);
    const vibe = VIBE_OPTIONS.find((v) => v.v === recap?.vibe_pick);
    const duration = DURATION_OPTIONS.find((d) => d.v === recap?.duration_bucket);
    const crew = [me, ...partners].map((p) => ({
      id: p.id,
      display_name: p.id === me.id ? 'You' : p.display_name,
      real_name: p.display_name,
      photo_url: p.photo_url ?? undefined,
    }));
    const sessionNumber = getSessionNumber(sessions, me.id, session.id);
    const houseCrew =
      groups.find((g) => g.id === session.posted_by_group_id) ??
      groups.find((g) => g.kind === 'house_hangout' && myGroupMemberships.includes(g.id));
    const shareText = `🧗 ${session.title} at ${gym?.short_name ?? session.area ?? 'the gym'} — ${partners.length + 1} climbed. Join us next time!`;
    const cardCrew: CardCrewMember[] = crew.map((p) => ({
      id: p.id,
      name: p.real_name,
      photoUrl: photoOn ? p.photo_url : undefined,
      initials: initialsOf(p.real_name),
    }));
    const chips: CardChip[] = [
      ...(felt ? [{ label: `FELT ${felt.label.toUpperCase()}`, gold: true }] : []),
      ...(vibe ? [{ label: vibe.label.toUpperCase() }] : []),
      ...(duration ? [{ label: duration.label.toUpperCase() }] : []),
      ...(sendsTotal > 0
        ? [{ label: `${sendsTotal} SEND${sendsTotal === 1 ? '' : 'S'}` }]
        : []),
      ...(recap?.gym_rating ? [{ label: `GYM ★ ${recap.gym_rating}` }] : []),
    ];
    // Image-first share: the card as a PNG via navigator.share({files}),
    // download fallback, and the deep link stays as the invite mechanism.
    const shareCard = async () => {
      const node = artRef.current;
      if (!node || sharingCard) return;
      setSharingCard(true);
      try {
        let photoFailedOnce = false;
        for (;;) {
          try {
            const r = await shareCardImage({
              node,
              fileName: `crux8-session-${sessionNumber}.png`,
              title: 'Crux8 session',
              text: shareText,
            });
            if (r === 'downloaded') toast('Image saved — post it anywhere 📸');
            return;
          } catch {
            if (!photoFailedOnce) {
              // Likely a tainted canvas from a cross-origin photo — retry
              // once with the branded panel instead.
              photoFailedOnce = true;
              setPhotoOn(false);
              await new Promise((r) => setTimeout(r, 200));
              continue;
            }
            toast('Could not render the image — copy the link instead');
            return;
          }
        }
      } finally {
        setSharingCard(false);
      }
    };
    const copyLink = async () => {
      try {
        await navigator.clipboard.writeText(`${shareText} ${url}`);
        toast('Link copied — share it anywhere');
      } catch {
        toast('Copy this link', { description: url });
      }
    };
    return (
      <Sheet open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
        <SheetContent title="Session complete">
          <ShareableCardFrame nodeRef={artRef}>
            <SessionCardArtwork
              data={{
                number: sessionNumber,
                dateLabel: formatCardDate(session.starts_at),
                headlineA: 'Session',
                headlineB: 'complete.',
                crew: cardCrew,
                crewLine: `${crew.length} climbed together`,
                crewSub: 'Crew showed up. That is the whole point.',
                chips,
                gymLine: (gym?.name ?? session.area ?? 'Outdoors').toUpperCase(),
              }}
            />
          </ShareableCardFrame>

          <div className="mt-4 flex flex-col gap-2">
            {/* Post-value orientation prompt (Lucy, 2026-10-14): the card
                is the guest's/skipped user's first trophy — this is the
                moment a profile is worth claiming, not before. */}
            {me.onboarded === false && !claimOpen && (
              <Button
                variant="punch"
                onClick={() => {
                  if (me.isGuest) {
                    setClaimOpen(true);
                  } else {
                    close();
                    nav('/onboarding');
                  }
                }}
              >
                {me.isGuest ? 'Claim your crew card →' : 'Finish your profile →'}
              </Button>
            )}
            {me.isGuest && claimOpen && (
              <div className="rounded-2xl border border-ink-100 bg-paper-100 p-4">
                <p className="text-sm font-semibold text-ink-900">Keep your card — add your email</p>
                <p className="mt-1 text-xs text-ink-500">
                  We email you a claim link. Same account, your session history stays.
                </p>
                <Input
                  className="mt-3"
                  type="email"
                  inputMode="email"
                  placeholder="you@email.com"
                  value={claimEmail}
                  onChange={(e) => setClaimEmail(e.target.value)}
                />
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setClaimOpen(false)}>
                    Later
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={claimBusy || !claimEmail.includes('@')}
                    onClick={async () => {
                      setClaimBusy(true);
                      setClaimError(null);
                      const res = await claimGuestAccount(claimEmail);
                      setClaimBusy(false);
                      if (!res.ok) {
                        setClaimError(res.error);
                        return;
                      }
                      toast.success('Claim link sent — check your inbox ✉️');
                      setClaimOpen(false);
                    }}
                  >
                    {claimBusy ? 'Sending…' : 'Send link'}
                  </Button>
                </div>
                {claimError && <p className="mt-2 text-xs text-red-600">{claimError}</p>}
              </div>
            )}
            <Button onClick={() => void shareCard()} disabled={sharingCard}>
              {sharingCard ? 'Rendering…' : 'Share card'}
            </Button>
            <Button variant="outline" onClick={() => void copyLink()}>
              Copy link
            </Button>
            {houseCrew && (
              <Button
                variant="outline"
                onClick={() => {
                  shareSessionToGroup(session.id, houseCrew.id);
                  toast(`Posted to ${houseCrew.name} 💬`);
                }}
              >
                Post to {houseCrew.name}
              </Button>
            )}
            <Button variant="outline" onClick={close}>
              Done
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <SheetContent title="Session recap">
        {/* Session summary header */}
        <div className="rounded-2xl bg-paper-50 border border-ink-100 p-4 mb-5">
          <h3 className="font-semibold text-ink-900">{session.title}</h3>
          <p className="text-sm text-ink-500">{session.subtitle}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-500">
            <span className="inline-flex items-center gap-1">
              <Calendar width={12} height={12} /> {formatSessionWhen(session.starts_at)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin width={12} height={12} /> {gym?.short_name ?? session.area ?? 'TBD'}
            </span>
          </div>
        </div>

        {/* Your session — Strava-style summary, every answer optional */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3">
            Your session <span className="normal-case font-normal text-ink-400">· all optional</span>
          </h3>

          <p className="text-[11px] font-semibold text-ink-700 mb-1.5">How it felt</p>
          <div className="flex gap-1.5 mb-4">
            {FELT_OPTIONS.map((f) => {
              const active = recap?.felt === f.v;
              return (
                <button
                  key={f.v}
                  onClick={() =>
                    setRecapSummary(session.id, { felt: active ? undefined : f.v })
                  }
                  className={cn(
                    'flex-1 rounded-xl border py-2 text-center transition-colors',
                    active
                      ? 'bg-brand-600 border-brand-600'
                      : 'bg-paper-100 border-ink-100 hover:border-ink-300',
                  )}
                >
                  <span className="block text-xl leading-none">{f.emoji}</span>
                  <span
                    className={cn(
                      'mt-1 block text-[10px] font-semibold',
                      active ? 'text-[#161310]' : 'text-ink-500',
                    )}
                  >
                    {f.label}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] font-semibold text-ink-700 mb-1.5">The vibe</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {VIBE_OPTIONS.map((o) => {
              const active = recap?.vibe_pick === o.v;
              return (
                <button
                  key={o.v}
                  onClick={() =>
                    setRecapSummary(session.id, {
                      vibe_pick: active ? undefined : o.v,
                    })
                  }
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                    active
                      ? 'bg-brand-600 text-[#161310] border-brand-600'
                      : 'bg-paper-100 text-ink-600 border-ink-100 hover:border-ink-300',
                  )}
                >
                  {o.emoji} {o.label}
                </button>
              );
            })}
          </div>

          <p className="text-[11px] font-semibold text-ink-700 mb-1.5">How long</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {DURATION_OPTIONS.map((o) => {
              const active = recap?.duration_bucket === o.v;
              return (
                <button
                  key={o.v}
                  onClick={() =>
                    setRecapSummary(session.id, {
                      duration_bucket: active ? undefined : o.v,
                    })
                  }
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                    active
                      ? 'bg-brand-600 text-[#161310] border-brand-600'
                      : 'bg-paper-100 text-ink-600 border-ink-100 hover:border-ink-300',
                  )}
                >
                  {o.label}
                </button>
              );
            })}
          </div>

          {/* Sends logger — per grade */}
          <p className="text-[11px] font-semibold text-ink-700 mb-1.5">
            Sends{' '}
            {sendsTotal > 0 && (
              <span className="text-brand-600">· {sendsTotal} total</span>
            )}
          </p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {gradeSet.map((g) => {
              const count = sendsLog[g] ?? 0;
              return (
                <button
                  key={g}
                  onClick={() => bumpSend(g, 1)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                    count > 0
                      ? 'bg-brand-600 text-[#161310] border-brand-600'
                      : 'bg-paper-100 text-ink-600 border-ink-100 hover:border-ink-300',
                  )}
                >
                  {g}
                  {count > 0 ? ` ×${count}` : ''}
                </button>
              );
            })}
          </div>
          {gradeSet
            .filter((g) => (sendsLog[g] ?? 0) > 0)
            .map((g) => (
              <div key={g} className="flex items-center gap-3 py-1">
                <span className="w-10 text-sm font-semibold text-ink-900">{g}</span>
                <button
                  onClick={() => bumpSend(g, -1)}
                  className="h-7 w-7 rounded-full border border-ink-100 text-sm text-ink-700"
                  aria-label={`One fewer ${g}`}
                >
                  −
                </button>
                <span className="w-5 text-center text-sm font-semibold text-ink-900">
                  {sendsLog[g]}
                </span>
                <button
                  onClick={() => bumpSend(g, 1)}
                  className="h-7 w-7 rounded-full border border-ink-100 text-sm text-ink-700"
                  aria-label={`One more ${g}`}
                >
                  +
                </button>
              </div>
            ))}

          {/* Gym rating — indoor sessions only */}
          {gym && (
            <>
              <p className="text-[11px] font-semibold text-ink-700 mt-4 mb-1.5">
                Rate {gym.short_name}
              </p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() =>
                      setRecapSummary(session.id, {
                        gym_rating: recap?.gym_rating === n ? undefined : n,
                      })
                    }
                    className="p-0.5 text-[22px] leading-none"
                    aria-label={`${n} star${n === 1 ? '' : 's'}`}
                  >
                    {recap?.gym_rating && recap.gym_rating >= n ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </>
          )}
          {partners.length === 0 && (
            <p className="mt-4 text-sm text-ink-500">
              Solo mission — just you and the wall. 🧗
            </p>
          )}
        </div>

        {partners.length === 0 ? null : (
          <>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
              Your cruxmates
            </h3>
            <p className="text-sm text-ink-600 mb-4">
              Give props to who you climbed with. All optional — no scores, no averages.
            </p>
            <div className="flex flex-col gap-4">
              {partners.map((p) => {
                const givenProps = recap?.props[p.id] ?? [];
                const check = recap?.partner_checks[p.id];
                const belay = recap?.belay_confirms?.[p.id];
                return (
                  <div key={p.id} className="rounded-2xl border border-ink-100 p-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar photoUrl={p.photo_url ?? undefined} config={p.avatar} alt={p.display_name} size={40} fallback={p.display_name} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-ink-900">{p.display_name}</p>
                        <p className="text-[11px] text-ink-500">Climbed together</p>
                      </div>
                      {check === 'all_good' && (
                        <span className="inline-flex items-center gap-1 text-teal-600 text-xs font-semibold">
                          <Check width={14} height={14} /> All good
                        </span>
                      )}
                    </div>

                    {/* Props — positive-only emoji kudos */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {REACTIONS.map((r) => {
                        const active = givenProps.includes(r.key);
                        return (
                          <button
                            key={r.key}
                            onClick={() => togglePartnerProp(session.id, p.id, r.key)}
                            title={r.label}
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition-colors',
                              active
                                ? 'bg-teal-100 border-teal-600 text-teal-600'
                                : 'bg-paper-100 border-ink-100 text-ink-500 hover:border-ink-300',
                            )}
                          >
                            <span className="text-sm">{r.emoji}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Peer belay-cert confirmation — turns self-reported into peer-confirmed */}
                    <div className="mt-3 rounded-xl bg-paper-50 border border-ink-100 p-3">
                      <p className="text-[11px] font-semibold text-ink-700 mb-2">
                        Does {p.display_name.split(' ')[0]} have a belay cert / belay safely?
                      </p>
                      <div className="flex gap-1.5">
                        {([
                          { v: 'has_cert', label: '✓ Yes' },
                          { v: 'unsure', label: 'Not sure' },
                          { v: 'no_cert', label: 'No' },
                        ] as const).map((o) => {
                          const active = belay === o.v;
                          return (
                            <button
                              key={o.v}
                              onClick={() => setBelayConfirm(session.id, p.id, o.v)}
                              className={cn(
                                'flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors',
                                active
                                  ? o.v === 'no_cert'
                                    ? 'bg-coral-500 text-white border-coral-500'
                                    : 'bg-brand-600 text-[#161310] border-brand-600'
                                  : 'bg-paper-100 text-ink-600 border-ink-100 hover:border-ink-300',
                              )}
                            >
                              {o.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Safety check — all-good default + private flag */}
                    {flagFor === p.id ? (
                      <div className="mt-3 rounded-xl bg-paper-50 border border-ink-100 p-3">
                        <p className="text-xs font-semibold text-ink-700 mb-2">
                          What felt off? This stays private.
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {FLAG_REASONS.map((fr) => (
                            <button
                              key={fr.value}
                              onClick={() => setFlagReason(fr.value)}
                              className={cn(
                                'text-left rounded-lg px-3 py-2 text-sm border',
                                flagReason === fr.value
                                  ? 'bg-brand-600 text-[#161310] border-brand-600'
                                  : 'bg-paper-100 text-ink-700 border-ink-100',
                              )}
                            >
                              {fr.label}
                            </button>
                          ))}
                        </div>
                        <Textarea
                          value={flagNote}
                          onChange={(e) => setFlagNote(e.target.value.slice(0, 240))}
                          rows={2}
                          placeholder="Optional detail (only trust & safety sees this)"
                          className="mt-2"
                        />
                        <div className="mt-2 flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => setFlagFor(null)}>
                            Cancel
                          </Button>
                          <Button size="sm" className="flex-1" onClick={submitFlag}>
                            Submit privately
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant={check === 'all_good' ? 'outline' : 'primary'}
                          size="sm"
                          className={cn('flex-1', check !== 'all_good' && 'bg-teal-600 hover:bg-teal-500 border-teal-600')}
                          onClick={() => {
                            setPartnerCheck(session.id, p.id, 'all_good');
                            toast(`Thanks for climbing with ${p.display_name.split(' ')[0]}`);
                          }}
                        >
                          <ShieldCheck width={15} height={15} />
                          {check === 'all_good' ? 'Marked all good' : 'All good'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFlagFor(p.id);
                            setFlagReason('unsafe_belay');
                          }}
                        >
                          <WarningTriangle width={15} height={15} className="text-ink-500" />
                          Something felt off
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <Button className="w-full mt-6" onClick={() => setShowCard(true)}>
          Done
        </Button>
      </SheetContent>
    </Sheet>
  );
}
