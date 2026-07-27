/**
 * Cute hand-drawn mini-glyphs for gear items. Keyword-matched from the gear
 * label so we don't have to hard-code per category. 28px, ink outline on a
 * soft palette tile.
 */
const OUT = '#0F2D3A';

export function glyphKey(item: string): string {
  const s = item.toLowerCase();
  if (s.includes('harness')) return 'harness';
  if (s.includes('belay device')) return 'belay';
  if (s.includes('carabiner')) return 'carabiner';
  if (s.includes('quickdraw')) return 'quickdraw';
  if (s.includes('crash pad') || s.includes('pad')) return 'crashpad';
  if (s.includes('brush')) return 'brush';
  if (s.includes('rack') || s.includes('cam') || s.includes('nut')) return 'rack';
  if (s.includes('sling') || s.includes('webbing') || s.includes('pas') || s.includes('prusik')) return 'sling';
  if (s.includes('helmet')) return 'helmet';
  if (s.includes('rope')) return 'rope';
  if (s.includes('chalk')) return 'chalk';
  if (s.includes('shoe') || s.includes('boot')) return 'shoes';
  if (s.includes('tape')) return 'tape';
  if (s.includes('water')) return 'water';
  if (s.includes('snack') || s.includes('lunch')) return 'snack';
  if (s.includes('sun')) return 'sun';
  if (s.includes('map') || s.includes('gps')) return 'map';
  if (s.includes('first')) return 'firstaid';
  if (s.includes('pole')) return 'poles';
  if (s.includes('headlamp')) return 'headlamp';
  if (s.includes('layer') || s.includes('shell') || s.includes('jacket')) return 'layers';
  return 'gear';
}

const TILE: Record<string, string> = {
  harness: 'bg-coral-100',
  belay: 'bg-sky-200',
  carabiner: 'bg-sky-200',
  quickdraw: 'bg-sky-200',
  crashpad: 'bg-gold-100',
  brush: 'bg-gold-100',
  rack: 'bg-sky-200',
  sling: 'bg-coral-100',
  helmet: 'bg-coral-100',
  rope: 'bg-teal-100',
  chalk: 'bg-gold-100',
  shoes: 'bg-teal-100',
  tape: 'bg-gold-100',
  water: 'bg-sky-200',
  snack: 'bg-gold-100',
  sun: 'bg-gold-100',
  map: 'bg-teal-100',
  firstaid: 'bg-coral-100',
  poles: 'bg-teal-100',
  headlamp: 'bg-gold-100',
  layers: 'bg-sky-200',
  gear: 'bg-paper-50',
};

export function GearGlyph({ item, size = 30 }: { item: string; size?: number }) {
  const key = glyphKey(item);
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl shrink-0 ${TILE[key] ?? 'bg-paper-50'}`}
      style={{ width: size, height: size }}
    >
      <Draw k={key} />
    </span>
  );
}

function Draw({ k }: { k: string }) {
  const p = { fill: 'none', stroke: OUT, strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const s = { width: 18, height: 18, viewBox: '0 0 24 24', xmlns: 'http://www.w3.org/2000/svg' };
  switch (k) {
    case 'harness':
      return (
        <svg {...s}>
          <path d="M5 8h14" {...p} strokeWidth={2.4} />
          <path d="M6 8v3a5 5 0 0 0 5 5h2a5 5 0 0 0 5-5V8" {...p} />
          <path d="M9 16l-1 4M15 16l1 4" {...p} />
          <circle cx="12" cy="8" r="1.2" fill={OUT} />
        </svg>
      );
    case 'belay':
      return (
        <svg {...s}>
          <path d="M8 6h8l1.5 8a4 4 0 0 1-4 4h-3a4 4 0 0 1-4-4L8 6z" {...p} />
          <rect x="10" y="9" width="1.6" height="5" rx="0.8" fill={OUT} />
          <rect x="12.6" y="9" width="1.6" height="5" rx="0.8" fill={OUT} />
        </svg>
      );
    case 'carabiner':
      return (
        <svg {...s}>
          <path d="M9 4a6 6 0 0 0 0 16h1" {...p} strokeWidth={2} />
          <path d="M15 4a6 6 0 0 1 0 16h-1" {...p} strokeWidth={2} />
          <path d="M10 4h6" {...p} strokeWidth={2} />
        </svg>
      );
    case 'quickdraw':
      return (
        <svg {...s}>
          <ellipse cx="12" cy="6" rx="2.6" ry="3.4" {...p} />
          <ellipse cx="12" cy="18" rx="2.6" ry="3.4" {...p} />
          <rect x="10.5" y="8" width="3" height="8" rx="1.5" {...p} />
        </svg>
      );
    case 'crashpad':
      return (
        <svg {...s}>
          <rect x="4" y="7" width="16" height="10" rx="1.5" {...p} />
          <path d="M12 7v10" {...p} />
          <path d="M4 12h2M18 12h2" {...p} />
        </svg>
      );
    case 'brush':
      return (
        <svg {...s}>
          <rect x="7" y="14" width="10" height="4" rx="1.2" {...p} />
          <path d="M12 14V6" {...p} strokeWidth={2} />
          <path d="M9 18l-1 2M12 18v2M15 18l1 2" {...p} />
        </svg>
      );
    case 'rack':
      return (
        <svg {...s}>
          <circle cx="12" cy="9" r="3.4" {...p} />
          <path d="M12 12.4V20" {...p} strokeWidth={2} />
          <path d="M9 9a3 3 0 0 0 6 0" {...p} />
        </svg>
      );
    case 'sling':
      return (
        <svg {...s}>
          <path d="M9 4c-3 3-3 13 0 16M15 4c3 3 3 13 0 16" {...p} />
          <path d="M9 4h6M9 20h6" {...p} />
        </svg>
      );
    case 'helmet':
      return (
        <svg {...s}>
          <path d="M4 14a8 8 0 0 1 16 0" {...p} />
          <rect x="3.5" y="14" width="17" height="3" rx="1.5" {...p} />
          <path d="M12 6v2" {...p} />
        </svg>
      );
    case 'rope':
      return (
        <svg {...s}>
          <circle cx="12" cy="12" r="7" {...p} strokeWidth={2.4} />
          <circle cx="12" cy="12" r="3" {...p} />
        </svg>
      );
    case 'chalk':
      return (
        <svg {...s}>
          <path d="M7 9c0-1 2-2 5-2s5 1 5 2v8a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V9z" {...p} />
          <path d="M7 9c1 1.5 9 1.5 10 0" {...p} />
        </svg>
      );
    case 'shoes':
      return (
        <svg {...s}>
          <path d="M4 15c3 0 5-1 7-3s5-5 7-4c1 .5 1.5 3 1.5 5 0 1.5-.8 2-2 2H5c-.7 0-1-.4-1-1z" {...p} />
          <path d="M6 17v1M9 17v1M12 17v1" {...p} />
        </svg>
      );
    case 'tape':
      return (
        <svg {...s}>
          <circle cx="12" cy="12" r="7" {...p} />
          <circle cx="12" cy="12" r="3" {...p} />
        </svg>
      );
    case 'water':
      return (
        <svg {...s}>
          <path d="M9 4h6M10 4v2M14 4v2" {...p} />
          <rect x="8" y="6" width="8" height="14" rx="2.5" {...p} />
          <path d="M8 11h8" {...p} />
        </svg>
      );
    case 'snack':
      return (
        <svg {...s}>
          <rect x="5" y="8" width="14" height="8" rx="2" {...p} />
          <path d="M8 8v8M16 8v8" {...p} />
        </svg>
      );
    case 'sun':
      return (
        <svg {...s}>
          <circle cx="12" cy="12" r="4" {...p} />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M6 6l1.5 1.5M16.5 16.5L18 18M18 6l-1.5 1.5M7.5 16.5L6 18" {...p} />
        </svg>
      );
    case 'map':
      return (
        <svg {...s}>
          <path d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2V6z" {...p} />
          <path d="M9 4v14M15 6v14" {...p} />
        </svg>
      );
    case 'firstaid':
      return (
        <svg {...s}>
          <rect x="4" y="7" width="16" height="11" rx="2" {...p} />
          <path d="M12 9.5v6M9 12.5h6" {...p} strokeWidth={2} />
        </svg>
      );
    case 'poles':
      return (
        <svg {...s}>
          <path d="M9 4v16M15 4v16" {...p} strokeWidth={2} />
          <path d="M7.5 5h3M13.5 5h3" {...p} />
        </svg>
      );
    case 'headlamp':
      return (
        <svg {...s}>
          <rect x="7" y="9" width="10" height="6" rx="2" {...p} />
          <path d="M5 12h2M17 12h2M17 10l3-1M17 14l3 1" {...p} />
          <circle cx="12" cy="12" r="1.4" fill={OUT} />
        </svg>
      );
    case 'layers':
      return (
        <svg {...s}>
          <path d="M8 5l4 2 4-2 4 3-2 2-1-1v10H7V9L6 10 4 8l4-3z" {...p} />
          <path d="M12 7v13" {...p} />
        </svg>
      );
    default:
      return (
        <svg {...s}>
          <path d="M7 8h10l-1 11a2 2 0 0 1-2 1.8H10A2 2 0 0 1 8 19L7 8z" {...p} />
          <path d="M9.5 8V6a2.5 2.5 0 0 1 5 0v2" {...p} />
        </svg>
      );
  }
}
