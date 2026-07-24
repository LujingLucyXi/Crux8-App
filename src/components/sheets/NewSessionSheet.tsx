import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { useAppStore } from '@/store/useAppStore';
import type { Category, EventType, LocationType, Vibe, ClimbCall } from '@/seed/types';
import { plusHours } from '@/seed/types';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultGroupId?: string;
}

const CATEGORIES: { value: Category; label: string; loc: LocationType }[] = [
  { value: 'top_rope', label: 'Top Rope', loc: 'indoor' },
  { value: 'lead', label: 'Lead', loc: 'indoor' },
  { value: 'boulder', label: 'Boulder', loc: 'indoor' },
  { value: 'outdoor_sport', label: 'Outdoor Sport', loc: 'outdoor' },
  { value: 'trad', label: 'Trad', loc: 'outdoor' },
  { value: 'outdoor_boulder', label: 'Outdoor Boulder', loc: 'outdoor' },
];

const VIBES: Vibe[] = ['chill', 'projecting', 'training', 'social'];

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

const EVENT_TYPES: EventType[] = [
  'community_night',
  'identity',
  'education',
  'mountaineering',
  'backcountry',
  'comp',
  'social',
];

export function NewSessionSheet({ open, onOpenChange, defaultGroupId }: Props) {
  const gyms = useAppStore((s) => s.gyms);
  const me = useAppStore((s) => s.me);
  const groups = useAppStore((s) => s.groups);
  const postSession = useAppStore((s) => s.postSession);
  const postEvent = useAppStore((s) => s.postEvent);
  const postClimbCall = useAppStore((s) => s.postClimbCall);

  // Taxonomy mirrors Find: INDOOR / OUTDOOR / EVENT, with BELAY / BOULDER
  // under the two climb modes. Belay => climb call, Boulder => session.
  const [mode, setMode] = useState<'indoor' | 'outdoor' | 'event'>('indoor');
  const [discipline, setDiscipline] = useState<'belay' | 'boulder'>('belay');
  const [outdoorLoc, setOutdoorLoc] = useState('');

  // Call state
  const [callLookingFor, setCallLookingFor] = useState<ClimbCall['looking_for']>('take_turns');
  const [callCategory, setCallCategory] = useState<ClimbCall['category']>('top_rope');
  const [callTitle, setCallTitle] = useState('');
  const [callGrade, setCallGrade] = useState('5.10a–5.10d');
  const [callGymId, setCallGymId] = useState<string>(me?.home_gym_id ?? gyms[0]?.id ?? '');
  const [callWhen, setCallWhen] = useState<'now' | 'tonight' | 'custom'>('now');
  const todayStr = new Date().toISOString().slice(0, 10);
  const [callDate, setCallDate] = useState(todayStr);
  const [callTime, setCallTime] = useState('18:00');
  const [callDurationHours, setCallDurationHours] = useState(2);
  const [callCapacity, setCallCapacity] = useState(2);
  const [callNote, setCallNote] = useState('');

  // Session state
  const [category, setCategory] = useState<Category>('top_rope');
  const [sessionTitle, setSessionTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [gymId, setGymId] = useState<string>(me?.home_gym_id ?? gyms[0]?.id ?? '');
  const [area, setArea] = useState<string>('Index');
  const [durationHours, setDurationHours] = useState(2);
  const [capacity, setCapacity] = useState(4);
  const [vibe, setVibe] = useState<Vibe>('chill');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [note, setNote] = useState('');

  // Event state
  const [evtTitle, setEvtTitle] = useState('');
  const [evtTagline, setEvtTagline] = useState('');
  const [evtType, setEvtType] = useState<EventType>('community_night');
  const [evtVenue, setEvtVenue] = useState('');
  const [evtCost, setEvtCost] = useState(0);
  const [evtCapacity, setEvtCapacity] = useState<number | ''>(20);
  const [evtDesc, setEvtDesc] = useState('');
  const [evtGroupId, setEvtGroupId] = useState<string>(defaultGroupId ?? '');

  // Belay = roped climbing, so only gyms with top-rope/lead walls qualify
  // (drops boulder-only gyms like SBP / BlocHaus).
  const ropeGyms = useMemo(
    () => gyms.filter((g) => g.disciplines.some((d) => d === 'top_rope' || d === 'lead')),
    [gyms],
  );
  useEffect(() => {
    if (discipline === 'belay' && !ropeGyms.some((g) => g.id === callGymId)) {
      setCallGymId(ropeGyms[0]?.id ?? '');
    }
  }, [discipline, ropeGyms, callGymId]);

  const resolveStart = (): string => {
    if (callWhen === 'now') return new Date().toISOString();
    // "tonight" = today at the (editable) chosen time; "custom" = chosen day + time.
    const day = callWhen === 'tonight' ? todayStr : callDate;
    const d = new Date(`${day}T${callTime || '18:00'}`);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  };

  const catInfo = CATEGORIES.find((c) => c.value === category)!;
  const adminGroups = groups.filter((g) => g.admin_ids.includes(me?.id ?? 'me'));

  const reset = () => {
    setMode('indoor');
    setDiscipline('belay');
    setOutdoorLoc('');
    setCallLookingFor('take_turns');
    setCallCategory('top_rope');
    setCallTitle('');
    setCallGrade('5.10a–5.10d');
    setCallGymId(me?.home_gym_id ?? gyms[0]?.id ?? '');
    setCallWhen('now');
    setCallDate(todayStr);
    setCallTime('18:00');
    setCallDurationHours(2);
    setCallCapacity(2);
    setCallNote('');
    setCategory('top_rope');
    setSessionTitle('');
    setSubtitle('');
    setGymId(me?.home_gym_id ?? gyms[0]?.id ?? '');
    setArea('Index');
    setDurationHours(2);
    setCapacity(4);
    setVibe('chill');
    setVerifiedOnly(false);
    setNote('');
    setEvtTitle('');
    setEvtTagline('');
    setEvtType('community_night');
    setEvtVenue('');
    setEvtCost(0);
    setEvtCapacity(20);
    setEvtDesc('');
    setEvtGroupId('');
  };

  const handleSubmitCall = () => {
    const startsAt = resolveStart();
    const isOutdoor = mode === 'outdoor';
    postClimbCall({
      title: callTitle.trim() || undefined,
      looking_for: callLookingFor,
      category: callCategory,
      grade: callGrade,
      location_type: isOutdoor ? 'outdoor' : 'indoor',
      gym_id: isOutdoor ? undefined : callGymId,
      area: isOutdoor ? (outdoorLoc.trim() || 'Outdoor crag') : undefined,
      starts_at: startsAt,
      ends_at: plusHours(startsAt, callDurationHours),
      note: callNote.trim() || undefined,
      is_friend_only: false,
      weight_kg: me?.weight_kg,
      capacity: callCapacity,
      participant_ids: [me!.id],
    });
    toast('Climb call live', { description: `Belay partners can request to pair.` });
    onOpenChange(false);
    reset();
  };

  const handleSubmitSession = () => {
    // Boulder session; indoor or outdoor decided by `mode`.
    const isOutdoor = mode === 'outdoor';
    const startsIso = resolveStart();
    const session = postSession({
      category: isOutdoor ? 'outdoor_boulder' : 'boulder',
      title: sessionTitle.trim() || 'Boulder Session',
      subtitle: subtitle || 'All levels welcome',
      starts_at: startsIso,
      ends_at: plusHours(startsIso, durationHours),
      gym_id: isOutdoor ? undefined : gymId,
      area: isOutdoor ? (outdoorLoc.trim() || 'Outdoor boulders') : undefined,
      capacity,
      vibe,
      location_type: isOutdoor ? 'outdoor' : 'indoor',
      is_verified_only: false,
      requires_attestation: false,
      posted_by_group_id: defaultGroupId,
      note: note.trim() || undefined,
    });
    toast('Session posted', {
      description: `${session.capacity - 1} spots open · appears at the top of Find.`,
    });
    onOpenChange(false);
    reset();
  };

  const handleSubmitEvent = () => {
    const startsIso = new Date().toISOString();
    postEvent({
      title: evtTitle || 'Untitled event',
      tagline: evtTagline,
      type: evtType,
      starts_at: startsIso,
      ends_at: plusHours(startsIso, 3),
      venue: evtVenue,
      cost_cents: evtCost * 100,
      capacity: evtCapacity === '' ? null : evtCapacity,
      host_group_id: evtGroupId || undefined,
      age_restricted: false,
      description: evtDesc,
    });
    toast('Event posted', { description: 'Visible in Find → Events.' });
    onOpenChange(false);
    reset();
  };

  const sheetTitle =
    mode === 'event' ? 'Post an event' : discipline === 'belay' ? 'Drop a climb call' : 'Post a boulder session';

  // Shared location field — gym dropdown indoors, free-text crag outdoors.
  const locationField = (gymValue: string, onGym: (v: string) => void, gymList = gyms) =>
    mode === 'indoor' ? (
      <div>
        <Label>Gym</Label>
        <select
          value={gymValue}
          onChange={(e) => onGym(e.target.value)}
          className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900"
        >
          {gymList.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>
    ) : (
      <div>
        <Label>Exact location</Label>
        <Input
          value={outdoorLoc}
          onChange={(e) => setOutdoorLoc(e.target.value.slice(0, 80))}
          placeholder="e.g. Index — Lower Town Wall"
        />
        <p className="text-[10px] text-ink-300 mt-1">Crag, wall, or boulder field — as specific as you like.</p>
      </div>
    );

  const whenField = () => (
    <div>
      <Label>When</Label>
      <div className="grid grid-cols-3 gap-2">
        {([
          { v: 'now', l: 'Now' },
          { v: 'tonight', l: 'Tonight' },
          { v: 'custom', l: 'Pick date…' },
        ] as const).map((w) => (
          <button
            key={w.v}
            onClick={() => setCallWhen(w.v)}
            className={cn(
              'rounded-xl border py-2 text-xs',
              callWhen === w.v ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-700 border-ink-100',
            )}
          >
            {w.l}
          </button>
        ))}
      </div>
      {/* Tonight → editable time (today implied). Custom → day + time. */}
      {callWhen === 'tonight' && (
        <div className="mt-2">
          <Input type="time" value={callTime} onChange={(e) => setCallTime(e.target.value)} />
          <p className="text-[10px] text-ink-300 mt-1">Today at this time — adjust if you like.</p>
        </div>
      )}
      {callWhen === 'custom' && (
        <div className="grid grid-cols-2 gap-3 mt-2">
          <Input type="date" min={todayStr} value={callDate} onChange={(e) => setCallDate(e.target.value)} />
          <Input type="time" value={callTime} onChange={(e) => setCallTime(e.target.value)} />
        </div>
      )}
    </div>
  );

  const descriptionField = (value: string, onChange: (v: string) => void) => (
    <div>
      <Label>Details for climbers (optional)</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 600))}
        rows={5}
        placeholder="Meeting spot, gear to bring, parking, what you're projecting, pace, who it's for…"
      />
      <p className="text-[10px] text-ink-300 mt-1 text-right">{value.length} / 600</p>
    </div>
  );

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <SheetContent title={sheetTitle}>
        {/* Top: INDOOR / OUTDOOR / EVENT */}
        <div className="flex gap-2 mb-3 -mt-1">
          {([
            { v: 'indoor', l: 'Indoor' },
            { v: 'outdoor', l: 'Outdoor' },
            { v: 'event', l: 'Event' },
          ] as const).map((m) => (
            <button
              key={m.v}
              onClick={() => setMode(m.v)}
              className={cn(
                'flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors',
                mode === m.v ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-500 border-ink-100',
              )}
            >
              {m.l}
            </button>
          ))}
        </div>

        {/* Sub: BELAY / BOULDER (climb modes only) */}
        {mode !== 'event' && (
          <div className="flex gap-2 mb-5">
            {([
              { v: 'belay', l: 'Belay' },
              { v: 'boulder', l: 'Boulder' },
            ] as const).map((d) => (
              <button
                key={d.v}
                onClick={() => setDiscipline(d.v)}
                className={cn(
                  'flex-1 rounded-full border py-2 text-xs font-medium transition-colors',
                  discipline === d.v ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-ink-500 border-ink-100',
                )}
              >
                {d.l}
              </button>
            ))}
          </div>
        )}

        {/* ───────── BELAY (climb call) ───────── */}
        {mode !== 'event' && discipline === 'belay' && (
          <div className="flex flex-col gap-5">
            <p className="text-xs text-ink-500 -mt-1">
              A belay call — a rope partner request. Others tap "Request to pair" to lock it in.
            </p>
            <div>
              <Label>I'm looking for a…</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: 'belayer', l: 'Belayer' },
                  { v: 'climber', l: 'Climber' },
                  { v: 'take_turns', l: 'Take turns' },
                ] as const).map((r) => (
                  <button
                    key={r.v}
                    onClick={() => setCallLookingFor(r.v)}
                    className={cn(
                      'rounded-xl border py-2.5 text-xs font-semibold',
                      callLookingFor === r.v ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-700 border-ink-100',
                    )}
                  >
                    {r.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Style</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['top_rope', 'lead'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCallCategory(c)}
                    className={cn(
                      'rounded-xl border py-2.5 text-sm',
                      callCategory === c ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-700 border-ink-100',
                    )}
                  >
                    {c === 'top_rope' ? 'Top rope' : 'Lead'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Grade or range</Label>
              <select
                value={callGrade}
                onChange={(e) => setCallGrade(e.target.value)}
                className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900"
              >
                {GRADE_RANGES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Call name (optional)</Label>
              <Input value={callTitle} onChange={(e) => setCallTitle(e.target.value.slice(0, 48))} placeholder="e.g. Sunset lead sesh" />
            </div>
            {/* Belay is roped → only rope-capable gyms */}
            {locationField(callGymId, setCallGymId, ropeGyms)}
            {whenField()}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration (hours)</Label>
                <Input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={callDurationHours}
                  onChange={(e) => setCallDurationHours(Number(e.target.value) || 2)}
                />
              </div>
              <div>
                <Label>Party size</Label>
                <Input
                  type="number"
                  min={2}
                  max={12}
                  value={callCapacity}
                  onChange={(e) => setCallCapacity(Number(e.target.value) || 2)}
                />
              </div>
            </div>
            {descriptionField(callNote, setCallNote)}
            {!me?.weight_kg && (
              <div className="rounded-xl bg-gold-100 border border-gold-500/30 p-3 text-xs text-ink-700">
                Add your weight in Profile to unlock <b>weight-safe</b> matching. It stays hidden from other users.
              </div>
            )}
            <Button className="bg-teal-600 hover:bg-teal-500 border-teal-600" onClick={handleSubmitCall}>
              Drop climb call
            </Button>
          </div>
        )}

        {/* ───────── BOULDER (session) ───────── */}
        {mode !== 'event' && discipline === 'boulder' && (
          <div className="flex flex-col gap-5">
            <p className="text-xs text-ink-500 -mt-1">
              A boulder session — a group meetup. Set how many can join.
            </p>
            <div>
              <Label>Session name (optional)</Label>
              <Input value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value.slice(0, 48))} placeholder='Defaults to "Boulder Session"' />
            </div>
            <div>
              <Label>Grade or level</Label>
              <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value.slice(0, 60))} placeholder="e.g. V3 – V6, or 'All levels welcome'" />
            </div>
            {locationField(gymId, setGymId)}
            {whenField()}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration</Label>
                <select value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900">
                  {[1, 2, 3, 4, 6, 8].map((h) => (<option key={h} value={h}>{h}h</option>))}
                </select>
              </div>
              <div>
                <Label>Capacity</Label>
                <select value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900">
                  {[2, 3, 4, 5, 6].map((c) => (<option key={c} value={c}>{c} people</option>))}
                </select>
              </div>
            </div>
            <div>
              <Label>Vibe</Label>
              <RadioGroup.Root value={vibe} onValueChange={(v) => setVibe(v as Vibe)} className="flex gap-2 flex-wrap">
                {VIBES.map((v) => (
                  <RadioGroup.Item key={v} value={v} className={cn('rounded-full border px-3 py-1 text-xs font-medium capitalize', 'data-[state=checked]:bg-ink-900 data-[state=checked]:text-white data-[state=checked]:border-ink-900', 'bg-white text-ink-700 border-ink-100')}>
                    {v}
                  </RadioGroup.Item>
                ))}
              </RadioGroup.Root>
            </div>
            {descriptionField(note, setNote)}
            <Button onClick={handleSubmitSession}>Post boulder session</Button>
          </div>
        )}

        {/* ───────── EVENT ───────── */}
        {mode === 'event' && (
          <div className="flex flex-col gap-5">
            <div>
              <Label>Title</Label>
              <Input value={evtTitle} onChange={(e) => setEvtTitle(e.target.value)} placeholder="e.g. Queer Climb Night" />
            </div>
            <div>
              <Label>One-line tagline</Label>
              <Input value={evtTagline} onChange={(e) => setEvtTagline(e.target.value)} />
            </div>
            <div>
              <Label>Type</Label>
              <select value={evtType} onChange={(e) => setEvtType(e.target.value as EventType)} className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900">
                {EVENT_TYPES.map((t2) => (<option key={t2} value={t2}>{t2.replace('_', ' ')}</option>))}
              </select>
            </div>
            <div>
              <Label>Venue</Label>
              <Input value={evtVenue} onChange={(e) => setEvtVenue(e.target.value)} placeholder="Gym name or address" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cost (USD)</Label>
                <Input type="number" min={0} value={evtCost} onChange={(e) => setEvtCost(Number(e.target.value))} />
              </div>
              <div>
                <Label>Capacity</Label>
                <Input type="number" min={2} value={evtCapacity} onChange={(e) => setEvtCapacity(e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
            </div>
            {adminGroups.length > 0 && (
              <div>
                <Label>Post as group (optional)</Label>
                <select value={evtGroupId} onChange={(e) => setEvtGroupId(e.target.value)} className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900">
                  <option value="">— just me —</option>
                  {adminGroups.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
                </select>
              </div>
            )}
            <div>
              <Label>Description</Label>
              <Textarea value={evtDesc} onChange={(e) => setEvtDesc(e.target.value.slice(0, 600))} rows={6} placeholder="What is it? Who's it for? Schedule, cost breakdown, what to bring…" />
              <p className="text-[10px] text-ink-300 mt-1 text-right">{evtDesc.length} / 600</p>
            </div>
            <Button onClick={handleSubmitEvent}>Post event</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
