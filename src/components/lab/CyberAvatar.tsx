import { SKIN_HEX, type AvatarConfig } from '@/lib/avatar';

/**
 * THROWAWAY cyberpunk avatar mock for /lab — v2: eclectic dual-tone neon
 * palettes + polish (glow, gradients, refined face/visor/augments). Renders the
 * SAME AvatarConfig the live punk avatar uses, so a real build is a renderer swap.
 */

const OUTLINE = '#3B2130';
const SW = 3;

/** Eclectic WARM dual-neon palettes + a COOL accent for cyberpunk edge. */
const PALETTES: { a: string; b: string; cool: string; base: string; base2: string }[] = [
  { a: '#FF7A5C', b: '#FFC24B', cool: '#3BE0FF', base: '#FFE7D4', base2: '#FFB79E' }, // coral / gold / cyan
  { a: '#FF6FA5', b: '#FFB37A', cool: '#6AA8FF', base: '#FFE1EA', base2: '#FFC2D2' }, // pink / peach / blue
  { a: '#FFD23D', b: '#FF6F91', cool: '#35D6C0', base: '#FFF1D2', base2: '#FFD8C2' }, // sunny / rose / teal
  { a: '#B57BFF', b: '#FF7FB0', cool: '#5BE0FF', base: '#F1E5FF', base2: '#FFD9EC' }, // violet / pink / cyan
  { a: '#FF8A3D', b: '#FF5D8F', cool: '#4FB8FF', base: '#FFE7D8', base2: '#FFC9B2' }, // tangerine / rose / sky
  { a: '#8FD94C', b: '#FF7A5C', cool: '#35C9FF', base: '#F0F7D6', base2: '#FFD9C6' }, // lime / coral / cyan
  { a: '#FF5FB0', b: '#FFC24B', cool: '#5BD6FF', base: '#FFE2EE', base2: '#FFD4B2' }, // magenta / gold / cyan
  { a: '#37D6C0', b: '#FF8A5C', cool: '#3B9DFF', base: '#DEF6EF', base2: '#FFD9C6' }, // aqua / coral / blue
];

/** Several face silhouettes (mostly rounder) — a real build makes this a picker. */
const FACE_SHAPES: string[] = [
  // round & full
  'M27 46 Q27 27 50 26 Q73 27 73 46 Q73 65 62 74 Q50 80 38 74 Q27 65 27 46 Z',
  // soft round-chin
  'M28 45 Q28 27 50 26 Q72 27 72 45 Q72 61 60 73 Q50 79 40 73 Q28 61 28 45 Z',
  // soft square / strong jaw
  'M30 44 Q30 28 50 27 Q70 28 70 44 L70 60 Q70 71 60 74 L40 74 Q30 71 30 60 Z',
  // oval taper (original)
  'M32 42 Q32 28 50 27 Q68 28 68 42 L68 56 Q68 72 50 79 Q32 72 32 56 Z',
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function CyberAvatar({ config, size = 64 }: { config: AvatarConfig; size?: number }) {
  const skin = SKIN_HEX[config.skin];
  const pal = PALETTES[hash(config.backdrop + config.hairColor + config.hair) % PALETTES.length];
  const { a, b, cool, base, base2 } = pal;
  const face = FACE_SHAPES[hash(config.skin + config.hair) % FACE_SHAPES.length];
  const uid = `${config.backdrop}-${config.hairColor}-${config.eyes}`;
  const bgId = `cbg-${uid}`;
  const skinId = `csk-${uid}`;
  const hairId = `chr-${uid}`;
  const glow = `cgl-${uid}`;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="rounded-full shrink-0" aria-label="cyber avatar">
      <defs>
        <radialGradient id={bgId} cx="50%" cy="32%" r="85%">
          <stop offset="0%" stopColor={mix(a, '#FFFFFF', 0.35)} />
          <stop offset="50%" stopColor={base} />
          <stop offset="100%" stopColor={base2} />
        </radialGradient>
        <linearGradient id={skinId} x1="30" y1="26" x2="70" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={mix(skin, '#FFFFFF', 0.18)} />
          <stop offset="60%" stopColor={skin} />
          <stop offset="100%" stopColor={mix(skin, '#000000', 0.32)} />
        </linearGradient>
        <linearGradient id={hairId} x1="30" y1="6" x2="70" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={a} />
          <stop offset="100%" stopColor={b} />
        </linearGradient>
        <filter id={glow} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.1" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Warm sunny backdrop + soft scanlines + glow motes */}
      <rect width="100" height="100" fill={`url(#${bgId})`} />
      <circle cx="50" cy="30" r="26" fill="#FFFFFF" opacity="0.22" />
      <g stroke="#7A4A38" strokeWidth="0.5" opacity="0.05">
        {[16, 28, 40, 52, 64, 76, 88].map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} />
        ))}
      </g>
      {/* subtle cool HUD halo ring behind the head */}
      <g filter={`url(#${glow})`}>
        <circle cx="50" cy="47" r="34" fill="none" stroke={cool} strokeWidth="0.9" strokeDasharray="2 5" opacity="0.4" />
      </g>

      {/* Neck + chrome collar */}
      <path d="M40 76 L40 86 Q50 90 60 86 L60 76 Z" fill={`url(#${skinId})`} stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M22 100 Q22 84 40 82 Q50 89 60 82 Q78 84 78 100 Z" fill="#3A2E3F" stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round" />
      <g filter={`url(#${glow})`}>
        <path d="M30 91 L70 91" stroke={cool} strokeWidth="1.8" />
        <circle cx="50" cy="91" r="1.8" fill={a} />
      </g>

      {/* Ears */}
      <ellipse cx="27" cy="52" rx="4.5" ry="6.5" fill={`url(#${skinId})`} stroke={OUTLINE} strokeWidth={SW} />
      <ellipse cx="73" cy="52" rx="4.5" ry="6.5" fill={`url(#${skinId})`} stroke={OUTLINE} strokeWidth={SW} />

      {/* Face — one of several silhouettes */}
      <path
        d={face}
        fill={`url(#${skinId})`}
        stroke={OUTLINE}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      {/* cheekbone highlight + jaw shadow */}
      <path d="M37 46 Q40 44 43 46" stroke="#FFFFFF" strokeWidth="2" opacity="0.16" fill="none" strokeLinecap="round" />
      <path d="M40 70 Q50 76 60 70" stroke="#000000" strokeWidth="3" opacity="0.12" fill="none" strokeLinecap="round" />
      {/* two-tone neon rim: warm left, cool right + cool underlight */}
      <g filter={`url(#${glow})`}>
        <path d="M33 44 Q31 58 36 70" fill="none" stroke={a} strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
        <path d="M67 44 Q69 57 64 69" fill="none" stroke={cool} strokeWidth="2" strokeLinecap="round" opacity="0.85" />
        <path d="M39 74 Q50 79 61 74" fill="none" stroke={cool} strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
      </g>

      {/* soft blush */}
      <ellipse cx="38" cy="63" rx="3.8" ry="2.3" fill="#FF7AA0" opacity="0.26" />
      <ellipse cx="61" cy="64" rx="3.4" ry="2.1" fill="#FF7AA0" opacity="0.2" />

      {/* Cyber face-plate on right cheek */}
      <g>
        <path d="M60 48 L69 49 L69 64 L61 66 Z" fill="#3A2E3F" stroke={OUTLINE} strokeWidth="1.6" strokeLinejoin="round" opacity="0.92" />
        <path d="M62 53 L67 53 M62 58 L67 58" stroke={b} strokeWidth="1.1" opacity="0.85" />
        <circle cx="65" cy="62" r="1.6" fill={a} filter={`url(#${glow})`} />
      </g>

      <Hair style={config.hair} fill={`url(#${hairId})`} a={a} glow={glow} />
      <Eyes kind={config.eyes} a={a} b={b} glow={glow} />
      <Mouth kind={config.eyes} />
      <CyberAccessory kind={config.accessory} a={a} b={b} glow={glow} />
    </svg>
  );
}

/* Hair bucketed into 4 cyber silhouettes, gradient-filled with a highlight. */
function Hair({ style, fill, a, glow }: { style: AvatarConfig['hair']; fill: string; a: string; glow: string }) {
  const s = { fill, stroke: OUTLINE, strokeWidth: SW, strokeLinejoin: 'round' as const };
  const spikes = ['mohawk', 'liberty', 'undercut', 'shaved'];
  const pods = ['topknot', 'spacebuns', 'ponytail', 'pigtails', 'buzz'];
  const bald = ['bald', 'locs'];
  if (spikes.includes(style)) {
    return (
      <g>
        <g {...s}>
          <path d="M35 32 L33 11 L43 30 Z" />
          <path d="M45 30 L47 5 L54 29 Z" />
          <path d="M55 29 L63 8 L61 31 Z" />
          <path d="M63 31 L72 15 L68 33 Z" />
        </g>
        <path d="M47 24 L48 10" stroke="#FFFFFF" strokeWidth="1" opacity="0.4" filter={`url(#${glow})`} />
        <g filter={`url(#${glow})`} fill="#FFFFFF">
          <circle cx="33" cy="11" r="1" opacity="0.85" />
          <circle cx="47" cy="5" r="1.1" opacity="0.95" />
          <circle cx="63" cy="8" r="1" opacity="0.9" />
          <circle cx="72" cy="15" r="0.9" opacity="0.8" />
        </g>
      </g>
    );
  }
  if (pods.includes(style)) {
    return (
      <g>
        <g {...s}>
          <path d="M30 34 Q30 19 50 18 Q70 19 70 34 Q50 27 30 34 Z" />
          <circle cx="33" cy="19" r="5.5" />
          <circle cx="67" cy="19" r="5.5" />
        </g>
        <g filter={`url(#${glow})`} fill={a}>
          <circle cx="33" cy="19" r="1.6" />
          <circle cx="67" cy="19" r="1.6" />
        </g>
      </g>
    );
  }
  if (bald.includes(style)) {
    return (
      <g>
        <path d="M31 41 Q31 21 50 20 Q69 21 69 41 Q50 30 31 41 Z" fill="#4A3E52" stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round" />
        <g filter={`url(#${glow})`}>
          <path d="M50 22 L50 39" stroke={a} strokeWidth="1.4" opacity="0.9" />
          <circle cx="50" cy="26" r="1.5" fill={a} />
        </g>
      </g>
    );
  }
  // sleek helmet-bob
  return (
    <g>
      <g {...s}>
        <path d="M28 47 Q26 21 50 19 Q74 21 72 47 L72 40 Q72 29 50 28 Q28 29 28 40 Z" />
        <path d="M28 40 Q28 62 31 71 L37 71 Q34 52 34 40 Z" />
        <path d="M72 40 Q72 62 69 71 L63 71 Q66 52 66 40 Z" />
      </g>
      <path d="M40 24 Q50 21 60 24" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.35" fill="none" filter={`url(#${glow})`} />
    </g>
  );
}

/**
 * Eyes — a mix of CYBER (kept "creepy" glow) and HUMAN variants:
 *   shades  → full HUD visor bar        (cyber)
 *   deadpan → glowing round cyber-eyes  (cyber)
 *   sharp   → open human almond eyes
 *   tired   → half-lidded human eyes
 *   stoked  → happy curved (^^) eyes
 *   wink    → human wink
 */
function Eyes({ kind, a, b, glow }: { kind: AvatarConfig['eyes']; a: string; b: string; glow: string }) {
  // ── cyber ──
  if (kind === 'shades') {
    return (
      <g>
        <rect x="29" y="46" width="42" height="11" rx="5.5" fill="#241826" stroke={OUTLINE} strokeWidth={SW} />
        <g filter={`url(#${glow})`}>
          <rect x="32" y="49.5" width="36" height="4" rx="2" fill={a} />
          <rect x="32" y="49.5" width="13" height="4" rx="2" fill="#FFFFFF" opacity="0.9" />
        </g>
        {[38, 46, 54, 62].map((x) => (
          <line key={x} x1={x} y1="47.5" x2={x} y2="49" stroke={b} strokeWidth="0.8" opacity="0.8" />
        ))}
      </g>
    );
  }
  if (kind === 'deadpan') {
    return (
      <g>
        {[41, 59].map((cx, i) => (
          <g key={cx}>
            <circle cx={cx} cy="51" r="5" fill="#241826" stroke={OUTLINE} strokeWidth="2" />
            <g filter={`url(#${glow})`}>
              <circle cx={cx} cy="51" r="2.6" fill={i === 0 ? a : b} />
            </g>
            <circle cx={cx - 1.2} cy="49.6" r="0.9" fill="#FFFFFF" />
          </g>
        ))}
      </g>
    );
  }

  // ── human (simplified black dot + dash, like the original avatars) ──
  const L = 41;
  const R = 59;
  const Y = 51;
  const brow = (x: number, tilt: number) => (
    <path d={`M${x - 6} ${Y - 9 + tilt} L${x + 6} ${Y - 11 - tilt}`} stroke={OUTLINE} strokeWidth="2.4" strokeLinecap="round" />
  );
  const dot = (x: number) => <circle cx={x} cy={Y} r="3.2" fill={OUTLINE} />;

  if (kind === 'stoked') {
    // happy ^ curved eyes
    return (
      <g>
        {brow(L, -3)}
        {brow(R, 3)}
        <path d={`M${L - 4} ${Y + 2} Q${L} ${Y - 4} ${L + 4} ${Y + 2}`} stroke={OUTLINE} strokeWidth="2.8" fill="none" strokeLinecap="round" />
        <path d={`M${R - 4} ${Y + 2} Q${R} ${Y - 4} ${R + 4} ${Y + 2}`} stroke={OUTLINE} strokeWidth="2.8" fill="none" strokeLinecap="round" />
      </g>
    );
  }
  if (kind === 'tired') {
    return (
      <g>
        {brow(L, 2)}
        {brow(R, -2)}
        <path d={`M${L - 4} ${Y} Q${L} ${Y + 3} ${L + 4} ${Y}`} stroke={OUTLINE} strokeWidth="2.8" fill="none" strokeLinecap="round" />
        <path d={`M${R - 4} ${Y} Q${R} ${Y + 3} ${R + 4} ${Y}`} stroke={OUTLINE} strokeWidth="2.8" fill="none" strokeLinecap="round" />
      </g>
    );
  }
  if (kind === 'wink') {
    return (
      <g>
        {brow(L, -1)}
        {brow(R, 1)}
        {dot(L)}
        <path d={`M${R - 4} ${Y} L${R + 4} ${Y}`} stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
      </g>
    );
  }
  // sharp / default — two black dots
  return (
    <g>
      {brow(L, -1)}
      {brow(R, 1)}
      {dot(L)}
      {dot(R)}
    </g>
  );
}

/* Simple single-stroke mouth, matching the original avatars. */
function Mouth({ kind }: { kind: AvatarConfig['eyes'] }) {
  const s = { stroke: OUTLINE, strokeWidth: 3, fill: 'none' as const, strokeLinecap: 'round' as const };
  if (kind === 'stoked') return <path d="M42 65 Q50 73 58 65" {...s} />;
  if (kind === 'tired') return <path d="M44 69 Q50 66 56 69" {...s} />;
  if (kind === 'wink') return <path d="M44 67 Q50 71 56 66" {...s} />;
  return <path d="M44 67 Q50 71 56 67" {...s} />;
}

function CyberAccessory({ kind, a, b, glow }: { kind: AvatarConfig['accessory']; a: string; b: string; glow: string }) {
  switch (kind) {
    case 'nosering':
      return <path d="M46 62 Q50 66 54 62" fill="none" stroke={a} strokeWidth="2" strokeLinecap="round" filter={`url(#${glow})`} />;
    case 'gauges':
      return (
        <g filter={`url(#${glow})`} fill={a}>
          <circle cx="27" cy="52" r="2" />
          <circle cx="73" cy="52" r="2" />
        </g>
      );
    case 'hoops':
      return (
        <g fill="none" stroke={a} strokeWidth="1.8" filter={`url(#${glow})`}>
          <circle cx="27" cy="58" r="3" />
          <circle cx="73" cy="58" r="3" />
        </g>
      );
    case 'bandana': // respirator
      return (
        <g>
          <path d="M35 63 Q50 59 65 63 L63 76 Q50 82 37 76 Z" fill="#3A2E3F" stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M42 67 L58 67 M43 71 L57 71" stroke="#6A5A6E" strokeWidth="1.2" />
          <g filter={`url(#${glow})`} fill={a}>
            <circle cx="43" cy="73" r="2" />
            <circle cx="57" cy="73" r="2" fill={b} />
          </g>
        </g>
      );
    case 'beanie':
      return (
        <g>
          <path d="M29 41 Q29 20 50 19 Q71 20 71 41 Q50 31 29 41 Z" fill="#4A3A52" stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M34 30 L66 30" stroke={a} strokeWidth="1.6" opacity="0.85" filter={`url(#${glow})`} />
        </g>
      );
    case 'chalkdust': // data motes
      return (
        <g filter={`url(#${glow})`}>
          <rect x="22" y="30" width="2.4" height="2.4" fill={a} />
          <rect x="77" y="42" width="2" height="2" fill={b} />
          <rect x="20" y="60" width="2" height="2" fill={a} />
          <rect x="80" y="58" width="1.8" height="1.8" fill={b} />
        </g>
      );
    default:
      return null;
  }
}

/** Blend two hex colors by t (0..1). */
function mix(hex1: string, hex2: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = p(hex1);
  const [r2, g2, b2] = p(hex2);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}
