/**
 * OG badge — the Founding Member mark. v3 (Lucy 2026-10-16): the
 * round coin fought with the round spinning sign above it ("two
 * circles with different animation is a bit crowded") — so the OG
 * is now a STARBURST SEAL: different silhouette, no motion of its
 * own (the sign is the page's one moving piece), just a static neon
 * glow. Variants remain one-word swaps: neon (live), onyx, gold.
 */
export type OGBadgeVariant = 'neon' | 'onyx' | 'gold';

const VARIANTS: Record<
  OGBadgeVariant,
  { field: string; rim: string; letters: string; diamond: string; glow?: string }
> = {
  neon: {
    field: '#0C0F0A',
    rim: '#B4FF3A',
    letters: '#B4FF3A',
    diamond: '#B4FF3A',
    glow: 'drop-shadow(0 0 10px rgba(180,255,58,0.45))',
  },
  onyx: { field: '#161412', rim: '#C9A24B', letters: '#F9E29A', diamond: '#C9A24B' },
  gold: { field: '#EFC95E', rim: '#8A6D2F', letters: '#161310', diamond: '#161310' },
};

/** 16-point starburst seal, alternating outer/inner radius. */
const STAR_POINTS = (() => {
  const cx = 60;
  const cy = 60;
  const spikes = 16;
  const outer = 58;
  const inner = 46;
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
})();

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
        <polygon points={STAR_POINTS} fill={v.field} stroke={v.rim} strokeWidth="2.5" strokeLinejoin="round" />
        {/* enamel gloss */}
        <ellipse cx="60" cy="34" rx="30" ry="13" fill="#FFFFFF" opacity="0.10" />
        <text
          x="60" y="73" textAnchor="middle"
          fontSize="38" fontWeight="900"
          fill={v.letters}
          style={{ fontFamily: 'Archivo, system-ui, sans-serif' }}
        >
          OG
        </text>
        <path d="M60 84 l4.5 5.5 -4.5 5.5 -4.5 -5.5 z" fill={v.diamond} />
      </svg>
    </span>
  );
}
