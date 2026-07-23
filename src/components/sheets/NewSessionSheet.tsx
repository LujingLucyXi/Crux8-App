import { useState } from 'react';
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

  const [type, setType] = useState<'session' | 'call' | 'event'>('call');

  // Call state
  const [callLookingFor, setCallLookingFor] = useState<ClimbCall['looking_for']>('take_turns');
  const [callCategory, setCallCategory] = useState<ClimbCall['category']>('top_rope');
  const [callTitle, setCallTitle] = useState('');
  const [callGrade, setCallGrade] = useState('5.10a–5.11a');
  const [callGymId, setCallGymId] = useState<string>(me?.home_gym_id ?? gyms[0]?.id ?? '');
  const [callWhen, setCallWhen] = useState<'now' | 'tonight' | 'tomorrow_morning'>('now');
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

  const catInfo = CATEGORIES.find((c) => c.value === category)!;
  const adminGroups = groups.filter((g) => g.admin_ids.includes(me?.id ?? 'me'));

  const reset = () => {
    setType('call');
    setCallLookingFor('take_turns');
    setCallCategory('top_rope');
    setCallTitle('');
    setCallGrade('5.10a–5.11a');
    setCallGymId(me?.home_gym_id ?? gyms[0]?.id ?? '');
    setCallWhen('now');
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
    let startsAt: string;
    if (callWhen === 'now') {
      startsAt = new Date().toISOString();
    } else if (callWhen === 'tonight') {
      const d = new Date();
      d.setHours(18, 0, 0, 0);
      startsAt = d.toISOString();
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      startsAt = d.toISOString();
    }
    postClimbCall({
      title: callTitle.trim() || undefined,
      looking_for: callLookingFor,
      category: callCategory,
      grade: callGrade,
      gym_id: callGymId,
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
    const startsIso = new Date().toISOString();
    const session = postSession({
      category,
      title: sessionTitle.trim() || catInfo.label,
      subtitle: subtitle || 'All levels welcome',
      starts_at: startsIso,
      ends_at: plusHours(startsIso, durationHours),
      gym_id: catInfo.loc === 'indoor' ? gymId : undefined,
      area: catInfo.loc === 'outdoor' ? area : undefined,
      capacity,
      vibe,
      location_type: catInfo.loc,
      is_verified_only: verifiedOnly,
      requires_attestation: category === 'trad',
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

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <SheetContent title={type === 'call' ? 'Drop a climb call' : type === 'session' ? 'Post a session' : 'Post an event'}>
        <div className="flex gap-2 mb-5 -mt-1">
          {(
            [
              { value: 'call', label: 'Climb call' },
              { value: 'session', label: 'Session' },
              { value: 'event', label: 'Event' },
            ] as const
          ).map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={cn(
                'flex-1 rounded-xl border py-2 text-xs font-medium transition-colors',
                type === t.value
                  ? 'bg-ink-900 text-white border-ink-900'
                  : 'bg-white text-ink-500 border-ink-100',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {type === 'call' ? (
          <div className="flex flex-col gap-5">
            <p className="text-xs text-ink-500 -mt-1">
              A 1:1 belay call. Solo — no capacity. Others tap "Request to pair" to lock it in.
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
              <Input value={callGrade} onChange={(e) => setCallGrade(e.target.value)} placeholder="e.g. 5.10a–5.11a" />
            </div>
            <div>
              <Label>Call name (optional)</Label>
              <Input
                value={callTitle}
                onChange={(e) => setCallTitle(e.target.value.slice(0, 48))}
                placeholder="e.g. Sunset lead sesh"
              />
            </div>
            <div>
              <Label>Gym</Label>
              <select
                value={callGymId}
                onChange={(e) => setCallGymId(e.target.value)}
                className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900"
              >
                {gyms.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>When</Label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { v: 'now', l: 'Now' },
                    { v: 'tonight', l: 'Tonight 6pm' },
                    { v: 'tomorrow_morning', l: 'Tomorrow 9am' },
                  ] as const
                ).map((w) => (
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration</Label>
                <select
                  value={callDurationHours}
                  onChange={(e) => setCallDurationHours(Number(e.target.value))}
                  className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900"
                >
                  {[1, 2, 3, 4].map((h) => (
                    <option key={h} value={h}>
                      +{h}h
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Party size</Label>
                <select
                  value={callCapacity}
                  onChange={(e) => setCallCapacity(Number(e.target.value))}
                  className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900"
                >
                  {[2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} people
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>Note (optional · 140 char)</Label>
              <Textarea
                value={callNote}
                onChange={(e) => setCallNote(e.target.value.slice(0, 140))}
                rows={2}
                placeholder="e.g. Projecting 5.11a — soft catches please"
              />
              <p className="text-[10px] text-ink-300 mt-1 text-right">{callNote.length} / 140</p>
            </div>
            {!me?.weight_kg && (
              <div className="rounded-xl bg-gold-100 border border-gold-500/30 p-3 text-xs text-ink-700">
                Add your weight in Profile to unlock <b>weight-safe</b> matching. It stays hidden from other users.
              </div>
            )}
            <Button className="bg-teal-600 hover:bg-teal-500 border-teal-600" onClick={handleSubmitCall}>
              Drop climb call
            </Button>
          </div>
        ) : type === 'session' ? (
          <div className="flex flex-col gap-5">
            <div>
              <Label>Category</Label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={cn(
                      'rounded-xl border p-3 text-sm text-left',
                      category === c.value
                        ? 'bg-ink-900 text-white border-ink-900'
                        : 'bg-white text-ink-700 border-ink-100',
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Session name (optional)</Label>
              <Input
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value.slice(0, 48))}
                placeholder={`Defaults to "${catInfo.label}"`}
              />
              <p className="text-[10px] text-ink-300 mt-1 text-right">{sessionTitle.length} / 48</p>
            </div>

            <div>
              <Label>Tagline · grade or level</Label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value.slice(0, 60))}
                placeholder="e.g. 5.10a – 5.11c, V3 – V6, or 'All levels welcome'"
              />
              <p className="text-[10px] text-ink-300 mt-1 text-right">{subtitle.length} / 60</p>
            </div>

            {catInfo.loc === 'indoor' ? (
              <div>
                <Label>Gym</Label>
                <select
                  value={gymId}
                  onChange={(e) => setGymId(e.target.value)}
                  className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900"
                >
                  {gyms.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <Label>Area</Label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900"
                >
                  {['Index', 'Gold Bar', 'Leavenworth', 'Vantage', 'Exit 38', 'Little Si', 'Squamish', 'Smith Rock'].map(
                    (a) => (
                      <option key={a}>{a}</option>
                    ),
                  )}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration (hours)</Label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900"
                >
                  {[1, 2, 3, 4, 6, 8].map((h) => (
                    <option key={h} value={h}>
                      {h}h
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Capacity</Label>
                <select
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900"
                >
                  {[2, 3, 4, 5, 6].map((c) => (
                    <option key={c} value={c}>
                      {c} people
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Vibe</Label>
              <RadioGroup.Root value={vibe} onValueChange={(v) => setVibe(v as Vibe)} className="flex gap-2 flex-wrap">
                {VIBES.map((v) => (
                  <RadioGroup.Item
                    key={v}
                    value={v}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium capitalize',
                      'data-[state=checked]:bg-ink-900 data-[state=checked]:text-white data-[state=checked]:border-ink-900',
                      'bg-white text-ink-700 border-ink-100',
                    )}
                  >
                    {v}
                  </RadioGroup.Item>
                ))}
              </RadioGroup.Root>
            </div>

            {catInfo.loc === 'indoor' && category !== 'boulder' && (
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox checked={verifiedOnly} onCheckedChange={(v) => setVerifiedOnly(!!v)} />
                <span className="text-sm text-ink-700">
                  Verified belayers only (raises the trust bar)
                </span>
              </label>
            )}

            <div>
              <Label>Note (optional · 140 char)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 140))}
                placeholder="Anything else people should know?"
                rows={2}
              />
              <p className="text-[10px] text-ink-300 mt-1 text-right">{note.length} / 140</p>
            </div>

            <Button onClick={handleSubmitSession}>Post session</Button>
          </div>
        ) : (
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
              <select
                value={evtType}
                onChange={(e) => setEvtType(e.target.value as EventType)}
                className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Venue</Label>
              <Input value={evtVenue} onChange={(e) => setEvtVenue(e.target.value)} placeholder="Gym name or address" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cost (USD)</Label>
                <Input
                  type="number"
                  min={0}
                  value={evtCost}
                  onChange={(e) => setEvtCost(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Capacity</Label>
                <Input
                  type="number"
                  min={2}
                  value={evtCapacity}
                  onChange={(e) => setEvtCapacity(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>
            {adminGroups.length > 0 && (
              <div>
                <Label>Post as group (optional)</Label>
                <select
                  value={evtGroupId}
                  onChange={(e) => setEvtGroupId(e.target.value)}
                  className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900"
                >
                  <option value="">— just me —</option>
                  {adminGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <Label>Description</Label>
              <Textarea
                value={evtDesc}
                onChange={(e) => setEvtDesc(e.target.value.slice(0, 500))}
                rows={4}
                placeholder="What is it? Who's it for?"
              />
              <p className="text-[10px] text-ink-300 mt-1 text-right">{evtDesc.length} / 500</p>
            </div>
            <Button onClick={handleSubmitEvent}>Post event</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
