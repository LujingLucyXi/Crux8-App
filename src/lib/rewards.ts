/**
 * CruxMate reward system — XP, levels, and send scoring.
 * Climbing-culture level titles keep progression fun and identity-forming.
 */

export interface CelebrationConfig {
  emoji: string;
  title: string;
  subtitle: string;
  colors: string[]; // ring + confetti accents
}

export interface SendLog {
  id: string;
  grade: string;                 // 'V5' or '5.11a'
  discipline: 'boulder' | 'rope';
  style: 'flash' | 'onsight' | 'redpoint' | 'send';
  at: string;                    // ISO
  note?: string;
}

/** XP awarded per action. */
export const XP = {
  checkIn: 15,
  rsvp: 10,
  recap: 40,
  props: 5,
  sendBase: 20,
} as const;

/** Level ladder — cumulative XP floor + a climbing-culture title + emoji. */
export const LEVELS: { title: string; emoji: string; floor: number }[] = [
  { title: 'Gym Newbie', emoji: '🧗', floor: 0 },
  { title: 'Chalk Rookie', emoji: '🧂', floor: 60 },
  { title: 'Flapper Survivor', emoji: '🩹', floor: 150 },
  { title: 'Crimp Lord', emoji: '🤏', floor: 300 },
  { title: 'Dyno Devil', emoji: '⚡', floor: 520 },
  { title: 'Send Machine', emoji: '🔩', floor: 820 },
  { title: 'Crux Crusher', emoji: '💥', floor: 1250 },
  { title: 'Beta Wizard', emoji: '🔮', floor: 1850 },
  { title: 'Send God', emoji: '👑', floor: 2700 },
];

export interface LevelState {
  level: number;      // 1-indexed
  title: string;
  emoji: string;
  floor: number;      // xp at start of this level
  nextAt: number | null; // xp needed for next level (null at max)
  intoLevel: number;  // xp earned within current level
  span: number;       // xp span of current level (1 at max)
  pct: number;        // 0-100 progress to next
}

export function levelFromXp(xp: number): LevelState {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].floor) idx = i;
  }
  const cur = LEVELS[idx];
  const next = LEVELS[idx + 1] ?? null;
  const nextAt = next ? next.floor : null;
  const span = next ? next.floor - cur.floor : 1;
  const intoLevel = xp - cur.floor;
  const pct = next ? Math.min(100, Math.round((intoLevel / span) * 100)) : 100;
  return { level: idx + 1, title: cur.title, emoji: cur.emoji, floor: cur.floor, nextAt, intoLevel, span, pct };
}

/** Grade → XP. Harder sends earn more. Accepts V-scale or YDS. */
export function sendXp(grade: string): number {
  const g = grade.trim().toLowerCase();
  // V-scale boulder
  const v = g.match(/^v(\d+)/);
  if (v) return XP.sendBase + Number(v[1]) * 8;
  // YDS rope: 5.x(letter)
  const y = g.match(/^5\.(\d+)([a-d]?)/);
  if (y) {
    const num = Number(y[1]);
    const letter = { a: 0, b: 1, c: 2, d: 3 }[y[2] as 'a' | 'b' | 'c' | 'd'] ?? 0;
    const above10 = Math.max(0, num - 9); // 5.9 → 0, 5.10 → 1 ...
    return XP.sendBase + above10 * 10 + letter * 2;
  }
  return XP.sendBase;
}

const STYLE_BONUS: Record<SendLog['style'], number> = {
  onsight: 12,
  flash: 8,
  redpoint: 4,
  send: 0,
};

export function totalSendXp(grade: string, style: SendLog['style']): number {
  return sendXp(grade) + STYLE_BONUS[style];
}

export const BRAND_COLORS = ['#7C3AED', '#EC4899', '#38BDF8'];
export const SEND_COLORS = ['#FF5A5F', '#FFB020', '#C6F135'];
export const LEVELUP_COLORS = ['#C6F135', '#7C3AED', '#EC4899'];
export const CHECKIN_COLORS = ['#22D3A5', '#38BDF8', '#C6F135'];
