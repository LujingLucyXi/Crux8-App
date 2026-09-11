import {
  format, isToday, isTomorrow, isThisWeek, formatDistanceToNow,
  isSameDay, differenceInCalendarDays,
} from 'date-fns';

export function formatSessionWhen(iso: string): string {
  const d = new Date(iso);
  const time = format(d, 'h:mm a');
  if (isToday(d)) return `Today · ${time}`;
  if (isTomorrow(d)) return `Tomorrow · ${time}`;
  if (isThisWeek(d, { weekStartsOn: 1 })) return `${format(d, 'EEE')} · ${time}`;
  return `${format(d, 'MMM d')} · ${time}`;
}

/** True when start and end fall on different calendar days (a multi-day trip). */
export function isMultiDaySpan(startIso: string, endIso: string): boolean {
  return !isSameDay(new Date(startIso), new Date(endIso));
}

/**
 * A compact date range for multi-day trips, e.g. `Sep 20–22 · 3 days` or
 * `Sep 30 – Oct 2 · 3 days` when the months differ.
 */
export function formatTripRange(startIso: string, endIso: string): string {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const days = differenceInCalendarDays(e, s) + 1;
  const left = format(s, 'MMM d');
  const right = s.getMonth() === e.getMonth() ? format(e, 'd') : format(e, 'MMM d');
  const sep = s.getMonth() === e.getMonth() ? '–' : ' – ';
  return `${left}${sep}${right} · ${days} days`;
}

export function formatChatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = (now.getTime() - d.getTime()) / 60000;
  if (diffMin < 60) return `${Math.max(1, Math.floor(diffMin))}m`;
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}h`;
  if (isTomorrow(d) || isToday(d)) return format(d, 'h:mm a');
  const diffDays = (now.getTime() - d.getTime()) / (86400000);
  if (diffDays < 2) return 'Yesterday';
  if (diffDays < 7) return format(d, 'EEE');
  return format(d, 'MMM d');
}

export function formatRelative(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

export function inHour(iso: string, hourStart: number, hourEnd: number): boolean {
  const h = new Date(iso).getHours();
  return h >= hourStart && h < hourEnd;
}
