import type { ReactElement } from 'react';

/**
 * THROWAWAY /lab: "CU" monogram (Crux-Up), polished + letters SIDE BY SIDE.
 * C is an open arc on the left; U sits clearly to its right; the U's right
 * prong rises into an up-arrow. Equal cap height, rounded caps, clean gap.
 */

const INK = '#2A2140';
const VIOLET = '#7C3AED';
const PINK = '#EC4899';
const LIME = '#C6F135';
const ROCK = '#6B7385';
const ROCK_HI = '#8B93A7';

const SW = 11;   // letter stroke
const ASW = 6.5; // arrow stroke

type Props = { size?: number };

function defs(k: string): ReactElement {
  return (
    <defs>
      <linearGradient id={`${k}-bp`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={VIOLET} />
        <stop offset="100%" stopColor={PINK} />
      </linearGradient>
      <linearGradient id={`${k}-tile`} x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%" stopColor="#A78BFA" />
        <stop offset="100%" stopColor={VIOLET} />
      </linearGradient>
      <linearGradient id={`${k}-lime`} x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%" stopColor="#DFFB6B" />
        <stop offset="100%" stopColor="#A6E22E" />
      </linearGradient>
    </defs>
  );
}

// C on the left (open arc), U on the right with an up-arrow prong. Clean gap between.
function Glyph({ cCol, uCol, arrowCol }: { cCol: string; uCol: string; arrowCol: string }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* C — open arc, opening faces the U */}
      <path d="M45 34 A17 17 0 1 0 45 66" stroke={cCol} strokeWidth={SW} />
      {/* U — clearly separate, right prong rises up */}
      <path d="M60 33 L60 59 A9 9 0 0 0 78 59 L78 26" stroke={uCol} strokeWidth={SW} />
      {/* arrowhead on the U's right prong */}
      <path d="M71 33 L78 24 L85 33" stroke={arrowCol} strokeWidth={ASW} />
    </g>
  );
}

// 1. Gradient CU on white
function CUGrad({ size = 72 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="CruxUp logo">
      {defs('cug')}
      <Glyph cCol={`url(#cug-bp)`} uCol={`url(#cug-bp)`} arrowCol={LIME} />
    </svg>
  );
}

// 2. Duotone — C violet, U pink, lime arrow (color makes the two letters read distinctly)
function CUDuo({ size = 72 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="CruxUp logo">
      {defs('cud')}
      <Glyph cCol={VIOLET} uCol={PINK} arrowCol={LIME} />
    </svg>
  );
}

// 3. White CU on electric-violet polished tile (app icon)
function CUTile({ size = 72 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="CruxUp logo">
      {defs('cut')}
      <rect x="4" y="4" width="92" height="92" rx="26" fill={`url(#cut-tile)`} stroke={INK} strokeWidth="3.5" />
      <Glyph cCol="#FFFFFF" uCol="#FFFFFF" arrowCol={LIME} />
    </svg>
  );
}

// 4. Boulder-rock CU on lime polished tile
function CURock({ size = 72 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="CruxUp logo">
      {defs('cur')}
      <rect x="4" y="4" width="92" height="92" rx="26" fill={`url(#cur-lime)`} stroke={INK} strokeWidth="3.5" />
      <Glyph cCol={ROCK} uCol={ROCK_HI} arrowCol={INK} />
    </svg>
  );
}

export const CU_LOGOS: { key: string; name: string; note: string; Mark: (p: Props) => ReactElement }[] = [
  { key: 'grad', name: 'CU gradient', note: 'C and U side by side, U’s right prong rises into a lime arrow. Brand gradient. Clean gap between letters.', Mark: CUGrad },
  { key: 'duo', name: 'CU duotone', note: 'C in violet, U in pink — the two-tone makes both letters read instantly. Lime arrow keeps the “up”.', Mark: CUDuo },
  { key: 'tile', name: 'CU on violet tile', note: 'White CU on an electric-violet polished tile — the cleanest app-icon / home-screen mark.', Mark: CUTile },
  { key: 'rock', name: 'CU rock on lime tile', note: 'Boulder-rock letters on a lime tile — ties to the mascot rock + your reward accent.', Mark: CURock },
];
