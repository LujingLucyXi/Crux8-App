import { useMemo, useState } from 'react';
import { Sparks as SparksIcon, SearchEngine } from 'iconoir-react';
import { SessionCard } from '@/components/cards/SessionCard';
import { EventCard } from '@/components/cards/EventCard';
import { ClimbCallCard } from '@/components/cards/ClimbCallCard';
import { SessionDetailSheet } from '@/components/sheets/SessionDetailSheet';
import { EventDetailSheet } from '@/components/sheets/EventDetailSheet';
import { ClimbCallDetailSheet } from '@/components/sheets/ClimbCallDetailSheet';
import { AiMatchSheet } from '@/components/sheets/AiMatchSheet';
import { FilterRow } from '@/components/filters/FilterRow';
import { CrewsBrowser } from '@/components/crews/CrewsBrowser';
import { useAppStore } from '@/store/useAppStore';
import { inHour } from '@/lib/date';
import { isWeightSafe } from '@/lib/weight';
import { cn } from '@/lib/utils';
import type { Session, EventItem, ClimbCall } from '@/seed/types';

const L1_TABS = [
  { value: 'climb', label: 'Climb' },
  { value: 'hike', label: 'Hike' },
  { value: 'event', label: 'Event' },
  { value: 'crew', label: 'Crew' },
] as const;

const CLIMB_STYLES_INDOOR = [
  { v: 'top_rope', l: 'Top Rope' },
  { v: 'lead', l: 'Lead' },
  { v: 'boulder', l: 'Boulder' },
];
const CLIMB_STYLES_OUTDOOR = [
  { v: 'outdoor_sport', l: 'Sport' },
  { v: 'trad', l: 'Trad' },
  { v: 'multi_pitch', l: 'Multi-pitch' },
  { v: 'outdoor_boulder', l: 'Boulder' },
];
const HIKE_TYPES = [
  { v: 'trail', l: 'Trail' },
  { v: 'scramble', l: 'Scramble' },
  { v: 'snow', l: 'Snow' },
  { v: 'backpack', l: 'Backpack' },
];
const EVENT_TYPES = [
  { v: 'community_night', l: 'Community' },
  { v: 'identity', l: 'Identity' },
  { v: 'education', l: 'Education' },
  { v: 'mountaineering', l: 'Alpine' },
  { v: 'backcountry', l: 'Backcountry' },
  { v: 'comp', l: 'Comp' },
  { v: 'social', l: 'Social' },
];

function withinTime(iso: string, time?: 'morning' | 'afternoon' | 'evening'): boolean {
  if (!time) return true;
  if (time === 'morning') return inHour(iso, 6, 12);
  if (time === 'afternoon') return inHour(iso, 12, 17);
  if (time === 'evening') return inHour(iso, 17, 22);
  return true;
}

function withinDate(iso: string, date?: 'today' | 'tomorrow' | 'this_week', dateSpecific?: string): boolean {
  const d = new Date(iso);
  if (dateSpecific) return d.toISOString().slice(0, 10) === dateSpecific;
  if (!date) return true;
  const now = new Date();
  if (date === 'today') return d.toDateString() === now.toDateString();
  if (date === 'tomorrow') {
    const tm = new Date();
    tm.setDate(now.getDate() + 1);
    return d.toDateString() === tm.toDateString();
  }
  if (date === 'this_week') {
    const w = new Date();
    w.setDate(now.getDate() + 7);
    return d.getTime() >= now.getTime() && d.getTime() <= w.getTime();
  }
  return true;
}

export function Find() {
  const filters = useAppStore((s) => s.filters);
  const setFilter = useAppStore((s) => s.setFilter);
  const setL1 = useAppStore((s) => s.setL1);
  const sessions = useAppStore((s) => s.sessions);
  const events = useAppStore((s) => s.events);
  const climbCalls = useAppStore((s) => s.climbCalls);
  const users = useAppStore((s) => s.users);
  const gyms = useAppStore((s) => s.gyms);
  const groups = useAppStore((s) => s.groups);
  const cruxmates = useAppStore((s) => s.cruxmates);
  const me = useAppStore((s) => s.me);

  const [detailSession, setDetailSession] = useState<Session | null>(null);
  const [detailEvent, setDetailEvent] = useState<EventItem | null>(null);
  const [detailCall, setDetailCall] = useState<ClimbCall | null>(null);
  const [aiMatchOpen, setAiMatchOpen] = useState(false);

  const { l1, env } = filters;

  const toggle = (key: 'climb_styles' | 'hike_types' | 'event_types', v: string) => {
    const cur = filters[key];
    setFilter({ [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] } as never);
  };

  const dateOk = (iso: string) => withinDate(iso, filters.date, filters.date_specific) && withinTime(iso, filters.time);

  /* ── Climb: rope calls + climbing sessions for the current env ── */
  const climbCallsFiltered = useMemo(() => {
    if (l1 !== 'climb') return [];
    const styles = filters.climb_styles;
    return climbCalls
      .filter((c) => c.status === 'live' && c.location_type === env)
      .filter((c) => {
        if (styles.length > 0 && !styles.includes(c.category)) return false;
        if (env === 'indoor' && filters.gym_id && c.gym_id !== filters.gym_id) return false;
        if (env === 'outdoor' && filters.area && c.area !== filters.area) return false;
        if (filters.looking_for && c.looking_for !== filters.looking_for) return false;
        if (filters.weight_safe_only && !isWeightSafe(me?.weight_kg, c.weight_kg)) return false;
        return dateOk(c.starts_at);
      })
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [l1, env, filters, climbCalls, me?.weight_kg]);

  const climbSessionsFiltered = useMemo(() => {
    if (l1 !== 'climb') return [];
    const styles = filters.climb_styles;
    const envCats = env === 'indoor' ? ['boulder'] : ['outdoor_sport', 'trad', 'multi_pitch', 'outdoor_boulder'];
    return sessions
      .filter((s) => s.location_type === env && envCats.includes(s.category))
      .filter((s) => {
        if (styles.length > 0 && !styles.includes(s.category)) return false;
        if (env === 'indoor' && filters.gym_id && s.gym_id !== filters.gym_id) return false;
        if (env === 'outdoor' && filters.area && s.area !== filters.area) return false;
        return dateOk(s.starts_at);
      })
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [l1, env, filters, sessions]);

  /* ── Hike ── */
  const hikesFiltered = useMemo(() => {
    if (l1 !== 'hike') return [];
    const types = filters.hike_types;
    return sessions
      .filter((s) => s.category === 'hiking')
      .filter((s) => {
        if (types.length > 0 && !(s.hike_type && types.includes(s.hike_type))) return false;
        if (filters.area && s.area !== filters.area) return false;
        return dateOk(s.starts_at);
      })
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [l1, filters, sessions]);

  /* ── Events ── */
  const eventsFiltered = useMemo(() => {
    if (l1 !== 'event') return [];
    const types = filters.event_types;
    return events
      .filter((e) => {
        if (types.length > 0 && !types.includes(e.type)) return false;
        if (filters.free_only && e.cost_cents > 0) return false;
        return dateOk(e.starts_at);
      })
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [l1, filters, events]);

  const climbEmpty = climbCallsFiltered.length === 0 && climbSessionsFiltered.length === 0;

  // Which chip set is visible at "styles" level
  const styleSet =
    l1 === 'climb' ? (env === 'indoor' ? CLIMB_STYLES_INDOOR : CLIMB_STYLES_OUTDOOR) :
    l1 === 'hike' ? HIKE_TYPES :
    l1 === 'event' ? EVENT_TYPES : [];
  const styleKey: 'climb_styles' | 'hike_types' | 'event_types' =
    l1 === 'climb' ? 'climb_styles' : l1 === 'hike' ? 'hike_types' : 'event_types';
  const activeStyles = filters[styleKey];

  const renderCall = (c: ClimbCall) => {
    const caller = c.user_id === me?.id ? me : users.find((u) => u.id === c.user_id);
    if (!caller) return null;
    const gym = c.gym_id ? gyms.find((g) => g.id === c.gym_id) : undefined;
    return (
      <ClimbCallCard
        key={c.id}
        call={c}
        caller={caller}
        gymName={gym?.short_name ?? c.area ?? 'Outdoor'}
        users={users}
        isFriend={cruxmates.includes(c.user_id)}
        onRequest={() => setDetailCall(c)}
        onViewCard={() => setDetailCall(c)}
      />
    );
  };

  const renderSession = (s: Session) => {
    const gym = s.gym_id ? gyms.find((g) => g.id === s.gym_id) : undefined;
    const grp = s.posted_by_group_id ? groups.find((g) => g.id === s.posted_by_group_id) : undefined;
    return (
      <SessionCard
        key={s.id}
        session={s}
        users={users}
        gymName={gym?.short_name}
        groupName={grp?.name}
        onClick={() => setDetailSession(s)}
      />
    );
  };

  return (
    <div className="pb-4">
      {/* ── Level 1 ── */}
      <div className="flex gap-1.5 mb-4">
        {L1_TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setL1(value)}
            className={cn(
              'flex-1 rounded-full border py-2.5 text-xs font-semibold transition-colors',
              l1 === value ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-500 border-ink-100',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {l1 === 'crew' ? (
        <CrewsBrowser />
      ) : (
        <>
          {/* ── Level 2: Climb only → Indoor / Outdoor ── */}
          {l1 === 'climb' && (
            <div className="flex gap-1.5 mb-3">
              {(['indoor', 'outdoor'] as const).map((e) => (
                <button
                  key={e}
                  onClick={() => setFilter({ env: e, climb_styles: [] })}
                  className={cn(
                    'flex-1 rounded-full border py-2 text-xs font-medium capitalize transition-colors',
                    env === e ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-ink-500 border-ink-100',
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          {/* ── Styles: always-visible multi-select ── */}
          {styleSet.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {styleSet.map((s) => {
                const on = activeStyles.includes(s.v);
                return (
                  <button
                    key={s.v}
                    onClick={() => toggle(styleKey, s.v)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      on ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-700 border-ink-100 hover:border-ink-300',
                    )}
                  >
                    {s.l}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Secondary refinements ── */}
          <FilterRow />

          {/* ── AI banner (climb + hike) ── */}
          {(l1 === 'climb' || l1 === 'hike') && (
            <button
              onClick={() => setAiMatchOpen(true)}
              className="w-full mb-4 rounded-2xl bg-sky-200 border border-ink-100 p-4 flex items-center gap-3 text-left hover:brightness-95 transition-all"
            >
              <div className="w-10 h-10 shrink-0 rounded-full bg-white flex items-center justify-center">
                <SparksIcon width={20} height={20} className="text-teal-600" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-ink-900 text-sm">AI Auto Match</p>
                <p className="text-xs text-ink-600 mt-0.5">Get matched with the best partners for your {l1 === 'hike' ? 'hike' : 'climb'}.</p>
              </div>
            </button>
          )}

          {/* ── Content ── */}
          <div className="flex flex-col gap-3">
            {l1 === 'climb' && (
              <>
                {climbCallsFiltered.map(renderCall)}
                {climbSessionsFiltered.map(renderSession)}
                {climbEmpty && <EmptyState />}
              </>
            )}
            {l1 === 'hike' && (
              <>
                {hikesFiltered.map(renderSession)}
                {hikesFiltered.length === 0 && <EmptyState />}
              </>
            )}
            {l1 === 'event' && (
              <>
                {eventsFiltered.map((e) => {
                  const host = e.host_group_id ? groups.find((g) => g.id === e.host_group_id) : undefined;
                  return <EventCard key={e.id} event={e} hostGroupName={host?.name} onClick={() => setDetailEvent(e)} />;
                })}
                {eventsFiltered.length === 0 && <EmptyState />}
              </>
            )}
          </div>
        </>
      )}

      <SessionDetailSheet session={detailSession} open={!!detailSession} onOpenChange={(o) => !o && setDetailSession(null)} />
      <EventDetailSheet event={detailEvent} open={!!detailEvent} onOpenChange={(o) => !o && setDetailEvent(null)} />
      <ClimbCallDetailSheet call={detailCall} open={!!detailCall} onOpenChange={(o) => !o && setDetailCall(null)} />
      <AiMatchSheet open={aiMatchOpen} onOpenChange={setAiMatchOpen} />
    </div>
  );
}

function EmptyState() {
  const clearFilters = useAppStore((s) => s.clearFilters);
  return (
    <div className="rounded-2xl bg-white border border-ink-100 p-10 flex flex-col items-center text-center">
      <SearchEngine width={32} height={32} className="text-ink-300" />
      <p className="mt-3 text-sm text-ink-500">Nothing matches your filters yet.</p>
      <button onClick={clearFilters} className="mt-3 text-xs font-semibold text-teal-600">
        Clear filters
      </button>
    </div>
  );
}
