import type { AvatarConfig } from '@/lib/avatar';
import { getArchetype } from '@/lib/quizMeta';

/**
 * Shared builder for the expedition-postmark share card (v20, 2026-10-15).
 * One template, rendered per USER from that user's own recap:
 * crew = session participants; chips + field note = the card owner's recap only.
 * Hard rules: no grades/levels/sends, no photos, no session numbers.
 */

export interface CardParticipant {
  id: string;
  displayName: string;
  photoUrl?: string | null;
  avatarConfig?: AvatarConfig;
  /** archetype id (e.g. 'send-machine'), or null when unknown */
  archetypeId?: string | null;
}

export interface CardGym {
  id?: string;
  name: string;
  shortName?: string;
  city?: string;
  lat?: number | null;
  lng?: number | null;
}

export interface CardRecap {
  durationLabel?: string; // e.g. '2–3h'
  feltLabel?: string; // e.g. 'Great'
  vibeLabel?: string; // e.g. 'Training'
  note?: string;
}

export interface CardCrewRow {
  id: string;
  name: string;
  isOwner: boolean;
  photoUrl?: string | null;
  avatarConfig?: AvatarConfig;
  archetypeId?: string | null;
  archetypeLabel?: string;
}

export interface CardChip {
  kind: 'duration' | 'felt' | 'vibe';
  text: string;
}

export type GymMotif = 'peak' | 'boulder' | 'star';

export interface SessionCardData {
  kicker: string;
  /** "47.6609° N · 122.3868° W" — omitted when the gym record has no coords */
  coordLine?: string;
  /** Session name, split so the last word renders gold. Null when unnamed. */
  headline?: { head: string; goldTail: string } | null;
  crew: CardCrewRow[];
  /** When the roster is capped, how many more climbers are behind "+N more" */
  crewOverflow?: number;
  chips: CardChip[];
  fieldNote?: string;
  stamp: {
    issuer: string; // gym as issuer, e.g. 'VERTICAL WORLD · SEATTLE'
    motif: GymMotif;
    dateBox: string; // '13 OCT 2026'
    mon: string; // 'OCT'
    day: string; // '13'
    year: string; // '2026'
    cachet: string; // 'CRUX8 SESSION LOG · CREW OF 3'
  };
  /** Owner's invite code — omitted gracefully when unavailable. */
  inviteCode?: string | null;
}

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

const VIBE_LABELS: Record<string, string> = {
  chill: 'Chill',
  projecting: 'Projecting',
  training: 'Training',
  social: 'Social',
};

/** Gym → stamp motif. Bouldering Project ids + name all resolve to the boulder. */
export function gymMotif(gym?: CardGym | null): GymMotif {
  const hay = `${gym?.id ?? ''} ${gym?.name ?? ''} ${gym?.shortName ?? ''}`.toLowerCase();
  if (hay.includes('bouldering project') || /gym_(sbp_|bp_)/.test(hay)) return 'boulder';
  if (hay.includes('vertical world')) return 'peak';
  return 'star';
}

function cityOf(gym?: CardGym | null): string {
  const c = (gym?.city ?? '').split(',')[0].trim();
  return c ? c.toUpperCase() : 'SEATTLE';
}

export interface BuildCardInput {
  sessionTitle?: string | null;
  startsAt: string;
  area?: string | null;
  ownerId: string;
  /** Owner FIRST, then everyone else. */
  participants: CardParticipant[];
  recap: CardRecap;
  gym?: CardGym | null;
  inviteCode?: string | null;
}

export function buildSessionCardData(input: BuildCardInput): SessionCardData {
  const d = new Date(input.startsAt);
  const kicker = [
    DAYS[d.getDay()],
    '·',
    MONTHS[d.getMonth()],
    String(d.getDate()).padStart(2, '0'),
    '—',
    (input.gym?.shortName ?? input.gym?.name ?? input.area ?? 'THE GYM').toUpperCase(),
    '·',
    cityOf(input.gym),
  ].join(' ');

  let coordLine: string | undefined;
  const lat = input.gym?.lat;
  const lng = input.gym?.lng;
  if (typeof lat === 'number' && typeof lng === 'number') {
    const ns = lat >= 0 ? 'N' : 'S';
    const ew = lng >= 0 ? 'E' : 'W';
    coordLine = `${Math.abs(lat).toFixed(4)}° ${ns} · ${Math.abs(lng).toFixed(4)}° ${ew}`;
  }

  let headline: SessionCardData['headline'];
  const title = (input.sessionTitle ?? '').trim();
  if (title) {
    const words = title.split(/\s+/);
    if (words.length > 1) {
      headline = { head: words.slice(0, -1).join(' '), goldTail: words[words.length - 1] };
    } else {
      headline = { head: title, goldTail: '' };
    }
  } else {
    headline = null;
  }

  const crew: CardCrewRow[] = input.participants.map((p) => {
    const arch = p.archetypeId ? getArchetype(p.archetypeId) : null;
    return {
      id: p.id,
      name: p.displayName,
      isOwner: p.id === input.ownerId,
      photoUrl: p.photoUrl ?? null,
      avatarConfig: p.avatarConfig,
      archetypeId: arch?.id ?? null,
      archetypeLabel: arch ? `THE ${arch.name_en.toUpperCase()}` : undefined,
    };
  });
  const MAX_ROWS = 6;
  const crewOverflow = crew.length > MAX_ROWS ? crew.length - MAX_ROWS : 0;

  const chips: CardChip[] = [];
  if (input.recap.durationLabel)
    chips.push({ kind: 'duration', text: `${input.recap.durationLabel.toUpperCase()} ON THE WALL` });
  if (input.recap.feltLabel) chips.push({ kind: 'felt', text: `FELT ${input.recap.feltLabel.toUpperCase()}` });
  const vibe = input.recap.vibeLabel;
  if (vibe) chips.push({ kind: 'vibe', text: vibe.toUpperCase() });

  const note = (input.recap.note ?? '').trim();

  const mon = MONTHS[d.getMonth()];
  const day = String(d.getDate());
  const year = String(d.getFullYear());

  return {
    kicker,
    coordLine,
    headline,
    crew: crew.slice(0, MAX_ROWS),
    crewOverflow: crewOverflow > 0 ? crewOverflow : undefined,
    chips,
    fieldNote: note ? note : undefined,
    stamp: {
      issuer: `${(input.gym?.shortName ?? input.gym?.name ?? 'CRUX8').toUpperCase()} · ${cityOf(input.gym)}`,
      motif: gymMotif(input.gym),
      dateBox: `${String(d.getDate()).padStart(2, '0')} ${mon} ${year}`,
      mon,
      day,
      year,
      cachet: `CRUX8 SESSION LOG · CREW OF ${crew.length}`,
    },
    inviteCode: input.inviteCode ?? null,
  };
}

export function vibeLabelFor(v: string | undefined): string | undefined {
  if (!v) return undefined;
  return VIBE_LABELS[v] ?? v;
}
