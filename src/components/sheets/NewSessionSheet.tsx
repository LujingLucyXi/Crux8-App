import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { useAppStore } from '@/store/useAppStore';
import type { EventType, Vibe, ClimbCall, HikeType, Gym } from '@/seed/types';
import { plusHours, UNCAPPED_CAPACITY } from '@/seed/types';
import { cn } from '@/lib/utils';
import { gymsForCategory } from '@/lib/gymFilter';
import { resolveUser } from '@/lib/resolveUser';
import { CruxmatePicker } from './CruxmatePicker';
import { SuggestGymSheet } from './SuggestGymSheet';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultGroupId?: string;
}

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
  const cruxmates = useAppStore((s) => s.cruxmates);
  const users = useAppStore((s) => s.users);
  const directory = useAppStore((s) => s.directory);
  const ensureDirectoryProfiles = useAppStore((s) => s.ensureDirectoryProfiles);
  const inviteCruxmatesToCall = useAppStore((s) => s.inviteCruxmatesToCall);
  const inviteCruxyToCall = useAppStore((s) => s.inviteCruxyToCall);
  const inviteCruxmatesToSession = useAppStore((s) => s.inviteCruxmatesToSession);
  const inviteCruxy = useAppStore((s) => s.inviteCruxy);
  // Cruxmates to invite the moment the call/session is created.
  const [inviteIds, setInviteIds] = useState<string[]>([]);
  const invitable = me
    ? cruxmates
        .filter((id) => id !== me.id)
        .map((id) => resolveUser(id, me, users, directory))
        .filter((u): u is NonNullable<typeof u> => !!u)
    : [];
  const toggleInvite = (id: string) =>
    setInviteIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  // The picker resolves cruxmates through the directory — make sure
  // every cruxmate's profile is fetched when this form opens, or real
  // (non-seed) mates silently vanish from the list.
  useEffect(() => {
    if (open) void ensureDirectoryProfiles(cruxmates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  // "Invite to climb" from a friend's profile card opens THIS template
  // with that friend pre-invited (Lucy 2026-10-16: pick the time, the
  // gym, the level, the style — the template IS the invite composer).
  const preselectInvite = useAppStore((s) => s.newSessionPreselectInvite);
  const setPreselectInvite = useAppStore((s) => s.setNewSessionPreselectInvite);
  // Direct-invite mode (tester feedback relayed by Lucy 2026-10-16:
  // the full template has 'too many buttons' for a simple invite).
  // When the sheet opens from a friend's "Invite to climb", it renders
  // a LEAN form instead: when, gym, style, level, one send button —
  // riding the same state + submit handlers as the full form, with
  // sensible defaults (indoor, take-turns, 2h, standard capacity).
  const verifications = useAppStore((s) => s.verifications);
  const submitVerification = useAppStore((s) => s.submitVerification);
  const [leanBelayOk, setLeanBelayOk] = useState(false);
  const [directInviteId, setDirectInviteId] = useState<string | null>(null);
  const [leanStyle, setLeanStyle] = useState<'boulder' | 'top_rope' | 'lead'>('boulder');
  // Type FIRST, then the box (Lucy 2026-10-16, same breath as the
  // 'too many buttons' feedback): step 1 picks the climb type, step 2
  // shows only that type's simplified box.
  const [leanStep, setLeanStep] = useState<'type' | 'form'>('type');
  const [leanGrade, setLeanGrade] = useState('All levels');
  useEffect(() => {
    if (open && preselectInvite) {
      setInviteIds([preselectInvite]);
      setDirectInviteId(preselectInvite);
      setLeanBelayOk(false);
      setLeanStep('type');
      setLeanGrade('All levels');
      setPreselectInvite(null);
    }
  }, [open, preselectInvite, setPreselectInvite]);

  // Taxonomy mirrors Find: INDOOR / OUTDOOR / EVENT, with BELAY / BOULDER
  // under the two climb modes. Belay => climb call, Boulder => session.
  const [mode, setMode] = useState<'indoor' | 'outdoor' | 'event'>('indoor');
  const [discipline, setDiscipline] = useState<'belay' | 'boulder' | 'hike'>('belay');
  const [outdoorLoc, setOutdoorLoc] = useState('');
  const [hikeType, setHikeType] = useState<HikeType>('trail');
  const [tripDays, setTripDays] = useState(2);

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
  const [sessionTitle, setSessionTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [gymId, setGymId] = useState<string>(me?.home_gym_id ?? gyms[0]?.id ?? '');
  const [suggestGymOpen, setSuggestGymOpen] = useState(false);
  const [suggestFor, setSuggestFor] = useState<'call' | 'session'>('session');
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

  // Gym lists are category-scoped: a top-rope call lists only gyms with
  // top-rope walls, lead only lead gyms. The session form only ever posts
  // boulder sessions (see handleSubmitSession), so its list is boulder-only.
  // (It previously read a leftover `category` state that never left
  // 'top_rope', which hid every boulder-only gym — SBP included.)
  const callGyms = useMemo(
    () => gymsForCategory(gyms, callCategory),
    [gyms, callCategory],
  );
  const sessionGyms = useMemo(
    () => gymsForCategory(gyms, 'boulder'),
    [gyms],
  );

  // A gym suggested from a form joins the local list carrying the
  // discipline that form is posting, so it passes that form's gym filter
  // and can be auto-selected into the form's gym field.
  const suggestDisciplines: Gym['disciplines'] =
    suggestFor === 'call'
      ? callCategory === 'top_rope'
        ? ['top_rope']
        : ['lead']
      : ['boulder'];
  useEffect(() => {
    if (mode === 'indoor' && discipline === 'hike') setDiscipline('belay');
  }, [mode, discipline]);
  useEffect(() => {
    if (!callGyms.some((g) => g.id === callGymId)) {
      setCallGymId(callGyms[0]?.id ?? '');
    }
  }, [callGyms, callGymId]);
  useEffect(() => {
    if (mode === 'indoor' && !sessionGyms.some((g) => g.id === gymId)) {
      setGymId(sessionGyms[0]?.id ?? '');
    }
  }, [sessionGyms, gymId, mode]);

  const resolveStart = (): string => {
    if (callWhen === 'now') return new Date().toISOString();
    // "tonight" = today at the (editable) chosen time; "custom" = chosen day + time.
    const day = callWhen === 'tonight' ? todayStr : callDate;
    const d = new Date(`${day}T${callTime || '18:00'}`);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  };

  const adminGroups = groups.filter((g) => g.admin_ids.includes(me?.id ?? ''));

  const reset = () => {
    setDirectInviteId(null);
    setLeanStyle('boulder');
    setLeanBelayOk(false);
    setLeanStep('type');
    setLeanGrade('All levels');
    setMode('indoor');
    setDiscipline('belay');
    setOutdoorLoc('');
    setHikeType('trail');
    setTripDays(2);
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
    setInviteIds([]);
  };

  const handleSubmitCall = async () => {
    const startsAt = resolveStart();
    const isOutdoor = mode === 'outdoor';
    let created: Awaited<ReturnType<typeof postClimbCall>>;
    try {
      // The store fills user_id from the signed-in user and seeds
      // participant_ids from it; the payload must NOT carry them.
      created = await postClimbCall({
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
      });
    } catch {
      toast("Couldn't post — check your connection and try again.");
      return;
    }
    // Invites chosen in the form fire the moment the call exists: Cruxy
    // joins on the spot; everyone else gets the invite DM.
    if (inviteIds.includes('cruxy')) inviteCruxyToCall(created.id);
    const humans = inviteIds.filter((id) => id !== 'cruxy');
    if (humans.length > 0) inviteCruxmatesToCall(created.id, humans);
    toast('Climb call live', { description: `Belay partners can request to pair.` });
    onOpenChange(false);
    reset();
  };

  const handleSubmitSession = async () => {
    // Boulder session; indoor or outdoor decided by `mode`.
    const isOutdoor = mode === 'outdoor';
    const startsIso = resolveStart();
    try {
      // The store fills host_id from the signed-in user and seeds
      // participant_ids from it; the payload must NOT carry them.
      const session = await postSession({
        category: discipline === 'hike' ? 'hiking' : isOutdoor ? 'outdoor_boulder' : 'boulder',
        hike_type: discipline === 'hike' ? hikeType : undefined,
        title: sessionTitle.trim() || (discipline === 'hike' ? 'Hike' : 'Boulder Session'),
        subtitle: subtitle || 'All levels welcome',
        starts_at: startsIso,
        ends_at: plusHours(
          startsIso,
          discipline === 'hike' && hikeType === 'expedition' ? tripDays * 24 : durationHours,
        ),
        gym_id: isOutdoor ? undefined : gymId,
        area: isOutdoor ? (outdoorLoc.trim() || (discipline === 'hike' ? 'Trailhead' : 'Outdoor boulders')) : undefined,
        capacity,
        vibe,
        location_type: isOutdoor ? 'outdoor' : 'indoor',
        is_verified_only: false,
        requires_attestation: false,
        posted_by_group_id: defaultGroupId,
        note: note.trim() || undefined,
      });
      // Invites chosen in the form fire the moment the session exists.
      if (inviteIds.includes('cruxy')) inviteCruxy(session.id);
      const humans = inviteIds.filter((id) => id !== 'cruxy');
      if (humans.length > 0) inviteCruxmatesToSession(session.id, humans);
      toast('Session posted', {
        description: `${session.capacity >= UNCAPPED_CAPACITY ? 'Open invite' : `${session.capacity - 1} spots open`} · appears at the top of Find.`,
      });
      onOpenChange(false);
      reset();
    } catch {
      toast("Couldn't post — check your connection and try again.");
    }
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
    mode === 'event' ? 'Post an event' : discipline === 'belay' ? 'Drop a climb call' : discipline === 'hike' ? 'Post a hike' : 'Post a boulder session';

  // Shared location field — gym dropdown indoors, free-text crag outdoors.
  const locationField = (gymValue: string, onGym: (v: string) => void, gymList = gyms, onSuggest?: () => void) =>
    mode === 'indoor' ? (
      <div>
        <Label>Gym</Label>
        <select
          value={gymValue}
          onChange={(e) => onGym(e.target.value)}
          className="w-full rounded-xl border border-ink-100 bg-paper-100 px-3.5 py-2.5 text-sm text-ink-900"
        >
          {gymList.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={onSuggest ?? (() => setSuggestGymOpen(true))}
          className="mt-1.5 text-xs font-semibold text-brand-600"
        >
          + Don't see your gym? Suggest it
        </button>
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
              callWhen === w.v ? 'bg-brand-600 text-[#161310] border-brand-600' : 'bg-paper-100 text-ink-700 border-ink-100',
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

  // ── Lean direct-invite form ─────────────────────────────────────
  // Shown INSTEAD of the full template when this sheet was opened
  // from a friend's profile ("Invite to climb"). Four choices + one
  // button; everything else takes the full form's defaults.
  if (directInviteId) {
    const directUser = resolveUser(directInviteId, me, users, directory);
    const firstName = directUser?.display_name.split(' ')[0] ?? 'your friend';
    const leanGyms =
      leanStyle === 'boulder' ? sessionGyms : gymsForCategory(gyms, leanStyle);
    const BOULDER_RANGES = ['All levels', 'V0–V2', 'V2–V4', 'V4–V6', 'V6–V8', 'V8+'];
    const pickLeanStyle = (st: 'boulder' | 'top_rope' | 'lead') => {
      setLeanStyle(st);
      setLeanBelayOk(false);
      setMode('indoor');
      if (st === 'boulder') {
        setDiscipline('boulder');
        setLeanGrade('All levels');
        setSubtitle('');
      } else {
        setDiscipline('belay');
        setCallCategory(st);
        setLeanGrade('5.10a–5.10d');
        setCallGrade('5.10a–5.10d');
      }
      setLeanStep('form');
    };
    const applyLeanGrade = (g: string) => {
      setLeanGrade(g);
      setCallGrade(g);
      setSubtitle(g === 'All levels' ? '' : g);
    };
    const chip = (active: boolean) =>
      `flex-1 rounded-full px-3 py-2.5 text-sm font-semibold border ${
        active
          ? 'bg-brand-600 text-[#161310] border-brand-600'
          : 'bg-paper-100 text-ink-600 border-ink-100'
      }`;
    return (
      <Sheet
        open={open}
        onOpenChange={(o) => {
          onOpenChange(o);
          if (!o) reset();
        }}
      >
        <SheetContent title={`Invite ${firstName} to climb`}>
          {leanStep === 'type' ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-ink-500">What are we climbing?</p>
              {(
                [
                  { st: 'boulder', label: 'Boulder' },
                  { st: 'top_rope', label: 'Top rope' },
                  { st: 'lead', label: 'Lead' },
                ] as const
              ).map(({ st, label }) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => pickLeanStyle(st)}
                  className="rounded-2xl border border-ink-100 bg-paper-100 px-5 py-4 text-left active:bg-brand-50"
                >
                  <span className="block text-base font-bold text-ink-900">{label}</span>
                </button>
              ))}
            </div>
          ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink-500">
              {directUser?.display_name ?? 'They'}&apos;ll get this invite and can accept or
              decline. Accepting puts you both in the session and its group chat.
            </p>
            <div className="flex items-center justify-between rounded-2xl border border-ink-100 bg-paper-100 px-4 py-3">
              <span className="text-sm font-bold text-ink-900">
                {leanStyle === 'boulder' ? 'Boulder' : leanStyle === 'top_rope' ? 'Top rope' : 'Lead'}
              </span>
              <button
                type="button"
                onClick={() => setLeanStep('type')}
                className="text-sm font-semibold text-brand-600"
              >
                Change
              </button>
            </div>
            <div>
              <Label>When</Label>
              <div className="flex gap-2">
                <button type="button" className={chip(callWhen === 'now')} onClick={() => setCallWhen('now')}>
                  Now
                </button>
                <button type="button" className={chip(callWhen === 'tonight')} onClick={() => setCallWhen('tonight')}>
                  Tonight
                </button>
                <button type="button" className={chip(callWhen === 'custom')} onClick={() => setCallWhen('custom')}>
                  Pick a time
                </button>
              </div>
              {callWhen !== 'now' && (
                <div className="mt-2 flex gap-2">
                  {callWhen === 'custom' && (
                    <input
                      type="date"
                      value={callDate}
                      onChange={(e) => setCallDate(e.target.value)}
                      className="min-w-0 flex-1 rounded-xl border border-ink-100 bg-paper-100 px-3 py-2 text-sm text-ink-900"
                    />
                  )}
                  <input
                    type="time"
                    value={callTime}
                    onChange={(e) => setCallTime(e.target.value)}
                    className="w-32 rounded-xl border border-ink-100 bg-paper-100 px-3 py-2 text-sm text-ink-900"
                  />
                </div>
              )}
            </div>
            <div>
              <Label>Gym</Label>
              <select
                value={leanStyle === 'boulder' ? gymId : callGymId}
                onChange={(e) => {
                  setGymId(e.target.value);
                  setCallGymId(e.target.value);
                }}
                className="w-full rounded-xl border border-ink-100 bg-paper-100 px-3.5 py-2.5 text-sm text-ink-900"
              >
                {leanGyms.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Level</Label>
              <select
                value={leanGrade}
                onChange={(e) => applyLeanGrade(e.target.value)}
                className="w-full rounded-xl border border-ink-100 bg-paper-100 px-3.5 py-2.5 text-sm text-ink-900"
              >
                {(leanStyle === 'boulder' ? BOULDER_RANGES : GRADE_RANGES).map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            {leanStyle !== 'boulder' && verifications[leanStyle].status === 'unverified' && (
              <label className="flex items-start gap-3 rounded-2xl border border-ink-100 bg-paper-100 px-4 py-3">
                <input
                  type="checkbox"
                  checked={leanBelayOk}
                  onChange={(e) => setLeanBelayOk(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#C9A24B]"
                />
                <span className="text-sm text-ink-700">
                  I&apos;m belay certified for {leanStyle === 'top_rope' ? 'top rope' : 'lead'} at
                  my gym
                  <span className="mt-0.5 block text-xs text-ink-500">
                    Asked here because this invite needs it — no need to dig through your
                    profile. Partners can confirm it after you climb together.
                  </span>
                </span>
              </label>
            )}
            <Button
              disabled={
                leanStyle !== 'boulder' &&
                verifications[leanStyle].status === 'unverified' &&
                !leanBelayOk
              }
              onClick={() => {
                // Just-in-time belay attestation (Lucy 2026-10-16):
                // orientation no longer asks this up front; the first
                // rope invite asks it here, once.
                if (leanStyle !== 'boulder' && verifications[leanStyle].status === 'unverified') {
                  submitVerification(leanStyle);
                }
                void (leanStyle === 'boulder' ? handleSubmitSession() : handleSubmitCall());
              }}
            >
              Send invite to {firstName}
            </Button>
          </div>
          )}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
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
                mode === m.v ? 'bg-brand-600 text-[#161310] border-brand-600' : 'bg-paper-100 text-ink-500 border-ink-100',
              )}
            >
              {m.l}
            </button>
          ))}
        </div>

        {/* Sub: BELAY / BOULDER (+ HIKE outdoors) */}
        {mode !== 'event' && (
          <div className="flex gap-2 mb-5">
            {(mode === 'outdoor'
              ? ([
                  { v: 'belay', l: 'Belay' },
                  { v: 'boulder', l: 'Boulder' },
                  { v: 'hike', l: 'Hike' },
                ] as const)
              : ([
                  { v: 'belay', l: 'Belay' },
                  { v: 'boulder', l: 'Boulder' },
                ] as const)
            ).map((d) => (
              <button
                key={d.v}
                onClick={() => setDiscipline(d.v)}
                className={cn(
                  'flex-1 rounded-full border py-2 text-xs font-medium transition-colors',
                  discipline === d.v ? 'bg-brand-600 text-[#161310] border-brand-600' : 'bg-paper-100 text-ink-500 border-ink-100',
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
                      callLookingFor === r.v ? 'bg-brand-600 text-[#161310] border-brand-600' : 'bg-paper-100 text-ink-700 border-ink-100',
                    )}
                  >
                    {r.l}
                  </button>
                ))}
              </div>
            </div>
              <div>
                <Label>Invite cruxmates (optional)</Label>
                {invitable.length > 0 ? (
                  <>
                    <CruxmatePicker
                      invitable={invitable}
                      invited={inviteIds}
                      selectMode
                      onInvite={(id) => toggleInvite(id)}
                    />
                    <p className="mt-1.5 text-[11px] text-ink-400">
                      Cruxy joins the moment you post. Others get an invite they can accept or deny.
                    </p>
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-ink-100 bg-paper-100 p-4">
                    <p className="text-sm font-semibold text-ink-900">No cruxmates yet — invite them once it's posted</p>
                    <p className="mt-1 text-xs text-ink-500">
                      Every posted session gets a share link + QR code, and anyone can add you with your invite code.
                    </p>
                  </div>
                )}
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
                      callCategory === c ? 'bg-brand-600 text-[#161310] border-brand-600' : 'bg-paper-100 text-ink-700 border-ink-100',
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
                className="w-full rounded-xl border border-ink-100 bg-paper-100 px-3.5 py-2.5 text-sm text-ink-900"
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
            {/* Roped calls list only gyms with that rope discipline */}
            {locationField(callGymId, setCallGymId, callGyms, () => { setSuggestFor('call'); setSuggestGymOpen(true); })}
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

        {/* ───────── BOULDER / HIKE (session) ───────── */}
        {mode !== 'event' && discipline !== 'belay' && (
          <div className="flex flex-col gap-5">
            <p className="text-xs text-ink-500 -mt-1">
              {discipline === 'hike'
                ? 'A hike — find trail mates. Set how many can join.'
                : 'A boulder session — a group meetup. Set how many can join.'}
            </p>
            {discipline === 'hike' && (
              <div>
                <Label>Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { v: 'trail', l: 'Trail' },
                    { v: 'scramble', l: 'Scramble' },
                    { v: 'snow', l: 'Snow' },
                    { v: 'backpack', l: 'Backpack' },
                    { v: 'expedition', l: 'Multi-day' },
                  ] as const).map((h) => (
                    <button
                      key={h.v}
                      onClick={() => setHikeType(h.v)}
                      className={cn(
                        'rounded-xl border py-2 text-xs font-medium',
                        hikeType === h.v ? 'bg-brand-600 text-[#161310] border-brand-600' : 'bg-paper-100 text-ink-700 border-ink-100',
                      )}
                    >
                      {h.l}
                    </button>
                  ))}
                </div>
                {hikeType === 'expedition' && (
                  <div className="mt-3">
                    <Label>Trip length</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[2, 3, 4, 5].map((d) => (
                        <button
                          key={d}
                          onClick={() => setTripDays(d)}
                          className={cn(
                            'rounded-xl border py-2 text-xs font-medium',
                            tripDays === d ? 'bg-brand-600 text-[#161310] border-brand-600' : 'bg-paper-100 text-ink-700 border-ink-100',
                          )}
                        >
                          {d} days
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div>
              <Label>Invite cruxmates (optional)</Label>
              {invitable.length > 0 ? (
                <>
                  <CruxmatePicker
                    invitable={invitable}
                    invited={inviteIds}
                    selectMode
                    onInvite={(id) => toggleInvite(id)}
                  />
                  <p className="mt-1.5 text-[11px] text-ink-400">
                    Cruxy joins the moment you post. Others get an invite DM with the link.
                  </p>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-ink-100 bg-paper-100 p-4">
                  <p className="text-sm font-semibold text-ink-900">No cruxmates yet — invite them once it's posted</p>
                  <p className="mt-1 text-xs text-ink-500">
                    Every posted session gets a share link + QR code, and anyone can add you with your invite code.
                  </p>
                </div>
              )}
            </div>
            <div>
              <Label>{discipline === 'hike' ? 'Hike name (optional)' : 'Session name (optional)'}</Label>
              <Input
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value.slice(0, 48))}
                placeholder={discipline === 'hike' ? 'e.g. Mailbox Peak sunrise' : 'Defaults to "Boulder Session"'}
              />
            </div>
            <div>
              <Label>{discipline === 'hike' ? 'Distance & difficulty' : 'Grade or level'}</Label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value.slice(0, 60))}
                placeholder={discipline === 'hike' ? 'e.g. 6 mi · moderate · 1,800 ft gain' : "e.g. V3 – V6, or 'All levels welcome'"}
              />
            </div>
            {locationField(gymId, setGymId, sessionGyms, () => { setSuggestFor('session'); setSuggestGymOpen(true); })}
            {whenField()}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration</Label>
                <select value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} className="w-full rounded-xl border border-ink-100 bg-paper-100 px-3.5 py-2.5 text-sm text-ink-900">
                  {[1, 2, 3, 4, 6, 8].map((h) => (<option key={h} value={h}>{h}h</option>))}
                </select>
              </div>
              <div>
                <Label>Capacity</Label>
                <select value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="w-full rounded-xl border border-ink-100 bg-paper-100 px-3.5 py-2.5 text-sm text-ink-900">
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => (<option key={c} value={c}>{c} people</option>))}
                  <option value={UNCAPPED_CAPACITY}>10+ (uncapped)</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Vibe</Label>
              <RadioGroup.Root value={vibe} onValueChange={(v) => setVibe(v as Vibe)} className="flex gap-2 flex-wrap">
                {VIBES.map((v) => (
                  <RadioGroup.Item key={v} value={v} className={cn('rounded-full border px-3 py-1 text-xs font-medium capitalize', 'data-[state=checked]:bg-brand-600 data-[state=checked]:text-[#161310] data-[state=checked]:border-brand-600', 'bg-paper-100 text-ink-700 border-ink-100')}>
                    {v}
                  </RadioGroup.Item>
                ))}
              </RadioGroup.Root>
            </div>
            {descriptionField(note, setNote)}
            <Button onClick={handleSubmitSession}>{discipline === 'hike' ? 'Post hike' : 'Post boulder session'}</Button>
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
              <select value={evtType} onChange={(e) => setEvtType(e.target.value as EventType)} className="w-full rounded-xl border border-ink-100 bg-paper-100 px-3.5 py-2.5 text-sm text-ink-900">
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
                <select value={evtGroupId} onChange={(e) => setEvtGroupId(e.target.value)} className="w-full rounded-xl border border-ink-100 bg-paper-100 px-3.5 py-2.5 text-sm text-ink-900">
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
    <SuggestGymSheet
      open={suggestGymOpen}
      onOpenChange={setSuggestGymOpen}
      disciplines={suggestDisciplines}
      onAdded={(id) => {
        if (suggestFor === 'call') setCallGymId(id);
        else setGymId(id);
      }}
    />
    </>
  );
}
