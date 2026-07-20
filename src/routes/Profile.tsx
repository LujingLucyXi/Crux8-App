import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck, Trophy, Star, Community, Trekking, Sparks, HandCard } from 'iconoir-react';
import { Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { SessionCard } from '@/components/cards/SessionCard';
import { CertVerificationSheet } from '@/components/sheets/CertVerificationSheet';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { useAppStore, type BadgeId } from '@/store/useAppStore';
import type { VerificationCategory, Rating } from '@/seed/types';
import { cn } from '@/lib/utils';

const BADGE_META: Record<BadgeId, { label: string; Icon: React.ComponentType<{ width: number; height: number; color: string }> }> = {
  first_session: { label: 'First Session', Icon: HandCard },
  first_send: { label: 'First Send', Icon: Star },
  verified_belayer: { label: 'Verified Belayer', Icon: ShieldCheck },
  adventurer: { label: 'Adventurer', Icon: Trekking },
  community: { label: 'Community', Icon: Community },
  cruxmate_x5: { label: 'CruxMate x5', Icon: Sparks },
  trust_champion: { label: 'Trust Champion', Icon: Trophy },
};

const BADGE_ORDER: BadgeId[] = [
  'first_session',
  'first_send',
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
  const ratings = useAppStore((s) => s.ratings);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const submitRating = useAppStore((s) => s.submitRating);

  const [certOpen, setCertOpen] = useState(false);
  const [certPreset, setCertPreset] = useState<VerificationCategory | undefined>(undefined);
  const [rateSessionId, setRateSessionId] = useState<string | null>(null);
  const [about, setAbout] = useState(me?.about ?? '');
  const [editingAbout, setEditingAbout] = useState(false);

  if (!me) return null;

  const gym = gyms.find((g) => g.id === me.home_gym_id);
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
          <Avatar src={me.avatar_url} alt={me.display_name} size={80} fallback={me.display_name} />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-ink-900">{me.display_name}</h1>
            {me.pronouns && <p className="text-sm text-ink-500">{me.pronouns}</p>}
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
            const isVerified = v.status === 'verified';
            const isPending = v.status === 'pending';
            return (
              <button
                key={cat}
                onClick={() => !isVerified && openCert(cat)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full text-xs font-semibold px-3 py-1.5 transition-colors',
                  isVerified
                    ? 'bg-teal-600 text-white'
                    : isPending
                    ? 'bg-gold-100 text-gold-500'
                    : 'border border-ink-300 text-ink-300 hover:border-ink-500 hover:text-ink-700',
                )}
              >
                {isVerified ? <ShieldCheck width={12} height={12} /> : isPending ? '⏳' : '○'}
                <span>{CATEGORY_LABEL[cat]} Belay</span>
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
            const { Icon } = meta;
            return (
              <div key={id} className="flex flex-col items-center gap-1 shrink-0 w-20 text-center">
                <div
                  className={cn(
                    'w-14 h-14 rounded-full flex items-center justify-center border',
                    earned ? 'bg-gold-500 border-gold-500' : 'bg-paper-50 border-ink-100',
                  )}
                >
                  <Icon width={22} height={22} color={earned ? 'white' : '#8FA0AA'} />
                </div>
                <p
                  className={cn(
                    'text-[10px] font-medium leading-tight',
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
              const rated = !!ratings[s.id];
              return (
                <div key={s.id}>
                  <SessionCard session={s} users={users} gymName={gymForCard?.short_name} />
                  {!rated && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => setRateSessionId(s.id)}
                    >
                      Rate this session
                    </Button>
                  )}
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
                <Avatar src={u.avatar_url} alt={u.display_name} size={52} fallback={u.display_name} />
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

      <CertVerificationSheet
        open={certOpen}
        onOpenChange={(o) => {
          setCertOpen(o);
          if (!o) setCertPreset(undefined);
        }}
        presetCategory={certPreset}
      />

      <RateSessionDialog
        sessionId={rateSessionId}
        onClose={() => setRateSessionId(null)}
        onSubmit={(rating) => {
          if (rateSessionId) submitRating(rateSessionId, rating);
          setRateSessionId(null);
          toast('Rating submitted · thanks!');
        }}
      />
    </div>
  );
}

function RateSessionDialog({
  sessionId,
  onClose,
  onSubmit,
}: {
  sessionId: string | null;
  onClose: () => void;
  onSubmit: (rating: Rating) => void;
}) {
  const [safety, setSafety] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [vibe, setVibe] = useState(5);
  const [note, setNote] = useState('');

  return (
    <Dialog open={!!sessionId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Rate this session" description="Private ratings help match better next time.">
        <div className="space-y-4 mt-2">
          <StarRow label="Safety" value={safety} onChange={setSafety} />
          <StarRow label="Punctuality" value={punctuality} onChange={setPunctuality} />
          <StarRow label="Vibe" value={vibe} onChange={setVibe} />
          <div>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 240))}
              rows={2}
              placeholder="Private note to CruxMate (optional)"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={() => onSubmit({ safety, punctuality, vibe, note })}>
              Submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StarRow({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <p className="text-sm font-medium text-ink-700 mb-1">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={cn('text-2xl', n <= value ? 'text-gold-500' : 'text-ink-100')}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}
