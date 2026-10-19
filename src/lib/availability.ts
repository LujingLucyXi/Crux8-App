/**
 * Usual climb times (Lucy 2026-10-19): every climber can publish the
 * weekly slots they usually climb — day of week × daypart — plus the
 * gyms they usually climb at. Others search by slot and send a climb
 * invite pre-filled for that slot, which is what gives climb calls
 * their "time of the essence" pull: the invite lands exactly when
 * the person likes to climb.
 *
 * Slot keys are `${dow}:${part}` with dow 0=Sunday..6=Saturday
 * (matching Date.getDay()) and part morning|afternoon|evening.
 * Stored on profiles as a text[] (usual_times) + usual_gym_ids text[].
 */
export type DayPart = 'morning' | 'afternoon' | 'evening';

export const DAY_PARTS: { key: DayPart; label: string; hour: number }[] = [
  { key: 'morning', label: 'Morning', hour: 9 },
  { key: 'afternoon', label: 'Afternoon', hour: 13 },
  { key: 'evening', label: 'Evening', hour: 18 },
];

/** Monday-first day list for pickers (dow stays JS-style). */
export const DAYS_MON_FIRST: { dow: number; short: string; label: string }[] = [
  { dow: 1, short: 'Mon', label: 'Monday' },
  { dow: 2, short: 'Tue', label: 'Tuesday' },
  { dow: 3, short: 'Wed', label: 'Wednesday' },
  { dow: 4, short: 'Thu', label: 'Thursday' },
  { dow: 5, short: 'Fri', label: 'Friday' },
  { dow: 6, short: 'Sat', label: 'Saturday' },
  { dow: 0, short: 'Sun', label: 'Sunday' },
];

export const slotKey = (dow: number, part: DayPart): string => `${dow}:${part}`;

export function parseSlot(key: string): { dow: number; part: DayPart } | null {
  const [d, p] = key.split(':');
  const dow = Number(d);
  if (!Number.isInteger(dow) || dow < 0 || dow > 6) return null;
  if (p !== 'morning' && p !== 'afternoon' && p !== 'evening') return null;
  return { dow, part: p };
}

/** "Tue & Thu evenings · Sat mornings" — compact profile summary. */
export function summarizeUsualTimes(keys: string[]): string {
  const slots = keys.map(parseSlot).filter((x): x is { dow: number; part: DayPart } => !!x);
  if (slots.length === 0) return '';
  const byPart = new Map<DayPart, number[]>();
  for (const s of slots) {
    const arr = byPart.get(s.part) ?? [];
    arr.push(s.dow);
    byPart.set(s.part, arr);
  }
  const dayShort = (dow: number) => DAYS_MON_FIRST.find((d) => d.dow === dow)?.short ?? '';
  const parts: string[] = [];
  for (const { key, label } of DAY_PARTS) {
    const dows = byPart.get(key);
    if (!dows?.length) continue;
    const ordered = DAYS_MON_FIRST.map((d) => d.dow).filter((d) => dows.includes(d));
    parts.push(`${ordered.map(dayShort).join(' & ')} ${label.toLowerCase()}s`);
  }
  return parts.join(' · ');
}

/** Next future occurrence of a weekly slot (today counts if its hour is still ahead). */
export function nextSlotDate(dow: number, part: DayPart, from: Date = new Date()): Date {
  const hour = DAY_PARTS.find((p) => p.key === part)?.hour ?? 18;
  const d = new Date(from);
  d.setHours(hour, 0, 0, 0);
  let add = (dow - from.getDay() + 7) % 7;
  if (add === 0 && d.getTime() <= from.getTime()) add = 7;
  d.setDate(d.getDate() + add);
  return d;
}
