import type { ReactElement } from 'react';
import { SKIN_HEX, HAIR_HEX, type AvatarConfig } from '@/lib/avatar';

/**
 * THROWAWAY single-sample style explorations for /lab (one avatar each):
 * pixel, enamel-pin, low-poly, risograph, vaporwave. Same AvatarConfig.
 */

function mix(h1: string, h2: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = p(h1);
  const [r2, g2, b2] = p(h2);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}

/* ── 1. Pixel / 8-bit ── */
export function PixelAvatar({ config, size = 72 }: { config: AvatarConfig; size?: number }) {
  const skin = SKIN_HEX[config.skin];
  const hair = HAIR_HEX[config.hairColor];
  const bg = mix(hair, '#FFFFFF', 0.8);
  const shirt = mix(hair, '#1B1533', 0.35);
  const px = (x: number, y: number, w: number, h: number, fill: string, o = 1) => (
    <rect x={x} y={y} width={w} height={h} fill={fill} opacity={o} />
  );
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" className="rounded-full shrink-0">
      {px(0, 0, 16, 16, bg)}
      {px(6, 12, 4, 1, skin)}
      {px(3, 13, 10, 3, shirt)}
      {px(4, 4, 8, 8, skin)}
      {px(4, 2, 8, 2, hair)}
      {px(3, 3, 1, 5, hair)}
      {px(12, 3, 1, 5, hair)}
      {px(4, 4, 8, 1, hair)}
      {px(6, 6, 1, 2, '#241826')}
      {px(9, 6, 1, 2, '#241826')}
      {px(5, 8, 1, 1, '#FF7AA0', 0.7)}
      {px(10, 8, 1, 1, '#FF7AA0', 0.7)}
      {px(7, 9, 2, 1, '#7A3B4A')}
    </svg>
  );
}

/* ── 2. Enamel pin / patch ── */
const ENAMEL_BG: Record<AvatarConfig['backdrop'], string> = {
  ink: '#5C6EA6',
  teal: '#2FA89A',
  gold: '#EDBB4A',
  coral: '#F27E86',
  sky: '#8FB6E4',
  slate: '#7E88A0',
};
const GOLD = '#C99A38';
const LINE = '#6E5019';

export function PinAvatar({ config, size = 72 }: { config: AvatarConfig; size?: number }) {
  const skin = SKIN_HEX[config.skin];
  const hair = HAIR_HEX[config.hairColor];
  const enamel = ENAMEL_BG[config.backdrop];
  const uid = `${config.skin}-${config.hairColor}-${config.backdrop}-${config.hair}-${config.eyes}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="rounded-full shrink-0" aria-label="pin avatar">
      <defs>
        <linearGradient id={`pm-${uid}`} x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCE79A" />
          <stop offset="48%" stopColor="#E7B646" />
          <stop offset="100%" stopColor="#A9791F" />
        </linearGradient>
      </defs>

      {/* metal rim + bevel */}
      <circle cx="50" cy="50" r="49" fill={`url(#pm-${uid})`} />
      <circle cx="50" cy="50" r="43.5" fill="none" stroke="#8A6416" strokeWidth="1.2" opacity="0.6" />
      {/* enamel background field */}
      <circle cx="50" cy="50" r="42.5" fill={enamel} />

      {/* neck + collar enamel */}
      <path d="M42 74 L42 84 Q50 88 58 84 L58 74 Z" fill={skin} stroke={LINE} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M30 92 Q30 82 42 81 Q50 87 58 81 Q70 82 70 92 Z" fill={mix(enamel, '#000000', 0.2)} stroke={LINE} strokeWidth="1.4" strokeLinejoin="round" />

      {/* ears */}
      <ellipse cx="30" cy="52" rx="3.4" ry="4.6" fill={skin} stroke={LINE} strokeWidth="1.3" />
      <ellipse cx="70" cy="52" rx="3.4" ry="4.6" fill={skin} stroke={LINE} strokeWidth="1.3" />

      {/* face enamel */}
      <path d="M31 46 Q31 30 50 29 Q69 30 69 46 Q69 62 59 73 Q50 80 41 73 Q31 62 31 46 Z" fill={skin} stroke={LINE} strokeWidth="1.6" strokeLinejoin="round" />

      {/* blush */}
      <ellipse cx="38" cy="60" rx="3.4" ry="2" fill="#FF8AA8" opacity="0.45" />
      <ellipse cx="62" cy="60" rx="3.4" ry="2" fill="#FF8AA8" opacity="0.45" />

      <PinHair style={config.hair} hair={hair} />
      <PinFace kind={config.eyes} />

      {/* glossy enamel shine */}
      <path d="M28 32 Q42 22 58 26" stroke="#FFFFFF" strokeWidth="3.4" opacity="0.45" fill="none" strokeLinecap="round" />
      {/* climbing-flair star */}
      <path d="M50 82 L51.6 85.4 L55.3 85.9 L52.6 88.5 L53.3 92.2 L50 90.4 L46.7 92.2 L47.4 88.5 L44.7 85.9 L48.4 85.4 Z" fill="#FCE79A" stroke="#8A6416" strokeWidth="0.8" strokeLinejoin="round" />
    </svg>
  );
}

function PinHair({ style, hair }: { style: AvatarConfig['hair']; hair: string }) {
  const s = { fill: hair, stroke: GOLD, strokeWidth: 1.6, strokeLinejoin: 'round' as const };
  const spikes = ['mohawk', 'liberty', 'undercut', 'shaved'].includes(style);
  const pods = ['topknot', 'spacebuns', 'ponytail', 'pigtails', 'buzz'].includes(style);
  const bald = ['bald', 'locs'].includes(style);
  if (spikes) {
    return <path d="M30 46 Q30 30 50 24 Q70 30 70 46 L65 35 L60 44 L54 32 L50 44 L46 32 L40 44 L35 35 Z" {...s} />;
  }
  if (pods) {
    return (
      <g {...s}>
        <path d="M31 44 Q31 30 50 27 Q69 30 69 44 Q60 37 50 37 Q40 37 31 44 Z" />
        <circle cx="50" cy="22" r="7" />
      </g>
    );
  }
  if (bald) {
    return <path d="M33 43 Q35 32 50 31 Q65 32 67 43 Q59 37 50 37 Q41 37 33 43 Z" {...s} />;
  }
  // bob / long framing hair
  return (
    <path d="M28 48 Q26 27 50 25 Q74 27 72 48 L72 62 Q72 68 66 70 L63 54 Q65 41 50 40 Q35 41 37 54 L34 70 Q28 68 28 62 Z" {...s} />
  );
}

function PinFace({ kind }: { kind: AvatarConfig['eyes'] }) {
  const L = 41;
  const R = 59;
  const Y = 52;
  const dot = (x: number) => <circle cx={x} cy={Y} r="2.4" fill={LINE} />;
  if (kind === 'shades' || kind === 'deadpan') {
    return (
      <g>
        <rect x="35" y="48" width="12" height="7" rx="2" fill={LINE} />
        <rect x="53" y="48" width="12" height="7" rx="2" fill={LINE} />
        <path d="M47 50 L53 50" stroke={LINE} strokeWidth="1.6" />
        <path d="M43 62 Q50 66 57 62" stroke={LINE} strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
    );
  }
  const brow = (x: number, t: number) => (
    <path d={`M${x - 5} ${Y - 8 + t} Q ${x} ${Y - 10} ${x + 5} ${Y - 8 - t}`} stroke={LINE} strokeWidth="1.6" fill="none" strokeLinecap="round" />
  );
  if (kind === 'stoked') {
    return (
      <g stroke={LINE} strokeWidth="2" fill="none" strokeLinecap="round">
        <path d={`M${L - 4} ${Y + 1} Q ${L} ${Y - 4} ${L + 4} ${Y + 1}`} />
        <path d={`M${R - 4} ${Y + 1} Q ${R} ${Y - 4} ${R + 4} ${Y + 1}`} />
        <path d="M44 63 Q50 68 56 63" />
      </g>
    );
  }
  if (kind === 'wink') {
    return (
      <g>
        {brow(L, -1)}
        {brow(R, 1)}
        {dot(L)}
        <path d={`M${R - 4} ${Y} L${R + 4} ${Y}`} stroke={LINE} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M44 62 Q50 66 56 62" stroke={LINE} strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g>
      {brow(L, -1)}
      {brow(R, 1)}
      {dot(L)}
      {dot(R)}
      <path d="M44 62 Q50 66 56 62" stroke={LINE} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  );
}

/* ── 3. Low-poly / geometric ── */
export function LowPolyAvatar({ config, size = 72 }: { config: AvatarConfig; size?: number }) {
  const skin = SKIN_HEX[config.skin];
  const hair = HAIR_HEX[config.hairColor];
  const dark = mix(skin, '#000000', 0.28);
  const light = mix(skin, '#FFFFFF', 0.22);
  const hairD = mix(hair, '#000000', 0.25);
  const uid = `${config.skin}-${config.hairColor}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="rounded-full shrink-0" aria-label="low-poly avatar">
      <defs>
        <linearGradient id={`lp-bg-${uid}`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={mix(hair, '#1B1533', 0.2)} />
          <stop offset="100%" stopColor="#141024" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#lp-bg-${uid})`} />
      {/* shoulders */}
      <polygon points="24,100 40,80 60,80 76,100" fill={hairD} />
      {/* base face (angular) */}
      <polygon points="50,22 66,30 70,48 62,66 50,78 38,66 30,48 34,30" fill={skin} />
      {/* facets */}
      <polygon points="66,30 70,48 50,44" fill={dark} opacity="0.45" />
      <polygon points="70,48 62,66 50,50" fill={dark} opacity="0.35" />
      <polygon points="34,30 30,48 50,44" fill={light} opacity="0.5" />
      <polygon points="50,78 38,66 50,58" fill={dark} opacity="0.3" />
      {/* hair shards */}
      <g fill={hair}>
        <polygon points="34,30 50,20 66,30 62,38 50,30 38,38" />
        <polygon points="30,48 34,30 38,38 34,46" />
        <polygon points="70,48 66,30 62,38 66,46" />
      </g>
      <polygon points="50,20 66,30 56,30" fill={hairD} opacity="0.6" />
      {/* eyes + mouth (angular) */}
      <polygon points="40,48 45,49 42,52" fill="#0E0A1C" />
      <polygon points="60,48 55,49 58,52" fill="#0E0A1C" />
      <path d="M44 62 L56 62" stroke="#0E0A1C" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/* ── 4. Risograph / two-tone print ── */
export function RisoAvatar({ config, size = 72 }: { config: AvatarConfig; size?: number }) {
  const uid = `${config.skin}-${config.hairColor}-${config.hair}`;
  const inkA = '#2E4BFF'; // blue
  const inkB = '#FF4D8D'; // pink
  const head = 'M31 46 Q31 29 50 28 Q69 29 69 46 Q69 63 59 74 Q50 81 41 74 Q31 63 31 46 Z';
  const hair = 'M28 48 Q24 24 50 22 Q76 24 72 48 Q66 36 50 35 Q34 36 28 48 Z';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="rounded-full shrink-0" aria-label="riso avatar">
      <defs>
        <filter id={`riso-grain-${uid}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0" />
        </filter>
      </defs>
      <rect width="100" height="100" fill="#F4EFE2" />
      {/* two mis-registered ink layers */}
      <g style={{ mixBlendMode: 'multiply' }} opacity="0.85">
        <path d={head} fill={inkA} />
        <path d={hair} fill={inkA} />
      </g>
      <g style={{ mixBlendMode: 'multiply' }} opacity="0.8" transform="translate(2.6 -2)">
        <path d={head} fill={inkB} />
        <path d={hair} fill={inkB} />
      </g>
      {/* features */}
      <g stroke="#1A1730" strokeWidth="2" strokeLinecap="round" fill="#1A1730">
        <circle cx="41" cy="51" r="2" stroke="none" />
        <circle cx="59" cy="51" r="2" stroke="none" />
        <path d="M44 63 Q50 67 56 63" fill="none" />
      </g>
      {/* grain overlay */}
      <rect width="100" height="100" filter={`url(#riso-grain-${uid})`} opacity="0.14" style={{ mixBlendMode: 'multiply' }} />
    </svg>
  );
}

/* ── 5. Vaporwave / synthwave ── */
export function VaporAvatar({ config, size = 72 }: { config: AvatarConfig; size?: number }) {
  const skin = SKIN_HEX[config.skin];
  const hair = HAIR_HEX[config.hairColor];
  const uid = `${config.skin}-${config.hairColor}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="rounded-full shrink-0" aria-label="vaporwave avatar">
      <defs>
        <linearGradient id={`vw-sky-${uid}`} x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B1F6E" />
          <stop offset="55%" stopColor="#B5379B" />
          <stop offset="100%" stopColor="#FF9E7D" />
        </linearGradient>
        <linearGradient id={`vw-sun-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE45E" />
          <stop offset="100%" stopColor="#FF4D8D" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#vw-sky-${uid})`} />
      {/* retro sun */}
      <circle cx="50" cy="46" r="30" fill={`url(#vw-sun-${uid})`} />
      <g stroke="#3B1F6E" strokeWidth="2.4">
        <line x1="20" y1="52" x2="80" y2="52" />
        <line x1="20" y1="58" x2="80" y2="58" />
        <line x1="20" y1="64" x2="80" y2="64" />
      </g>
      {/* neon perspective grid */}
      <g stroke="#35E0E0" strokeWidth="1" opacity="0.85">
        <line x1="0" y1="82" x2="100" y2="82" />
        <line x1="0" y1="92" x2="100" y2="92" />
        <line x1="50" y1="78" x2="20" y2="100" />
        <line x1="50" y1="78" x2="80" y2="100" />
        <line x1="50" y1="78" x2="50" y2="100" />
      </g>
      {/* face with neon rim */}
      <path d="M34 44 Q34 30 50 29 Q66 30 66 44 Q66 58 58 68 Q50 75 42 68 Q34 58 34 44 Z" fill={skin} stroke="#FF4D8D" strokeWidth="2" strokeLinejoin="round" />
      <path d="M32 40 Q32 26 50 25 Q68 26 68 40 Q62 32 50 32 Q38 32 32 40 Z" fill={hair} stroke="#35E0E0" strokeWidth="1.5" strokeLinejoin="round" />
      {/* synth shades */}
      <g>
        <rect x="37" y="45" width="11" height="7" rx="1.5" fill="#1A1030" stroke="#35E0E0" strokeWidth="1.4" />
        <rect x="52" y="45" width="11" height="7" rx="1.5" fill="#1A1030" stroke="#FF4D8D" strokeWidth="1.4" />
        <line x1="48" y1="47" x2="52" y2="47" stroke="#35E0E0" strokeWidth="1.4" />
      </g>
      <path d="M44 62 Q50 65 56 62" stroke="#3B1F6E" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export const MORE_STYLES: { key: string; name: string; note: string; Render: (p: { config: AvatarConfig; size?: number }) => ReactElement }[] = [
  { key: 'pixel', name: 'Pixel / 8-bit', note: 'Retro-game; reinforces XP/levels.', Render: PixelAvatar },
  { key: 'pin', name: 'Enamel pin', note: 'Gear-culture, collectible / badges.', Render: PinAvatar },
  { key: 'lowpoly', name: 'Low-poly', note: 'Techy, matches electric brand.', Render: LowPolyAvatar },
  { key: 'riso', name: 'Risograph', note: 'Two-tone print, grain, artsy.', Render: RisoAvatar },
  { key: 'vapor', name: 'Vaporwave', note: 'Neon sunset + grid, retro-80s.', Render: VaporAvatar },
];
