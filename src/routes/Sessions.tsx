import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'iconoir-react';
import { SessionCard } from '@/components/cards/SessionCard';
import { ClimbCallCard } from '@/components/cards/ClimbCallCard';
import { EventCard } from '@/components/cards/EventCard';
import { SessionDetailSheet } from '@/components/sheets/SessionDetailSheet';
import { ClimbCallDetailSheet } from '@/components/sheets/ClimbCallDetailSheet';
import { EventDetailSheet } from '@/components/sheets/EventDetailSheet';
import { SessionRecapSheet } from '@/components/sheets/SessionRecapSheet';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import type { Session, ClimbCall, EventItem } from '@/seed/types';

type Item =
  | { kind: 'session'; at: string; end: string; data: Session }
  | { kind: 'call'; at: string; end: string; data: ClimbCall }
  | { kind: 'event'; at: string; end: string; data: EventItem };

/**
 * "My climbs" ledger — the personal commitment view. High-frequency
 * ("am I on for tonight? who did I climb with last week?"), zero new
 * storage since it's a filtered view of what's already in the store.
 */
export function Sessions() {
  const nav = useNavigate();
  const me = useAppStore((s) => s.me);
  const sessions = useAppStore((s) => s.sessions);
  const climbCalls = useAppStore((s) => s.climbCalls);
  const events = useAppStore((s) => s.events);
  const users = useAppStore((s) => s.users);
  const gyms = useAppStore((s) => s.gyms);
  const groups = useAppStore((s) => s.groups);
  const recaps = useAppStore((s) => s.recaps);

  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');
  const [detailSession, setDetailSession] = useState<Session | null>(null);
  const [detailCall, setDetailCall] = useState<ClimbCall | null>(null);
  const [detailEvent, setDetailEvent] = useState<EventItem | null>(null);
  const [recapSession, setRecapSession] = useState<Session | null>(null);

  const gymName = (id?: string) => gyms.find((g) => g.id === id)?.short_name;

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    if (!me) return { upcoming: [] as Item[], past: [] as Item[] };
    const all: Item[] = [
      ...sessions
        .filter((s) => s.participant_ids.includes(me.id))
        .map((s) => ({ kind: 'session' as const, at: s.starts_at, data: s, end: s.ends_at })),
      ...climbCalls
        .filter((c) => c.participant_ids.includes(me.id))
        .map((c) => ({ kind: 'call' as const, at: c.starts_at, data: c, end: c.ends_at })),
      ...events
        .filter((e) => e.attendee_ids.includes(me.id))
        .map((e) => ({ kind: 'event' as const, at: e.starts_at, data: e, end: e.ends_at })),
    ];
    const up = all
      .filter((i) => new Date(i.end).getTime() > now)
      .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    const pa = all
      .filter((i) => new Date(i.end).getTime() <= now)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return { upcoming: up, past: pa };
  }, [me, sessions, climbCalls, events]);

  if (!me) return null;
  const list = view === 'upcoming' ? upcoming : past;

  const renderItem = (it: Item) => {
    if (it.kind === 'session') {
      const s = it.data;
      const grp = s.posted_by_group_id ? groups.find((g) => g.id === s.posted_by_group_id) : undefined;
      const done = !!recaps[s.id];
      return (
        <div key={`session-${s.id}`}>
          <SessionCard
            session={s}
            users={users}
            gymName={gymName(s.gym_id)}
            groupName={grp?.name}
            onClick={() => setDetailSession(s)}
          />
          {view === 'past' && (
            <Button
              variant={done ? 'outline' : 'primary'}
              size="sm"
              className={cn('mt-2 w-full', !done && 'bg-teal-600 hover:bg-teal-500 border-teal-600')}
              onClick={() => setRecapSession(s)}
            >
              {done ? 'View recap' : 'Log recap · give props'}
            </Button>
          )}
        </div>
      );
    }
    if (it.kind === 'call') {
      const c = it.data;
      const caller = c.user_id === me.id ? me : users.find((u) => u.id === c.user_id);
      const gym = gyms.find((g) => g.id === c.gym_id);
      if (!caller || !gym) return null;
      return (
        <ClimbCallCard
          key={`call-${c.id}`}
          call={c}
          caller={caller}
          gymName={gym.short_name}
          users={users}
          onRequest={() => setDetailCall(c)}
          onViewCard={() => setDetailCall(c)}
        />
      );
    }
    const e = it.data;
    const host = e.host_group_id ? groups.find((g) => g.id === e.host_group_id) : undefined;
    return (
      <EventCard key={`event-${e.id}`} event={e} hostGroupName={host?.name} onClick={() => setDetailEvent(e)} />
    );
  };

  return (
    <div className="pb-4">
      <h1 className="text-2xl font-semibold text-ink-900 mb-4">My climbs</h1>

      {/* Upcoming / Past segmented */}
      <div className="flex gap-1.5 mb-4">
        {(
          [
            { v: 'upcoming', l: `Upcoming · ${upcoming.length}` },
            { v: 'past', l: `Past · ${past.length}` },
          ] as const
        ).map((seg) => (
          <button
            key={seg.v}
            onClick={() => setView(seg.v)}
            className={cn(
              'flex-1 rounded-full border py-2.5 px-3 text-xs font-semibold transition-colors',
              view === seg.v ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-500 border-ink-100',
            )}
          >
            {seg.l}
          </button>
        ))}
      </div>

      {list.length > 0 ? (
        <div className="flex flex-col gap-3">{list.map(renderItem)}</div>
      ) : (
        <div className="rounded-2xl bg-white border border-dashed border-ink-100 p-10 flex flex-col items-center text-center">
          <Calendar width={30} height={30} className="text-ink-300" />
          <p className="mt-3 text-sm text-ink-500">
            {view === 'upcoming' ? 'Nothing booked yet.' : 'No past climbs yet.'}
          </p>
          {view === 'upcoming' && (
            <button onClick={() => nav('/find')} className="mt-3 text-xs font-semibold text-teal-600">
              Find a partner →
            </button>
          )}
        </div>
      )}

      <SessionDetailSheet session={detailSession} open={!!detailSession} onOpenChange={(o) => !o && setDetailSession(null)} />
      <ClimbCallDetailSheet call={detailCall} open={!!detailCall} onOpenChange={(o) => !o && setDetailCall(null)} />
      <EventDetailSheet event={detailEvent} open={!!detailEvent} onOpenChange={(o) => !o && setDetailEvent(null)} />
      <SessionRecapSheet session={recapSession} open={!!recapSession} onOpenChange={(o) => !o && setRecapSession(null)} />
    </div>
  );
}
