/**
 * Usual climb times (Lucy 2026-10-19): every climber can publish the
 * weekly slots they usually climb — PER DISCIPLINE (Lucy 2026-10-20:
 * boulder, top rope and lead are separate — someone boulders Tuesday
 * mornings but leads Thursday evenings) — plus the gyms they usually
 * climb at. Others search by slot and send a climb invite pre-filled
 * for that slot, which is what gives climb calls their "time of the
 * essence" pull: the invite lands exactly when the person likes to
 * climb.
 *
 * Slot keys are `${style}:${dow}:${part}` with style boulder |
 * top_rope | lead, dow 0=Sunday..6=Saturday (matching Date.getDay())
 * and part morning|afternoon|evening. Legacy keys from the first
 * ship (`${dow}:${part}`, no style) still parse and count as
 * any-style.
 * Stored on profiles as a text[] (usual_times) + usual_gym_ids text[].
 */
export type DayPart = 'morning' | 'afternoon' | 'evening';
export type UsualStyle = 'boulder' | 'top_rope' | 'lead';

export const USUAL_STYLES: { key: UsualStyle; label: string }[] = [
  { key: 'boulder', label: 'Boulder' },
  { key: 'top_rope', label: 'Top rope' },
  { key: 'lead', label: 'Lead' },
];

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

export const slotKey = (style: UsualStyle, dow: number, part: DayPart): string =>
  `${style}:${dow}:${part}`;

/** Legacy (pre-style) key shape. */
export const legacySlotKey = (dow: number, part: DayPart): string => `${dow}:${part}`;

export function parseSlot(
  key: string,
): { style: UsualStyle | null; dow: number; part: DayPart } | null {
  const parts = key.split(':');
  let style: UsualStyle | null = null;
  let dowStr: string | undefined;
  let partStr: string | undefined;
  if (parts.length === 3) {
    const [st, d, p] = parts;
    if (st !== 'boulder' && st !== 'top_rope' && st !== 'lead') return null;
    style = st;
    dowStr = d;
    partStr = p;
  } else if (parts.length === 2) {
    [dowStr, partStr] = parts;
  } else {
    return null;
  }
  const dow = Number(dowStr);
  if (!Number.isInteger(dow) || dow < 0 || dow > 6) return null;
  if (partStr !== 'morning' && partStr !== 'afternoon' && partStr !== 'evening') return null;
  return { style, dow, part: partStr };
}

const dayShort = (dow: number) => DAYS_MON_FIRST.find((d) => d.dow === dow)?.short ?? '';

/** Summarize ONE style's slots: "Tue & Thu evenings · Sat mornings". */
function summarizeSlots(slots: { dow: number; part: DayPart }[]): string {
  const byPart = new Map<DayPart, number[]>();
  for (const s of slots) {
    const arr = byPart.get(s.part) ?? [];
    arr.push(s.dow);
    byPart.set(s.part, arr);
  }
  const parts: string[] = [];
  for (const { key, label } of DAY_PARTS) {
    const dows = byPart.get(key);
    if (!dows?.length) continue;
    const ordered = DAYS_MON_FIRST.map((d) => d.dow).filter((d) => dows.includes(d));
    parts.push(`${ordered.map(dayShort).join(' & ')} ${label.toLowerCase()}s`);
  }
  return parts.join(' · ');
}

/**
 * Full profile summary, grouped by discipline:
 * "Boulder: Tue mornings — Lead: Thu evenings". Legacy no-style
 * slots summarize without a discipline prefix.
 */
export function summarizeUsualTimes(keys: string[]): string {
  const parsed = keys.map(parseSlot).filter((x): x is NonNullable<typeof x> => !!x);
  if (parsed.length === 0) return '';
  const chunks: string[] = [];
  for (const { key: style, label } of USUAL_STYLES) {
    const slots = parsed.filter((s) => s.style === style);
    if (slots.length) chunks.push(`${label}: ${summarizeSlots(slots)}`);
  }
  const legacy = parsed.filter((s) => s.style === null);
  if (legacy.length) chunks.push(summarizeSlots(legacy));
  return chunks.join(' — ');
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
