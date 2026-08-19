import logoUrl from '@/assets/crux8.png';

/**
 * Crux8 logo — the carabiner figure-8 mark (from the brand artwork).
 * Rendered as a CSS mask so the exact artwork is recolorable (defaults to the
 * brand plum ink, flips to white on dark) and stays crisp + transparent on any
 * surface. The source art is portrait, so it's sized by height and centered.
 *
 * Backward-compatible props: old callers pass only `size`; legacy color props
 * are accepted and ignored so nothing breaks.
 */
const INK = '#2A2140';

export function Logo({
  size = 32,
  color = INK,
}: {
  size?: number;
  color?: string;
  /** legacy props kept so old callers don't break */
  bg?: string;
  bg2?: string;
  rock?: string;
  thrust?: string;
  tick?: string;
}) {
  return (
    <span
      role="img"
      aria-label="Crux8"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        backgroundColor: color,
        WebkitMaskImage: `url(${logoUrl})`,
        maskImage: `url(${logoUrl})`,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
      }}
    />
  );
}
