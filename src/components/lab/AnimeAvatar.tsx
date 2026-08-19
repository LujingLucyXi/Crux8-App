import { SKIN_HEX, HAIR_HEX, type AvatarConfig } from '@/lib/avatar';

/**
 * THROWAWAY anime-style avatar mock for /lab. Same AvatarConfig — big
 * expressive eyes, cel-shaded skin, bold bangs, soft pastel backdrop.
 */

const OUTLINE = '#3A2E3A';

function mix(h1: string, h2: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = p(h1);
  const [r2, g2, b2] = p(h2);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}

export function AnimeAvatar({ config, size = 64 }: { config: AvatarConfig; size?: number }) {
  const skin = SKIN_HEX[config.skin];
  const hair = HAIR_HEX[config.hairColor];
  const iris = hair;
  const uid = `${config.skin}-${config.hairColor}-${config.eyes}`;
  const bgId = `abg-${uid}`;
  const skinId = `ask-${uid}`;
  const hairId = `ahr-${uid}`;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="rounded-full shrink-0" aria-label="anime avatar">
      <defs>
        <radialGradient id={bgId} cx="50%" cy="38%" r="75%">
          <stop offset="0%" stopColor={mix(hair, '#FFFFFF', 0.78)} />
          <stop offset="100%" stopColor={mix(hair, '#FFFFFF', 0.5)} />
        </radialGradient>
        <linearGradient id={skinId} x1="30" y1="30" x2="66" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={mix(skin, '#FFFFFF', 0.2)} />
          <stop offset="62%" stopColor={skin} />
          <stop offset="100%" stopColor={mix(skin, '#C24E6E', 0.22)} />
        </linearGradient>
        <linearGradient id={hairId} x1="30" y1="8" x2="70" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={mix(hair, '#FFFFFF', 0.28)} />
          <stop offset="100%" stopColor={hair} />
        </linearGradient>
      </defs>

      <rect width="100" height="100" fill={`url(#${bgId})`} />
      {/* soft sparkles */}
      <g fill="#FFFFFF" opacity="0.6">
        <circle cx="22" cy="26" r="1.6" />
        <circle cx="80" cy="32" r="1.2" />
        <circle cx="78" cy="70" r="1.4" />
      </g>

      {/* neck + shoulders */}
      <path d="M42 76 L42 86 Q50 90 58 86 L58 76 Z" fill={`url(#${skinId})`} stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
      <path d="M24 100 Q24 86 42 84 Q50 89 58 84 Q76 86 76 100 Z" fill={mix(hair, '#FFFFFF', 0.35)} stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />

      {/* hair back layer */}
      <path d="M22 56 Q18 22 50 18 Q82 22 78 56 L74 50 Q76 30 50 28 Q24 30 26 50 Z" fill={`url(#${hairId})`} stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />

      {/* face — soft with pointed chin */}
      <path d="M30 46 Q30 30 50 29 Q70 30 70 46 Q70 62 60 74 Q50 82 40 74 Q30 62 30 46 Z" fill={`url(#${skinId})`} stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />

      {/* ears */}
      <ellipse cx="29" cy="54" rx="3.5" ry="5" fill={`url(#${skinId})`} stroke={OUTLINE} strokeWidth="2" />
      <ellipse cx="71" cy="54" rx="3.5" ry="5" fill={`url(#${skinId})`} stroke={OUTLINE} strokeWidth="2" />

      {/* blush */}
      <ellipse cx="37" cy="60" rx="4.2" ry="2.4" fill="#FF8AA8" opacity="0.5" />
      <ellipse cx="63" cy="60" rx="4.2" ry="2.4" fill="#FF8AA8" opacity="0.5" />

      <AnimeEyes kind={config.eyes} iris={iris} />

      {/* tiny nose + mouth */}
      <path d="M50 58 L49 61" stroke={OUTLINE} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <AnimeMouth kind={config.eyes} />

      {/* hair front bangs */}
      <g fill={`url(#${hairId})`} stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round">
        <path d="M26 50 Q24 28 50 27 Q76 28 74 50 Q70 40 62 44 Q66 33 55 31 Q60 41 50 42 Q40 41 45 31 Q34 33 38 44 Q30 40 26 50 Z" />
      </g>
      {/* hair shine */}
      <path d="M40 33 Q50 30 60 33" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function AnimeEyes({ kind, iris }: { kind: AvatarConfig['eyes']; iris: string }) {
  const L = 39;
  const R = 61;
  const Y = 56;
  const brow = (x: number, tilt: number) => (
    <path d={`M${x - 6} ${Y - 12 + tilt} Q ${x} ${Y - 14} ${x + 6} ${Y - 12 - tilt}`} stroke={OUTLINE} strokeWidth="1.8" fill="none" strokeLinecap="round" />
  );

  if (kind === 'stoked' || kind === 'wink') {
    // happy closed ^^ (wink = one open)
    const closed = (x: number) => <path d={`M${x - 5} ${Y + 1} Q ${x} ${Y - 5} ${x + 5} ${Y + 1}`} stroke={OUTLINE} strokeWidth="2.4" fill="none" strokeLinecap="round" />;
    return (
      <g>
        {brow(L, -1)}
        {brow(R, 1)}
        {kind === 'wink' ? bigEye(L, iris) : closed(L)}
        {closed(R)}
      </g>
    );
  }
  return (
    <g>
      {brow(L, -1)}
      {brow(R, 1)}
      {bigEye(L, iris)}
      {bigEye(R, iris)}
    </g>
  );
}

function bigEye(x: number, iris: string) {
  const Y = 57;
  return (
    <g>
      {/* sclera */}
      <path d={`M${x - 6.5} ${Y} Q ${x - 6} ${Y - 7} ${x} ${Y - 7.5} Q ${x + 6} ${Y - 7} ${x + 6.5} ${Y} Q ${x + 5} ${Y + 6} ${x} ${Y + 6.5} Q ${x - 5} ${Y + 6} ${x - 6.5} ${Y} Z`} fill="#FBFCFF" stroke={OUTLINE} strokeWidth="1.6" />
      {/* iris + pupil */}
      <ellipse cx={x} cy={Y} rx="4.6" ry="6" fill={iris} />
      <ellipse cx={x} cy={Y} rx="4.6" ry="6" fill="#000000" opacity="0.12" />
      <ellipse cx={x} cy={Y + 0.5} rx="2.3" ry="3.1" fill="#241826" />
      {/* highlights */}
      <circle cx={x - 2} cy={Y - 3} r="1.9" fill="#FFFFFF" />
      <circle cx={x + 2.2} cy={Y + 2.5} r="1" fill="#FFFFFF" opacity="0.85" />
      {/* upper lash */}
      <path d={`M${x - 6.5} ${Y - 1} Q ${x} ${Y - 8.5} ${x + 6.5} ${Y - 1}`} stroke={OUTLINE} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d={`M${x + 6.5} ${Y - 1} L ${x + 9} ${Y - 3}`} stroke={OUTLINE} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  );
}

function AnimeMouth({ kind }: { kind: AvatarConfig['eyes'] }) {
  if (kind === 'stoked') return <path d="M46 68 Q50 72 54 68" stroke={OUTLINE} strokeWidth="1.8" fill="none" strokeLinecap="round" />;
  if (kind === 'tired') return <path d="M47 69 L53 69" stroke={OUTLINE} strokeWidth="1.8" strokeLinecap="round" />;
  return <path d="M47 68 Q50 70.5 53 68" stroke={OUTLINE} strokeWidth="1.8" fill="none" strokeLinecap="round" />;
}
