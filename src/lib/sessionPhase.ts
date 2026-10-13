import type { Session } from '@/seed/types';

/**
 * Session lifecycle (Lucy's rules, 2026-10-13):
 * - Nothing auto-starts. A session goes live only when a participant taps
 *   Start, and only inside the start window (30 min before → 1 hr after
 *   the scheduled start). Past +1 hr unstarted, it lapses ('expired').
 * - Nothing auto-finish. A live session stays live until someone taps
 *   Finish, however far past ends_at it runs.
 * - Finishing leads to the optional rating (recap) and the summary card.
 *
 * Lifecycle lives in the local store (same layer as recaps), keyed by
 * session id. Call-created sessions are born 'live' (startCallSession
 * stamps started_at when the crew confirms who's here).
 */
export interface SessionLifecycle {
  started_at?: string;
  finished_at?: string;
}

export type SessionPhase = 'upcoming' | 'live' | 'done' | 'expired';

export const START_EARLY_MS = 30 * 60_000; // can start 30 min early
export const START_LATE_MS = 60 * 60_000; // ...or up to 1 hr late

export function sessionPhase(
  session: Session,
  lc: SessionLifecycle | undefined,
  now: number = Date.now(),
): SessionPhase {
  if (lc?.finished_at) return 'done';
  if (lc?.started_at) return 'live';
  if (now > new Date(session.starts_at).getTime() + START_LATE_MS) return 'expired';
  return 'upcoming';
}

export function canStartSession(session: Session, now: number = Date.now()): boolean {
  const start = new Date(session.starts_at).getTime();
  return now >= start - START_EARLY_MS && now <= start + START_LATE_MS;
}
