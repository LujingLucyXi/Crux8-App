import type { Session, Profile, Style } from '@/seed/types';

const GRADE_BANDS: string[][] = [
  ['V0', '5.7'],
  ['V1', 'V2', '5.8', '5.9'],
  ['V3', 'V4', '5.10a', '5.10b', '5.10c'],
  ['V5', 'V6', '5.10d', '5.11a', '5.11b'],
  ['V7', 'V8', '5.11c', '5.12a', '5.12b'],
  ['V9', 'V10', '5.12c', '5.12d', '5.13a', '5.13b'],
];

function bandIndex(grade: string): number {
  const g = grade.replace(/\+$/, '').trim();
  for (let i = 0; i < GRADE_BANDS.length; i++) {
    if (GRADE_BANDS[i].some((b) => g.startsWith(b))) return i;
  }
  return -1;
}

/** Returns 1.0 for same band, 0.5 for adjacent, 0 otherwise. */
export function gradeOverlap(myGrade: string, sessionSubtitle: string): number {
  const myIdx = bandIndex(myGrade);
  if (myIdx < 0) return 0.25;
  // Parse first grade token out of subtitle
  const m = sessionSubtitle.match(/(V\d+|5\.\d+[a-d]?)/);
  if (!m) return 0.5;
  const sIdx = bandIndex(m[1]);
  if (sIdx < 0) return 0.25;
  const diff = Math.abs(myIdx - sIdx);
  if (diff === 0) return 1.0;
  if (diff === 1) return 0.5;
  return 0;
}

const CATEGORY_TO_STYLE: Record<string, Style> = {
  top_rope: 'top_rope',
  lead: 'lead',
  boulder: 'boulder',
  outdoor_sport: 'outdoor_sport',
  outdoor_boulder: 'boulder',
  trad: 'trad',
  multi_pitch: 'trad',
  hiking: 'hiking',
  event: 'events',
};

export function styleFor(cat: string): Style {
  return CATEGORY_TO_STYLE[cat] ?? 'top_rope';
}

export function matchScore(me: Profile, s: Session): number {
  let score = 0;
  score += gradeOverlap(me.top_grade, s.subtitle) * 40;
  score += me.preferred_styles.includes(styleFor(s.category)) ? 25 : 0;
  score += s.gym_id === me.home_gym_id ? 15 : 7;
  const hours = Math.max(0, (new Date(s.starts_at).getTime() - Date.now()) / 3.6e6);
  score += Math.max(0, 10 - hours / 24);
  score += ['social', 'chill'].includes(s.vibe) ? 5 : 3;
  if (s.participant_ids.includes(me.id)) score -= 20;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function rankMatches(me: Profile, sessions: Session[], k = 5): Array<{ session: Session; score: number }> {
  return sessions
    .map((session) => ({ session, score: matchScore(me, session) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
