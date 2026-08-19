/**
 * THROWAWAY /lab logo explorations for "Go-Crux".
 * Each mark is a bold, flat SVG on a 100×100 viewBox, tuned to read small.
 * Shared prop shape so the lab can render them in a grid.
 */
import type { ReactElement } from 'react';

type MarkProps = { size?: number };

const INK = '#2A2140';
const VIOLET = '#7C3AED';
const INDIGO = '#4F46E5';
const LIME = '#C6F135';
const CORAL = '#FF6B6B';
const ROCK = '#8B93A7';

/* 1 · GO gate — carabiner whose gate becomes an upward "go" arrow */
function GateGo({ size = 72 }: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="go-crux gate">
      <rect x="6" y="6" width="88" height="88" rx="22" fill={VIOLET} />
      <rect x="6" y="6" width="88" height="88" rx="22" fill="url(#gg)" opacity="0.5" />
      <defs>
        <linearGradient id="gg" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={VIOLET} /><stop offset="1" stopColor={INDIGO} />
        </linearGradient>
      </defs>
      {/* squared-D carabiner body */}
      <path d="M30 26 h30 a14 14 0 0 1 14 14 v20 a14 14 0 0 1 -14 14 h-30"
        stroke={LIME} strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* gate as an up arrow = "go up" */}
      <path d="M30 74 V32 M22 44 l8 -12 l8 12" stroke={LIME} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/* 2 · Boulder rocket — boulder launching upward with a lime thrust */
function BoulderRocket({ size = 72 }: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="go-crux rocket">
      {/* thrust */}
      <path d="M50 96 Q40 82 44 74 L56 74 Q60 82 50 96 Z" fill={LIME} />
      <path d="M50 88 Q46 82 48 78 L52 78 Q54 82 50 88 Z" fill={CORAL} />
      {/* boulder */}
      <path d="M26 60 Q18 44 32 34 Q40 20 56 26 Q76 26 76 46 Q80 62 64 68 L36 70 Q28 68 26 60 Z"
        fill={ROCK} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M56 26 Q40 22 32 34 Q42 40 52 38 Q56 30 56 26 Z" fill="#6B7385" opacity="0.4" />
      {/* eyes + grin */}
      <circle cx="44" cy="46" r="3" fill={INK} /><circle cx="60" cy="46" r="3" fill={INK} />
      <path d="M44 55 q6 6 14 0" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* speed ticks */}
      <path d="M14 44 h-8 M16 54 h-9 M18 64 h-8" stroke={VIOLET} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* 3 · GO light — rounded "traffic go" tile with a chalk hold dot */
function GoLight({ size = 72 }: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="go-crux light">
      <rect x="10" y="10" width="80" height="80" rx="24" fill={INK} />
      <circle cx="50" cy="50" r="28" fill={LIME} />
      <circle cx="50" cy="50" r="28" fill="url(#gl)" opacity="0.35" />
      <defs>
        <radialGradient id="gl" cx="38%" cy="34%" r="70%">
          <stop stopColor="#FFFFFF" stopOpacity="0.9" /><stop offset="1" stopColor={LIME} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* bold "G" hold */}
      <path d="M62 40 a16 16 0 1 0 0 20 h-10 v-8 h18 v18"
        stroke={INK} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/* 4 · Fist boulder — boulder throwing a pumped fist */
function FistBoulder({ size = 72 }: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="go-crux fist">
      {/* motion arc */}
      <path d="M70 20 q16 10 12 30" stroke={LIME} strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* boulder body */}
      <path d="M20 66 Q14 50 28 42 Q34 30 50 32 Q64 30 68 42 Q80 52 72 68 Q68 76 52 76 L32 76 Q24 74 20 66 Z"
        fill={ROCK} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      {/* arm + fist thrown up-right */}
      <path d="M62 46 L76 30" stroke={INK} strokeWidth="8" strokeLinecap="round" />
      <circle cx="80" cy="24" r="9" fill={CORAL} stroke={INK} strokeWidth="3.5" />
      <path d="M76 21 v6 M80 20 v7 M84 21 v6" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
      {/* happy face */}
      <circle cx="38" cy="54" r="3" fill={INK} /><circle cx="52" cy="54" r="3" fill={INK} />
      <path d="M37 62 q8 6 16 0" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* 5 · GoCrux monogram — G + upward chevron "go" ligature */
function GoMonogram({ size = 72 }: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="go-crux monogram">
      <rect x="6" y="6" width="88" height="88" rx="22" fill={INK} />
      {/* G */}
      <path d="M64 38 a18 18 0 1 0 0 24 h-12 v-9 h21 v20"
        stroke={LIME} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* upward "go" chevron nested */}
      <path d="M40 60 l10 -12 l10 12" stroke={VIOLET} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export const GOCRUX_CONCEPTS: { key: string; name: string; note: string; Mark: (p: MarkProps) => ReactElement }[] = [
  { key: 'gate', name: 'GO gate', note: 'Carabiner + up-arrow gate. Most on-brand (keeps the ’biner) and reads at 20px.', Mark: GateGo },
  { key: 'rocket', name: 'Boulder rocket', note: 'Smiley boulder launching up. Playful; thrust ties to “go/up.”', Mark: BoulderRocket },
  { key: 'light', name: 'GO light', note: 'Green-light “go” tile with a bold G hold. Instantly says “start.”', Mark: GoLight },
  { key: 'fist', name: 'Fist boulder', note: 'Boulder throwing a pumped fist. Most energetic mascot.', Mark: FistBoulder },
  { key: 'mono', name: 'G monogram', note: 'G + upward chevron. Cleanest/most scalable, least literal.', Mark: GoMonogram },
];
