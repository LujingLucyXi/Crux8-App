import { HAIR_HEX, type AvatarConfig } from '@/lib/avatar';

/**
 * THROWAWAY hand-drawn sketch avatar mock for /lab. Same AvatarConfig —
 * graphite line-art on paper, a "rough" displacement filter for wobble, and
 * cross-hatch shading. One accent pulled from hairColor.
 */

const INK = '#33302B';

export function SketchAvatar({ config, size = 64 }: { config: AvatarConfig; size?: number }) {
  const accent = HAIR_HEX[config.hairColor];
  const uid = `${config.skin}-${config.hairColor}-${config.hair}-${config.eyes}`;
  const rough = `srough-${uid}`;

  const spikes = ['mohawk', 'liberty', 'undercut', 'shaved', 'buzz'].includes(config.hair);
  const bald = ['bald', 'locs'].includes(config.hair);

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="rounded-full shrink-0" aria-label="sketch avatar">
      <defs>
        <filter id={rough}>
          <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="2" seed={config.hairColor.length + config.skin.length} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" />
        </filter>
      </defs>

      {/* paper */}
      <rect width="100" height="100" fill="#F4EFE2" />
      <rect width="100" height="100" fill={accent} opacity="0.05" />

      <g filter={`url(#${rough})`} stroke={INK} fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {/* neck + shoulders */}
        <path d="M42 74 L42 84 M58 74 L58 84" />
        <path d="M24 98 Q26 84 42 82 M58 82 Q74 84 76 98" />

        {/* face */}
        <path d="M31 46 Q31 29 50 28 Q69 29 69 46 Q69 63 59 74 Q50 81 41 74 Q31 63 31 46 Z" />
        {/* ears */}
        <path d="M31 50 Q27 51 28 56 Q30 58 32 56" />
        <path d="M69 50 Q73 51 72 56 Q70 58 68 56" />

        {/* hair — sketchy strokes by type */}
        {spikes ? (
          <g>
            <path d="M34 32 L32 12 M40 30 L41 8 M48 29 L49 5 M56 29 L58 9 M64 31 L67 14" />
            <path d="M30 42 Q30 30 40 28 M70 42 Q70 30 60 28" />
          </g>
        ) : bald ? (
          <path d="M32 42 Q34 30 50 29 Q66 30 68 42" />
        ) : (
          <g>
            <path d="M28 48 Q24 24 50 22 Q76 24 72 48" />
            <path d="M30 30 Q40 26 50 27 M50 27 Q60 26 70 30" />
            <path d="M31 46 Q30 34 36 30 M69 46 Q70 34 64 30" />
          </g>
        )}

        {/* brows */}
        <path d="M35 47 Q40 45 44 47 M56 47 Q60 45 65 47" />
        {/* eyes — simple sketch */}
        <SketchEyes kind={config.eyes} />
        {/* nose */}
        <path d="M50 55 L48 60 Q50 61 51 60" />
        {/* mouth */}
        <SketchMouth kind={config.eyes} />

        {/* cross-hatch shading on the right cheek + under jaw */}
        <g strokeWidth="0.7" opacity="0.5">
          <path d="M60 54 L66 60 M58 58 L65 65 M57 63 L63 69" />
          <path d="M42 72 L46 76 M48 74 L52 77 M54 73 L58 76" />
        </g>
      </g>

      {/* one accent scribble (hair tint) */}
      <g filter={`url(#${rough})`} stroke={accent} fill="none" strokeWidth="1.4" strokeLinecap="round" opacity="0.55">
        {spikes ? <path d="M40 24 L41 12 M48 22 L49 8" /> : bald ? <path d="M40 33 Q50 30 60 33" /> : <path d="M34 30 Q42 26 50 27" />}
      </g>
    </svg>
  );
}

function SketchEyes({ kind }: { kind: AvatarConfig['eyes'] }) {
  const L = 40;
  const R = 60;
  const Y = 52;
  if (kind === 'stoked' || kind === 'wink') {
    const closed = (x: number) => <path d={`M${x - 4} ${Y + 1} Q ${x} ${Y - 3} ${x + 4} ${Y + 1}`} />;
    return (
      <g>
        {kind === 'wink' ? <circle cx={L} cy={Y} r="2" fill={INK} stroke="none" /> : closed(L)}
        {closed(R)}
      </g>
    );
  }
  return (
    <g>
      <circle cx={L} cy={Y} r="2" fill={INK} stroke="none" />
      <circle cx={R} cy={Y} r="2" fill={INK} stroke="none" />
    </g>
  );
}

function SketchMouth({ kind }: { kind: AvatarConfig['eyes'] }) {
  if (kind === 'stoked') return <path d="M45 67 Q50 71 55 67" />;
  if (kind === 'tired') return <path d="M46 68 L54 68" />;
  return <path d="M46 67 Q50 69.5 54 67" />;
}
