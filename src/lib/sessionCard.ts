import type { Session } from '@/seed/types';

/**
 * Shared helpers for the single shareable session card (one-card decision,
 * 2026-10-14): chronological numbering among my sessions, card date label.
 */

/** 1-based chronological number of this session among my sessions. */
export function getSessionNumber(
  sessions: Session[],
  meId: string,
  sessionId: string,
): number {
  const mine = sessions
    .filter((s) => s.participant_ids.includes(meId) || s.host_id === meId)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  return mine.findIndex((s) => s.id === sessionId) + 1;
}

/** "TUE · OCT 14" style pill label. */
export function formatCardDate(iso: string): string {
  const d = new Date(iso);
  const wd = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const md = d
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toUpperCase();
  return `${wd} · ${md}`;
}

/** "Lucy Xi" -> "LX". */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '·';
}
