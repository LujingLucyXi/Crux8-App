/**
 * Charge — the bolt meter (Lucy 2026-10-16: "gains point when logs or
 * has activity, attach a point to each activity. If not logged in for
 * a while point drops. Almost like the light bolt visual.").
 *
 * Charge is NOT XP: XP/tiers are lifetime achievement and never drop.
 * Charge is current energy — it rises with activity and fades when
 * you go quiet, so the bolt on Home always answers "how alive is my
 * climbing life right now?"
 */

export type ChargeKind =
  | 'daily_login'
  | 'log_send'
  | 'check_in'
  | 'create_session'
  | 'join_session'
  | 'complete_session'
  | 'post_recap'
  | 'new_cruxmate'
  | 'finish_onboarding'
  | 'quiz_claim';

/** The points table — a point value attached to each activity. */
export const CHARGE_POINTS: Record<ChargeKind, { points: number; label: string }> = {
  daily_login: { points: 5, label: 'Show up (daily)' },
  log_send: { points: 10, label: 'Log a send' },
  check_in: { points: 5, label: 'Check in at a gym' },
  create_session: { points: 10, label: 'Host a session or call' },
  join_session: { points: 5, label: 'Join a session' },
  complete_session: { points: 15, label: 'Finish a session' },
  post_recap: { points: 10, label: 'Write a recap' },
  new_cruxmate: { points: 10, label: 'New cruxmate (card collected)' },
  finish_onboarding: { points: 20, label: 'Finish setting up your profile' },
  quiz_claim: { points: 15, label: 'Claim your Climber DNA' },
};

/** Decay: after this many fully-inactive days, charge fades per day. */
export const CHARGE_GRACE_DAYS = 2;
export const CHARGE_DECAY_PER_DAY = 8;

/** The meter reads "fully charged" at 100; storage caps at 150. */
export const CHARGE_FULL = 100;
export const CHARGE_CAP = 150;

export interface ChargeEntry {
  kind: ChargeKind;
  points: number;
  at: string; // ISO timestamp
}

/** Local calendar day (YYYY-MM-DD) — charge runs on the user's clock. */
export function localDay(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Whole days from a to b (both YYYY-MM-DD); negative if b < a. */
export function daysBetween(a: string, b: string): number {
  const ms = Date.parse(`${b}T12:00:00`) - Date.parse(`${a}T12:00:00`);
  return Math.round(ms / 86_400_000);
}

/**
 * Full days with zero activity strictly between the last active day
 * and today. Active Monday, back Thursday → Tue+Wed = 2.
 */
export function inactiveDays(lastActiveDay: string | null, today: string): number {
  if (!lastActiveDay) return 0;
  return Math.max(0, daysBetween(lastActiveDay, today) - 1);
}

/** Charge lost to absence, given the last active day. */
export function decayLoss(lastActiveDay: string | null, today: string): number {
  const billable = Math.max(0, inactiveDays(lastActiveDay, today) - CHARGE_GRACE_DAYS);
  return billable * CHARGE_DECAY_PER_DAY;
}
