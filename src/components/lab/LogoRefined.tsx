import type { ReactElement } from 'react';

/**
 * THROWAWAY /lab logo explorations, round 2.
 * Two families, both tuned to the *app* aesthetic (electric violet→pink→lime
 * gradient + gold accent + bold plum outline) rather than the flat kids-cartoon:
 *   - "boulder": refined boulder marks (geometric/gradient, no goofy face)
 *   - "abstract": non-cartoon geometric marks
 * Each mark fills a 100×100 viewBox and namespaces its gradient ids by `k`.
 */

const INK = '#2A2140';
const VIOLET = '#7C3AED';
const PINK = '#EC4899';
const LIME = '#C6F135';
const GOLD = '#E9B84B';
const GOLD_DK = '#C9992F';

type MarkProps = { size?: number };

function Defs({ k }: { k: string }) {
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

const wrap = (k: string, size: number, children: ReactElement) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="logo">
    <Defs k={k} />
    {children}
  </svg>
);

/* ───────────────── BOULDER family (refined, no cartoon face) ───────────────── */

// 1. Faceted gradient boulder — geometric crystal rock, no face
function GemBoulder({ size = 72 }: MarkProps) {
  return wrap('gem', size, (
    <g stroke={INK} strokeWidth="3.5" strokeLinejoin="round">
      <path d="M50 20 L78 40 L66 76 L34 76 L22 40 Z" fill={`url(#gem-bp)`} />
      <path d="M50 20 L50 76" stroke={INK} strokeWidth="2.5" opacity="0.5" />
      <path d="M22 40 L50 50 L78 40" fill="none" stroke={INK} strokeWidth="2.5" opacity="0.5" />
      <path d="M50 20 L78 40 L50 50 Z" fill="#FFFFFF" opacity="0.14" stroke="none" />
    </g>
  ));
}

// 2. Cairn — two stacked geometric boulders (trail marker = "find your way up")
function Cairn({ size = 72 }: MarkProps) {
  return wrap('cairn', size, (
    <g stroke={INK} strokeWidth="3.5" strokeLinejoin="round">
      <path d="M30 60 Q26 46 40 44 Q52 42 60 48 Q72 52 68 62 Q64 72 48 72 Q34 72 30 60 Z" fill={`url(#cairn-bp)`} />
      <path d="M38 40 Q34 28 46 26 Q58 24 62 32 Q68 40 58 44 Q46 48 38 40 Z" fill={GOLD} />
      <path d="M44 16 Q42 10 50 10 Q57 10 56 17 Q55 24 49 23 Q44 22 44 16 Z" fill={LIME} />
    </g>
  ));
}

// 3. Boulder + summit chevron — rock with a lime up-chevron rising off it
function BoulderRise({ size = 72 }: MarkProps) {
  return wrap('rise', size, (
    <g stroke={INK} strokeWidth="3.5" strokeLinejoin="round">
      <path d="M24 74 Q18 56 34 50 Q46 44 60 50 Q78 56 74 70 L74 74 Z" fill={`url(#rise-bp)`} />
      <path d="M32 44 L50 26 L68 44" fill="none" stroke={LIME} strokeWidth="8" strokeLinecap="round" />
    </g>
  ));
}

// 4. Gold-badge boulder — matches the avatar ring / collectible language
function BadgeBoulder({ size = 72 }: MarkProps) {
  return wrap('badge', size, (
    <g>
      <circle cx="50" cy="50" r="44" fill={`url(#badge-gold)`} stroke={GOLD_DK} strokeWidth="2" />
      <circle cx="50" cy="50" r="37" fill="#2A2140" />
      <path d="M34 62 Q28 48 40 42 Q50 36 60 42 Q72 48 66 60 Q62 66 50 66 Q38 66 34 62 Z"
        fill={`url(#badge-bp)`} stroke="#0B0A12" strokeWidth="3" strokeLinejoin="round" />
      <path d="M40 34 L50 24 L60 34" fill="none" stroke={LIME} strokeWidth="5" strokeLinecap="round" />
    </g>
  ));
}

/* ───────────────── ABSTRACT family (non-cartoon) ───────────────── */

// 5. Carabiner-C in gradient — evolves the existing mark
function GradCarabiner({ size = 72 }: MarkProps) {
  return wrap('cara', size, (
    <g fill="none" strokeLinecap="round">
      <path d="M72 24 A34 34 0 1 0 72 76" stroke={`url(#cara-bp)`} strokeWidth="11" />
      <path d="M72 24 L72 50" stroke={`url(#cara-bp)`} strokeWidth="11" />
      <path d="M60 28 L82 28" stroke={LIME} strokeWidth="7" />
    </g>
  ));
}

// 6. Summit chevrons — three ascending chevrons (level-up / send)
function Summit({ size = 72 }: MarkProps) {
  return wrap('sum', size, (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M26 74 L50 54 L74 74" stroke={VIOLET} strokeWidth="9" />
      <path d="M30 54 L50 38 L70 54" stroke={PINK} strokeWidth="9" />
      <path d="M36 36 L50 24 L64 36" stroke={LIME} strokeWidth="9" />
    </g>
  ));
}

// 7. Crux X — two crossing holds forming an X / crux move
function CruxX({ size = 72 }: MarkProps) {
  return wrap('x', size, (
    <g strokeLinecap="round">
      <path d="M30 30 L70 70" stroke={`url(#x-bp)`} strokeWidth="12" fill="none" />
      <path d="M70 30 L30 70" stroke={INK} strokeWidth="12" fill="none" />
      <circle cx="50" cy="50" r="7" fill={LIME} stroke={INK} strokeWidth="3" />
    </g>
  ));
}

// 8. Monogram C + up-arrow ligature
function MonoCUp({ size = 72 }: MarkProps) {
  return wrap('mono', size, (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M74 32 A32 32 0 1 0 74 68" stroke={`url(#mono-bp)`} strokeWidth="12" />
      <path d="M50 62 L50 34 M40 44 L50 32 L60 44" stroke={LIME} strokeWidth="7" />
    </g>
  ));
}

export const REFINED_LOGOS: {
  key: string;
  name: string;
  family: 'boulder' | 'abstract';
  note: string;
  Mark: (p: MarkProps) => ReactElement;
}[] = [
  { key: 'gem', name: 'Gem boulder', family: 'boulder', note: 'Faceted geometric rock in the brand gradient — clean, no cartoon face, reads at 20px.', Mark: GemBoulder },
  { key: 'cairn', name: 'Cairn', family: 'boulder', note: 'Stacked boulders (a trail cairn) topped with a lime cap — “mark the way up.” Gold mid-stone ties to the avatars.', Mark: Cairn },
  { key: 'rise', name: 'Boulder rise', family: 'boulder', note: 'Rock with a lime summit chevron launching off it — the “up/send” energy without the goofy face.', Mark: BoulderRise },
  { key: 'badge', name: 'Badge boulder', family: 'boulder', note: 'Boulder inside the gold collectible ring — same frame as the avatars, so logo + avatars finally match.', Mark: BadgeBoulder },
  { key: 'cara', name: 'Gradient carabiner-C', family: 'abstract', note: 'Evolves your existing carabiner into the gradient + lime gate. Most brand-continuous.', Mark: GradCarabiner },
  { key: 'summit', name: 'Summit chevrons', family: 'abstract', note: 'Three ascending chevrons in violet→pink→lime — literally the level-up gradient. Bold and scalable.', Mark: Summit },
  { key: 'cruxx', name: 'Crux X', family: 'abstract', note: 'Two crossing holds = the crux move, lime hold at the centre. Sharp, memorable, abstract.', Mark: CruxX },
  { key: 'mono', name: 'Mono C↑', family: 'abstract', note: 'Geometric C with an up-arrow ligature. The most restrained / “grown-up” option.', Mark: MonoCUp },
];
