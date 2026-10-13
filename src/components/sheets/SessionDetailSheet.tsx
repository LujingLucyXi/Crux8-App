import { useState } from 'react';
import { SessionSummarySheet } from '@/components/sheets/SessionSummarySheet';
import { SessionRecapSheet } from '@/components/sheets/SessionRecapSheet';
import { ShareSessionSheet } from '@/components/sheets/ShareSessionSheet';
import { sessionPhase, canStartSession } from '@/lib/sessionPhase';
import { toast } from 'sonner';
import { ShieldCheck, MapPin, Calendar, OpenInWindow, User, EditPencil, ShareIos } from 'iconoir-react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea } from '@/components/ui/Input';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { Checkbox } from '@/components/ui/Checkbox';
import { Avatar } from '@/components/ui/Avatar';
import { useAppStore } from '@/store/useAppStore';
import { formatSessionWhen } from '@/lib/date';
import type { Session, VerificationCategory, Vibe } from '@/seed/types';
import { formatCapacity } from '@/seed/types';
import { GearChecklistSheet } from './GearChecklistSheet';
import { CertVerificationSheet } from './CertVerificationSheet';
import { UserProfileSheet } from './UserProfileSheet';
import { openExternal, tapTick } from '@/lib/native';
import { resolveUser } from '@/lib/resolveUser';
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
  const updateSession = useAppStore((s) => s.updateSession);
  const users = useAppStore((s) => s.users);
  const directory = useAppStore((s) => s.directory);
  const directoryVerifications = useAppStore((s) => s.directoryVerifications);
  const gyms = useAppStore((s) => s.gyms);
  const routes = useAppStore((s) => s.routes);
  const verifications = useAppStore((s) => s.verifications);
  const me = useAppStore((s) => s.me);
  const lifecycle = useAppStore((s) => (session ? s.sessionLifecycle[session.id] : undefined));
  const startSession = useAppStore((s) => s.startSession);
  const finishSession = useAppStore((s) => s.finishSession);

  const [gearOpen, setGearOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const [attestOpen, setAttestOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [attested, setAttested] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [recapOpen, setRecapOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  if (!session || !me) return null;
  // Lifecycle is manual (see lib/sessionPhase): the clock never starts or
  // finishes a session. isPast here means "finished by a participant".
  const phase = sessionPhase(session, lifecycle);
  const isPast = phase === 'done';
  const isHost = session.host_id === me.id;
  const isJoined = session.participant_ids.includes(me.id);
  const isFull = session.participant_ids.length >= session.capacity;
  // Editing locks 2 hours before the session starts.
  const editLocked = new Date(session.starts_at).getTime() - Date.now() < 2 * 3600_000;
  const canEdit = isHost && !editLocked;
  const gym = session.gym_id ? gyms.find((g) => g.id === session.gym_id) : undefined;
  const route = session.route_id ? routes.find((r) => r.id === session.route_id) : undefined;
  const host = resolveUser(session.host_id, me, users, directory);
  const participants = session.participant_ids
    .map((id) => {
      const u = resolveUser(id, me, users, directory);
      return u ? { ...u, isMe: id === me.id } : null;
    })
    .filter(Boolean) as Array<{ id: string; display_name: string; avatar?: AvatarConfig; photo_url?: string | null; isMe?: boolean }>;

  const requiredVerification = catToVerification(session.category);
  const isVerified = requiredVerification
    ? (['self_attested', 'verified'] as const).includes(verifications[requiredVerification].status as 'verified')
    : true;

  // Gear checklist now gates the RSVP: show what to bring, THEN join on
  // confirm. We open the gear sheet ON TOP of the (still-mounted) detail
  // sheet — closing the detail here would null its session in the parent
  // and unmount the gear sheet before it could appear.
  const doRsvp = () => {
    setGearOpen(true);
  };

  const confirmRsvp = async () => {
    await rsvp(session.id);
    void tapTick();
    toast(`You're in for ${session.title}`, { description: formatSessionWhen(session.starts_at) });
    onOpenChange(false); // close the detail sheet after joining
  };

  const handleRsvp = async () => {
    if (isJoined) {
      // One click: leave, close the sheet, gone from my lists (it stays
      // reachable in Past history via the store's leftSessions record).
      void unrsvp(session.id);
      toast('Left session');
      onOpenChange(false);
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
            <button
              onClick={() => void openExternal(route.mp_url)}
              className="mb-5 flex w-full items-center justify-between rounded-xl border border-ink-100 bg-paper-50 px-4 py-3 text-left hover:bg-paper-100"
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
            </button>
          )}

          {session.note && (
            <div className="mb-5 rounded-xl bg-paper-50 border border-ink-100 p-3">
              <p className="text-sm text-ink-700 italic">"{session.note}"</p>
            </div>
          )}

          <div className="mb-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
              Who's going · {participants.length} / {formatCapacity(session.capacity)}
            </h3>
            <div className="flex flex-col gap-2">
              {participants.map((p) => (
                <button
                  key={p.id}
                  onClick={() => !p.isMe && setProfileUserId(p.id)}
                  disabled={p.isMe}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-paper-50 disabled:cursor-default disabled:hover:bg-transparent text-left"
                >
                  <Avatar photoUrl={p.photo_url ?? undefined} config={p.avatar} alt={p.display_name} size={32} fallback={p.display_name} />
                  <span className="text-sm text-ink-900 flex-1">{p.display_name}</span>
                  {(() => {
                    const vs = p.isMe
                      ? undefined
                      : (users.find((u) => u.id === p.id)?.verifications ??
                        directoryVerifications[p.id]);
                    const peerConfirmed = vs
                      ? requiredVerification
                        ? vs[requiredVerification] === 'verified'
                        : Object.values(vs).includes('verified')
                      : false;
                    return peerConfirmed ? (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-600 uppercase tracking-wider"
                        title="Peer-confirmed belayer"
                      >
                        <ShieldCheck width={12} height={12} /> Peer-confirmed
                      </span>
                    ) : null;
                  })()}
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

          {!isPast && (
            <button
              onClick={() => setShareOpen(true)}
              className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink-100 py-2.5 text-sm font-semibold text-ink-700"
            >
              <ShareIos width={15} height={15} /> Invite CruxMate
            </button>
          )}

          {/* Lifecycle: manual start / finish only — never the clock. */}
          {isJoined && phase === 'upcoming' && (
            <div className="mt-2">
              <Button
                className="w-full"
                disabled={!canStartSession(session)}
                onClick={() => {
                  startSession(session.id);
                  toast.success('Session started — have a good climb! 🧗');
                }}
              >
                ▶ Start session
              </Button>
              {!canStartSession(session) && (
                <p className="text-xs text-ink-500 text-center mt-2">
                  Starting opens 30 min before the session. If nobody starts it within
                  1 hr of the start time, it lapses.
                </p>
              )}
            </div>
          )}
          {/* Once a session has started (and isn't finished), ending it is
              always one tap away for anyone in it — independent of the
              phase/ends_at edges, so the option can never vanish. */}
          {isJoined && (session.started_at || lifecycle?.started_at) && !(session.finished_at || lifecycle?.finished_at) && (
            <div className="mt-2">
              <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-coral-500">
                ● Live now
              </p>
              <Button
                className="w-full"
                onClick={() => {
                  finishSession(session.id);
                  setRecapOpen(true);
                }}
              >
                End session
              </Button>
            </div>
          )}
          {phase === 'expired' && (
            <p className="mt-2 text-center text-xs text-ink-500">
              This session never started.
            </p>
          )}
          {canEdit && !editing && (
            <Button variant="outline" className="w-full mt-2" onClick={() => setEditing(true)}>
              <EditPencil width={14} height={14} className="mr-1" /> Edit session
            </Button>
          )}
          {isHost && editLocked && (
            <p className="text-xs text-ink-400 text-center mt-2">
              Editing is locked within 2 hours of the session.
            </p>
          )}
          {editing && (
            <EditSessionForm
              session={session}
              gyms={gyms}
              onCancel={() => {
                setEditing(false);
                setEditError('');
              }}
              onSave={async (patch) => {
                setSaving(true);
                setEditError('');
                try {
                  await updateSession(session.id, patch);
                  toast('Session updated');
                  setEditing(false);
                } catch (e) {
                  setEditError(e instanceof Error ? e.message : 'Could not save — try again.');
                } finally {
                  setSaving(false);
                }
              }}
              saving={saving}
              error={editError}
            />
          )}
        </SheetContent>
        {isPast && (
          <div className="px-6 pb-6">
            <Button variant="outline" className="w-full" onClick={() => setSummaryOpen(true)}>
              🃏 View session card
            </Button>
          </div>
        )}
      </Sheet>
      <SessionSummarySheet session={session} open={summaryOpen} onOpenChange={setSummaryOpen} />
      <ShareSessionSheet session={session} open={shareOpen} onOpenChange={setShareOpen} />
      {/* Finish flow: optional ratings first, then the session card. */}
      <SessionRecapSheet
        session={session}
        open={recapOpen}
        onOpenChange={(o) => {
          setRecapOpen(o);
          if (!o) setSummaryOpen(true);
        }}
      />

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

      <GearChecklistSheet session={session} open={gearOpen} onOpenChange={setGearOpen} onConfirm={confirmRsvp} />

      <UserProfileSheet
        userId={profileUserId}
        open={!!profileUserId}
        onOpenChange={(o) => !o && setProfileUserId(null)}
      />
    </>
  );
}

const EDIT_VIBES: Vibe[] = ['chill', 'projecting', 'training', 'social'];

/** Host-only inline editor. Editing is locked 2h before start (enforced in the store too). */
function EditSessionForm({
  session,
  gyms,
  onCancel,
  onSave,
  saving,
  error,
}: {
  session: Session;
  gyms: { id: string; name: string }[];
  onCancel: () => void;
  onSave: (patch: Partial<Session>) => Promise<void>;
  saving: boolean;
  error: string;
}) {
  const start = new Date(session.starts_at);
  const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
  const toTimeStr = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const [title, setTitle] = useState(session.title);
  const [subtitle, setSubtitle] = useState(session.subtitle);
  const [date, setDate] = useState(toDateStr(start));
  const [time, setTime] = useState(toTimeStr(start));
  const [gymId, setGymId] = useState(session.gym_id ?? '');
  const [capacity, setCapacity] = useState(session.capacity);
  const [vibe, setVibe] = useState<Vibe>(session.vibe);
  const [note, setNote] = useState(session.note ?? '');

  const durationMs = new Date(session.ends_at).getTime() - new Date(session.starts_at).getTime();

  const save = () => {
    const startsAt = new Date(`${date}T${time}`);
    if (isNaN(startsAt.getTime())) return;
    void onSave({
      title: title.trim() || session.title,
      subtitle: subtitle.trim() || session.subtitle,
      starts_at: startsAt.toISOString(),
      ends_at: new Date(startsAt.getTime() + durationMs).toISOString(),
      gym_id: gymId || undefined,
      capacity: Math.max(2, capacity),
      vibe,
      note: note.trim() || undefined,
    });
  };

  return (
    <div className="mt-4 rounded-2xl border border-ink-100 bg-paper-50 p-4 flex flex-col gap-3">
      <h3 className="font-semibold text-ink-900 text-sm">Edit session</h3>
      <div>
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} />
      </div>
      <div>
        <Label>Subtitle</Label>
        <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} maxLength={60} />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex-1">
          <Label>Time</Label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Gym</Label>
        <select
          value={gymId}
          onChange={(e) => setGymId(e.target.value)}
          className="w-full rounded-xl border border-ink-200 bg-paper-100 px-3 py-2.5 text-sm text-ink-900"
        >
          <option value="">No gym</option>
          {gyms.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Label>Party size</Label>
          <select
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="w-full rounded-xl border border-ink-200 bg-paper-100 px-3 py-2.5 text-sm text-ink-900"
          >
            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => (
              <option key={c} value={c}>
                {c} people
              </option>
            ))}
            <option value={99}>10+ (uncapped)</option>
          </select>
        </div>
        <div className="flex-1">
          <Label>Vibe</Label>
          <select
            value={vibe}
            onChange={(e) => setVibe(e.target.value as Vibe)}
            className="w-full rounded-xl border border-ink-200 bg-paper-100 px-3 py-2.5 text-sm text-ink-900 capitalize"
          >
            {EDIT_VIBES.map((v) => (
              <option key={v} value={v} className="capitalize">
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <Label>Note</Label>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={280} />
      </div>
      {error && <p className="text-sm text-coral-600">{error}</p>}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}
