import { format, isToday, isTomorrow, isThisWeek, formatDistanceToNow } from 'date-fns';

export function formatSessionWhen(iso: string): string {
  const d = new Date(iso);
  const time = format(d, 'h:mm a');
  if (isToday(d)) return `Today · ${time}`;
  if (isTomorrow(d)) return `Tomorrow · ${time}`;
  if (isThisWeek(d, { weekStartsOn: 1 })) return `${format(d, 'EEE')} · ${time}`;
  return `${format(d, 'MMM d')} · ${time}`;
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
