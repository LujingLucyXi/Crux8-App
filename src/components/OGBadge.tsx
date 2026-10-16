/**
 * OG badge — the Founding Member mark. v4 (Lucy 2026-10-16): the
 * badge IS a lightning bolt now — volt green, OG knocked out of its
 * waist in black. It ties straight into the page's own line,
 * "Electrify your climb." The same bolt (BoltMark) rides the
 * Founding Register progress bar where the flame used to be.
 * Variants: neon (live), gold, onyx.
 */
export type OGBadgeVariant = 'neon' | 'gold' | 'onyx';

const VARIANTS: Record<
  OGBadgeVariant,
  { bolt: string; letters: string; glow?: string }
> = {
  neon: { bolt: '#B4FF3A', letters: '#0C0F0A', glow: 'drop-shadow(0 0 10px rgba(180,255,58,0.5))' },
  gold: { bolt: '#EFC95E', letters: '#161310' },
  onyx: { bolt: '#161412', letters: '#F9E29A' },
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
      style={{ width: size, height: size, filter: v.glow }}
      role="img"
      aria-label="OG — Founding Member"
    >
      <svg viewBox="0 0 120 120" width={size} height={size} className="block">
        <path d={BOLT_PATH} fill={v.bolt} stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" strokeLinejoin="round" />
        {/* enamel gloss on the bolt's top facet */}
        <path d="M70 4 L24 66 L48 66 L62 40 L70 48 Z" fill="#FFFFFF" opacity="0.14" />
        <text
          x="57" y="68" textAnchor="middle"
          fontSize="21" fontWeight="900"
          fill={v.letters}
          style={{ fontFamily: 'Archivo, system-ui, sans-serif' }}
        >
          OG
        </text>
      </svg>
    </span>
  );
}
