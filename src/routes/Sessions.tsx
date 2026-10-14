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
import { resolveUser } from '@/lib/resolveUser';
import { sessionPhase } from '@/lib/sessionPhase';
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
  const leftSessions = useAppStore((s) => s.leftSessions);
  const climbCalls = useAppStore((s) => s.climbCalls);
  const events = useAppStore((s) => s.events);
  const users = useAppStore((s) => s.users);
  const directory = useAppStore((s) => s.directory);
  const gyms = useAppStore((s) => s.gyms);
  const groups = useAppStore((s) => s.groups);
  const recaps = useAppStore((s) => s.recaps);
  const sessionLifecycle = useAppStore((s) => s.sessionLifecycle);
  const sessionsLoading = useAppStore((s) => s.sessionsLoading);

  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');
  const [detailSession, setDetailSession] = useState<Session | null>(null);
  const [detailCall, setDetailCall] = useState<ClimbCall | null>(null);
  const [detailEvent, setDetailEvent] = useState<EventItem | null>(null);
  const [recapSession, setRecapSession] = useState<Session | null>(null);

  const gymName = (id?: string) => gyms.find((g) => g.id === id)?.short_name;

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    if (!me) return { upcoming: [] as Item[], past: [] as Item[] };
    // Sessions partition by lifecycle phase, not the clock: upcoming/live
    // stay in Upcoming until someone taps Finish; finished and lapsed
    // (never started) sessions land in Past. Calls and events keep the
    // clock-based split.
    const sessionItems: Item[] = sessions
      .filter((s) => s.participant_ids.includes(me.id) || leftSessions.includes(s.id))
      .map((s) => ({ kind: 'session' as const, at: s.starts_at, data: s, end: s.ends_at }));
    const otherItems: Item[] = [
      ...climbCalls
        // A matched call became a session — the session is the single
        // entry for that climb now (no duplicate call + session cards).
        .filter((c) => c.status !== 'matched')
        .filter((c) => c.participant_ids.includes(me.id))
        .map((c) => ({ kind: 'call' as const, at: c.starts_at, data: c, end: c.ends_at })),
      ...events
        .filter((e) => e.attendee_ids.includes(me.id))
        .map((e) => ({ kind: 'event' as const, at: e.starts_at, data: e, end: e.ends_at })),
    ];
    const isPastSession = (i: Item) => {
      if (i.kind === 'call') {
        // An ended (cancelled) call is history right away, not at ends_at.
        if ((i.data as ClimbCall).status === 'expired') return true;
        return new Date(i.end).getTime() <= now;
      }
      if (i.kind !== 'session') return new Date(i.end).getTime() <= now;
      const s = i.data as Session;
      // A session I left (and haven't rejoined) is history, even if it
      // hasn't happened yet — it's out of my Upcoming, kept in Past.
      if (leftSessions.includes(s.id) && !s.participant_ids.includes(me.id)) return true;
      const ph = sessionPhase(s, sessionLifecycle[s.id], now);
      return ph === 'done' || ph === 'expired';
    };
    const all = [...sessionItems, ...otherItems];
    const up = all
      .filter((i) => !isPastSession(i))
      .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    const pa = all
      .filter((i) => isPastSession(i))
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return { upcoming: up, past: pa };
  }, [me, sessions, climbCalls, events, sessionLifecycle, leftSessions]);

  if (!me) return null;
  const list = view === 'upcoming' ? upcoming : past;

  const renderItem = (it: Item) => {
    if (it.kind === 'session') {
      const s = it.data;
      const grp = s.posted_by_group_id ? groups.find((g) => g.id === s.posted_by_group_id) : undefined;
      const done = !!recaps[s.id];
      const phase = sessionPhase(s, sessionLifecycle[s.id]);
      return (
        <div key={`session-${s.id}`}>
          <SessionCard
            session={s}
            users={users}
            gymName={gymName(s.gym_id)}
            groupName={grp?.name}
            onClick={() => setDetailSession(s)}
          />
          {view === 'past' && phase === 'expired' && (
            <p className="mt-2 text-center text-xs text-ink-500">This session never started.</p>
          )}
          {view === 'past' && phase === 'done' && (
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
      const caller = resolveUser(c.user_id, me, users, directory);
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
              view === seg.v ? 'bg-brand-600 text-[#161310] border-brand-600' : 'bg-paper-100 text-ink-500 border-ink-100',
            )}
          >
            {seg.l}
          </button>
        ))}
      </div>

      {sessionsLoading && list.length === 0 ? (
        <div className="flex flex-col gap-3" aria-label="Loading climbs">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-2xl bg-paper-100 border border-ink-100 p-4 animate-pulse">
              <div className="h-4 w-2/3 rounded bg-ink-100" />
              <div className="mt-2 h-3 w-1/2 rounded bg-ink-100" />
            </div>
          ))}
        </div>
      ) : list.length > 0 ? (
        <div className="flex flex-col gap-3">{list.map(renderItem)}</div>
      ) : (
        <div className="rounded-2xl bg-paper-100 border border-dashed border-ink-100 p-10 flex flex-col items-center text-center">
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
