import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { CarouselSection, StackSection } from '@/components/home/Section';
import {
  UpNextCard, MiniScheduleCard, ChallengeCard, BadgeProgressCard, EmptyNudge,
} from '@/components/home/HomeCards';
import { SessionDetailSheet } from '@/components/sheets/SessionDetailSheet';
import { ClimbCallDetailSheet } from '@/components/sheets/ClimbCallDetailSheet';
import { EventDetailSheet } from '@/components/sheets/EventDetailSheet';
import { AiMatchSheet } from '@/components/sheets/AiMatchSheet';
import { CheckInSheet } from '@/components/sheets/CheckInSheet';
import { SessionRecapSheet } from '@/components/sheets/SessionRecapSheet';
import { LogSendSheet } from '@/components/sheets/LogSendSheet';
import { levelFromXp } from '@/lib/rewards';
import { computeChallenges, daysLeftInWeek } from '@/lib/challenges';
import { computeBadgeProgress, nextUpBadges } from '@/lib/badges';
import { rankMatches } from '@/lib/match';
import { Position, Check } from 'iconoir-react';
import { formatSessionWhen } from '@/lib/date';
import { cn } from '@/lib/utils';
import { LOOKING_FOR_LABEL } from '@/components/cards/ClimbCallCard';
import type { Session, ClimbCall, EventItem } from '@/seed/types';

/** Time-of-day greeting — small touch, makes the app feel alive. */
function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  if (h < 21) return 'Evening';
  return 'Tonight';
}

type AgendaItem =
  | { kind: 'session'; at: string; data: Session }
  | { kind: 'call'; at: string; data: ClimbCall }
  | { kind: 'event'; at: string; data: EventItem };

export function Home() {
  const nav = useNavigate();
  const me = useAppStore((s) => s.me);
  const sessions = useAppStore((s) => s.sessions);
  const climbCalls = useAppStore((s) => s.climbCalls);
  const events = useAppStore((s) => s.events);
  const groups = useAppStore((s) => s.groups);
  const gyms = useAppStore((s) => s.gyms);
  const users = useAppStore((s) => s.users);
  const cruxmates = useAppStore((s) => s.cruxmates);
  const myGroupMemberships = useAppStore((s) => s.myGroupMemberships);
  const verifications = useAppStore((s) => s.verifications);
  const badges = useAppStore((s) => s.badges);
  const recaps = useAppStore((s) => s.recaps);
  const checkin = useAppStore((s) => s.checkin);
  const gymPresence = useAppStore((s) => s.gymPresence);
  const xp = useAppStore((s) => s.xp);
  const level = levelFromXp(xp);

  const [detailSession, setDetailSession] = useState<Session | null>(null);
  const [detailCall, setDetailCall] = useState<ClimbCall | null>(null);
  const [detailEvent, setDetailEvent] = useState<EventItem | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [logSendOpen, setLogSendOpen] = useState(false);
  const [recapSession, setRecapSession] = useState<Session | null>(null);

  const gymName = (id?: string) => gyms.find((g) => g.id === id)?.short_name ?? '';

  /* ── My agenda (everything I'm on, future, soonest first) ── */
  const agenda = useMemo<AgendaItem[]>(() => {
    if (!me) return [];
    const now = Date.now();
    const items: AgendaItem[] = [
      ...sessions
        .filter((s) => s.participant_ids.includes(me.id) && new Date(s.ends_at).getTime() > now)
        .map((s) => ({ kind: 'session' as const, at: s.starts_at, data: s })),
      ...climbCalls
        .filter((c) => c.participant_ids.includes(me.id) && new Date(c.ends_at).getTime() > now)
        .map((c) => ({ kind: 'call' as const, at: c.starts_at, data: c })),
      ...events
        .filter((e) => e.attendee_ids.includes(me.id) && new Date(e.ends_at).getTime() > now)
        .map((e) => ({ kind: 'event' as const, at: e.starts_at, data: e })),
    ];
    return items.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [me, sessions, climbCalls, events]);

  const upNext = agenda[0];
  const restOfWeek = agenda.slice(1, 9);

  const needsRecap = useMemo(() => {
    if (!me) return [];
    const now = Date.now();
    return sessions
      .filter((s) => s.participant_ids.includes(me.id)
        && new Date(s.ends_at).getTime() <= now
        && !recaps[s.id])
      .sort((a, b) => new Date(b.ends_at).getTime() - new Date(a.ends_at).getTime())
      .slice(0, 4);
  }, [me, sessions, recaps]);

  /* ── Suggested (AI-ranked things I'm NOT already on) ── */
  const suggestedSessions = useMemo(() => {
    if (!me) return [];
    const open = sessions.filter(
      (s) => !s.participant_ids.includes(me.id) &&
             s.participant_ids.length < s.capacity &&
             new Date(s.starts_at).getTime() > Date.now(),
    );
    return rankMatches(me, open, 6);
  }, [me, sessions]);

  const suggestedCalls = useMemo(() => {
    if (!me) return [];
    return climbCalls
      .filter(
        (c) => c.status === 'live' &&
               !c.participant_ids.includes(me.id) &&
               c.participant_ids.length < c.capacity &&
               new Date(c.ends_at).getTime() > Date.now(),
      )
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
      .slice(0, 6);
  }, [me, climbCalls]);

  const suggestedEvents = useMemo(() => {
    if (!me) return [];
    return events
      .filter((e) => !e.attendee_ids.includes(me.id) && new Date(e.starts_at).getTime() > Date.now())
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
      .slice(0, 6);
  }, [me, events]);

  /* ── Challenges + badges ── */
  const challenges = useMemo(
    () => (me ? computeChallenges({
      meId: me.id, sessions, climbCalls, events, cruxmates, gyms,
    }) : []),
    [me, sessions, climbCalls, events, cruxmates, gyms],
  );
  const doneCount = challenges.filter((c) => c.current >= c.target).length;

  const badgeProgress = useMemo(
    () => (me ? computeBadgeProgress({
      meId: me.id, sessions, cruxmates, myGroupMemberships, verifications, recapCount: Object.keys(recaps).length,
    }, badges) : []),
    [me, sessions, cruxmates, myGroupMemberships, verifications, recaps, badges],
  );
  const nextBadges = nextUpBadges(badgeProgress, 5);
  const earnedCount = badgeProgress.filter((b) => b.earned).length;

  const myGroups = groups.filter((g) => myGroupMemberships.includes(g.id));

  if (!me) return null;

  const openAgenda = (it: AgendaItem) => {
    if (it.kind === 'session') setDetailSession(it.data);
    else if (it.kind === 'call') setDetailCall(it.data);
    else setDetailEvent(it.data);
  };

  return (
    <div className="pb-4">
      {/* ── Greeting ── */}
      <header className="pt-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-ink-900">
              {greeting()}, {me.display_name.split(' ')[0]}.
            </h1>
            <p className="text-sm text-ink-500 mt-0.5">
              {agenda.length > 0
                ? `${agenda.length} thing${agenda.length === 1 ? '' : 's'} on your calendar · ${earnedCount}/7 badges`
                : `Nothing booked yet · ${earnedCount}/7 badges`}
            </p>
          </div>
          <span className="enamel shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[linear-gradient(160deg,#8B5CF6,#6D28D9)] text-white text-xs font-bold px-3 py-1.5">
            {level.emoji} Lv {level.level}
          </span>
        </div>
        <button
          onClick={() => setLogSendOpen(true)}
          className="mt-3 w-full rounded-2xl bg-lime-400 text-ink-900 font-extrabold py-3 shadow-punch active:translate-y-[3px] active:shadow-none transition"
        >
          🔥 Log a send
        </button>
      </header>

      {/* ── On the wall now (check-in) ── */}
      {(() => {
        const g = checkin ? gyms.find((x) => x.id === checkin.gym_id) : null;
        return (
          <button
            onClick={() => setCheckInOpen(true)}
            className={cn(
              'w-full mt-4 rounded-3xl border p-4 flex items-center gap-3 text-left transition-all active:scale-[0.99]',
              checkin
                ? 'bg-teal-100 border-teal-600'
                : 'border-transparent text-white shadow-brand bg-gradient-to-r from-teal-600 to-brand-600 hover:brightness-105',
            )}
          >
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', checkin ? 'bg-teal-600' : 'bg-white/20 ring-1 ring-white/40')}>
              {checkin ? <Check width={20} height={20} color="white" /> : <Position width={20} height={20} color="white" />}
            </div>
            <div className="min-w-0 flex-1">
              {checkin && g ? (
                <>
                  <p className="text-sm font-semibold text-ink-900">Checked in · {g.short_name}</p>
                  <p className="text-xs text-ink-600">{gymPresence[g.id] ?? 1} climbers on the wall now</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-white">Check in at your gym</p>
                  <p className="text-xs text-white/85">Let partners see you're on the wall</p>
                </>
              )}
            </div>
            <span className={cn('text-xs font-bold shrink-0', checkin ? 'text-teal-600' : 'text-white')}>{checkin ? 'Manage' : 'Check in →'}</span>
          </button>
        );
      })()}

      {/* ── Up next (hero) ── */}
      <StackSection title="Up next" className="mt-5">
        {upNext ? (
          upNext.kind === 'session' ? (
            <UpNextCard
              kind="session"
              title={upNext.data.title}
              subtitle={upNext.data.subtitle}
              when={formatSessionWhen(upNext.data.starts_at)}
              where={gymName(upNext.data.gym_id) || upNext.data.area || 'TBD'}
              countLabel={`${upNext.data.participant_ids.length} of ${upNext.data.capacity} climbers in`}
              onClick={() => setDetailSession(upNext.data)}
            />
          ) : upNext.kind === 'call' ? (
            <UpNextCard
              kind="call"
              title={upNext.data.title ?? `${upNext.data.category === 'top_rope' ? 'Top-rope' : 'Lead'} call`}
              subtitle={upNext.data.grade}
              when={formatSessionWhen(upNext.data.starts_at)}
              where={gymName(upNext.data.gym_id)}
              countLabel={`${upNext.data.participant_ids.length} of ${upNext.data.capacity} paired`}
              onClick={() => setDetailCall(upNext.data)}
            />
          ) : (
            <UpNextCard
              kind="event"
              title={upNext.data.title}
              subtitle={upNext.data.tagline}
              when={formatSessionWhen(upNext.data.starts_at)}
              where={upNext.data.venue}
              countLabel={`${upNext.data.attendee_ids.length} going`}
              onClick={() => setDetailEvent(upNext.data)}
            />
          )
        ) : (
          <EmptyNudge
            emoji="🧗"
            text="No climbs booked. The wall is waiting."
            cta="Find a partner →"
            onClick={() => nav('/find')}
          />
        )}
      </StackSection>

      {/* ── Recap prompt (post-session touchpoint) ── */}
      {needsRecap.length > 0 && (
        <CarouselSection title={`Recap your climbs · ${needsRecap.length}`}>
          {needsRecap.map((s) => {
            const partners = s.participant_ids.filter((id) => id !== me.id).length;
            return (
              <button
                key={s.id}
                onClick={() => setRecapSession(s)}
                className="w-[220px] shrink-0 text-left rounded-2xl bg-teal-100 border border-teal-600 p-4 hover:brightness-95 transition-all"
              >
                <span className="text-lg">📓</span>
                <h3 className="mt-1.5 font-semibold text-ink-900 text-sm leading-tight">{s.title}</h3>
                <p className="text-[12px] text-ink-600 mt-0.5">
                  {gymName(s.gym_id) || s.area} · {partners > 0 ? `${partners} partner${partners === 1 ? '' : 's'}` : 'solo'}
                </p>
                <span className="mt-2 inline-block text-xs font-semibold text-teal-600">
                  Give props →
                </span>
              </button>
            );
          })}
        </CarouselSection>
      )}

      {/* ── Rest of agenda ── */}
      {restOfWeek.length > 0 && (
        <CarouselSection title="Also coming up" action={{ label: 'Profile', onClick: () => nav('/profile') }}>
          {restOfWeek.map((it) => {
            const key = `${it.kind}-${it.data.id}`;
            if (it.kind === 'session')
              return (
                <MiniScheduleCard
                  key={key} accent="bg-ink-900 text-white" emoji="🧗"
                  title={it.data.title} subtitle={it.data.subtitle}
                  startsAt={it.data.starts_at}
                  where={gymName(it.data.gym_id) || it.data.area || 'TBD'}
                  onClick={() => setDetailSession(it.data)}
                />
              );
            if (it.kind === 'call')
              return (
                <MiniScheduleCard
                  key={key} accent="bg-sky-200" emoji="🪢"
                  title={it.data.title ?? (it.data.category === 'top_rope' ? 'Top-rope call' : 'Lead call')}
                  subtitle={it.data.grade}
                  startsAt={it.data.starts_at} where={gymName(it.data.gym_id)}
                  onClick={() => setDetailCall(it.data)}
                />
              );
            return (
              <MiniScheduleCard
                key={key} accent="bg-gold-100" emoji="🎪"
                title={it.data.title} subtitle={it.data.tagline}
                startsAt={it.data.starts_at} where={it.data.venue}
                onClick={() => setDetailEvent(it.data)}
              />
            );
          })}
        </CarouselSection>
      )}

      {/* ── Weekly challenges ── */}
      <CarouselSection title={`This week · ${doneCount}/${challenges.length} done · ${daysLeftInWeek()}d left`}>
        {challenges.map((c) => <ChallengeCard key={c.id} c={c} />)}
      </CarouselSection>

      {/* ── Suggested climb calls ── */}
      {suggestedCalls.length > 0 && (
        <CarouselSection
          title="Partners looking now"
          action={{ label: 'All calls', onClick: () => nav('/find') }}
        >
          {suggestedCalls.map((c) => {
            const host = users.find((u) => u.id === c.user_id);
            return (
              <MiniScheduleCard
                key={c.id} accent="bg-sky-200" emoji="🪢"
                title={c.title ?? `${host?.display_name.split(' ')[0] ?? 'Someone'} · ${LOOKING_FOR_LABEL[c.looking_for]}`}
                subtitle={`${c.category === 'top_rope' ? 'Top-rope' : 'Lead'} · ${c.grade}`}
                startsAt={c.starts_at} where={gymName(c.gym_id)}
                onClick={() => setDetailCall(c)}
              />
            );
          })}
        </CarouselSection>
      )}

      {/* ── Suggested sessions (AI ranked) ── */}
      {suggestedSessions.length > 0 && (
        <CarouselSection
          title="Matched for you"
          action={{ label: 'Auto Match', onClick: () => setAiOpen(true) }}
        >
          {suggestedSessions.map(({ session, score }) => (
            <MiniScheduleCard
              key={session.id} accent="bg-teal-100" emoji={score >= 70 ? '✨' : '🧗'}
              title={session.title}
              subtitle={`${score}% match · ${session.subtitle}`}
              startsAt={session.starts_at}
              where={gymName(session.gym_id) || session.area || 'TBD'}
              onClick={() => setDetailSession(session)}
            />
          ))}
        </CarouselSection>
      )}

      {/* ── Badge progress ── */}
      {nextBadges.length > 0 && (
        <CarouselSection
          title={`Badges · ${earnedCount} of 7`}
          action={{ label: 'Profile', onClick: () => nav('/profile') }}
        >
          {nextBadges.map((b) => (
            <BadgeProgressCard key={b.id} b={b} onClick={() => nav('/profile')} />
          ))}
        </CarouselSection>
      )}

      {/* ── Events ── */}
      {suggestedEvents.length > 0 && (
        <CarouselSection
          title="Happening near you"
          action={{ label: 'All events', onClick: () => nav('/find') }}
        >
          {suggestedEvents.map((e) => (
            <MiniScheduleCard
              key={e.id} accent="bg-gold-100" emoji="🎪"
              title={e.title} subtitle={e.cost_cents === 0 ? 'Free' : `$${e.cost_cents / 100}`}
              startsAt={e.starts_at} where={e.venue}
              onClick={() => setDetailEvent(e)}
            />
          ))}
        </CarouselSection>
      )}

      {/* ── My groups ── */}
      <CarouselSection
        title={`Your crews · ${myGroups.length}`}
        action={{ label: 'Browse', onClick: () => nav('/community') }}
      >
        {myGroups.length > 0 ? (
          myGroups.map((g) => (
            <button
              key={g.id}
              onClick={() => nav(`/community/${g.id}`)}
              className="w-[152px] shrink-0 rounded-2xl bg-white border border-ink-100 overflow-hidden text-left hover:border-ink-300 transition-colors"
            >
              <img src={g.cover_url} alt="" className="w-full h-16 object-cover" loading="lazy" />
              <div className="p-3">
                <h3 className="font-semibold text-ink-900 text-[13px] leading-tight line-clamp-2">{g.name}</h3>
                <p className="text-[10px] text-ink-500 mt-1">{g.member_count.toLocaleString()} members</p>
              </div>
            </button>
          ))
        ) : (
          <button
            onClick={() => nav('/community')}
            className="w-[220px] shrink-0 rounded-2xl bg-white border border-dashed border-ink-100 p-5 text-center"
          >
            <span className="text-xl">🎪</span>
            <p className="mt-1.5 text-xs text-ink-500">Join a crew to see their events here.</p>
            <span className="mt-2 inline-block text-xs font-semibold text-teal-600">Browse groups →</span>
          </button>
        )}
      </CarouselSection>

      {/* Sheets */}
      <SessionDetailSheet session={detailSession} open={!!detailSession} onOpenChange={(o) => !o && setDetailSession(null)} />
      <ClimbCallDetailSheet call={detailCall} open={!!detailCall} onOpenChange={(o) => !o && setDetailCall(null)} />
      <EventDetailSheet event={detailEvent} open={!!detailEvent} onOpenChange={(o) => !o && setDetailEvent(null)} />
      <AiMatchSheet open={aiOpen} onOpenChange={setAiOpen} />
      <CheckInSheet open={checkInOpen} onOpenChange={setCheckInOpen} />
      <LogSendSheet open={logSendOpen} onOpenChange={setLogSendOpen} />
      <SessionRecapSheet
        session={recapSession}
        open={!!recapSession}
        onOpenChange={(o) => !o && setRecapSession(null)}
      />
    </div>
  );
}
