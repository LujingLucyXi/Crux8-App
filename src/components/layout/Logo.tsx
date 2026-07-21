/**
 * CruxMate fist-bump logo.
 * Two closed fists meeting at the center, small "impact" burst above.
 * Line-art style matching the brand board.
 */
export function Logo({ size = 32, color = '#0F2D3A' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size * 0.75}
      viewBox="0 0 96 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="CruxMate logo"
    >
      {/* ── Impact burst (spark rays above the meeting point) ─────────── */}
      <g stroke={color} strokeWidth={2.3} strokeLinecap="round">
        <line x1="48" y1="4" x2="48" y2="12" />
        <line x1="38" y1="6" x2="42" y2="13" />
        <line x1="58" y1="6" x2="54" y2="13" />
        <line x1="30" y1="10" x2="36" y2="15" />
        <line x1="66" y1="10" x2="60" y2="15" />
      </g>

      {/* ── Left fist ─────────────────────────────────────────────────── */}
      {/* main knuckle box */}
      <path
        d="M6 32
           C 6 26, 10 22, 16 22
           L 34 22
           C 40 22, 44 26, 44 32
           L 44 54
           C 44 60, 40 64, 34 64
           L 16 64
           C 10 64, 6 60, 6 54
           Z"
        stroke={color}
        strokeWidth={2.6}
        strokeLinejoin="round"
        fill="none"
      />
      {/* thumb */}
      <path
        d="M44 34
           C 48 30, 50 28, 50 34
           L 50 46
           C 50 50, 48 52, 44 50"
        stroke={color}
        strokeWidth={2.6}
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      {/* knuckle ridges */}
      <line x1="14" y1="30" x2="14" y2="38" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      <line x1="22" y1="28" x2="22" y2="38" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      <line x1="30" y1="28" x2="30" y2="38" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      <line x1="38" y1="30" x2="38" y2="38" stroke={color} strokeWidth={2.2} strokeLinecap="round" />

      {/* ── Right fist (mirror) ───────────────────────────────────────── */}
      <path
        d="M90 32
           C 90 26, 86 22, 80 22
           L 62 22
           C 56 22, 52 26, 52 32
           L 52 54
           C 52 60, 56 64, 62 64
           L 80 64
           C 86 64, 90 60, 90 54
           Z"
        stroke={color}
        strokeWidth={2.6}
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M52 34
           C 48 30, 46 28, 46 34
           L 46 46
           C 46 50, 48 52, 52 50"
        stroke={color}
        strokeWidth={2.6}
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <line x1="82" y1="30" x2="82" y2="38" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      <line x1="74" y1="28" x2="74" y2="38" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      <line x1="66" y1="28" x2="66" y2="38" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      <line x1="58" y1="30" x2="58" y2="38" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </svg>
  );
}
