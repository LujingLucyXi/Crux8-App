import {
  type AvatarConfig,
  SKIN_HEX,
  HAIR_HEX,
  BACKDROP_HEX,
} from '@/lib/avatar';
import { cn } from '@/lib/utils';

const OUTLINE = '#14161A';
const SW = 3; // stroke width in viewBox units

interface Props {
  config: AvatarConfig;
  size?: number;
  className?: string;
}

/**
 * Punk-rock layered SVG avatar. 100×100 viewBox.
 * Render order: backdrop → neck → ears → face → hair → eyes → mouth → accessory.
 */
export function PunkAvatar({ config, size = 48, className }: Props) {
  const skin = SKIN_HEX[config.skin];
  const hair = HAIR_HEX[config.hairColor];
  const bg = BACKDROP_HEX[config.backdrop];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('rounded-full shrink-0', className)}
      aria-label="avatar"
    >
      {/* Backdrop */}
      <rect width="100" height="100" fill={bg} />

      {/* Gym-wall speckle for texture */}
      <g opacity={0.13} fill="#FFFFFF">
        <circle cx="18" cy="22" r="2.2" />
        <circle cx="82" cy="34" r="1.6" />
        <circle cx="24" cy="72" r="1.8" />
        <circle cx="78" cy="80" r="2.4" />
      </g>

      {/* Neck + shoulders */}
      <path d="M38 78 L38 88 Q50 92 62 88 L62 78 Z" fill={skin} stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M22 100 Q22 86 38 84 Q50 90 62 84 Q78 86 78 100 Z" fill="#2B2F36" stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round" />

      {/* Ears */}
      <ellipse cx="26" cy="52" rx="5" ry="7" fill={skin} stroke={OUTLINE} strokeWidth={SW} />
      <ellipse cx="74" cy="52" rx="5" ry="7" fill={skin} stroke={OUTLINE} strokeWidth={SW} />

      {/* Face */}
      <rect x="28" y="28" width="44" height="52" rx="17" fill={skin} stroke={OUTLINE} strokeWidth={SW} />

      {/* Hair */}
      <Hair style={config.hair} color={hair} />

      {/* Eyes */}
      <Eyes kind={config.eyes} />

      {/* Mouth */}
      <Mouth kind={config.eyes} />

      {/* Accessory */}
      <Accessory kind={config.accessory} hairColor={hair} />
    </svg>
  );
}

/* ─────────────────────────── Hair ─────────────────────────── */

function Hair({ style, color }: { style: AvatarConfig['hair']; color: string }) {
  const s = { fill: color, stroke: OUTLINE, strokeWidth: SW, strokeLinejoin: 'round' as const };
  switch (style) {
    case 'mohawk':
      return (
        <g>
          <path d="M42 30 Q44 6 50 4 Q56 6 58 30 Z" {...s} />
          <path d="M30 40 Q30 30 40 29 L40 38 Z" fill={color} opacity={0.5} />
          <path d="M70 40 Q70 30 60 29 L60 38 Z" fill={color} opacity={0.5} />
        </g>
      );
    case 'liberty':
      return (
        <g {...s}>
          <path d="M34 32 L31 12 L41 30 Z" />
          <path d="M43 30 L44 6 L52 29 Z" />
          <path d="M53 29 L60 8 L61 30 Z" />
          <path d="M62 31 L71 15 L68 33 Z" />
        </g>
      );
    case 'shaved':
      return (
        <g>
          <path d="M28 40 Q30 22 50 22 Q70 22 72 40 L72 32 Q70 26 50 26 Q30 26 28 32 Z" {...s} />
          <path d="M28 40 Q30 24 50 24 Q70 24 72 40 L72 44 Q60 34 40 38 Q32 40 28 44 Z" {...s} />
        </g>
      );
    case 'undercut':
      return (
        <g>
          <path d="M28 42 Q28 20 50 20 Q72 20 72 42 L72 34 Q66 28 50 30 Q34 32 28 38 Z" {...s} />
          <path d="M28 38 Q34 24 50 24 Q66 24 72 34 L74 30 Q68 16 50 16 Q30 16 26 34 Z" {...s} />
        </g>
      );
    case 'bangs':
      return (
        <g>
          <path d="M26 44 Q26 20 50 20 Q74 20 74 44 L74 36 Q74 26 50 26 Q26 26 26 36 Z" {...s} />
          <path d="M26 36 L26 44 Q38 40 50 41 Q62 40 74 44 L74 36 Q62 32 50 33 Q38 32 26 36 Z" {...s} />
        </g>
      );
    case 'buzz':
      return <path d="M28 42 Q28 22 50 22 Q72 22 72 42 Q72 32 50 32 Q28 32 28 42 Z" {...s} />;
    case 'topknot':
      return (
        <g>
          <circle cx="50" cy="14" r="9" {...s} />
          <path d="M28 42 Q28 22 50 22 Q72 22 72 42 Q72 30 50 30 Q28 30 28 42 Z" {...s} />
        </g>
      );
    case 'locs':
      return (
        <g {...s}>
          <path d="M28 42 Q28 20 50 20 Q72 20 72 42 Q72 30 50 30 Q28 30 28 42 Z" />
          <rect x="24" y="36" width="6" height="26" rx="3" />
          <rect x="70" y="36" width="6" height="26" rx="3" />
          <rect x="32" y="34" width="5" height="18" rx="2.5" opacity={0.8} />
          <rect x="63" y="34" width="5" height="18" rx="2.5" opacity={0.8} />
        </g>
      );
    case 'curtain':
      return (
        <g>
          <path d="M26 46 Q26 20 50 20 Q74 20 74 46 L74 34 Q74 26 50 26 Q26 26 26 34 Z" {...s} />
          <path d="M26 34 Q30 52 34 56 Q30 40 38 32 Z" {...s} />
          <path d="M74 34 Q70 52 66 56 Q70 40 62 32 Z" {...s} />
        </g>
      );
    case 'long':
      return (
        <g>
          <path d="M22 92 Q20 46 26 34 L74 34 Q80 46 78 92 L68 92 Q72 54 66 40 L34 40 Q28 54 32 92 Z" {...s} />
          <path d="M26 42 Q26 20 50 20 Q74 20 74 42 Q74 28 50 28 Q26 28 26 42 Z" {...s} />
        </g>
      );
    case 'wavy':
      return (
        <g>
          <path d="M22 90 Q30 78 22 66 Q30 54 24 34 L76 34 Q70 54 78 66 Q70 78 78 90 L68 90 Q62 62 66 40 L34 40 Q38 62 32 90 Z" {...s} />
          <path d="M26 42 Q26 20 50 20 Q74 20 74 42 Q74 28 50 28 Q26 28 26 42 Z" {...s} />
        </g>
      );
    case 'bob':
      return (
        <g>
          <path d="M24 40 Q24 18 50 18 Q76 18 76 40 L76 62 Q76 70 68 70 Q74 52 70 38 L30 38 Q26 52 32 70 Q24 70 24 62 Z" {...s} />
          <path d="M24 40 L24 46 Q36 38 50 39 Q64 38 76 46 L76 40 Q64 32 50 33 Q36 32 24 40 Z" {...s} />
        </g>
      );
    case 'halfshave':
      return (
        <g>
          {/* long panel on the left */}
          <path d="M22 88 Q20 46 26 32 L50 32 L50 40 L34 40 Q28 56 32 88 Z" {...s} />
          <path d="M26 42 Q26 20 50 20 L50 28 Q30 28 26 42 Z" {...s} />
          {/* shaved stubble on the right */}
          <path d="M50 20 Q74 20 74 42 Q74 30 50 29 Z" fill={color} stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round" opacity={0.55} />
          <g stroke={color} strokeWidth={1.6} strokeLinecap="round" opacity={0.9}>
            <line x1="58" y1="30" x2="58" y2="35" />
            <line x1="64" y1="31" x2="64" y2="36" />
            <line x1="70" y1="34" x2="70" y2="39" />
          </g>
        </g>
      );
    case 'pigtails':
      return (
        <g>
          <path d="M26 42 Q26 20 50 20 Q74 20 74 42 Q74 28 50 28 Q26 28 26 42 Z" {...s} />
          <path d="M26 36 Q10 40 12 56 Q14 68 24 66 Q18 52 30 44 Z" {...s} />
          <path d="M74 36 Q90 40 88 56 Q86 68 76 66 Q82 52 70 44 Z" {...s} />
          <circle cx="28" cy="38" r="4" {...s} />
          <circle cx="72" cy="38" r="4" {...s} />
        </g>
      );
    case 'spacebuns':
      return (
        <g>
          <path d="M26 42 Q26 22 50 22 Q74 22 74 42 Q74 30 50 30 Q26 30 26 42 Z" {...s} />
          <circle cx="32" cy="16" r="9" {...s} />
          <circle cx="68" cy="16" r="9" {...s} />
        </g>
      );
    case 'ponytail':
      return (
        <g>
          <path d="M74 34 Q90 40 88 60 Q86 76 76 78 Q86 58 70 42 Z" {...s} />
          <path d="M26 42 Q26 20 50 20 Q74 20 74 42 Q74 28 50 28 Q26 28 26 42 Z" {...s} />
          <circle cx="73" cy="36" r="4.5" {...s} />
        </g>
      );
    case 'braids':
      return (
        <g>
          <path d="M26 42 Q26 20 50 20 Q74 20 74 42 Q74 28 50 28 Q26 28 26 42 Z" {...s} />
          <g {...s}>
            <ellipse cx="24" cy="46" rx="5" ry="6" />
            <ellipse cx="23" cy="58" rx="5" ry="6" />
            <ellipse cx="24" cy="70" rx="4.5" ry="5.5" />
            <ellipse cx="76" cy="46" rx="5" ry="6" />
            <ellipse cx="77" cy="58" rx="5" ry="6" />
            <ellipse cx="76" cy="70" rx="4.5" ry="5.5" />
          </g>
        </g>
      );
    case 'bald':
    default:
      return null;
  }
}

/* ─────────────────────────── Eyes ─────────────────────────── */

function Eyes({ kind }: { kind: AvatarConfig['eyes'] }) {
  const L = 40;
  const R = 60;
  const Y = 52;

  if (kind === 'shades') {
    return (
      <g>
        <rect x="30" y="45" width="18" height="13" rx="3" fill="#14161A" stroke={OUTLINE} strokeWidth={2} />
        <rect x="52" y="45" width="18" height="13" rx="3" fill="#14161A" stroke={OUTLINE} strokeWidth={2} />
        <path d="M48 50 L52 50" stroke={OUTLINE} strokeWidth={2.5} />
        <path d="M33 48 L38 48" stroke="#FFFFFF" strokeWidth={2} opacity={0.5} strokeLinecap="round" />
        <path d="M55 48 L60 48" stroke="#FFFFFF" strokeWidth={2} opacity={0.5} strokeLinecap="round" />
      </g>
    );
  }

  const brow = (x: number, tilt: number) => (
    <path
      d={`M${x - 7} ${Y - 10 + tilt} L${x + 7} ${Y - 12 - tilt}`}
      stroke={OUTLINE}
      strokeWidth={2.6}
      strokeLinecap="round"
    />
  );

  switch (kind) {
    case 'sharp':
      return (
        <g>
          {brow(L, -1)}
          {brow(R, 1)}
          <circle cx={L} cy={Y} r="3.4" fill={OUTLINE} />
          <circle cx={R} cy={Y} r="3.4" fill={OUTLINE} />
        </g>
      );
    case 'tired':
      return (
        <g>
          {brow(L, 2)}
          {brow(R, -2)}
          <path d={`M${L - 4} ${Y} Q${L} ${Y + 3} ${L + 4} ${Y}`} stroke={OUTLINE} strokeWidth={2.8} fill="none" strokeLinecap="round" />
          <path d={`M${R - 4} ${Y} Q${R} ${Y + 3} ${R + 4} ${Y}`} stroke={OUTLINE} strokeWidth={2.8} fill="none" strokeLinecap="round" />
        </g>
      );
    case 'wink':
      return (
        <g>
          {brow(L, -1)}
          {brow(R, 1)}
          <circle cx={L} cy={Y} r="3.4" fill={OUTLINE} />
          <path d={`M${R - 4} ${Y} L${R + 4} ${Y}`} stroke={OUTLINE} strokeWidth={3} strokeLinecap="round" />
        </g>
      );
    case 'stoked':
      return (
        <g>
          {brow(L, -3)}
          {brow(R, 3)}
          <path d={`M${L - 4} ${Y + 2} Q${L} ${Y - 4} ${L + 4} ${Y + 2}`} stroke={OUTLINE} strokeWidth={2.8} fill="none" strokeLinecap="round" />
          <path d={`M${R - 4} ${Y + 2} Q${R} ${Y - 4} ${R + 4} ${Y + 2}`} stroke={OUTLINE} strokeWidth={2.8} fill="none" strokeLinecap="round" />
        </g>
      );
    case 'deadpan':
    default:
      return (
        <g>
          {brow(L, 0)}
          {brow(R, 0)}
          <rect x={L - 4} y={Y - 1.5} width="8" height="3" rx="1.5" fill={OUTLINE} />
          <rect x={R - 4} y={Y - 1.5} width="8" height="3" rx="1.5" fill={OUTLINE} />
        </g>
      );
  }
}

/* ─────────────────────────── Mouth ─────────────────────────── */

function Mouth({ kind }: { kind: AvatarConfig['eyes'] }) {
  const Y = 68;
  if (kind === 'stoked') {
    return <path d={`M43 ${Y - 2} Q50 ${Y + 6} 57 ${Y - 2}`} stroke={OUTLINE} strokeWidth={3} fill="none" strokeLinecap="round" />;
  }
  if (kind === 'tired') {
    return <path d={`M44 ${Y + 2} Q50 ${Y - 2} 56 ${Y + 2}`} stroke={OUTLINE} strokeWidth={3} fill="none" strokeLinecap="round" />;
  }
  if (kind === 'wink') {
    return <path d={`M44 ${Y} Q50 ${Y + 5} 56 ${Y - 1}`} stroke={OUTLINE} strokeWidth={3} fill="none" strokeLinecap="round" />;
  }
  return <path d={`M44 ${Y} L56 ${Y}`} stroke={OUTLINE} strokeWidth={3} strokeLinecap="round" />;
}

/* ─────────────────────── Accessories ─────────────────────── */

function Accessory({ kind, hairColor }: { kind: AvatarConfig['accessory']; hairColor: string }) {
  switch (kind) {
    case 'nosering':
      return <circle cx="54" cy="61" r="3.2" fill="none" stroke="#C9CDD4" strokeWidth={2.2} />;
    case 'hoops':
      return (
        <g fill="none" stroke="#E8C86A" strokeWidth={2.4}>
          <ellipse cx="26" cy="60" rx="4.5" ry="6" />
          <ellipse cx="74" cy="60" rx="4.5" ry="6" />
        </g>
      );
    case 'gauges':
      return (
        <g>
          <circle cx="26" cy="54" r="3" fill="#14161A" stroke="#C9CDD4" strokeWidth={1.6} />
          <circle cx="74" cy="54" r="3" fill="#14161A" stroke="#C9CDD4" strokeWidth={1.6} />
        </g>
      );
    case 'bandana':
      return (
        <g>
          <path d="M27 38 Q50 30 73 38 L73 46 Q50 38 27 46 Z" fill="#E03A48" stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M73 42 L84 38 L80 50 Z" fill="#E03A48" stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round" />
          <g fill="#FFFFFF" opacity={0.85}>
            <circle cx="36" cy="40" r="1.6" />
            <circle cx="47" cy="37" r="1.6" />
            <circle cx="58" cy="38" r="1.6" />
            <circle cx="67" cy="41" r="1.6" />
          </g>
        </g>
      );
    case 'beanie':
      return (
        <g>
          <path d="M26 40 Q26 16 50 16 Q74 16 74 40 Z" fill="#2C7A7B" stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round" />
          <rect x="24" y="37" width="52" height="9" rx="4" fill="#3D9394" stroke={OUTLINE} strokeWidth={SW} />
          <circle cx="50" cy="13" r="5" fill={hairColor} stroke={OUTLINE} strokeWidth={SW} />
        </g>
      );
    case 'chalkdust':
      return (
        <g fill="#FFFFFF" opacity={0.75}>
          <circle cx="34" cy="70" r="2.4" />
          <circle cx="39" cy="74" r="1.6" />
          <circle cx="66" cy="69" r="2" />
          <circle cx="61" cy="74" r="1.4" />
          <circle cx="50" cy="78" r="1.8" />
        </g>
      );
    case 'none':
    default:
      return null;
  }
}
