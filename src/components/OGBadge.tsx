/**
 * OG badge — the Founding Member mark. v5 (Lucy picked concept C
 * from the design board, 2026-10-16): a gym ROUTE TAG — the little
 * volt tag that marks a climb, stamped OG, tilted like it was just
 * taped up. v5.1 layout pass (her note: the hole crowded the OG):
 * the tag widened and the three elements got real gutters —
 * [hole] · [OG] · [bolt cutout] — evenly spaced zones. Both punches
 * are true cutouts (even-odd path) so the surface shows through.
 * BoltMark (the bar-tip bolt) stays as its own mark.
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

/** Tag body: x 10–110, y 30–90. Zones: hole 18–30 · OG ~41–83 · bolt 93–107. */
const TAG_OUTLINE =
  'M22 30 H98 a12 12 0 0 1 12 12 V78 a12 12 0 0 1 -12 12 H22 a12 12 0 0 1 -12 -12 V42 a12 12 0 0 1 12 -12 Z';
const HOLE_PATH = 'M24 54 a6 6 0 1 0 0.001 0 Z';
const BOLT_CUTOUT = 'M101.8 49.3 L93.1 61 L97.6 61 L96.1 70.5 L107.1 57.6 L101.8 57.6 Z';
const TAG_PATH = [TAG_OUTLINE, HOLE_PATH, BOLT_CUTOUT].join(' ');

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
          <path d={TAG_OUTLINE} fill="none" stroke="rgba(0,0,0,0.16)" strokeWidth="1.5" />
          <circle cx="24" cy="60" r="6" fill="none" stroke={v.ink} strokeWidth="1.8" opacity="0.7" />
          <path d={BOLT_CUTOUT} fill="none" stroke={v.ink} strokeWidth="1" opacity="0.4" strokeLinejoin="round" />
          <text
            x="62" y="74" textAnchor="middle"
            fontSize="30" fontWeight="900" letterSpacing="0.5"
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
