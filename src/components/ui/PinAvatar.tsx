import { SKIN_HEX, HAIR_HEX, type AvatarConfig } from '@/lib/avatar';
import { cn } from '@/lib/utils';

/**
 * CruxMate enamel-pin avatar. Deterministic from an AvatarConfig — a collectible
 * gold-rimmed pin: colored enamel backdrop, skin-tone face, metal line-work,
 * gloss shine, and a climbing-flair star. Reads down to ~24px.
 */

const GOLD = '#C99A38';
const LINE = '#6E5019';

const ENAMEL_BG: Record<AvatarConfig['backdrop'], string> = {
  ink: '#5C6EA6',
  teal: '#2FA89A',
  gold: '#EDBB4A',
  coral: '#F27E86',
  sky: '#8FB6E4',
  slate: '#7E88A0',
};

function mix(h1: string, h2: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = p(h1);
  const [r2, g2, b2] = p(h2);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}

interface Props {
  config: AvatarConfig;
  size?: number;
  className?: string;
}

export function PinAvatar({ config, size = 48, className }: Props) {
  const skin = SKIN_HEX[config.skin];
  const hair = HAIR_HEX[config.hairColor];
  const enamel = ENAMEL_BG[config.backdrop];
  const uid = `${config.skin}-${config.hairColor}-${config.backdrop}-${config.hair}-${config.eyes}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn('rounded-full shrink-0', className)}
      aria-label="avatar"
    >
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

      {/* neck + collar */}
      <path d="M42 74 L42 84 Q50 88 58 84 L58 74 Z" fill={skin} stroke={LINE} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M30 92 Q30 82 42 81 Q50 87 58 81 Q70 82 70 92 Z" fill={mix(enamel, '#000000', 0.2)} stroke={LINE} strokeWidth="1.4" strokeLinejoin="round" />

      {/* ears */}
      <ellipse cx="30" cy="52" rx="3.4" ry="4.6" fill={skin} stroke={LINE} strokeWidth="1.3" />
      <ellipse cx="70" cy="52" rx="3.4" ry="4.6" fill={skin} stroke={LINE} strokeWidth="1.3" />

      {/* face */}
      <path d="M31 46 Q31 30 50 29 Q69 30 69 46 Q69 62 59 73 Q50 80 41 73 Q31 62 31 46 Z" fill={skin} stroke={LINE} strokeWidth="1.6" strokeLinejoin="round" />

      {/* blush */}
      <ellipse cx="38" cy="60" rx="3.4" ry="2" fill="#FF8AA8" opacity="0.45" />
      <ellipse cx="62" cy="60" rx="3.4" ry="2" fill="#FF8AA8" opacity="0.45" />

      <PinHair style={config.hair} hair={hair} />
      <PinFace kind={config.eyes} />

      {/* gloss + flair star */}
      <path d="M28 32 Q42 22 58 26" stroke="#FFFFFF" strokeWidth="3.4" opacity="0.45" fill="none" strokeLinecap="round" />
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
