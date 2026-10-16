/**
 * OG badge — the Founding Member mark (Lucy 2026-10-16, v2 after her
 * "too complicated — polished and simple" note): a glossy enamel disc,
 * one gold rim, a big OG, one tiny diamond. Nothing else. The shine
 * sweep stays — on the dark field it's what makes it read as metal.
 * Variants exist so the colorway can change with one word: onyx
 * (default, black + gold), violet (the app's tier enamel), gold.
 */
export type OGBadgeVariant = 'onyx' | 'violet' | 'gold';

const VARIANTS: Record<
  OGBadgeVariant,
  { field: string; rim: string; letters: string; diamond: string }
> = {
  onyx: { field: '#161412', rim: '#C9A24B', letters: 'url(#og-letters-gold)', diamond: '#C9A24B' },
  violet: { field: 'url(#og-field-violet)', rim: '#E9E4F5', letters: '#FFFFFF', diamond: '#F9E29A' },
  gold: { field: 'url(#og-field-gold)', rim: '#8A6D2F', letters: '#161310', diamond: '#161310' },
};

export function OGBadge({
  size = 64,
  shine = true,
  variant = 'onyx',
}: {
  size?: number;
  shine?: boolean;
  variant?: OGBadgeVariant;
}) {
  const v = VARIANTS[variant];
  return (
    <span
      className="relative inline-block shrink-0 overflow-hidden rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
      style={{ width: size, height: size }}
      role="img"
      aria-label="OG — Founding Member"
    >
      <svg viewBox="0 0 120 120" width={size} height={size} className="block">
        <defs>
          <linearGradient id="og-letters-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F9E29A" />
            <stop offset="100%" stopColor="#DFAF37" />
          </linearGradient>
          <linearGradient id="og-field-violet" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#5B21B6" />
          </linearGradient>
          <radialGradient id="og-field-gold" cx="38%" cy="30%" r="85%">
            <stop offset="0%" stopColor="#FDEFC0" />
            <stop offset="55%" stopColor="#F9E29A" />
            <stop offset="100%" stopColor="#DFAF37" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="57" fill={v.field} />
        <circle cx="60" cy="60" r="56" fill="none" stroke={v.rim} strokeWidth="3" />
        {/* enamel gloss */}
        <ellipse cx="60" cy="30" rx="40" ry="20" fill="#FFFFFF" opacity="0.10" />
        <text
          x="60" y="74" textAnchor="middle"
          fontSize="46" fontWeight="900"
          fill={v.letters}
          style={{ fontFamily: 'Archivo, system-ui, sans-serif' }}
        >
          OG
        </text>
        <path d="M60 88 l5 6 -5 6 -5 -6 z" fill={v.diamond} />
      </svg>
      {shine && (
        <span
          aria-hidden
          className="og-shine-bar pointer-events-none absolute inset-y-[-10%] left-0 w-[38%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)]"
        />
      )}
    </span>
  );
}
