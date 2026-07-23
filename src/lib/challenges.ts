import type { Session, ClimbCall, EventItem } from '@/seed/types';

/**
 * Weekly challenges — light gamification that rewards the behaviours
 * CruxMate actually wants (showing up, belaying others, meeting people,
 * getting outside). All progress is computed from real store state; nothing
 * is fabricated.
 *
 * The week resets Monday 00:00 local.
 */

export interface Challenge {
  id: string;
  emoji: string;
  title: string;
  blurb: string;
  target: number;
  current: number;
  unit: string;
}

export function startOfWeek(d = new Date()): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Mon = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfWeek(d = new Date()): Date {
  const x = startOfWeek(d);
  x.setDate(x.getDate() + 7);
  return x;
}

export function daysLeftInWeek(): number {
  const ms = endOfWeek().getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

interface Ctx {
  meId: string;
  sessions: Session[];
  climbCalls: ClimbCall[];
  events: EventItem[];
  cruxmates: string[];
  gyms: { id: string }[];
}

export function computeChallenges({
  meId, sessions, climbCalls, events, cruxmates,
}: Ctx): Challenge[] {
  const wkStart = startOfWeek().getTime();
  const wkEnd = endOfWeek().getTime();
  const inWeek = (iso: string) => {
    const t = new Date(iso).getTime();
    return t >= wkStart && t < wkEnd;
  };

  const mySessionsThisWeek = sessions.filter(
    (s) => s.participant_ids.includes(meId) && inWeek(s.starts_at),
  );
  const myCallsThisWeek = climbCalls.filter(
    (c) => c.participant_ids.includes(meId) && inWeek(c.starts_at),
  );
  const myEventsThisWeek = events.filter(
    (e) => e.attendee_ids.includes(meId) && inWeek(e.starts_at),
  );

  // Distinct gyms across everything I'm on this week
  const gymsThisWeek = new Set<string>();
  mySessionsThisWeek.forEach((s) => s.gym_id && gymsThisWeek.add(s.gym_id));
  myCallsThisWeek.forEach((c) => {
    if (c.gym_id) gymsThisWeek.add(c.gym_id);
    else if (c.area) gymsThisWeek.add(c.area);
  });

  const outdoorThisWeek = mySessionsThisWeek.filter((s) => s.location_type === 'outdoor');

  // Calls I joined that someone else hosted = I'm supporting a partner
  const belayAssists = myCallsThisWeek.filter((c) => c.user_id !== meId);

  return [
    {
      id: 'ch_show_up',
      emoji: '🧗',
      title: 'Show up 3×',
      blurb: 'Join three climbs this week',
      target: 3,
      current: mySessionsThisWeek.length + myCallsThisWeek.length,
      unit: 'climbs',
    },
    {
      id: 'ch_belay_karma',
      emoji: '🪢',
      title: 'Belay karma',
      blurb: "Answer 2 partners' climb calls",
      target: 2,
      current: belayAssists.length,
      unit: 'calls',
    },
    {
      id: 'ch_new_walls',
      emoji: '🧭',
      title: 'New walls',
      blurb: 'Climb at 2 different gyms',
      target: 2,
      current: gymsThisWeek.size,
      unit: 'gyms',
    },
    {
      id: 'ch_touch_grass',
      emoji: '🌲',
      title: 'Touch grass',
      blurb: 'Get outside once',
      target: 1,
      current: outdoorThisWeek.length,
      unit: 'trips',
    },
    {
      id: 'ch_new_mates',
      emoji: '🤝',
      title: 'Expand the crew',
      blurb: 'Reach 5 CruxMates',
      target: 5,
      current: cruxmates.length,
      unit: 'mates',
    },
    {
      id: 'ch_community',
      emoji: '🎪',
      title: 'Show face',
      blurb: 'RSVP to a community event',
      target: 1,
      current: myEventsThisWeek.length,
      unit: 'events',
    },
  ];
}
