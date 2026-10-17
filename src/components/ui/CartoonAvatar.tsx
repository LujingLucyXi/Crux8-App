import { SKIN_HEX, HAIR_HEX, type AvatarConfig } from '@/lib/avatar';
import { cn } from '@/lib/utils';

/**
 * Production avatar — flat, bold-outline CARTOON face (same language as the
 * Go-Crux boulder mascot) inside a gold collectible ring. Reads the shared
 * AvatarConfig, so it's a drop-in behind <Avatar>. Deterministic, no network.
 */
const OUTLINE = '#262019'; // warm near-black ink (was plum #2A2140 — invisible against colored hair, but with jet-black hair everywhere it read as a purple fringe; Lucy 2026-10-16)
const SW = 2.6;

export type HairBucket = 'spikes' | 'bob' | 'bun' | 'buzz' | 'long' | 'bald';
export function hairBucket(hair: string): HairBucket {
  if (['bald', 'buzz'].includes(hair)) return hair as 'bald' | 'buzz';
  if (['mohawk', 'liberty', 'spikes', 'shaved', 'undercut'].includes(hair)) return 'spikes';
  if (['topknot', 'bun', 'spacebuns', 'ponytail'].includes(hair)) return 'bun';
  if (['long', 'wavy', 'braids', 'pigtails', 'curtains'].includes(hair)) return 'long';
  return 'bob';
}

const BACKDROP_HEX: Record<string, string> = {
  ink: '#FDE9C8',
  teal: '#CFF3EA',
  gold: '#FFE6A8',
  coral: '#FFD9D2',
  sky: '#D8E6FF',
  slate: '#EAE4FF',
};

export function CartoonAvatar({
  config,
  size = 72,
  className,
}: {
  config: AvatarConfig;
  size?: number;
  className?: string;
}) {
  const skin = SKIN_HEX[config.skin];
  const hairCol = HAIR_HEX[config.hairColor];
  const bg = BACKDROP_HEX[config.backdrop] ?? '#FDE9C8';
  const bucket = hairBucket(config.hair);
  const hatOn = config.accessory === 'beanie' || config.accessory === 'cap';
  // Length is its own trait (Lucy 2026-10-16); saved configs from
  // before it existed read as 'medium'.
  const len = config.hairLength ?? 'medium';

  const dot = (cx: number) => <circle cx={cx} cy="52" r="2.6" fill={OUTLINE} />;
  const eyes = (() => {
    switch (config.eyes) {
      case 'tired':
        return (
          <g stroke={OUTLINE} strokeWidth="2.6" strokeLinecap="round" fill="none">
            <path d="M38 53 q4 3 8 0" /><path d="M54 53 q4 3 8 0" />
          </g>
        );
      case 'stoked':
        return (
          <g stroke={OUTLINE} strokeWidth="2.6" strokeLinecap="round" fill="none">
            <path d="M38 54 l4 -4 l4 4" /><path d="M54 54 l4 -4 l4 4" />
          </g>
        );
      case 'wink':
        return (
          <g>
            {dot(42)}
            <path d="M54 53 q4 3 8 0" stroke={OUTLINE} strokeWidth="2.6" strokeLinecap="round" fill="none" />
          </g>
        );
      case 'shades':
        return (
          <g>
            <rect x="35" y="47" width="30" height="9" rx="4" fill={OUTLINE} />
            <rect x="37" y="49" width="10" height="4" rx="2" fill="#FFFFFF" opacity="0.35" />
          </g>
        );
      case 'deadpan':
        return (
          <g stroke={OUTLINE} strokeWidth="2.6" strokeLinecap="round">
            <path d="M38 52 h8" /><path d="M54 52 h8" />
          </g>
        );
      default:
        return (
          <g>
            {dot(42)}{dot(58)}
            <path d="M38 46 q4 -2 8 -1 M54 45 q4 -1 8 1" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
        );
    }
  })();

  // Hair art, keyed by the EXACT style (2026-10-16 expansion, Lucy:
  // "add more hairstyles — wavy, straight, double pony, braid etc").
  // Styles used to collapse into 6 buckets, so Wavy/Pigtails/Braids
  // all rendered as the same generic long hair. Each named style now
  // has its own silhouette; the bucket mapping remains only as a
  // fallback. Two layers: `back` (drawn under the face — caps, sides,
  // tails, braids) and `front` (drawn over the face — bangs fringe,
  // curtain swoops, a straight part line).
  // Frame rule: silhouettes stay inside the backdrop ring — the old
  // long path spilled past the ring at the bottom corners (Lucy:
  // "long hair runs out of the frame"); every path now keeps its
  // bottom at y<=80 and its sides inside the circle there.
  // Hats (beanie/cap) sit ON the hair: sides below the brim stay
  // visible; spikes flatten to buzz; buns tuck under.
  const HS = { fill: hairCol, stroke: OUTLINE, strokeWidth: SW, strokeLinejoin: 'round' as const };
  const CAP_D = 'M28 46 Q28 26 50 26 Q72 26 72 46 Q60 36 50 36 Q40 36 28 46 Z';
  const BUZZ_D = 'M28 44 Q30 26 50 26 Q70 26 72 44 Q60 36 50 36 Q40 36 28 44 Z';
  const SPIKES_D = 'M28 44 L30 24 L38 36 L44 20 L50 34 L56 20 L62 36 L70 24 L72 44 Q60 34 50 34 Q40 34 28 44 Z';
  // Length-parameterized silhouettes: short / medium / long bottoms.
  const bobD = (l: string) =>
    l === 'short'
      ? 'M26 52 Q24 28 50 26 Q76 28 74 52 Q70 45 64 45 L64 44 Q58 36 50 36 Q42 36 36 44 L36 45 Q30 45 26 52 Z'
      : l === 'long'
        ? 'M26 78 Q24 28 50 26 Q76 28 74 78 Q70 70 66 71 L66 44 Q58 36 50 36 Q42 36 34 44 L34 71 Q30 70 26 78 Z'
        : 'M26 58 Q24 28 50 26 Q76 28 74 58 Q70 50 64 50 L64 44 Q58 36 50 36 Q42 36 36 44 L36 50 Q30 50 26 58 Z';
  const drapeD = (l: string, straight: boolean) => {
    const B = l === 'short' ? (straight ? 62 : 63) : l === 'long' ? (straight ? 83.5 : 84) : straight ? 72 : 73;
    const IB = l === 'short' ? 57 : l === 'long' ? (straight ? 77 : 76) : straight ? 67 : 68;
    return straight
      ? `M27 ${B} L25 42 Q25 25 50 24 Q75 25 75 42 L73 ${B} Q68 ${IB} 66 ${IB} L66 44 Q58 36 50 36 Q42 36 34 44 L34 ${IB} Q32 ${IB} 27 ${B} Z`
      : `M26 ${B} Q22 32 50 25 Q78 32 74 ${B} Q70 ${IB - 3} 66 ${IB} L66 44 Q58 36 50 36 Q42 36 34 44 L34 ${IB} Q30 ${IB - 3} 26 ${B} Z`;
  };
  const LONG_D = drapeD(len, false);
  const tie = (cx: number, cy: number) => (
    <circle cx={cx} cy={cy} r="3.2" fill="#FF6B6B" stroke={OUTLINE} strokeWidth="2.4" />
  );

  const hairBack = (() => {
    switch (config.hair) {
      case 'bald':
        return null;
      case 'buzz':
        return <path d={BUZZ_D} {...HS} />;
      case 'mohawk':
      case 'liberty':
      case 'shaved':
      case 'undercut':
        return <path d={hatOn ? BUZZ_D : SPIKES_D} {...HS} />;
      case 'topknot':
        return (
          <g {...HS}>
            {!hatOn && <circle cx="50" cy="20" r="8" />}
            <path d={CAP_D} />
          </g>
        );
      case 'spacebuns':
        return (
          <g {...HS}>
            {!hatOn && <circle cx="32" cy="21" r="7" />}
            {!hatOn && <circle cx="68" cy="21" r="7" />}
            <path d={CAP_D} />
          </g>
        );
      case 'bob':
      case 'bangs':
      case 'curtain':
        // Back layer is the bob silhouette for all three; bangs and
        // curtains get their fringe from a front-layer dome (see
        // hairFront). A back-layer hairline can't work: the face is
        // drawn over the hair and covers everything below y34, which
        // is exactly where a fringe lives (v3's mistake — the fringe
        // hid under the face and both read as buzz cuts).
        return <path d={bobD(len)} {...HS} />;
      case 'long':
        return <path d={LONG_D} {...HS} />;
      case 'straight':
        return <path d={drapeD(len, true)} {...HS} />;
      case 'wavy': {
        const d =
          len === 'short'
            ? 'M26 62 Q20 54 26 47 Q23 27 50 25 Q77 27 74 47 Q80 54 74 62 Q70 55 66 57 L66 44 Q58 36 50 36 Q42 36 34 44 L34 57 Q30 55 26 62 Z'
            : len === 'long'
              ? 'M26 84 Q20 71 26 62 Q20 53 26 44 Q23 27 50 25 Q77 27 74 44 Q80 53 74 62 Q80 71 74 84 Q70 73 66 76 L66 44 Q58 36 50 36 Q42 36 34 44 L34 76 Q30 73 26 84 Z'
              : 'M26 73 Q20 64 26 56 Q20 48 26 41 Q23 27 50 25 Q77 27 74 41 Q80 48 74 56 Q80 64 74 73 Q70 64 66 66 L66 44 Q58 36 50 36 Q42 36 34 44 L34 66 Q30 64 26 73 Z';
        return <path d={d} {...HS} />;
      }
      case 'pigtails': {
        const TB = len === 'short' ? 58 : len === 'long' ? 79 : 68;
        return (
          <g>
            <g {...HS}>
              <path d={CAP_D} />
              <path d={`M28 44 Q15 50 17 ${TB} Q18 ${TB + 7} 25 ${TB + 5} Q29 ${TB - 6} 28 50 Z`} />
              <path d={`M72 44 Q85 50 83 ${TB} Q82 ${TB + 7} 75 ${TB + 5} Q71 ${TB - 6} 72 50 Z`} />
            </g>
            {tie(25, 47)}
            {tie(75, 47)}
          </g>
        );
      }
      case 'ponytail': {
        const d =
          len === 'short'
            ? 'M70 40 Q84 45 82 60 Q81 67 75 65 Q70 54 69 48 Z'
            : len === 'long'
              ? 'M70 40 Q84 47 80 74 Q79 80.5 73 77.5 Q69 60 69 48 Z'
              : 'M70 40 Q86 46 84 66 Q83 77 75 75 Q70 60 69 48 Z';
        return (
          <g>
            <path d={CAP_D} {...HS} />
            <path d={d} {...HS} />
            {tie(70, 42)}
          </g>
        );
      }
      case 'braids':
        // CLIMBER braid (v6): hair pulled back sleek in a cap; the
        // braid itself hangs over one shoulder (front layer). A small
        // gather wedge behind the jaw connects cap to braid.
        return (
          <g {...HS}>
            <path d={CAP_D} />
            <path d="M29 43 Q22 47 22.5 57 L34.5 57 Q34 48 29 43 Z" />
          </g>
        );
      case 'locs': {
        // Distinct ropes BESIDE the face, two capsules per side with
        // segment bumps; bottoms follow the length trait.
        const O = len === 'short' ? 58 : len === 'long' ? 80 : 74;
        const I = len === 'short' ? 62 : len === 'long' ? 82 : 77;
        const t1 = Math.round(40 + (O - 40) * 0.45);
        const t2 = Math.round(40 + (O - 40) * 0.75);
        const u1 = Math.round(38 + (I - 38) * 0.45);
        const u2 = Math.round(38 + (I - 38) * 0.75);
        return (
          <g>
            <g {...HS}>
              <path d={CAP_D} />
              <path d={`M17.5 40 Q16 52 17.5 ${O} Q20.5 ${O + 3} 23.5 ${O} Q24.5 52 23.5 40 Q20.5 37.5 17.5 40 Z`} />
              <path d={`M24 38 Q23 54 24 ${I} Q27 ${I + 3.5} 30 ${I} L30 42 Q27 37 24 38 Z`} />
              <path d={`M76 38 Q77 54 76 ${I} Q73 ${I + 3.5} 70 ${I} L70 42 Q73 37 76 38 Z`} />
              <path d={`M82.5 40 Q84 52 82.5 ${O} Q79.5 ${O + 3} 76.5 ${O} Q75.5 52 76.5 40 Q79.5 37.5 82.5 40 Z`} />
            </g>
            <g stroke={OUTLINE} strokeWidth="1.8" strokeLinecap="round" opacity="0.4" fill="none">
              <path d={`M17.8 ${t1} L23.2 ${t1}`} /><path d={`M17.8 ${t2} L23.2 ${t2}`} />
              <path d={`M24.2 ${u1} L29.8 ${u1}`} /><path d={`M24.2 ${u2} L29.8 ${u2}`} />
              <path d={`M70.2 ${u1} L75.8 ${u1}`} /><path d={`M70.2 ${u2} L75.8 ${u2}`} />
              <path d={`M76.8 ${t1} L82.2 ${t1}`} /><path d={`M76.8 ${t2} L82.2 ${t2}`} />
            </g>
          </g>
        );
      }
      case 'halfshave': {
        const PB = len === 'short' ? 60 : len === 'long' ? 82 : 71;
        return (
          <g>
            <path d={BUZZ_D} {...HS} />
            <path d={`M27 ${PB} Q21 46 29 29 Q35 40 35 ${PB - 7} Q31 ${PB - 9} 27 ${PB} Z`} {...HS} />
          </g>
        );
      }
      default:
        switch (bucket) {
          case 'spikes':
            return <path d={hatOn ? BUZZ_D : SPIKES_D} {...HS} />;
          case 'bun':
            return (
              <g {...HS}>
                {!hatOn && <circle cx="50" cy="20" r="8" />}
                <path d={CAP_D} />
              </g>
            );
          case 'long':
            return <path d={LONG_D} {...HS} />;
          case 'buzz':
            return <path d={BUZZ_D} {...HS} />;
          case 'bald':
            return null;
          default:
            return <path d={bobD(len)} {...HS} />;
        }
    }
  })();

  const hairFront = (() => {
    // Fringes are front-layer DOMES: the dome's outline coincides
    // with the back hair's cap (same fill, no seam), and only its
    // bottom edge — the fringe line — gets a stroke. A flat patch
    // floated like a headband (v2); a back-layer hairline hides under
    // the face (v3). The dome is the shape that survives both.
    // 'braids' also lives here: the French braid band sits ON the cap.
    switch (config.hair) {
      case 'braids': {
        // One clean braid over the left shoulder, v7 (Lucy: "more even
        // throughout, smooth visual, not lumpy and bumpy in width"):
        // an EVEN-width column with smooth, barely-tapered sides —
        // the weave is suggested by soft scale-arc seams, not by the
        // silhouette. Slim gold tie, small smooth tuft, center part.
        const cx = 28;
        const top = 51;
        const yB = len === 'short' ? 66 : len === 'long' ? 80 : 73;
        const d = `M${cx - 5.6} ${top} Q${cx} ${top - 3.4} ${cx + 5.6} ${top} L${cx + 5.3} ${yB} Q${cx} ${yB + 2.8} ${cx - 5.3} ${yB} Z`;
        const seam = (f: number) => {
          const y = top + (yB - top) * f;
          return `M${cx - 5.2} ${y} Q${cx} ${y + 3.6} ${cx + 5.2} ${y}`;
        };
        return (
          <g>
            <path d="M50 25.5 L50 33.5" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
            <path d={d} {...HS} />
            <g stroke={OUTLINE} strokeWidth="1.9" strokeLinecap="round" opacity="0.38" fill="none">
              <path d={seam(0.3)} />
              <path d={seam(0.58)} />
              <path d={seam(0.84)} />
            </g>
            <path
              d={`M${cx - 5.2} ${yB - 0.5} L${cx + 5.2} ${yB - 0.5} L${cx + 4.7} ${yB + 3} L${cx - 4.7} ${yB + 3} Z`}
              fill="#C9A24B" stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round"
            />
            <path d={`M${cx - 2.6} ${yB + 3} Q${cx - 1.8} ${yB + 7.4} ${cx} ${yB + 8.1} Q${cx + 2.4} ${yB + 7.2} ${cx + 2} ${yB + 3} Z`} {...HS} />
          </g>
        );
      }
      case 'bangs':
        return (
          <g>
            <path d="M36 43.5 L64 43.5 L64 40 Q64 26.5 50 26.5 Q36 26.5 36 40 Z" fill={hairCol} />
            <path d="M36 43.5 L64 43.5" stroke={OUTLINE} strokeWidth="2.6" strokeLinecap="round" />
            <g stroke={OUTLINE} strokeWidth="1.8" strokeLinecap="round" opacity="0.35">
              <path d="M42 40 L42 42.8" /><path d="M50 40 L50 42.8" /><path d="M58 40 L58 42.8" />
            </g>
          </g>
        );
      case 'curtain':
        return (
          <g>
            <path d="M36 44 Q43 37.5 47.5 39.5 Q50 40.8 50 44 Q50 40.8 52.5 39.5 Q57 37.5 64 44 L64 40 Q64 26.5 50 26.5 Q36 26.5 36 40 Z" fill={hairCol} />
            <path d="M36 44 Q43 37.5 47.5 39.5 Q50 40.8 50 44 Q50 40.8 52.5 39.5 Q57 37.5 64 44" fill="none" stroke={OUTLINE} strokeWidth="2.6" strokeLinecap="round" />
          </g>
        );
      case 'straight':
        return <path d="M50 25.5 L50 34" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" opacity="0.4" />;
      default:
        return null;
    }
  })();

  const accessory = (() => {
    switch (config.accessory) {
      case 'bandana':
        return <path d="M30 42 Q50 34 70 42 L70 48 Q50 42 30 48 Z" fill="#FF6B6B" stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round" />;
      case 'beanie':
        // Knit beanie, polished (2026-10-16): cream pom, a ribbed
        // darker brim band along the bottom edge, three rib ticks.
        // Drawn over the hair — hair below the brim stays visible.
        return (
          <g strokeLinejoin="round">
            <circle cx="50" cy="19" r="5.5" fill="#F3EAD8" stroke={OUTLINE} strokeWidth={SW} />
            <path d="M28 42 Q30 24 50 24 Q70 24 72 42 Z" fill="#7C3AED" stroke={OUTLINE} strokeWidth={SW} />
            <path d="M28.4 37.6 Q50 35.4 71.6 37.6 L72 42 L28 42 Z" fill="#5B21B6" />
            <g stroke="#5B21B6" strokeWidth="2" strokeLinecap="round" opacity="0.65">
              <path d="M39 36.8 L39.4 40.6" />
              <path d="M50 35.9 L50 40.4" />
              <path d="M61 36.8 L60.6 40.6" />
            </g>
          </g>
        );
      case 'cap':
        // Five-panel cap (2026-10-16): gold crown + a darker visor
        // band that wraps wider than the head. Hair rules match the
        // beanie (hatOn) — sides pour out below the visor.
        return (
          <g strokeLinejoin="round">
            <path d="M29 41 Q31 25 50 25 Q69 25 71 41 Z" fill="#C9A24B" stroke={OUTLINE} strokeWidth={SW} />
            <path d="M21 45 Q50 37 79 45 Q79 50.5 71 48.5 Q50 42.5 29 48.5 Q21 50.5 21 45 Z" fill="#A8823A" stroke={OUTLINE} strokeWidth={SW} />
          </g>
        );
      case 'headlamp':
        // Dawn-patrol headlamp (2026-10-16): ink strap over the hair,
        // volt lens. The strap is thin enough to sit over any style.
        return (
          <g strokeLinejoin="round">
            <path d="M28 41 Q50 35 72 41 L72 46 Q50 40 28 46 Z" fill="#262019" />
            <circle cx="50" cy="35.5" r="6" fill="#B4FF3A" opacity="0.25" />
            <rect x="43.5" y="30.5" width="13" height="10" rx="3" fill="#161310" stroke={OUTLINE} strokeWidth="2.4" />
            <circle cx="50" cy="35.5" r="3" fill="#B4FF3A" />
          </g>
        );
      case 'chalkdust':
        return (
          <g fill="#FFFFFF">
            <ellipse cx="64" cy="42" rx="5" ry="3.2" opacity="0.38" />
            <ellipse cx="33" cy="69" rx="4" ry="2.6" opacity="0.3" />
          </g>
        );
      case 'hoops':
        return (
          <g fill="none" stroke="#C9992F" strokeWidth="2.2">
            <circle cx="26.5" cy="58" r="3" />
            <circle cx="73.5" cy="58" r="3" />
          </g>
        );
      case 'gauges':
        return (
          <g>
            <circle cx="26.5" cy="58" r="3.2" fill={OUTLINE} />
            <circle cx="73.5" cy="58" r="3.2" fill={OUTLINE} />
            <circle cx="26.5" cy="58" r="1.2" fill="#F7F3EA" />
            <circle cx="73.5" cy="58" r="1.2" fill="#F7F3EA" />
          </g>
        );
      case 'shades':
        // Drawn after the eyes, so it sits over them like real sunglasses.
        return (
          <g>
            <rect x="33" y="47" width="34" height="9" rx="4.5" fill={OUTLINE} />
            <rect x="35.5" y="49" width="10" height="3.5" rx="2" fill="#FFFFFF" opacity="0.35" />
          </g>
        );
      default:
        return null;
    }
  })();

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={cn(className)} aria-label="avatar">
      {/* gold collectible ring */}
      <circle cx="50" cy="50" r="48" fill="#E9B84B" />
      <circle cx="50" cy="50" r="48" fill="none" stroke="#C9992F" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="43" fill={bg} stroke={OUTLINE} strokeWidth="2" />

      {hairBack}

      <path d="M28 52 Q28 34 50 34 Q72 34 72 52 Q72 72 50 74 Q28 72 28 52 Z"
        fill={skin} stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round" />

      {/* soft gloss on the backdrop, upper-left (collectible feel) */}
      <path d="M19 31 A35 35 0 0 1 33 18" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" opacity="0.3" />

      <ellipse cx="36" cy="60" rx="4" ry="2.6" fill="#FF6B6B" opacity="0.4" />
      <ellipse cx="64" cy="60" rx="4" ry="2.6" fill="#FF6B6B" opacity="0.4" />

      {/* a whisper of a nose — grounds the face (and the nose ring) */}
      <path d="M50 56 q2.6 3.2 0 5.4" fill="none" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" opacity="0.5" />

      {hairFront}

      {eyes}
      {accessory}

      {config.eyes === 'stoked'
        ? <path d="M42 64 Q50 72 58 64" fill="none" stroke={OUTLINE} strokeWidth="2.6" strokeLinecap="round" />
        : <path d="M43 64 Q50 69 57 64" fill="none" stroke={OUTLINE} strokeWidth="2.6" strokeLinecap="round" />}
    </svg>
  );
}
