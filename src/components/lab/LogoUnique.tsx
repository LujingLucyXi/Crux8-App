import type { ReactElement } from 'react';

/**
 * THROWAWAY /lab logo explorations, round 3 — aiming for DISTINCTIVE / ownable.
 * Each mark has a climbing-specific twist or a dual-meaning, in the app's
 * material palette (brand gradient + gold + boulder rock + plum outline).
 */

const INK = '#2A2140';
const VIOLET = '#7C3AED';
const PINK = '#EC4899';
const LIME = '#C6F135';
const GOLD = '#E9B84B';
const GOLD_DK = '#C9992F';
const ROCK = '#6B7385';

type MarkProps = { size?: number };

function grad(k: string): ReactElement {
  return (
    <defs>
      <linearGradient id={`${k}-bp`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={VIOLET} />
        <stop offset="100%" stopColor={PINK} />
      </linearGradient>
      <linearGradient id={`${k}-gold`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F4D479" />
        <stop offset="100%" stopColor={GOLD_DK} />
      </linearGradient>
    </defs>
  );
}
const svg = (k: string, size: number, children: ReactElement) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="CruxUp logo">
    {grad(k)}
    {children}
  </svg>
);

// 1. Boulder with an up-arrow knocked OUT (negative space) — dual meaning, memorable
function NegArrow({ size = 72 }: MarkProps) {
  return svg('neg', size, (
    <g>
      <path d="M50 14 Q80 16 84 46 Q88 78 50 86 Q12 78 16 46 Q20 16 50 14 Z"
        fill={`url(#neg-bp)`} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M50 30 L66 50 L57 50 L57 68 L43 68 L43 50 L34 50 Z" fill="#FFFFFF" />
    </g>
  ));
}

// 2. Figure-8 climbing knot (THE climbing knot) drawn as a rope "8" that rises
function Knot8({ size = 72 }: MarkProps) {
  const path = 'M50 26 C33 26 33 49 50 49 C67 49 67 74 50 74 C33 74 33 49 50 49 C67 49 67 26 50 26 Z';
  return svg('knot', size, (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} stroke={INK} strokeWidth="15" />
      <path d={path} stroke={`url(#knot-gold)`} strokeWidth="9" />
      {/* rope tail flicking up */}
      <path d="M62 30 L74 20" stroke={`url(#knot-gold)`} strokeWidth="9" />
      <path d="M62 30 L74 20" stroke={INK} strokeWidth="2" opacity="0.4" />
    </g>
  ));
}

// 3. Carabiner that doubles as the letter "U" (Crux-UP), with a lime gate
function CarabinerU({ size = 72 }: MarkProps) {
  return svg('cu', size, (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M28 22 L28 56 A22 22 0 0 0 72 56 L72 22" stroke={`url(#cu-bp)`} strokeWidth="12" />
      {/* spring gate across the opening */}
      <path d="M58 16 L80 26" stroke={LIME} strokeWidth="7" />
      <circle cx="80" cy="26" r="3.5" fill={LIME} />
    </g>
  ));
}

// 4. Topo contour peak — rounded survey contours + a gold summit benchmark dot
function TopoPeak({ size = 72 }: MarkProps) {
  return svg('topo', size, (
    <g fill="none" strokeLinecap="round">
      <path d="M18 78 Q50 26 82 78" stroke={VIOLET} strokeWidth="8" />
      <path d="M28 78 Q50 40 72 78" stroke={PINK} strokeWidth="8" />
      <path d="M38 78 Q50 54 62 78" stroke={LIME} strokeWidth="8" />
      <circle cx="50" cy="30" r="6" fill={`url(#topo-gold)`} stroke={INK} strokeWidth="2.5" />
    </g>
  ));
}

// 5. Cairn-arrow — three stacked stones whose silhouette forms an up-arrow
function CairnArrow({ size = 72 }: MarkProps) {
  return svg('cairnA', size, (
    <g stroke={INK} strokeWidth="3.5" strokeLinejoin="round">
      <path d="M22 78 Q20 64 40 62 Q54 60 62 64 Q82 68 78 80 L22 80 Z" fill={ROCK} />
      <path d="M34 60 Q32 48 46 46 Q56 44 62 48 Q74 52 68 60 Q50 62 34 60 Z" fill="#8B93A7" />
      <path d="M42 44 Q40 32 50 32 Q60 32 58 43 Q50 47 42 44 Z" fill={`url(#cairnA-bp)`} />
      {/* tiny lime summit spark */}
      <path d="M50 30 L50 20 M45 24 L50 18 L55 24" stroke={LIME} strokeWidth="4" strokeLinecap="round" fill="none" />
    </g>
  ));
}

// 6. Chalked handprint reaching up — the climber's own mark
function ChalkUp({ size = 72 }: MarkProps) {
  return svg('chalk', size, (
    <g stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      {/* palm */}
      <path d="M36 58 Q34 46 40 44 L40 40 Q40 36 44 36 Q46 36 46 40 L46 43
               Q46 38 50 38 Q54 38 54 42 L54 43 Q54 39 58 39 Q62 39 62 43 L62 46
               Q62 40 66 41 Q70 42 68 50 Q72 56 66 66 Q58 76 48 74 Q38 72 36 58 Z"
        fill={`url(#chalk-bp)`} />
      {/* motion spark up */}
      <path d="M50 30 L50 20 M45 25 L50 18 L55 25" stroke={LIME} strokeWidth="4" fill="none" />
    </g>
  ));
}

export const UNIQUE_LOGOS: {
  key: string;
  name: string;
  note: string;
  Mark: (p: MarkProps) => ReactElement;
}[] = [
  { key: 'neg', name: 'Boulder ↑ (negative space)', note: 'A gradient boulder with an up-arrow cut out of it. Dual meaning in one shape — the most "aha" and the most memorable.', Mark: NegArrow },
  { key: 'knot', name: 'Figure-8 knot', note: 'THE climbing knot, drawn as a golden rope 8 with the tail flicking up. Instantly climbing, basically unused as a logo — very ownable.', Mark: Knot8 },
  { key: 'cu', name: 'Carabiner-U', note: 'A carabiner that IS the letter U (Crux-UP), lime spring-gate at the opening. Clever dual letterform, keeps your gear equity.', Mark: CarabinerU },
  { key: 'topo', name: 'Topo peak', note: 'Rounded topographic contour lines forming a peak, with a gold summit benchmark dot. Outdoorsy + distinct from plain chevrons.', Mark: TopoPeak },
  { key: 'cairnA', name: 'Cairn-arrow', note: 'Three stacked stones whose silhouette reads as an up-arrow, lime summit spark on top. Boulder-real + progression.', Mark: CairnArrow },
  { key: 'chalk', name: 'Chalk hand ↑', note: 'A chalked climbing hand reaching up. The most human/brand-voice option — “find your people.” Busiest at tiny sizes.', Mark: ChalkUp },
];
