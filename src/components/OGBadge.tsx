/**
 * OG badge — the Founding Member coin (Lucy 2026-10-16: "make an OG
 * badge, cool design, shiny"). Code-built SVG medallion in the DNA
 * card gold ramp: rope-etched rim, "CRUX8 · FOUNDING MEMBER" engraved
 * around the edge, big OG in the center, and a periodic light sweep
 * across the face so it reads as polished metal at any size.
 */
export function OGBadge({ size = 64, shine = true }: { size?: number; shine?: boolean }) {
  return (
    <span
      className="relative inline-block shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size }}
      role="img"
      aria-label="OG — Founding Member"
    >
      <svg viewBox="0 0 120 120" width={size} height={size} className="block">
        <defs>
          <radialGradient id="og-gold" cx="38%" cy="32%" r="80%">
            <stop offset="0%" stopColor="#FDEFC0" />
            <stop offset="45%" stopColor="#F9E29A" />
            <stop offset="75%" stopColor="#EFC95E" />
            <stop offset="100%" stopColor="#C9962E" />
          </radialGradient>
          <path id="og-arc" d="M 60,60 m -45,0 a 45,45 0 1,1 90,0 a 45,45 0 1,1 -90,0" fill="none" />
        </defs>
        {/* coin body */}
        <circle cx="60" cy="60" r="58" fill="url(#og-gold)" />
        <circle cx="60" cy="60" r="58" fill="none" stroke="#8A6D2F" strokeWidth="2" />
        {/* rope-etched rim */}
        <circle
          cx="60" cy="60" r="52.5" fill="none"
          stroke="#A37F27" strokeWidth="2.5" strokeDasharray="3.5 2.6" opacity="0.75"
        />
        {/* inner field */}
        <circle cx="60" cy="60" r="37" fill="#161310" opacity="0.92" />
        <circle cx="60" cy="60" r="37" fill="none" stroke="#F9E29A" strokeWidth="1" opacity="0.55" />
        {/* rim lettering */}
        <text fontSize="10.5" fontWeight="800" letterSpacing="2.6" fill="#5C4712">
          <textPath href="#og-arc" startOffset="2%">
            CRUX8 · FOUNDING MEMBER · EST. 2026 ·
          </textPath>
        </text>
        {/* center mark */}
        <text
          x="60" y="72" textAnchor="middle"
          fontSize="34" fontWeight="900" letterSpacing="1"
          fill="#F9E29A"
          style={{ fontFamily: 'Archivo, system-ui, sans-serif' }}
        >
          OG
        </text>
        <text x="60" y="86" textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="1.5" fill="#EFC95E">
          ★ FIRST 500 ★
        </text>
      </svg>
      {shine && (
        <span
          aria-hidden
          className="og-shine-bar pointer-events-none absolute inset-y-[-10%] left-0 w-[38%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)]"
        />
      )}
    </span>
  );
}
