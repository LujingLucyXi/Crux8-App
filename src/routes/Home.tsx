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
import { computeChallenges, daysLeftInWeek } from '@/lib/challenges';
import { computeBadgeProgress, nextUpBadges } from '@/lib/badges';
import { rankMatches } from '@/lib/match';
import { formatSessionWhen } from '@/lib/date';
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
  const ratings = useAppStore((s) => s.ratings);

  const [detailSession, setDetailSession] = useState<Session | null>(null);
  const [detailCall, setDetailCall] = useState<ClimbCall | null>(null);
  const [detailEvent, setDetailEvent] = useState<EventItem | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

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
      meId: me.id, sessions, cruxmates, myGroupMemberships, verifications, ratings,
    }, badges) : []),
    [me, sessions, cruxmates, myGroupMemberships, verifications, ratings, badges],
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
        <h1 className="text-2xl font-semibold text-ink-900">
          {greeting()}, {me.display_name.split(' ')[0]}.
        </h1>
        <p className="text-sm text-ink-500 mt-0.5">
          {agenda.length > 0
            ? `${agenda.length} thing${agenda.length === 1 ? '' : 's'} on your calendar · ${earnedCount}/7 badges`
            : `Nothing booked yet · ${earnedCount}/7 badges`}
        </p>
      </header>

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
                title={c.title ?? `${host?.display_name.split(' ')[0] ?? 'Someone'} needs a ${c.role === 'belayer' ? 'climber' : 'belayer'}`}
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
    </div>
  );
}
