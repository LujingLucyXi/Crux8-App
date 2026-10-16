import { SKIN_HEX, HAIR_HEX, type AvatarConfig } from '@/lib/avatar';
import { cn } from '@/lib/utils';

/**
 * Production avatar — flat, bold-outline CARTOON face (same language as the
 * Go-Crux boulder mascot) inside a gold collectible ring. Reads the shared
 * AvatarConfig, so it's a drop-in behind <Avatar>. Deterministic, no network.
 */
const OUTLINE = '#2A2140';
const SW = 3.5;

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

  const dot = (cx: number) => <circle cx={cx} cy="52" r="2.6" fill={OUTLINE} />;
  const eyes = (() => {
    switch (config.eyes) {
      case 'tired':
        return (
          <g stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M38 53 q4 3 8 0" /><path d="M54 53 q4 3 8 0" />
          </g>
        );
      case 'stoked':
        return (
          <g stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M38 54 l4 -4 l4 4" /><path d="M54 54 l4 -4 l4 4" />
          </g>
        );
      case 'wink':
        return (
          <g>
            {dot(42)}
            <path d="M54 53 q4 3 8 0" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" fill="none" />
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
          <g stroke={OUTLINE} strokeWidth="3" strokeLinecap="round">
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
  const BOB_D = 'M26 58 Q24 28 50 26 Q76 28 74 58 Q70 50 64 50 L64 44 Q58 36 50 36 Q42 36 36 44 L36 50 Q30 50 26 58 Z';
  const BUZZ_D = 'M28 44 Q30 26 50 26 Q70 26 72 44 Q60 36 50 36 Q40 36 28 44 Z';
  const SPIKES_D = 'M28 44 L30 24 L38 36 L44 20 L50 34 L56 20 L62 36 L70 24 L72 44 Q60 34 50 34 Q40 34 28 44 Z';
  const LONG_D = 'M26 80 Q22 32 50 25 Q78 32 74 80 Q70 69 66 72 L66 44 Q58 36 50 36 Q42 36 34 44 L34 72 Q30 69 26 80 Z';
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
        return <path d={BOB_D} {...HS} />;
      case 'curtain':
        return <path d="M27 54 Q25 28 50 26 Q75 28 73 54 Q68 47 64 48 L64 44 Q58 36 50 36 Q42 36 36 44 L36 48 Q32 47 27 54 Z" {...HS} />;
      case 'long':
        return <path d={LONG_D} {...HS} />;
      case 'straight':
        return <path d="M27 79 L25 42 Q25 25 50 24 Q75 25 75 42 L73 79 Q68 73 66 73 L66 44 Q58 36 50 36 Q42 36 34 44 L34 73 Q32 73 27 79 Z" {...HS} />;
      case 'wavy':
        return <path d="M26 80 Q20 68 26 59 Q20 50 26 42 Q23 27 50 25 Q77 27 74 42 Q80 50 74 59 Q80 68 74 80 Q70 69 66 72 L66 44 Q58 36 50 36 Q42 36 34 44 L34 72 Q30 69 26 80 Z" {...HS} />;
      case 'pigtails':
        return (
          <g>
            <g {...HS}>
              <path d={CAP_D} />
              <path d="M28 44 Q15 50 17 70 Q18 79 25 77 Q29 64 28 50 Z" />
              <path d="M72 44 Q85 50 83 70 Q82 79 75 77 Q71 64 72 50 Z" />
            </g>
            {tie(25, 47)}
            {tie(75, 47)}
          </g>
        );
      case 'ponytail':
        return (
          <g>
            <path d={CAP_D} {...HS} />
            <path d="M70 40 Q86 46 84 66 Q83 77 75 75 Q70 60 69 48 Z" {...HS} />
            {tie(70, 42)}
          </g>
        );
      case 'braids':
        // Hair pulled back in a clean cap; the braid itself is drawn
        // in the FRONT layer (over the cheek's edge, emerging from the
        // temple) — in the back layer its top hid behind the face and
        // it read as a plank stuck to the side of the head.
        return <path d={CAP_D} {...HS} />;
      case 'locs':
        // Distinct ropes BESIDE the face (the first pass hid most of
        // each strand behind the face, reading as sideburn smudges):
        // two capsules per side with segment bumps, staggered lengths.
        return (
          <g>
            <g {...HS}>
              <path d={CAP_D} />
              <path d="M17.5 40 Q16 58 17.5 74 Q20.5 77 23.5 74 Q24.5 56 23.5 40 Q20.5 37.5 17.5 40 Z" />
              <path d="M24 38 Q23 58 24 77 Q27 80.5 30 77 L30 42 Q27 37 24 38 Z" />
              <path d="M76 38 Q77 58 76 77 Q73 80.5 70 77 L70 42 Q73 37 76 38 Z" />
              <path d="M82.5 40 Q84 58 82.5 74 Q79.5 77 76.5 74 Q75.5 56 76.5 40 Q79.5 37.5 82.5 40 Z" />
            </g>
            <g stroke={OUTLINE} strokeWidth="1.8" strokeLinecap="round" opacity="0.4" fill="none">
              <path d="M17.8 50 L23.2 50" /><path d="M17.8 61 L23.2 61" />
              <path d="M24.2 51 L29.8 51" /><path d="M24.2 64 L29.8 64" />
              <path d="M70.2 51 L75.8 51" /><path d="M70.2 64 L75.8 64" />
              <path d="M76.8 50 L82.2 50" /><path d="M76.8 61 L82.2 61" />
            </g>
          </g>
        );
      case 'halfshave':
        return (
          <g>
            <path d={BUZZ_D} {...HS} />
            <path d="M27 80 Q21 46 29 29 Q35 40 35 73 Q31 71 27 80 Z" {...HS} />
          </g>
        );
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
            return <path d={BOB_D} {...HS} />;
        }
    }
  })();

  const hairFront = (() => {
    // Fringe masses MERGE with the cap: same fill, no outline of their
    // own (an outlined shape floating on the forehead read as a band /
    // two blobs — Lucy's "bangs, curtains have problem" note). Only the
    // bottom edge gets a stroked line, like a real hairline.
    switch (config.hair) {
      case 'bangs':
        return (
          <g>
            <path d="M29 30 Q50 25.5 71 30 L71 43.5 Q50 39 29 43.5 Z" fill={hairCol} />
            <path d="M29 43.5 Q50 39 71 43.5" fill="none" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
            <g stroke={OUTLINE} strokeWidth="1.8" strokeLinecap="round" opacity="0.35">
              <path d="M40 40.2 L40 42.8" /><path d="M50 38.8 L50 41.6" /><path d="M60 40.2 L60 42.8" />
            </g>
          </g>
        );
      case 'curtain':
        return (
          <g>
            <path d="M29 30 Q50 25.5 71 30 L71 39 Q64.5 46.5 56 44.5 Q51 43 50 37.5 Q49 43 44 44.5 Q35.5 46.5 29 39 Z" fill={hairCol} />
            <path d="M29 39 Q35.5 46.5 44 44.5 Q49 43 50 37.5 Q51 43 56 44.5 Q64.5 46.5 71 39" fill="none" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
          </g>
        );
      case 'straight':
        return <path d="M50 25.5 L50 34" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" opacity="0.4" />;
      case 'braids':
        // ONE tight side braid, country-girl style (Lucy 2026-10-16):
        // emerges from the left temple and lies over the cheek's edge —
        // chevron weave, coral tie band, small tail tuft.
        return (
          <g>
            <path d="M24 40 Q21 56 23 71 Q27 76 32 72 Q34 56 33 41 Q28.5 36.5 24 40 Z" {...HS} />
            <g stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" opacity="0.45" fill="none">
              <path d="M23.5 47 L28.2 51.5 L33 47" />
              <path d="M23.3 54.5 L28.2 59 L32.8 54.5" />
              <path d="M23.5 62 L28.2 66.5 L32.5 62" />
            </g>
            <path d="M23.2 68.5 L32.8 68.5 L32.2 73 L23.8 73 Z" fill="#FF6B6B" stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M25 73 Q26 80.5 28.5 81.5 Q31.5 80 30.5 73 Z" {...HS} />
          </g>
        );
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
            <path d="M28 41 Q50 35 72 41 L72 46 Q50 40 28 46 Z" fill="#2A2140" />
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
        ? <path d="M42 64 Q50 72 58 64" fill="none" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
        : <path d="M43 64 Q50 69 57 64" fill="none" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />}
    </svg>
  );
}
