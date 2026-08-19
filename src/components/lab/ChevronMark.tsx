import type { ReactElement } from 'react';

/**
 * THROWAWAY /lab logo exploration: the "3 up" chevron mark rendered in real
 * BOULDER-ROCK color (dark grey + plum outline), sitting on a polished,
 * colorful rounded-tile background that contrasts the dark mark.
 * Several background palettes so we can pick the one that pops.
 */

const OUTLINE = '#2A2140'; // plum-black (the app's outline)
const ROCK = '#6B7385';    // boulder rock grey
const ROCK_HI = '#8B93A7'; // lighter facet

// Polished background palettes (top → bottom gradient) that contrast dark rock.
type Bg = { key: string; name: string; from: string; to: string };
const BGS: Bg[] = [
  { key: 'lime', name: 'Lime pop', from: '#DFFB6B', to: '#A6E22E' },
  { key: 'coral', name: 'Coral sunset', from: '#FF9A8B', to: '#FF6B6B' },
  { key: 'violet', name: 'Electric violet', from: '#A78BFA', to: '#7C3AED' },
  { key: 'sky', name: 'Sky', from: '#8BD3FF', to: '#3B9EFF' },
  { key: 'gold', name: 'Warm gold', from: '#FFD87A', to: '#F4B942' },
  { key: 'mint', name: 'Fresh mint', from: '#9DEBC8', to: '#34D399' },
];

/** The three ascending chevrons, in rock color with a subtle facet + gloss. */
function chevrons(k: string): ReactElement {
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* soft drop for depth */}
      <g opacity="0.18" stroke={OUTLINE} strokeWidth="13">
        <path d="M32 75 L50 58 L68 75" />
        <path d="M34 57 L50 42 L66 57" />
        <path d="M38 40 L50 29 L62 40" />
      </g>
      {/* rock chevrons, dark with a lighter top edge (facet) */}
      <g stroke={ROCK} strokeWidth="11">
        <path d="M32 73 L50 56 L68 73" />
        <path d="M34 55 L50 40 L66 55" />
        <path d="M38 38 L50 27 L62 38" />
      </g>
      <g stroke={ROCK_HI} strokeWidth="3" opacity="0.7">
        <path d={`M32 73 L50 56 L68 73`} />
        <path d={`M34 55 L50 40 L66 55`} />
        <path d={`M38 38 L50 27 L62 38`} />
      </g>
      {/* crisp plum outline so it reads at tiny sizes */}
      <g stroke={OUTLINE} strokeWidth="2.5">
        <path d="M32 73 L50 56 L68 73" />
        <path d="M34 55 L50 40 L66 55" />
        <path d="M38 38 L50 27 L62 38" />
      </g>
      {/* gloss sweep on the tile */}
      <path d={`M8 30 Q40 12 92 22`} stroke="#FFFFFF" strokeWidth="6" opacity="0.16" fill="none" />
    </g>
  );
}

export function ChevronMark({ bg = 'violet', size = 72 }: { bg?: string; size?: number }): ReactElement {
  const pal = BGS.find((b) => b.key === bg) ?? BGS[2];
  const gid = `chev-${pal.key}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="CruxUp logo">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor={pal.from} />
          <stop offset="100%" stopColor={pal.to} />
        </linearGradient>
      </defs>
      {/* polished colorful tile */}
      <rect x="4" y="4" width="92" height="92" rx="26" fill={`url(#${gid})`} stroke={OUTLINE} strokeWidth="3.5" />
      {chevrons(pal.key)}
    </svg>
  );
}

export const CHEVRON_BGS = BGS;
