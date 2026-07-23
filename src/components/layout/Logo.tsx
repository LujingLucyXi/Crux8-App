/**
 * CruxMate logo — clean square carabiner.
 *
 * Squared-off "D" carabiner body with a spring gate on the right side.
 * Geometric, minimal, reads clearly at 20px. Line-art to match the brand board.
 */
export function Logo({ size = 32, color = '#0F2D3A' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="CruxMate logo"
    >
      {/* Outer carabiner body — squared D shape, open on the gate side */}
      <path
        d="M44 10
           L20 10
           C 14 10, 10 14, 10 20
           L10 44
           C 10 50, 14 54, 20 54
           L44 54"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Spine (right vertical bar of the D) */}
      <path
        d="M44 10 L44 24"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <path
        d="M44 40 L44 54"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
      />

      {/* Gate — the angled spring-loaded segment */}
      <path
        d="M44 24 L44 40"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray="1 6"
        opacity={0.55}
      />

      {/* Inner cutout — squared, echoes the body */}
      <path
        d="M38 20
           L22 20
           C 20.5 20, 20 20.5, 20 22
           L20 42
           C 20 43.5, 20.5 44, 22 44
           L38 44"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.32}
        fill="none"
      />
    </svg>
  );
}
