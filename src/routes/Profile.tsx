import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck, EyeClosed } from 'iconoir-react';
import { Textarea, Input, Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { AvatarCustomizer } from '@/components/ui/AvatarCustomizer';
import { DEFAULT_AVATAR } from '@/lib/avatar';
import { SessionCard } from '@/components/cards/SessionCard';
import { CertVerificationSheet } from '@/components/sheets/CertVerificationSheet';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { SessionRecapSheet } from '@/components/sheets/SessionRecapSheet';
import { LogSendSheet } from '@/components/sheets/LogSendSheet';
import { useAppStore, type BadgeId } from '@/store/useAppStore';
import type { VerificationCategory } from '@/seed/types';
import { cn } from '@/lib/utils';
import { cmToFtIn, kgToLbs, lbsToKg, ftInToCm } from '@/lib/weight';
import { levelFromXp, sendXp } from '@/lib/rewards';
import { format } from 'date-fns';

const BADGE_META: Record<BadgeId, { label: string; emoji: string; grad: string }> = {
  first_session: { label: 'First Session', emoji: '🧗', grad: 'linear-gradient(135deg,#7C3AED,#EC4899)' },
  first_recap: { label: 'First Recap', emoji: '📓', grad: 'linear-gradient(135deg,#38BDF8,#7C3AED)' },
  verified_belayer: { label: 'Verified Belayer', emoji: '🛡️', grad: 'linear-gradient(135deg,#0EA5A5,#38BDF8)' },
  adventurer: { label: 'Adventurer', emoji: '🏔️', grad: 'linear-gradient(135deg,#F4B942,#FF5A5F)' },
  community: { label: 'Community', emoji: '🤝', grad: 'linear-gradient(135deg,#EC4899,#F4B942)' },
  cruxmate_x5: { label: 'CruxMate ×5', emoji: '⚡', grad: 'linear-gradient(135deg,#C6F135,#0EA5A5)' },
  trust_champion: { label: 'Trust Champion', emoji: '🏆', grad: 'linear-gradient(135deg,#FFB020,#EC4899)' },
};

const BADGE_ORDER: BadgeId[] = [
  'first_session',
  'first_recap',
  'verified_belayer',
  'adventurer',
  'community',
  'cruxmate_x5',
  'trust_champion',
];

const CATEGORY_LABEL: Record<VerificationCategory, string> = {
  top_rope: 'Top Rope',
  lead: 'Lead',
  trad: 'Trad',
};

export function Profile() {
  const nav = useNavigate();
  const me = useAppStore((s) => s.me);
  const gyms = useAppStore((s) => s.gyms);
  const users = useAppStore((s) => s.users);
  const sessions = useAppStore((s) => s.sessions);
  const cruxmates = useAppStore((s) => s.cruxmates);
  const verifications = useAppStore((s) => s.verifications);
  const badges = useAppStore((s) => s.badges);
  const recaps = useAppStore((s) => s.recaps);
  const xp = useAppStore((s) => s.xp);
  const sends = useAppStore((s) => s.sends);
  const updateProfile = useAppStore((s) => s.updateProfile);

  const [logSendOpen, setLogSendOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const [certPreset, setCertPreset] = useState<VerificationCategory | undefined>(undefined);
  const [recapSessionId, setRecapSessionId] = useState<string | null>(null);
  const [about, setAbout] = useState(me?.about ?? '');
  const [editingAbout, setEditingAbout] = useState(false);
  const [hwOpen, setHwOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [draftAvatar, setDraftAvatar] = useState(me?.avatar ?? DEFAULT_AVATAR);
  const [draftPhoto, setDraftPhoto] = useState<string | undefined>(me?.photo_url);
  const [weightLbs, setWeightLbs] = useState(me?.weight_kg ? String(kgToLbs(me.weight_kg)) : '');
  const [heightFt, setHeightFt] = useState(me?.height_cm ? String(Math.floor(me.height_cm / 2.54 / 12)) : '');
  const [heightIn, setHeightIn] = useState(
    me?.height_cm ? String(Math.round(me.height_cm / 2.54 - Math.floor(me.height_cm / 2.54 / 12) * 12)) : '',
  );

  if (!me) return null;

  const gym = gyms.find((g) => g.id === me.home_gym_id);
  const level = levelFromXp(xp);
  const topSend = sends.length
    ? [...sends].sort((a, b) => sendXp(b.grade) - sendXp(a.grade))[0].grade
    : null;
  const now = Date.now();
  const upcoming = sessions.filter((s) => s.participant_ids.includes(me.id) && new Date(s.ends_at).getTime() > now);
  const past = sessions.filter((s) => s.participant_ids.includes(me.id) && new Date(s.ends_at).getTime() <= now);

  const openCert = (cat: VerificationCategory) => {
    setCertPreset(cat);
    setCertOpen(true);
  };

  return (
    <div className="pb-4">
      {/* Header card */}
      <div className="rounded-2xl bg-white border border-ink-100 p-5">
        <div className="flex items-start gap-4">
          <button
            onClick={() => {
              setDraftAvatar(me.avatar ?? DEFAULT_AVATAR);
              setDraftPhoto(me.photo_url);
              setAvatarOpen(true);
            }}
            className="relative shrink-0 group"
            aria-label="Edit avatar"
          >
            <Avatar photoUrl={me.photo_url} config={me.avatar} alt={me.display_name} size={80} fallback={me.display_name} />
            <span className="absolute -bottom-1 -right-1 rounded-full bg-ink-900 text-white text-[9px] font-semibold px-2 py-0.5 border-2 border-white">
              Edit
            </span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-ink-900">{me.display_name}</h1>
            {me.pronouns && <p className="text-sm text-ink-500">{me.pronouns}</p>}
            {me.signature && <p className="mt-0.5 text-sm text-ink-700 italic">“{me.signature}”</p>}
            {me.location && <p className="text-xs text-ink-500">📍 {me.location}</p>}
            {me.tags && me.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {me.tags.map((t) => (
                  <span key={t} className="rounded-full bg-brand-100 text-brand-600 text-[10px] font-semibold px-2 py-0.5">
                    {t}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {gym && (
                <span className="rounded-full border border-teal-600 text-teal-600 text-[11px] font-medium px-2.5 py-0.5">
                  {gym.short_name}
                </span>
              )}
              <span className="rounded-full border border-gold-500 text-gold-500 text-[11px] font-medium px-2.5 py-0.5">
                Top: {me.top_grade}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {(['top_rope', 'lead', 'trad'] as VerificationCategory[]).map((cat) => {
            const v = verifications[cat];
            const isVerified = v.status === 'verified';           // peer-confirmed
            const isSelf = v.status === 'self_attested';           // self-reported
            return (
              <button
                key={cat}
                onClick={() => openCert(cat)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full text-xs font-semibold px-3 py-1.5 transition-colors',
                  isVerified
                    ? 'bg-teal-600 text-white'
                    : isSelf
                    ? 'bg-brand-100 text-brand-600 border border-brand-400'
                    : 'border border-ink-300 text-ink-300 hover:border-ink-500 hover:text-ink-700',
                )}
              >
                {isVerified ? <ShieldCheck width={12} height={12} /> : isSelf ? '•' : '○'}
                <span>
                  {CATEGORY_LABEL[cat]} Belay
                  {isVerified ? ' · peer-confirmed' : isSelf ? ' · self-reported' : ''}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => nav('/onboarding')}>
            Edit profile
          </Button>
        </div>
      </div>

      {/* ── Level / XP power-up ── */}
      <div className="mt-4 rounded-3xl bg-brand-gradient text-white p-5 shadow-brand">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-white/20 ring-1 ring-white/40 flex items-center justify-center text-3xl shrink-0">
              {level.emoji}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">Level {level.level}</p>
              <p className="text-lg font-extrabold leading-tight truncate">{level.title}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black leading-none">{xp}</p>
            <p className="text-[11px] font-semibold text-white/80">XP</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full rounded-full bg-lime-400 transition-all" style={{ width: `${level.pct}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] font-medium text-white/85">
            {level.nextAt ? `${level.nextAt - xp} XP to level ${level.level + 1}` : 'Max level — legend status 👑'}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { n: sends.length, label: 'Sends' },
            { n: topSend ?? '—', label: 'Top send' },
            { n: badges.length, label: 'Badges' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/15 ring-1 ring-white/20 py-2.5 text-center">
              <p className="text-lg font-black leading-none">{s.n}</p>
              <p className="text-[10px] font-semibold text-white/80 mt-1 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => setLogSendOpen(true)}
          className="mt-4 w-full rounded-2xl bg-lime-400 text-ink-900 font-extrabold py-3 shadow-punch active:translate-y-[3px] active:shadow-none transition"
        >
          🔥 Log a send
        </button>
      </div>

      {/* Hidden fields — height + weight (for weight-safe matching) */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500">Body stats</h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 text-teal-600 text-[10px] font-semibold px-2 py-0.5">
            <EyeClosed width={10} height={10} />
            Hidden from others
          </span>
        </div>
        <button
          onClick={() => setHwOpen(true)}
          className="w-full text-left rounded-2xl bg-white border border-ink-100 p-4 hover:border-ink-300 flex items-center justify-between gap-3"
        >
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-baseline gap-3 text-sm">
              <span className="text-ink-500 text-xs uppercase tracking-wider">Weight</span>
              <span className="text-ink-900 font-medium">
                {me.weight_kg ? `${kgToLbs(me.weight_kg)} lbs` : 'Not set'}
              </span>
            </div>
            <div className="flex items-baseline gap-3 text-sm">
              <span className="text-ink-500 text-xs uppercase tracking-wider">Height</span>
              <span className="text-ink-900 font-medium">
                {me.height_cm ? cmToFtIn(me.height_cm) : 'Not set'}
              </span>
            </div>
            <p className="text-[11px] text-ink-500 mt-1">
              {me.weight_kg
                ? 'Powering the weight-safe chip on 1:1 belay calls.'
                : 'Add weight to unlock weight-safe matching.'}
            </p>
          </div>
          <span className="text-xs text-teal-600 font-semibold shrink-0">Edit</span>
        </button>
      </section>

      {/* About / Story */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">About / Story</h2>
        {editingAbout ? (
          <div className="rounded-2xl bg-white border border-ink-100 p-4">
            <Textarea
              value={about}
              onChange={(e) => setAbout(e.target.value.slice(0, 500))}
              rows={4}
              placeholder="Share your climbing story — how you started, what you love, what you're projecting."
            />
            <p className="text-[10px] text-ink-300 mt-1 text-right">{about.length} / 500</p>
            <div className="mt-2 flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAbout(me.about ?? '');
                  setEditingAbout(false);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  updateProfile({ about });
                  setEditingAbout(false);
                  toast('Profile saved');
                }}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditingAbout(true)}
            className="w-full text-left rounded-2xl bg-white border border-ink-100 p-4 hover:border-ink-300"
          >
            {me.about ? (
              <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{me.about}</p>
            ) : (
              <p className="text-sm text-ink-300 italic">
                Share your climbing story — tap to add.
              </p>
            )}
          </button>
        )}
      </section>

      {/* Badges */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Badges</h2>
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
          {BADGE_ORDER.map((id) => {
            const earned = badges.includes(id);
            const meta = BADGE_META[id];
            return (
              <div key={id} className="flex flex-col items-center gap-1 shrink-0 w-20 text-center">
                <div
                  className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition',
                    earned ? 'shadow-brand' : 'bg-paper-50 border border-ink-100 grayscale opacity-45',
                  )}
                  style={earned ? { backgroundImage: meta.grad } : undefined}
                >
                  {meta.emoji}
                </div>
                <p
                  className={cn(
                    'text-[10px] font-semibold leading-tight',
                    earned ? 'text-ink-900' : 'text-ink-300',
                  )}
                >
                  {meta.label}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Send log */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Send log · {sends.length}
          </h2>
          <button onClick={() => setLogSendOpen(true)} className="text-xs font-bold text-brand-600">
            + Log a send
          </button>
        </div>
        {sends.length === 0 ? (
          <div className="rounded-2xl bg-white border border-dashed border-ink-100 p-6 text-center">
            <span className="text-2xl">🔥</span>
            <p className="mt-2 text-sm text-ink-500">No sends logged yet. Every send counts — record your first.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {sends.slice(0, 8).map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-white border border-ink-100 px-3.5 py-2.5">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-lg shrink-0">
                  {s.discipline === 'boulder' ? '🪨' : '🧗'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-ink-900 leading-tight">
                    {s.grade} <span className="text-ink-300 font-semibold capitalize">· {s.style}</span>
                  </p>
                  {s.note && <p className="text-[12px] text-ink-500 truncate">{s.note}</p>}
                </div>
                <span className="text-[11px] text-ink-300 shrink-0">{format(new Date(s.at), 'MMM d')}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Upcoming</h2>
        <div className="flex flex-col gap-3">
          {upcoming.length > 0 ? (
            upcoming.map((s) => {
              const gymForCard = s.gym_id ? gyms.find((g) => g.id === s.gym_id) : undefined;
              return (
                <SessionCard
                  key={s.id}
                  session={s}
                  users={users}
                  gymName={gymForCard?.short_name}
                />
              );
            })
          ) : (
            <p className="text-sm text-ink-500">No upcoming sessions. RSVP to something from Find →</p>
          )}
        </div>
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Past</h2>
          <div className="flex flex-col gap-3">
            {past.map((s) => {
              const gymForCard = s.gym_id ? gyms.find((g) => g.id === s.gym_id) : undefined;
              const done = !!recaps[s.id];
              return (
                <div key={s.id}>
                  <SessionCard session={s} users={users} gymName={gymForCard?.short_name} />
                  <Button
                    variant={done ? 'outline' : 'primary'}
                    size="sm"
                    className={cn('mt-2 w-full', !done && 'bg-teal-600 hover:bg-teal-500 border-teal-600')}
                    onClick={() => setRecapSessionId(s.id)}
                  >
                    {done ? 'View recap' : 'Log recap · give props'}
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* CruxMates */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
          CruxMates · {cruxmates.length}
        </h2>
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
          {cruxmates.map((id) => {
            const u = users.find((x) => x.id === id);
            if (!u) return null;
            return (
              <button
                key={id}
                onClick={() => nav(`/chat/${id}`)}
                className="flex flex-col items-center gap-1 shrink-0 w-16"
              >
                <Avatar config={u.avatar} alt={u.display_name} size={52} fallback={u.display_name} />
                <p className="text-[10px] font-medium text-ink-700 text-center leading-tight truncate w-full">
                  {u.display_name.split(' ')[0]}
                </p>
              </button>
            );
          })}
          {cruxmates.length === 0 && (
            <p className="text-sm text-ink-500 py-3">Add CruxMates from any session or profile.</p>
          )}
        </div>
      </section>

      {/* Avatar customizer sheet */}
      <Sheet open={avatarOpen} onOpenChange={setAvatarOpen}>
        <SheetContent title="Your climber">
          <AvatarCustomizer
            value={draftAvatar}
            onChange={setDraftAvatar}
            photoUrl={draftPhoto}
            onPhotoChange={setDraftPhoto}
          />
          <div className="flex gap-2 pt-6">
            <Button variant="outline" className="flex-1" onClick={() => setAvatarOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                updateProfile({ avatar: draftAvatar, photo_url: draftPhoto });
                toast('Look updated');
                setAvatarOpen(false);
              }}
            >
              Save
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Height + weight edit sheet */}
      <Sheet open={hwOpen} onOpenChange={setHwOpen}>
        <SheetContent title="Body stats">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 text-teal-600 text-[10px] font-semibold px-2 py-0.5 mb-3">
            <EyeClosed width={11} height={11} />
            HIDDEN FROM OTHERS
          </div>
          <p className="text-sm text-ink-500 mb-4">
            Used only to compute the <b>weight-safe</b> chip on belay pairings. Never shown to other users.
          </p>
          <div className="space-y-4">
            <div>
              <Label>Weight (lbs)</Label>
              <Input
                type="number"
                min={60}
                max={400}
                value={weightLbs}
                onChange={(e) => setWeightLbs(e.target.value)}
                placeholder="e.g. 145"
              />
            </div>
            <div>
              <Label>Height</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  min={3}
                  max={8}
                  value={heightFt}
                  onChange={(e) => setHeightFt(e.target.value)}
                  placeholder="ft"
                />
                <Input
                  type="number"
                  min={0}
                  max={11}
                  value={heightIn}
                  onChange={(e) => setHeightIn(e.target.value)}
                  placeholder="in"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setHwOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  const wKg = weightLbs ? lbsToKg(Number(weightLbs)) : undefined;
                  const hCm =
                    heightFt || heightIn
                      ? ftInToCm(Number(heightFt || 0), Number(heightIn || 0))
                      : undefined;
                  updateProfile({ weight_kg: wKg, height_cm: hCm });
                  toast('Body stats saved · hidden from others');
                  setHwOpen(false);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <CertVerificationSheet
        open={certOpen}
        onOpenChange={(o) => {
          setCertOpen(o);
          if (!o) setCertPreset(undefined);
        }}
        presetCategory={certPreset}
      />

      <SessionRecapSheet
        session={sessions.find((s) => s.id === recapSessionId) ?? null}
        open={!!recapSessionId}
        onOpenChange={(o) => !o && setRecapSessionId(null)}
      />

      <LogSendSheet open={logSendOpen} onOpenChange={setLogSendOpen} />
    </div>
  );
}


