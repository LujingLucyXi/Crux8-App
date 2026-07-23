import { useState } from 'react';
import { toast } from 'sonner';
import { ShieldCheck, MapPin, Calendar, OpenInWindow, User } from 'iconoir-react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { Checkbox } from '@/components/ui/Checkbox';
import { Avatar } from '@/components/ui/Avatar';
import { useAppStore } from '@/store/useAppStore';
import { formatSessionWhen } from '@/lib/date';
import type { Session, VerificationCategory } from '@/seed/types';
import { GearChecklistSheet } from './GearChecklistSheet';
import { CertVerificationSheet } from './CertVerificationSheet';
import { UserProfileSheet } from './UserProfileSheet';
import type { AvatarConfig } from '@/lib/avatar';

interface Props {
  session: Session | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROPE_CATS: Session['category'][] = ['top_rope', 'lead', 'trad', 'multi_pitch', 'outdoor_sport'];

function catToVerification(cat: Session['category']): VerificationCategory | null {
  if (cat === 'top_rope') return 'top_rope';
  if (cat === 'lead' || cat === 'outdoor_sport') return 'lead';
  if (cat === 'trad' || cat === 'multi_pitch') return 'trad';
  return null;
}

export function SessionDetailSheet({ session, open, onOpenChange }: Props) {
  const rsvp = useAppStore((s) => s.rsvp);
  const unrsvp = useAppStore((s) => s.unrsvp);
  const users = useAppStore((s) => s.users);
  const gyms = useAppStore((s) => s.gyms);
  const routes = useAppStore((s) => s.routes);
  const verifications = useAppStore((s) => s.verifications);
  const me = useAppStore((s) => s.me);

  const [gearOpen, setGearOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const [attestOpen, setAttestOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [attested, setAttested] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  if (!session || !me) return null;
  const isJoined = session.participant_ids.includes(me.id);
  const isFull = session.participant_ids.length >= session.capacity;
  const gym = session.gym_id ? gyms.find((g) => g.id === session.gym_id) : undefined;
  const route = session.route_id ? routes.find((r) => r.id === session.route_id) : undefined;
  const host = users.find((u) => u.id === session.host_id);
  const participants = session.participant_ids
    .map((id) => {
      if (id === 'me') return { id: 'me', display_name: me.display_name, avatar: me.avatar, photo_url: me.photo_url, isMe: true };
      const u = users.find((x) => x.id === id);
      return u ? { ...u, isMe: false } : null;
    })
    .filter(Boolean) as Array<{ id: string; display_name: string; avatar?: AvatarConfig; photo_url?: string; isMe?: boolean }>;

  const requiredVerification = catToVerification(session.category);
  const isVerified = requiredVerification ? verifications[requiredVerification].status === 'verified' : true;

  const doRsvp = () => {
    rsvp(session.id);
    onOpenChange(false);
    setTimeout(() => setGearOpen(true), 250);
    toast(`You're in for ${session.title}`, { description: formatSessionWhen(session.starts_at) });
  };

  const handleRsvp = () => {
    if (isJoined) {
      unrsvp(session.id);
      toast('Left session');
      return;
    }
    if (isFull) return;
    if (ROPE_CATS.includes(session.category) && requiredVerification && !isVerified) {
      setGateOpen(true);
      return;
    }
    if (session.requires_attestation) {
      setAttestOpen(true);
      return;
    }
    doRsvp();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent title={session.title}>
          <p className="text-sm text-ink-500 -mt-2 mb-4">{session.subtitle}</p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {session.is_verified_only && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 text-teal-600 text-[11px] font-semibold px-2.5 py-1">
                <ShieldCheck width={12} height={12} />
                Verified belayers only
              </span>
            )}
            {session.requires_attestation && (
              <span className="inline-flex items-center rounded-full bg-coral-100 text-coral-500 text-[11px] font-semibold px-2.5 py-1">
                TRAD · attestation required
              </span>
            )}
          </div>

          <div className="space-y-2 mb-5">
            <div className="flex items-center gap-2 text-sm text-ink-700">
              <Calendar width={16} height={16} className="text-ink-500" />
              <span>{formatSessionWhen(session.starts_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-700">
              <MapPin width={16} height={16} className="text-ink-500" />
              <span>{gym?.name ?? session.area ?? 'TBD'}</span>
            </div>
          </div>

          {route && (
            <a
              href={route.mp_url}
              target="_blank"
              rel="noreferrer"
              className="mb-5 flex items-center justify-between rounded-xl border border-ink-100 bg-paper-50 px-4 py-3 hover:bg-white"
            >
              <div>
                <p className="text-sm font-semibold text-ink-900">{route.name}</p>
                <p className="text-xs text-ink-500">
                  {route.grade} · {route.style} · {route.pitches}p
                </p>
              </div>
              <span className="text-xs text-teal-600 font-semibold inline-flex items-center gap-1">
                Mountain Project <OpenInWindow width={12} height={12} />
              </span>
            </a>
          )}

          {session.note && (
            <div className="mb-5 rounded-xl bg-paper-50 border border-ink-100 p-3">
              <p className="text-sm text-ink-700 italic">"{session.note}"</p>
            </div>
          )}

          <div className="mb-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
              Who's going · {participants.length} / {session.capacity}
            </h3>
            <div className="flex flex-col gap-2">
              {participants.map((p) => (
                <button
                  key={p.id}
                  onClick={() => !p.isMe && setProfileUserId(p.id)}
                  disabled={p.isMe}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-paper-50 disabled:cursor-default disabled:hover:bg-transparent text-left"
                >
                  <Avatar photoUrl={p.photo_url} config={p.avatar} alt={p.display_name} size={32} fallback={p.display_name} />
                  <span className="text-sm text-ink-900 flex-1">{p.display_name}</span>
                  {p.id === session.host_id && (
                    <span className="text-[10px] font-semibold text-ink-500 uppercase tracking-wider">Host</span>
                  )}
                  {p.isMe && (
                    <span className="text-[10px] font-semibold text-teal-600 uppercase tracking-wider">You</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <Button
            variant={isJoined ? 'outline' : 'primary'}
            className="w-full"
            disabled={!isJoined && isFull}
            onClick={handleRsvp}
          >
            {isJoined ? 'Leave session' : isFull ? 'Full' : 'RSVP'}
          </Button>
        </SheetContent>
      </Sheet>

      {/* Attestation dialog */}
      <Dialog open={attestOpen} onOpenChange={setAttestOpen}>
        <DialogContent
          title="Trad attestation"
          description="Trad sessions require self-attestation for everyone's safety."
        >
          <label className="flex items-start gap-3 cursor-pointer mt-2">
            <Checkbox checked={attested} onCheckedChange={(v) => setAttested(!!v)} />
            <span className="text-sm text-ink-700">
              I have led trad outside within the last 12 months.
            </span>
          </label>
          <div className="mt-5 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setAttestOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!attested}
              onClick={() => {
                setAttestOpen(false);
                doRsvp();
                setAttested(false);
              }}
            >
              Confirm & RSVP
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verification gate */}
      <Dialog open={gateOpen} onOpenChange={setGateOpen}>
        <DialogContent
          title={`${requiredVerification === 'top_rope' ? 'Top Rope' : requiredVerification === 'lead' ? 'Lead' : 'Trad'} verification required`}
          description="You need matching cert verification to join this session."
        >
          <div className="mt-4 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setGateOpen(false)}>
              Not now
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setGateOpen(false);
                setCertOpen(true);
              }}
            >
              Verify now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CertVerificationSheet
        open={certOpen}
        onOpenChange={setCertOpen}
        presetCategory={requiredVerification ?? undefined}
      />

      <GearChecklistSheet session={session} open={gearOpen} onOpenChange={setGearOpen} />

      <UserProfileSheet
        userId={profileUserId}
        open={!!profileUserId}
        onOpenChange={(o) => !o && setProfileUserId(null)}
      />
    </>
  );
}
