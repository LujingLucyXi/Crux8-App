/**
 * Simple fist-bump icon in the CruxMate brand style. Not a perfect match for
 * the brand board's illustration, but visually consistent (line art, ink-900).
 * Swap with the real SVG export when available.
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
      {/* Left fist */}
      <path
        d="M6 30c0-3 2-5 5-5h10c3 0 5 2 5 5v8c0 3-2 5-5 5H11c-3 0-5-2-5-5v-8z"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <path d="M11 25v-5c0-2 1-3 3-3M17 25v-6M21 26v-4" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      {/* Right fist */}
      <path
        d="M58 30c0-3-2-5-5-5H43c-3 0-5 2-5 5v8c0 3 2 5 5 5h10c3 0 5-2 5-5v-8z"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <path d="M53 25v-5c0-2-1-3-3-3M47 25v-6M43 26v-4" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      {/* Spark */}
      <path d="M28 34l4-3 4 3" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28 12l2-4 2 4M34 12l-2-4-2 4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}
