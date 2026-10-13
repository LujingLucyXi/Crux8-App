import { toast } from 'sonner';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, ShieldCheck, Xmark, ShareIos } from 'iconoir-react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { ShareCallSheet } from '@/components/sheets/ShareCallSheet';
import { StartSessionSheet } from '@/components/sheets/StartSessionSheet';
import { useAppStore } from '@/store/useAppStore';
import { isWeightSafe } from '@/lib/weight';
import { gymsForCategory } from '@/lib/gymFilter';
import { cn } from '@/lib/utils';
import { LOOKING_FOR_LABEL } from '@/components/cards/ClimbCallCard';
import { resolveUser } from '@/lib/resolveUser';
import type { ClimbCall } from '@/seed/types';

interface Props {
  call: ClimbCall | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClimbCallDetailSheet({ call, open, onOpenChange }: Props) {
  const nav = useNavigate();
  const me = useAppStore((s) => s.me);
  const users = useAppStore((s) => s.users);
  const directory = useAppStore((s) => s.directory);
  const gyms = useAppStore((s) => s.gyms);
  const cruxmates = useAppStore((s) => s.cruxmates);
  const pairRequests = useAppStore((s) => s.pairRequests);
  const requestPair = useAppStore((s) => s.requestPair);
  const cancelPairRequest = useAppStore((s) => s.cancelPairRequest);
  const addCruxMate = useAppStore((s) => s.addCruxMate);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const [shareOpen, setShareOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  if (!call || !me) return null;
  const caller = resolveUser(call.user_id, me, users, directory);
  const gym = call.gym_id ? gyms.find((g) => g.id === call.gym_id) : undefined;
  const locationLabel = gym?.name ?? call.area ?? 'Location TBD';
  if (!caller) return null;
  // NPC-only fields (verifications, pronouns) aren't on resolved directory users.
  const callerNpc = users.find((u) => u.id === call.user_id);

  const isRequested = pairRequests.includes(call.id);  const isFriend = cruxmates.includes(caller.id);
  const weightSafe = isWeightSafe(me.weight_kg, call.weight_kg);
  const isMyCall = caller.id === me.id;
  // The host can always start their own call (even solo — others can join
  // the live session later); anyone else needs a real group of 2+.
  const canStart = call.status === 'live' && (isMyCall || call.participant_ids.length >= 2);

  const handleRequest = async () => {
    if (isRequested) {
      await cancelPairRequest(call.id);
      toast('Pair request canceled');
      return;
    }
    await requestPair(call.id);
    // Auto-add as CruxMate + start chat
    if (!isFriend) addCruxMate(caller.id);
    sendMessage(caller.id, `Hi! Requesting to pair on your ${call.category === 'top_rope' ? 'top-rope' : 'lead'} call at ${gym?.short_name ?? call.area}.`);
    toast(`Paired with ${caller.display_name}`, {
      description: 'Chat opened — say hi and confirm details.',
    });
    setTimeout(() => {
      onOpenChange(false);
      nav(`/chat/${caller.id}`);
    }, 500);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title=" ">
        <div className="flex flex-col items-center -mt-4 mb-5">
          <Avatar photoUrl={caller.photo_url ?? undefined} config={caller.avatar} alt={caller.display_name} size={96} fallback={caller.display_name} />
          <h2 className="mt-3 text-xl font-semibold text-ink-900">{caller.display_name}</h2>
          {callerNpc?.pronouns && <p className="text-sm text-ink-500">{callerNpc.pronouns}</p>}

          <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
            <span className="rounded-full bg-paper-50 border border-ink-100 text-ink-700 text-[11px] font-semibold px-2.5 py-0.5 tracking-wider">
              {LOOKING_FOR_LABEL[call.looking_for].toUpperCase()}
            </span>
            {weightSafe && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 text-teal-600 text-[11px] font-semibold px-2 py-0.5">
                ⚖ weight-safe with you
              </span>
            )}
            {isFriend && (
              <span className="rounded-full bg-paper-50 border border-ink-100 text-ink-700 text-[11px] font-semibold px-2.5 py-0.5">
                CruxMate
              </span>
            )}
          </div>

          {/* Verified belay chips */}
          <div className="mt-3 flex flex-wrap gap-1 justify-center">
            {(['top_rope', 'lead', 'trad'] as const).map((cat) => {
              const isV = callerNpc?.verifications[cat] === 'verified';
              return (
                <span
                  key={cat}
                  className={
                    isV
                      ? 'inline-flex items-center gap-1 rounded-full bg-teal-600 text-white text-[10px] font-semibold px-2 py-0.5'
                      : 'inline-flex items-center gap-1 rounded-full border border-ink-100 text-ink-300 text-[10px] font-semibold px-2 py-0.5'
                  }
                >
                  {isV ? <ShieldCheck width={11} height={11} /> : <Xmark width={11} height={11} />}
                  {cat.replace('_', ' ')}
                </span>
              );
            })}
          </div>
        </div>

        {editing ? (
          <EditCallForm call={call} onDone={() => setEditing(false)} />
        ) : (
        <>
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-ink-700">
            <MapPin width={16} height={16} className="text-ink-500" />
            <span>{locationLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-700">
            <Clock width={16} height={16} className="text-ink-500" />
            <span>
              {new Date(call.starts_at).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
              {' → '}
              {new Date(call.ends_at).toLocaleString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-700">
            <span className="capitalize">
              {call.category === 'top_rope' ? 'Top-rope' : 'Lead'} · {call.grade}
            </span>
          </div>
        </div>

        {call.note && (
          <div className="mb-5 rounded-xl bg-paper-50 border border-ink-100 p-3">
            <p className="text-sm text-ink-900 italic">"{call.note}"</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {isMyCall ? (
            <>
              <p className="text-sm text-ink-500 text-center">This is your call — it's visible to others.</p>
              <Button variant="outline" onClick={() => setEditing(true)}>
                Edit call
              </Button>
              <Button variant="outline" onClick={() => setShareOpen(true)}>
                Invite CruxMate
              </Button>
            </>
          ) : (
            <Button
              variant={isRequested ? 'outline' : 'primary'}
              className={isRequested ? '' : 'bg-teal-600 hover:bg-teal-500 border-teal-600'}
              onClick={handleRequest}
            >
              {isRequested ? 'Cancel pair request' : 'Request to pair'}
            </Button>
          )}
          <Button variant="outline" onClick={() => setShareOpen(true)}>
            <ShareIos width={16} height={16} /> Share
          </Button>
          {canStart && (
            <Button
              className="bg-teal-600 hover:bg-teal-500 border-teal-600"
              onClick={() => setStartOpen(true)}
            >
              🧗 Start session
            </Button>
          )}
        </div>
        </>
        )}
      </SheetContent>
      <ShareCallSheet call={call} open={shareOpen} onOpenChange={setShareOpen} />
      <StartSessionSheet
        call={call}
        open={startOpen}
        onOpenChange={setStartOpen}
        onStarted={() => onOpenChange(false)}
      />
    </Sheet>
  );
}

const GRADE_RANGES = [
  'All levels',
  '5.6–5.8',
  '5.8–5.10a',
  '5.10a–5.10d',
  '5.10d–5.11b',
  '5.11a–5.11d',
  '5.11c–5.12b',
  '5.12c+',
];
const DURATIONS = [0.5, 1, 1.5, 2, 2.5, 3, 4];

const pad2 = (n: number) => String(n).padStart(2, '0');
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const toTimeStr = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

/** Host-only edit form for a climb call (rendered inside the detail sheet). */
function EditCallForm({ call, onDone }: { call: ClimbCall; onDone: () => void }) {
  const gyms = useAppStore((s) => s.gyms);
  const updateClimbCall = useAppStore((s) => s.updateClimbCall);
  const start = new Date(call.starts_at);
  const end = new Date(call.ends_at);
  const [title, setTitle] = useState(call.title ?? '');
  const [lookingFor, setLookingFor] = useState<ClimbCall['looking_for']>(call.looking_for);
  const [category, setCategory] = useState<ClimbCall['category']>(call.category);
  const [grade, setGrade] = useState(call.grade);
  const [gymId, setGymId] = useState(call.gym_id ?? '');
  const [area, setArea] = useState(call.area ?? '');
  const [date, setDate] = useState(toDateStr(start));
  const [time, setTime] = useState(toTimeStr(start));
  const [duration, setDuration] = useState(
    Math.max(0.5, Math.round(((end.getTime() - start.getTime()) / 3600000) * 2) / 2),
  );
  const [note, setNote] = useState(call.note ?? '');
  const [capacity, setCapacity] = useState(call.capacity);
  const [saving, setSaving] = useState(false);

  // The gym list follows the category: top-rope calls list top-rope gyms,
  // lead calls list lead gyms (same rule as call creation).
  const gymOptions = useMemo(() => gymsForCategory(gyms, category), [gyms, category]);
  useEffect(() => {
    if (call.location_type === 'indoor' && !gymOptions.some((g) => g.id === gymId)) {
      setGymId(gymOptions[0]?.id ?? '');
    }
  }, [gymOptions, gymId, call.location_type]);

  const save = async () => {
    const starts = new Date(`${date}T${time || '18:00'}`);
    if (isNaN(starts.getTime())) {
      toast.error('Pick a valid date and time');
      return;
    }
    setSaving(true);
    await updateClimbCall(call.id, {
      title: title.trim() || null,
      looking_for: lookingFor,
      category,
      grade,
      gym_id: call.location_type === 'indoor' ? gymId || null : null,
      area: call.location_type === 'outdoor' ? area.trim() || null : null,
      starts_at: starts.toISOString(),
      ends_at: new Date(starts.getTime() + duration * 3600000).toISOString(),
      note: note.trim() || null,
      capacity,
    });
    setSaving(false);
    toast.success('Call updated');
    onDone();
  };

  const toggleCls = (active: boolean) =>
    cn(
      'rounded-xl border py-2.5 text-sm flex-1',
      active
        ? 'bg-brand-600 text-[#161310] border-brand-600 font-semibold'
        : 'bg-paper-100 text-ink-700 border-ink-100',
    );
  const selectCls =
    'w-full rounded-xl border border-ink-100 bg-paper-100 px-3.5 py-2.5 text-sm text-ink-900';

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label>Call name (optional)</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 48))} placeholder="e.g. Sunset lead sesh" />
      </div>
      <div>
        <Label>Looking for</Label>
        <div className="flex gap-2">
          {(Object.keys(LOOKING_FOR_LABEL) as ClimbCall['looking_for'][]).map((k) => (
            <button key={k} type="button" onClick={() => setLookingFor(k)} className={toggleCls(lookingFor === k)}>
              {LOOKING_FOR_LABEL[k].replace('Needs ', '')}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Type</Label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setCategory('top_rope')} className={toggleCls(category === 'top_rope')}>
            Top rope
          </button>
          <button type="button" onClick={() => setCategory('lead')} className={toggleCls(category === 'lead')}>
            Lead
          </button>
        </div>
      </div>
      <div>
        <Label>Grade or range</Label>
        <select value={grade} onChange={(e) => setGrade(e.target.value)} className={selectCls}>
          {GRADE_RANGES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>
      {call.location_type === 'indoor' ? (
        <div>
          <Label>Gym</Label>
          <select value={gymId} onChange={(e) => setGymId(e.target.value)} className={selectCls}>
            {gymOptions.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <Label>Exact location</Label>
          <Input value={area} onChange={(e) => setArea(e.target.value.slice(0, 80))} placeholder="e.g. Index — Lower Town Wall" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label>Start time</Label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Duration (hours)</Label>
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={selectCls}>
            {DURATIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Group size (incl. you)</Label>
          <select value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className={selectCls}>
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <Label>Note (optional)</Label>
        <Input value={note} onChange={(e) => setNote(e.target.value.slice(0, 140))} placeholder="e.g. Projecting 5.11a — soft catches please" />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}
