/**
 * Past-history visibility tiers (Lucy 2026-10-15):
 * - Normal accounts: only the last 3 days of history show.
 * - Premium accounts: full history — but the list itself shows the 8
 *   most recent; everything older waits in the archive, one tap away.
 *
 * "Premium" today = an active Mystery Crew membership
 * (mysteryMemberUntil in the future) — the app's only paid tier.
 */
export const PREMIUM_PAST_VISIBLE = 8;
export const NORMAL_PAST_DAYS = 3;

export interface PastSplit<T> {
  visible: T[];
  archived: T[];
  /** Normal accounts only: how many older entries the tier hides. */
  hiddenCount: number;
}

export function splitPastHistory<T>(
  items: readonly T[],
  at: (item: T) => string,
  isPremium: boolean,
  now: number = Date.now(),
): PastSplit<T> {
  const sorted = [...items].sort(
    (a, b) => new Date(at(b)).getTime() - new Date(at(a)).getTime(),
  );
  if (isPremium) {
    return {
      visible: sorted.slice(0, PREMIUM_PAST_VISIBLE),
      archived: sorted.slice(PREMIUM_PAST_VISIBLE),
      hiddenCount: 0,
    };
  }
  const cutoff = now - NORMAL_PAST_DAYS * 86400_000;
  const visible = sorted.filter((i) => new Date(at(i)).getTime() >= cutoff);
  return { visible, archived: [], hiddenCount: sorted.length - visible.length };
}

export function isPremiumMember(
  mysteryMemberUntil: string | null,
  now: number = Date.now(),
): boolean {
  return !!mysteryMemberUntil && new Date(mysteryMemberUntil).getTime() > now;
}
