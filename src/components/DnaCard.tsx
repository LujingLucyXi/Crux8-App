import { getArchetype, getHouse } from '@/lib/quizMeta';
import { ArchetypeEmblem } from '@/components/ArchetypeEmblem';

/**
 * A climber DNA card as a collectible object. Design lineage: the
 * Crux8 Play result card's medallion + gold frame, on a bright
 * golden-tone body (Lucy 2026-10-15: filled gold and brighter — the
 * near-black body read dull, and stripe textures read as a card BACK,
 * so neither survives here). Ink text on the gold; the house speaks
 * through the medallion's glow and the house pill. This is THE card
 * everywhere — reveal, the Vault grid, the Vault detail. `locked`
 * renders the uncollected silhouette in dull parchment-gray.
 */
export function DnaCard({
  archetypeId,
  footer,
  subFooter,
  locked = false,
  size = 'full',
  className = '',
}: {
  archetypeId: string;
  footer?: string;
  subFooter?: string;
  locked?: boolean;
  size?: 'full' | 'mini';
  className?: string;
}) {
  const arch = getArchetype(archetypeId);
  const house = arch ? getHouse(arch.house_id) : null;
  if (!arch || !house) return null;
  const mini = size === 'mini';
  const emblemPx = mini ? 84 : 192;

  return (
    <div
      className={`rounded-[26px] p-[3px] ${
        locked
          ? 'bg-gradient-to-br from-[#B9B29A] via-[#A39C85] to-[#8A8471]'
          : 'bg-gradient-to-br from-[#FFE9A8] via-[#C9A24B] to-[#B07E2B] shadow-[0_18px_44px_-12px_rgba(201,162,75,0.65)]'
      } ${className}`}
    >
      <div
        className={`relative overflow-hidden rounded-[23px] text-center ${
          mini ? 'px-2 py-3' : 'px-5 py-6'
        }`}
        style={{
          background: locked
            ? 'linear-gradient(165deg, #E9E3D0 0%, #D9D2BA 55%, #C4BC9F 100%)'
            : 'linear-gradient(165deg, #F9E29A 0%, #EFC95E 48%, #DFAF37 100%)',
        }}
      >
        <p
          className={`relative font-extrabold tracking-[0.45em] ${
            mini ? 'text-[8px]' : 'text-[10px]'
          }`}
          style={{ color: locked ? 'rgba(22,19,16,0.35)' : '#7A5B14' }}
        >
          CRUX8
        </p>

        <div
          className="relative mx-auto mt-2.5"
          style={{ width: emblemPx, height: emblemPx }}
          aria-hidden
        >
          {!locked && (
            <div
              className="absolute inset-[8%] rounded-full blur-2xl"
              style={{ background: house.color, opacity: 0.45 }}
            />
          )}
          <ArchetypeEmblem
            archetypeId={arch.id}
            className={`relative h-full w-full drop-shadow-[0_10px_20px_rgba(90,60,0,0.35)] ${
              locked ? 'grayscale opacity-40' : ''
            }`}
            fallbackClassName={mini ? 'text-3xl' : 'text-6xl'}
          />
          {locked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className={`font-black ${mini ? 'text-3xl' : 'text-6xl'}`}
                style={{ color: 'rgba(22,19,16,0.30)', fontFamily: 'Archivo, sans-serif' }}
              >
                ?
              </span>
            </div>
          )}
        </div>

        <h3
          className={`relative mt-2.5 font-extrabold uppercase leading-tight ${
            mini ? 'text-[11px]' : 'text-xl'
          }`}
          style={{
            color: locked ? 'rgba(22,19,16,0.35)' : '#161310',
            fontFamily: 'Archivo, sans-serif',
          }}
        >
          {arch.name_en}
        </h3>
        {locked ? (
          <p className="relative mt-1 text-[8px] font-bold tracking-[0.25em] text-[#161310]/35">
            NOT COLLECTED
          </p>
        ) : (
          !mini && (
            <p className="relative mt-1.5 text-sm" style={{ color: 'rgba(22,19,16,0.82)' }}>
              “{arch.tagline_en}”
            </p>
          )
        )}

        {!mini && (
          <div className="relative mt-3">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white"
              style={{ background: locked ? 'rgba(22,19,16,0.18)' : house.color }}
            >
              {house.emoji} {house.name}
            </span>
          </div>
        )}

        {footer && (
          <p
            className={`relative font-semibold truncate ${
              mini ? 'mt-1.5 text-[10px]' : 'mt-3 text-xs'
            }`}
            style={{ color: 'rgba(22,19,16,0.85)' }}
          >
            {footer}
          </p>
        )}
        {subFooter && (
          <p
            className={`relative ${mini ? 'text-[9px]' : 'mt-0.5 text-[11px]'}`}
            style={{ color: 'rgba(22,19,16,0.55)' }}
          >
            {subFooter}
          </p>
        )}
      </div>
    </div>
  );
}
