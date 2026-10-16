/**
 * OG badge — the Founding Member mark. v5 (Lucy picked concept C
 * from the design board, 2026-10-16): a gym ROUTE TAG — the little
 * volt tag that marks a climb, punched hole and all, stamped OG,
 * tilted like it was just taped up. The hole is a real cutout
 * (even-odd path) so whatever surface the badge sits on shows
 * through. BoltMark (the bar-tip bolt) stays as its own mark.
 */
export type OGBadgeVariant = 'neon' | 'gold' | 'onyx';

const VARIANTS: Record<OGBadgeVariant, { tag: string; ink: string }> = {
  neon: { tag: '#B4FF3A', ink: '#0C0F0A' },
  gold: { tag: '#EFC95E', ink: '#161310' },
  onyx: { tag: '#161412', ink: '#B4FF3A' },
};

/** Chunky lightning bolt silhouette in a 120 box. */
const BOLT_PATH = 'M70 4 L24 66 L48 66 L40 116 L98 48 L70 48 Z';

/** The bare bolt, for the Register bar tip and anywhere else. */
export function BoltMark({ size = 16, color = '#B4FF3A' }: { size?: number; color?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size * 0.72}
      height={size}
      className="block"
      aria-hidden
      style={{ filter: 'drop-shadow(0 0 5px rgba(180,255,58,0.65))' }}
    >
      <path d={BOLT_PATH} fill={color} />
    </svg>
  );
}

/** Rounded route-tag outline with TWO punches — the hole and a small
 *  bolt cutout at the tag's right end (Lucy 2026-10-16) — one
 *  even-odd path so the surface shows through both. */
const BOLT_CUTOUT = 'M99 48.8 L89.8 61.2 L94.6 61.2 L93 71.2 L104.6 57.6 L99 57.6 Z';
const TAG_PATH = [
  'M26 28 H94 a12 12 0 0 1 12 12 V80 a12 12 0 0 1 -12 12 H26 a12 12 0 0 1 -12 -12 V40 a12 12 0 0 1 12 -12 Z',
  'M30 53 a7 7 0 1 0 0.001 0 Z',
  BOLT_CUTOUT,
].join(' ');

export function OGBadge({
  size = 64,
  variant = 'neon',
}: {
  size?: number;
  variant?: OGBadgeVariant;
}) {
  const v = VARIANTS[variant];
  return (
    <span
      className="relative inline-block shrink-0"
      style={{ width: size, height: size, filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.35))' }}
      role="img"
      aria-label="OG — Founding Member"
    >
      <svg viewBox="0 0 120 120" width={size} height={size} className="block">
        <g transform="rotate(-8 60 60)">
          <path d={TAG_PATH} fill={v.tag} fillRule="evenodd" />
          <path
            d="M26 28 H94 a12 12 0 0 1 12 12 V80 a12 12 0 0 1 -12 12 H26 a12 12 0 0 1 -12 -12 V40 a12 12 0 0 1 12 -12 Z"
            fill="none" stroke="rgba(0,0,0,0.16)" strokeWidth="1.5"
          />
          <circle cx="30" cy="60" r="7" fill="none" stroke={v.ink} strokeWidth="2" opacity="0.75" />
          <path d={BOLT_CUTOUT} fill="none" stroke={v.ink} strokeWidth="1.2" opacity="0.45" strokeLinejoin="round" />
          <text
            x="63" y="75" textAnchor="middle"
            fontSize="32" fontWeight="900" letterSpacing="0.5"
            fill={v.ink}
            style={{ fontFamily: 'Archivo, system-ui, sans-serif' }}
          >
            OG
          </text>
        </g>
      </svg>
    </span>
  );
}
