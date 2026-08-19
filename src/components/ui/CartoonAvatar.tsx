import { SKIN_HEX, HAIR_HEX, type AvatarConfig } from '@/lib/avatar';
import { cn } from '@/lib/utils';

/**
 * Production avatar — flat, bold-outline CARTOON face (same language as the
 * Go-Crux boulder mascot) inside a gold collectible ring. Reads the shared
 * AvatarConfig, so it's a drop-in behind <Avatar>. Deterministic, no network.
 */
const OUTLINE = '#2A2140';
const SW = 3.5;

function hairBucket(hair: string): 'spikes' | 'bob' | 'bun' | 'buzz' | 'long' | 'bald' {
  if (['bald', 'buzz'].includes(hair)) return hair as 'bald' | 'buzz';
  if (['mohawk', 'liberty', 'spikes', 'shaved', 'undercut'].includes(hair)) return 'spikes';
  if (['topknot', 'bun', 'spacebuns', 'ponytail'].includes(hair)) return 'bun';
  if (['long', 'wavy', 'braids', 'pigtails', 'curtains'].includes(hair)) return 'long';
  return 'bob';
}

const BACKDROP_HEX: Record<string, string> = {
  ink: '#FDE9C8',
  teal: '#CFF3EA',
  gold: '#FFE6A8',
  coral: '#FFD9D2',
  sky: '#D8E6FF',
  slate: '#EAE4FF',
};

export function CartoonAvatar({
  config,
  size = 72,
  className,
}: {
  config: AvatarConfig;
  size?: number;
  className?: string;
}) {
  const skin = SKIN_HEX[config.skin];
  const hairCol = HAIR_HEX[config.hairColor];
  const bg = BACKDROP_HEX[config.backdrop] ?? '#FDE9C8';
  const bucket = hairBucket(config.hair);
  const beanie = config.accessory === 'beanie';

  const dot = (cx: number) => <circle cx={cx} cy="52" r="2.6" fill={OUTLINE} />;
  const eyes = (() => {
    switch (config.eyes) {
      case 'tired':
        return (
          <g stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M38 53 q4 3 8 0" /><path d="M54 53 q4 3 8 0" />
          </g>
        );
      case 'stoked':
        return (
          <g stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M38 54 l4 -4 l4 4" /><path d="M54 54 l4 -4 l4 4" />
          </g>
        );
      case 'wink':
        return (
          <g>
            {dot(42)}
            <path d="M54 53 q4 3 8 0" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
        );
      case 'shades':
        return (
          <g>
            <rect x="35" y="47" width="30" height="9" rx="4" fill={OUTLINE} />
            <rect x="37" y="49" width="10" height="4" rx="2" fill="#FFFFFF" opacity="0.35" />
          </g>
        );
      case 'deadpan':
        return (
          <g stroke={OUTLINE} strokeWidth="3" strokeLinecap="round">
            <path d="M38 52 h8" /><path d="M54 52 h8" />
          </g>
        );
      default:
        return (
          <g>
            {dot(42)}{dot(58)}
            <path d="M38 46 q4 -2 8 -1 M54 45 q4 -1 8 1" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
        );
    }
  })();

  const hair = (() => {
    switch (bucket) {
      case 'bald':
        return null;
      case 'buzz':
        return <path d="M28 44 Q30 26 50 26 Q70 26 72 44 Q60 36 50 36 Q40 36 28 44 Z" fill={hairCol} stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round" />;
      case 'spikes':
        return (
          <path d="M28 44 L30 24 L38 36 L44 20 L50 34 L56 20 L62 36 L70 24 L72 44 Q60 34 50 34 Q40 34 28 44 Z"
            fill={hairCol} stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round" />
        );
      case 'bun':
        return (
          <g fill={hairCol} stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round">
            <circle cx="50" cy="20" r="8" />
            <path d="M28 46 Q28 26 50 26 Q72 26 72 46 Q60 36 50 36 Q40 36 28 46 Z" />
          </g>
        );
      case 'long':
        return (
          <path d="M24 66 Q22 30 50 26 Q78 30 76 66 Q70 58 66 60 L66 44 Q58 36 50 36 Q42 36 34 44 L34 60 Q30 58 24 66 Z"
            fill={hairCol} stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round" />
        );
      default:
        return (
          <path d="M26 58 Q24 28 50 26 Q76 28 74 58 Q70 50 64 50 L64 44 Q58 36 50 36 Q42 36 36 44 L36 50 Q30 50 26 58 Z"
            fill={hairCol} stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round" />
        );
    }
  })();

  const accessory = (() => {
    switch (config.accessory) {
      case 'nosering':
        return <circle cx="50" cy="63" r="2.4" fill="none" stroke={OUTLINE} strokeWidth="2" />;
      case 'bandana':
        return <path d="M30 42 Q50 34 70 42 L70 48 Q50 42 30 48 Z" fill="#FF6B6B" stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round" />;
      case 'beanie':
        return <path d="M28 42 Q30 24 50 24 Q70 24 72 42 Z" fill="#7C3AED" stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round" />;
      default:
        return null;
    }
  })();

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={cn(className)} aria-label="avatar">
      {/* gold collectible ring */}
      <circle cx="50" cy="50" r="48" fill="#E9B84B" />
      <circle cx="50" cy="50" r="48" fill="none" stroke="#C9992F" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="43" fill={bg} stroke={OUTLINE} strokeWidth="2" />

      {!beanie && hair}

      <path d="M28 52 Q28 34 50 34 Q72 34 72 52 Q72 72 50 74 Q28 72 28 52 Z"
        fill={skin} stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round" />

      <ellipse cx="36" cy="60" rx="4" ry="2.6" fill="#FF6B6B" opacity="0.45" />
      <ellipse cx="64" cy="60" rx="4" ry="2.6" fill="#FF6B6B" opacity="0.45" />

      {eyes}
      {accessory}

      {config.eyes === 'stoked'
        ? <path d="M42 64 Q50 72 58 64" fill="none" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
        : <path d="M43 64 Q50 69 57 64" fill="none" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />}
    </svg>
  );
}
