/**
 * Throwaway logo explorations for the /lab picker. Each is a bold, single-mark
 * SVG that accepts a solid `color` or the brand `gradient`. Pick/remix one and
 * I'll promote it into src/components/layout/Logo.tsx.
 */

import type { ReactElement } from 'react';

interface MarkProps {
  size?: number;
  color?: string;
  gradient?: boolean;
}

function Grad({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7C3AED" />
        <stop offset="1" stopColor="#EC4899" />
      </linearGradient>
    </defs>
  );
}

/* 1 — Carabiner: ring + spring gate (the current mark, refined). */
export function LogoCarabiner({ size = 32, color = '#1B1533', gradient = false }: MarkProps) {
  const id = 'lg-carab';
  const c = gradient ? `url(#${id})` : color;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="Carabiner logo">
      {gradient && <Grad id={id} />}
      <path d="M46 15 A 22 22 0 1 0 52 36" stroke={c} strokeWidth={9} strokeLinecap="round" fill="none" />
      <path d="M46 15 L52 24" stroke={c} strokeWidth={9} strokeLinecap="round" />
      <circle cx="52" cy="24" r="3.4" fill={c} />
    </svg>
  );
}

/* 2 — Linked: two interlocking rings = partners / "mate". */
export function LogoLinked({ size = 32, color = '#1B1533', gradient = false }: MarkProps) {
  const id = 'lg-link';
  const c = gradient ? `url(#${id})` : color;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="Linked rings logo">
      {gradient && <Grad id={id} />}
      {/* left ring */}
      <circle cx="25" cy="32" r="14" stroke={c} strokeWidth={7.5} fill="none" />
      {/* right ring, drawn so it reads as passing under/over */}
      <circle cx="41" cy="32" r="14" stroke="white" strokeWidth={12} fill="none" />
      <circle cx="41" cy="32" r="14" stroke={c} strokeWidth={7.5} fill="none" />
      {/* re-draw left's right edge on top for the interlock illusion */}
      <path d="M35 21 A 14 14 0 0 1 35 43" stroke={c} strokeWidth={7.5} fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* 3 — Monogram C: one bold geometric letterform. */
export function LogoMonogram({ size = 32, color = '#1B1533', gradient = false }: MarkProps) {
  const id = 'lg-mono';
  const c = gradient ? `url(#${id})` : color;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="Monogram C logo">
      {gradient && <Grad id={id} />}
      <path d="M49 20 A 20 20 0 1 0 49 44" stroke={c} strokeWidth={11} strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* 4 — Peaks: two chevron summits = mountains / upward send. */
export function LogoPeaks({ size = 32, color = '#1B1533', gradient = false }: MarkProps) {
  const id = 'lg-peak';
  const c = gradient ? `url(#${id})` : color;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="Peaks logo">
      {gradient && <Grad id={id} />}
      <path d="M8 46 L24 22 L34 36" stroke={c} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M30 44 L44 20 L56 40" stroke={c} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/* 5 — Bolt-C: a chunky C wrapping a lightning/route bolt (send energy). */
export function LogoBoltC({ size = 32, color = '#1B1533', gradient = false }: MarkProps) {
  const id = 'lg-bolt';
  const c = gradient ? `url(#${id})` : color;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="Bolt C logo">
      {gradient && <Grad id={id} />}
      <path d="M50 21 A 19 19 0 1 0 50 43" stroke={c} strokeWidth={8} strokeLinecap="round" fill="none" />
      <path d="M34 18 L24 34 L32 34 L28 48 L42 30 L34 30 Z" fill={c} />
    </svg>
  );
}

export const LOGO_CONCEPTS: { key: string; name: string; note: string; Mark: (p: MarkProps) => ReactElement }[] = [
  { key: 'carabiner', name: 'Carabiner', note: 'Literal gear. Current mark.', Mark: LogoCarabiner },
  { key: 'linked', name: 'Linked', note: 'Two rings = partners / “mate”.', Mark: LogoLinked },
  { key: 'monogram', name: 'Monogram C', note: 'Bold letterform, most scalable.', Mark: LogoMonogram },
  { key: 'peaks', name: 'Peaks', note: 'Mountains / upward send energy.', Mark: LogoPeaks },
  { key: 'boltc', name: 'Bolt-C', note: 'C wrapping a send bolt.', Mark: LogoBoltC },
];
