import type { ReactElement } from 'react';

/**
 * THROWAWAY /lab: the "rope loop → up-arrow" mark, SLEEK redesign.
 * One continuous fluid ribbon coils into a loop (partnership) and sweeps up
 * into a clean arrow (progression). Gradient stroke, rounded caps, a single
 * accent node at the crux instead of a busy knot. Modern + minimal.
 */

const INK = '#2A2140';
const VIOLET = '#7C3AED';
const PINK = '#EC4899';
const LIME = '#C6F135';
const CORAL = '#FF6B6B';
const ROCK = '#8B93A7';

// One flowing ribbon: loop on the lower-left, rising into the shaft on the right.
const RIBBON = 'M64 56 C42 74 16 62 22 42 C27 26 50 26 54 44 C57 58 54 66 66 62 C76 59 74 48 74 34';
// Sleek slim arrowhead sitting on top of the shaft (x≈74).
const HEAD = 'M64 38 L74 24 L84 38';

type Props = { size?: number };

function defs(k: string): ReactElement {
  return (
    <defs>
      <linearGradient id={`${k}-g`} x1="0.1" y1="0.9" x2="0.9" y2="0.1">
        <stop offset="0%" stopColor={VIOLET} />
        <stop offset="60%" stopColor={PINK} />
        <stop offset="100%" stopColor={LIME} />
      </linearGradient>
      <linearGradient id={`${k}-vp`} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor={VIOLET} />
        <stop offset="100%" stopColor={PINK} />
      </linearGradient>
    </defs>
  );
}

/** Sleek ribbon: soft shadow pass for depth, then the colored stroke, clean arrowhead. */
function Ribbon({ stroke, node, tile }: { stroke: string; node?: string; tile?: boolean }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* subtle depth shadow under the ribbon */}
      <path d={RIBBON} stroke={tile ? '#00000022' : '#2A214012'} strokeWidth="12" transform="translate(0,2)" />
      {/* the ribbon */}
      <path d={RIBBON} stroke={stroke} strokeWidth="9" />
      {/* arrowhead */}
      <path d={HEAD} stroke={stroke} strokeWidth="9" />
      {/* crux node — a single clean dot where the ribbon crosses */}
      {node && <circle cx="60" cy="55" r="4.5" fill={node} stroke={tile ? '#ffffff' : INK} strokeWidth="2" />}
    </g>
  );
}

// 1. Gradient ribbon (violet→pink→lime), coral crux node — the hero
function RopeGrad({ size = 72 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="CruxUp logo">
      {defs('rg')}
      <Ribbon stroke={`url(#rg-g)`} node={CORAL} />
    </svg>
  );
}

// 2. Monoline violet — minimal, single color, no node
function RopeMono({ size = 72 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="CruxUp logo">
      {defs('rm')}
      <Ribbon stroke={VIOLET} />
    </svg>
  );
}

// 3. Duo — violet→pink ribbon, lime crux node (calmer than the tri-gradient)
function RopeDuo({ size = 72 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="CruxUp logo">
      {defs('rd')}
      <Ribbon stroke={`url(#rd-vp)`} node={LIME} />
    </svg>
  );
}

// 4. On a violet app-icon tile — white ribbon, lime node
function RopeTile({ size = 72 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="CruxUp logo">
      {defs('rt')}
      <rect x="4" y="4" width="92" height="92" rx="26" fill={`url(#rt-vp)`} />
      <Ribbon stroke="#FFFFFF" node={LIME} tile />
    </svg>
  );
}

// 5. Neutral rope grey + lime arrow tip (ties to the boulder-rock mascot)
function RopeRock({ size = 72 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="CruxUp logo">
      {defs('rr')}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={RIBBON} stroke="#2A214012" strokeWidth="12" transform="translate(0,2)" />
        <path d={RIBBON} stroke={ROCK} strokeWidth="9" />
        <path d={HEAD} stroke={LIME} strokeWidth="9" />
      </g>
    </svg>
  );
}

export const ROPE_LOGOS: {
  key: string; name: string; note: string; Mark: (p: Props) => ReactElement;
}[] = [
  { key: 'grad', name: 'Gradient ribbon', note: 'One fluid ribbon, violet→pink→lime, coral crux node. Sleek + energetic — the hero.', Mark: RopeGrad },
  { key: 'duo', name: 'Violet→pink + lime node', note: 'Calmer two-tone ribbon with a single lime node at the crux. Clean at every size.', Mark: RopeDuo },
  { key: 'mono', name: 'Monoline violet', note: 'Minimal single-color line — the most restrained, most scalable. Great as a favicon.', Mark: RopeMono },
  { key: 'tile', name: 'On violet tile', note: 'White ribbon on a violet app-icon tile — the home-screen / PWA icon.', Mark: RopeTile },
  { key: 'rock', name: 'Rock rope + lime tip', note: 'Neutral rope that turns lime as it becomes the arrow — ties to the boulder mascot.', Mark: RopeRock },
];
