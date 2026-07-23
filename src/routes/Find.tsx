import { useMemo, useState } from 'react';
import { Home, Trekking, Sparks, Sparks as SparksIcon, SearchEngine, Community } from 'iconoir-react';
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

const TABS = [
  { value: 'indoor', label: 'INDOOR', Icon: Home },
  { value: 'outdoor', label: 'OUTDOOR', Icon: Trekking },
  { value: 'events', label: 'EVENTS', Icon: Sparks },
  { value: 'crews', label: 'CREWS', Icon: Community },
] as const;

function withinTime(iso: string, time?: 'morning' | 'afternoon' | 'evening'): boolean {
  if (!time) return true;
  if (time === 'morning') return inHour(iso, 6, 12);
  if (time === 'afternoon') return inHour(iso, 12, 17);
  if (time === 'evening') return inHour(iso, 17, 22);
  return true;
}

function withinDate(
  iso: string,
  date?: 'today' | 'tomorrow' | 'this_week',
  dateSpecific?: string,
): boolean {
  const d = new Date(iso);
  if (dateSpecific) {
    return d.toISOString().slice(0, 10) === dateSpecific;
  }
  if (!date) return true;
  const now = new Date();
  if (date === 'today') return d.toDateString() === now.toDateString();
  if (date === 'tomorrow') {
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    return d.toDateString() === tomorrow.toDateString();
  }
  if (date === 'this_week') {
    const weekOut = new Date();
    weekOut.setDate(now.getDate() + 7);
    return d.getTime() >= now.getTime() && d.getTime() <= weekOut.getTime();
  }
  return true;
}

export function Find() {
  const filters = useAppStore((s) => s.filters);
  const setFilterTab = useAppStore((s) => s.setFilterTab);
  const setIndoor = useAppStore((s) => s.setIndoorFilter);
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
  const [crewsView, setCrewsView] = useState(false);

  const isIndoorBelay = filters.tab === 'indoor' && filters.indoor.sub_tab === 'belay';

  const filteredCalls = useMemo(() => {
    if (!isIndoorBelay) return [];
    const fi = filters.indoor;
    return climbCalls
      .filter((c) => c.status === 'live')
      .filter((c) => {
        if (fi.gym_id && c.gym_id !== fi.gym_id) return false;
        if (fi.styles.length > 0 && !fi.styles.includes(c.category)) return false;
        if (fi.looking_for && c.looking_for !== fi.looking_for) return false;
        if (!withinDate(c.starts_at, fi.date, fi.date_specific)) return false;
        if (!withinTime(c.starts_at, fi.time)) return false;
        if (fi.weight_safe_only && !isWeightSafe(me?.weight_kg, c.weight_kg)) return false;
        return true;
      })
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [isIndoorBelay, filters.indoor, climbCalls, me?.weight_kg]);

  const filteredSessions = useMemo(() => {
    if (filters.tab === 'events') return [];
    if (isIndoorBelay) return []; // Belay uses climb calls, not sessions
    const f = filters.tab === 'indoor' ? filters.indoor : filters.outdoor;
    return sessions
      .filter((s) => {
        if (s.location_type !== filters.tab) return false;
        if (filters.tab === 'indoor') {
          // In Indoor mode, we're in the Boulder sub-tab (since Belay bails early above).
          if (s.category !== 'boulder') return false;
          const fi = filters.indoor;
          if (fi.gym_id && s.gym_id !== fi.gym_id) return false;
        } else {
          const fo = filters.outdoor;
          if (fo.area && s.area !== fo.area) return false;
          if (fo.styles.length > 0 && !fo.styles.includes(s.category)) return false;
          if (fo.route_id && s.route_id !== fo.route_id) return false;
        }
        if (!withinDate(s.starts_at, f.date, (f as { date_specific?: string }).date_specific)) return false;
        if (!withinTime(s.starts_at, f.time)) return false;
        return true;
      })
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [filters, sessions, isIndoorBelay]);

  const filteredEvents = useMemo(() => {
    if (filters.tab !== 'events') return [];
    const fe = filters.events;
    return events
      .filter((e) => {
        if (fe.types.length > 0 && !fe.types.includes(e.type)) return false;
        if (fe.freeOnly && e.cost_cents > 0) return false;
        if (fe.host && e.host_group_id !== fe.host) return false;
        if (!withinDate(e.starts_at, fe.date)) return false;
        if (!withinTime(e.starts_at, fe.time)) return false;
        return true;
      })
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [filters, events]);

  return (
    <div className="pb-4">
      {/* Segmented tabs */}
      <div className="flex gap-1.5 mb-4">
        {TABS.map(({ value, label, Icon }) => {
          const active = value === 'crews' ? crewsView : !crewsView && filters.tab === value;
          return (
            <button
              key={value}
              onClick={() => {
                if (value === 'crews') setCrewsView(true);
                else {
                  setCrewsView(false);
                  setFilterTab(value as 'indoor' | 'outdoor' | 'events');
                }
              }}
              className={cn(
                'flex-1 rounded-full border py-2.5 px-2 flex items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
                active ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-500 border-ink-100',
              )}
            >
              <Icon width={13} height={13} />
              {label}
            </button>
          );
        })}
      </div>

      {crewsView ? (
        <CrewsBrowser />
      ) : (
      <>
      {/* Belay / Boulder sub-tabs (Indoor only) */}
      {filters.tab === 'indoor' && (
        <div className="flex gap-1.5 mb-4">
          {(
            [
              { v: 'belay', l: 'Belay' },
              { v: 'boulder', l: 'Boulder' },
            ] as const
          ).map((s) => (
            <button
              key={s.v}
              onClick={() => setIndoor({ sub_tab: s.v })}
              className={cn(
                'flex-1 rounded-full border py-2 px-3 text-xs font-medium transition-colors',
                filters.indoor.sub_tab === s.v
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-ink-500 border-ink-100',
              )}
            >
              {s.l}
            </button>
          ))}
        </div>
      )}

      <FilterRow />

      {/* AI Auto Match banner */}
      <button
        onClick={() => setAiMatchOpen(true)}
        className="w-full mb-4 rounded-2xl bg-sky-200 border border-ink-100 p-4 flex items-center gap-3 text-left hover:brightness-95 transition-all"
      >
        <div className="w-10 h-10 shrink-0 rounded-full bg-white flex items-center justify-center">
          <SparksIcon width={20} height={20} className="text-teal-600" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-ink-900 text-sm">AI Auto Match</p>
          <p className="text-xs text-ink-600 mt-0.5">Get matched with the best partners for your climb.</p>
        </div>
      </button>

      {/* List */}
      {filters.tab === 'events' ? (
        <div className="flex flex-col gap-3">
          {filteredEvents.map((e) => {
            const host = e.host_group_id ? groups.find((g) => g.id === e.host_group_id) : undefined;
            return (
              <EventCard key={e.id} event={e} hostGroupName={host?.name} onClick={() => setDetailEvent(e)} />
            );
          })}
          {filteredEvents.length === 0 && <EmptyState />}
        </div>
      ) : isIndoorBelay ? (
        <div className="flex flex-col gap-3">
          {filteredCalls.map((c) => {
            const caller = c.user_id === me?.id ? me : users.find((u) => u.id === c.user_id);
            const gym = gyms.find((g) => g.id === c.gym_id);
            if (!caller || !gym) return null;
            const isFriend = cruxmates.includes(c.user_id);
            return (
              <ClimbCallCard
                key={c.id}
                call={c}
                caller={caller}
                gymName={gym.short_name}
                users={users}
                isFriend={isFriend}
                onRequest={() => setDetailCall(c)}
                onViewCard={() => setDetailCall(c)}
              />
            );
          })}
          {filteredCalls.length === 0 && <EmptyState />}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredSessions.map((s) => {
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
          })}
          {filteredSessions.length === 0 && <EmptyState />}
        </div>
      )}

      </>
      )}

      <SessionDetailSheet
        session={detailSession}
        open={!!detailSession}
        onOpenChange={(o) => !o && setDetailSession(null)}
      />
      <EventDetailSheet
        event={detailEvent}
        open={!!detailEvent}
        onOpenChange={(o) => !o && setDetailEvent(null)}
      />
      <ClimbCallDetailSheet
        call={detailCall}
        open={!!detailCall}
        onOpenChange={(o) => !o && setDetailCall(null)}
      />
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
