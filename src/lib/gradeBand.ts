/**
 * Level (grade band) filtering for Find.
 *
 * Two grading systems live side by side in this app — boulder V-scale
 * and rope YDS — and session/call grades arrive as range STRINGS
 * ('V3 – V6', '5.10a–5.11c', a call's grade field, a session's
 * subtitle). The old Find level filter had one mixed band list and,
 * worse, never actually applied the selection to results (Lucy
 * 2026-10-17 field bug: picking Boulder still offered rope grades,
 * and picking any level changed nothing).
 *
 * Model: parse every grade token out of a string into a per-system
 * rank interval; a band is a per-system interval; an item matches
 * when its interval overlaps the band's IN THE SAME SYSTEM. Items
 * with no parseable grade ('All levels welcome', 'Beginner
 * friendly', free text) declare no level restriction and pass any
 * band — a level filter must never hide them.
 */

export const BOULDER_BANDS = ['V0–V2', 'V2–V4', 'V4–V6', 'V6–V8', 'V8+'] as const;
export const ROPE_BANDS = [
  'Up to 5.7',
  '5.8–5.9',
  '5.10a–5.10c',
  '5.10d–5.11b',
  '5.11c–5.12b',
  '5.12c+',
] as const;

type Interval = { lo: number; hi: number };

const BAND_INTERVALS: Record<string, { system: 'v' | 'yds'; range: Interval }> = {
  'V0–V2': { system: 'v', range: { lo: 0, hi: 2 } },
  'V2–V4': { system: 'v', range: { lo: 2, hi: 4 } },
  'V4–V6': { system: 'v', range: { lo: 4, hi: 6 } },
  'V6–V8': { system: 'v', range: { lo: 6, hi: 8 } },
  'V8+': { system: 'v', range: { lo: 8, hi: Number.POSITIVE_INFINITY } },
  'Up to 5.7': { system: 'yds', range: { lo: 0, hi: 29 } },
  '5.8–5.9': { system: 'yds', range: { lo: 33, hi: 37 } },
  '5.10a–5.10c': { system: 'yds', range: { lo: 40, hi: 42 } },
  '5.10d–5.11b': { system: 'yds', range: { lo: 43, hi: 45 } },
  '5.11c–5.12b': { system: 'yds', range: { lo: 46, hi: 49 } },
  '5.12c+': { system: 'yds', range: { lo: 50, hi: Number.POSITIVE_INFINITY } },
};

export const ALL_BANDS: string[] = [...BOULDER_BANDS, ...ROPE_BANDS];

/** Which bands to OFFER given the style selection: boulder styles
 *  see V bands, rope styles see YDS bands, no/mixed selection sees
 *  both sets. */
export function bandsForStyles(styles: string[]): string[] {
  const boulder = styles.includes('boulder') || styles.includes('outdoor_boulder');
  const rope = styles.some((x) => ['top_rope', 'lead', 'outdoor_sport', 'trad', 'multi_pitch'].includes(x));
  if (boulder && !rope) return [...BOULDER_BANDS];
  if (rope && !boulder) return [...ROPE_BANDS];
  return ALL_BANDS;
}

/** YDS rank: 5.10a → 40, 5.10c → 42, bare 5.9 → 37 (mid-letter). */
function ydsRank(major: number, letter?: string): number {
  const li = letter ? 'abcd'.indexOf(letter) : 1;
  return major * 4 + Math.max(0, li);
}

/** Parse a grade-bearing string into per-system intervals. A trailing
 *  '+' on the last token opens the interval upward ('V8+', '5.12c+'). */
function parseIntervals(text: string): Partial<Record<'v' | 'yds', Interval>> {
  const out: Partial<Record<'v' | 'yds', Interval>> = {};
  const vTokens = [...text.matchAll(/V(\d+)\+?/g)].map((m) => ({
    rank: parseInt(m[1], 10),
    open: m[0].endsWith('+'),
  }));
  if (vTokens.length) {
    out.v = {
      lo: Math.min(...vTokens.map((t) => t.rank)),
      hi: vTokens.some((t) => t.open)
        ? Number.POSITIVE_INFINITY
        : Math.max(...vTokens.map((t) => t.rank)),
    };
  }
  const yTokens = [...text.matchAll(/5\.(\d{1,2})([a-d])?\+?/g)].map((m) => ({
    rank: ydsRank(parseInt(m[1], 10), m[2]),
    open: m[0].endsWith('+'),
  }));
  if (yTokens.length) {
    out.yds = {
      lo: Math.min(...yTokens.map((t) => t.rank)),
      hi: yTokens.some((t) => t.open)
        ? Number.POSITIVE_INFINITY
        : Math.max(...yTokens.map((t) => t.rank)),
    };
  }
  return out;
}

/** Does a grade-bearing string (call grade, session subtitle) fall
 *  in the selected band? No parseable grade → true (unrestricted). */
export function gradeMatchesBand(text: string | undefined, band: string): boolean {
  const def = BAND_INTERVALS[band];
  if (!def || !text) return true;
  const intervals = parseIntervals(text);
  const mine = intervals[def.system];
  if (!mine) {
    // The item speaks only the OTHER grading system — or none. If it
    // has grades at all, they're the other system's: no match. If it
    // has none, it's unrestricted: match.
    return !intervals.v && !intervals.yds;
  }
  return mine.lo <= def.range.hi && def.range.lo <= mine.hi;
}
