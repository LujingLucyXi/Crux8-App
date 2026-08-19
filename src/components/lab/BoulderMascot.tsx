/**
 * THROWAWAY /lab logo concept for "Go-Crux": a chunky little boulder with a
 * happy face yelling "Go!". Single flat SVG so it reads at header size.
 * Props: size, and whether to show the "Go!" speech burst.
 */
export function BoulderMascot({
  size = 72,
  shout = true,
  rock = '#8B93A7',
  rockDark = '#6B7385',
  accent = '#7C3AED',
  pop = '#C6F135',
  outline = '#2A2140',
}: {
  size?: number;
  shout?: boolean;
  rock?: string;
  rockDark?: string;
  accent?: string;
  pop?: string;
  outline?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="go-crux boulder">
      {/* ground shadow */}
      <ellipse cx="46" cy="88" rx="30" ry="5" fill={outline} opacity="0.12" />

      {/* boulder body — irregular chunky rock */}
      <path
        d="M18 66 Q12 50 24 40 Q30 26 48 26 Q68 24 76 40 Q86 52 78 66 Q74 74 58 75 L30 75 Q22 74 18 66 Z"
        fill={rock}
        stroke={outline}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* facet shading */}
      <path d="M48 26 Q30 26 24 40 Q34 44 46 42 Q50 32 48 26 Z" fill={rockDark} opacity="0.35" />
      <path d="M78 66 Q74 74 58 75 L62 60 Q74 60 78 66 Z" fill={rockDark} opacity="0.35" />
      {/* crimp lines (climbing texture) */}
      <path d="M30 52 q6 -3 12 0" stroke={outline} strokeWidth="2" strokeLinecap="round" opacity="0.35" />
      <path d="M58 50 q6 -3 12 1" stroke={outline} strokeWidth="2" strokeLinecap="round" opacity="0.35" />

      {/* eyes */}
      <circle cx="40" cy="50" r="3.4" fill={outline} />
      <circle cx="60" cy="50" r="3.4" fill={outline} />
      <circle cx="41.2" cy="48.8" r="1.1" fill="#FFFFFF" />
      <circle cx="61.2" cy="48.8" r="1.1" fill="#FFFFFF" />
      {/* brows lifted = pumped */}
      <path d="M35 43 q5 -3 9 -1" stroke={outline} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M56 42 q5 -2 9 1" stroke={outline} strokeWidth="2.4" strokeLinecap="round" />

      {/* yelling open mouth */}
      <path
        d="M42 60 Q50 58 58 60 Q57 70 50 71 Q43 70 42 60 Z"
        fill={outline}
        stroke={outline}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path d="M45 64 Q50 63 55 64 Q54 67 50 67.5 Q46 67 45 64 Z" fill="#FF6B6B" />

      {/* rosy cheeks */}
      <ellipse cx="33" cy="58" rx="4" ry="2.6" fill="#FF6B6B" opacity="0.5" />
      <ellipse cx="67" cy="58" rx="4" ry="2.6" fill="#FF6B6B" opacity="0.5" />

      {shout && (
        <g>
          {/* speech burst */}
          <path
            d="M70 20 L92 14 L86 34 L94 40 L74 42 L78 30 Z"
            fill={pop}
            stroke={outline}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <text
            x="83"
            y="31"
            fontFamily="Poppins, sans-serif"
            fontSize="13"
            fontWeight="800"
            fill={outline}
            textAnchor="middle"
          >
            Go!
          </text>
          {/* motion ticks */}
          <path d="M14 34 l-7 -3" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <path d="M14 44 l-8 0" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <path d="M16 54 l-7 3" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
