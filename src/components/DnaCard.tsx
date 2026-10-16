import { getArchetype, getHouse } from '@/lib/quizMeta';
import { ArchetypeEmblem } from '@/components/ArchetypeEmblem';

/**
 * A climber DNA card as a collectible object, styled after the Crux8
 * Play result card (play.crux8.app): near-black body, gold-gradient
 * frame, letterspaced CRUX8 header, medallion emblem lit by a
 * house-color glow, archetype name in the house accent, tagline in
 * parchment. This is THE card everywhere — reveal, the Vault grid,
 * the Vault detail. `locked` renders the uncollected silhouette.
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
  const emblemPx = mini ? 84 : 148;

  return (
    <div
      className={`rounded-[26px] p-[3px] ${
        locked
          ? 'bg-gradient-to-br from-[#3a3a40] via-[#232329] to-[#101013]'
          : 'bg-gradient-to-br from-[#FFD97A] via-[#C9A24B] to-[#FF8A5C] shadow-[0_18px_44px_-12px_rgba(201,162,75,0.55)]'
      } ${className}`}
    >
      <div
        className={`relative overflow-hidden rounded-[23px] bg-[#0d0d10] text-center ${
          mini ? 'px-3 py-4' : 'px-5 py-6'
        }`}
      >
        {/* Diagonal sheen, same texture as the Play card back. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.10]"
          style={{
            background:
              'repeating-linear-gradient(135deg, transparent 0 14px, rgba(255,255,255,0.9) 14px 16px)',
          }}
          aria-hidden
        />
        <p className="relative text-[10px] font-extrabold tracking-[0.45em] text-[#C9A24B]">
          CRUX8
        </p>

        <div
          className="relative mx-auto mt-3"
          style={{ width: emblemPx, height: emblemPx }}
          aria-hidden
        >
          {!locked && (
            <div
              className="absolute inset-[8%] rounded-full blur-2xl"
              style={{ background: house.color, opacity: 0.35 }}
            />
          )}
          <ArchetypeEmblem
            archetypeId={arch.id}
            className={`relative h-full w-full drop-shadow-[0_10px_24px_rgba(0,0,0,0.5)] ${
              locked ? 'grayscale opacity-40' : ''
            }`}
            fallbackClassName={mini ? 'text-4xl' : 'text-6xl'}
          />
          {locked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className={`font-black text-[#C9A24B]/60 ${mini ? 'text-4xl' : 'text-6xl'}`}
                style={{ fontFamily: 'Archivo, sans-serif' }}
              >
                ?
              </span>
            </div>
          )}
        </div>

        <h3
          className={`relative mt-3 font-extrabold uppercase leading-tight ${
            mini ? 'text-[13px]' : 'text-xl'
          }`}
          style={{
            color: locked ? 'rgba(245,239,224,0.35)' : house.color,
            fontFamily: 'Archivo, sans-serif',
          }}
        >
          {arch.name_en}
        </h3>
        {locked ? (
          <p className="relative mt-1.5 text-[9px] font-bold tracking-[0.3em] text-white/30">
            NOT COLLECTED
          </p>
        ) : (
          <p
            className={`relative mt-1.5 text-[#F5EFE0] ${mini ? 'text-[11px] leading-snug' : 'text-sm'}`}
          >
            “{arch.tagline_en}”
          </p>
        )}

        <div className="relative mt-3">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white"
            style={{ background: locked ? 'rgba(255,255,255,0.10)' : house.color }}
          >
            {house.emoji} {house.name}
          </span>
        </div>

        {footer && (
          <p className="relative mt-3 text-xs font-semibold text-[#F5EFE0]/85 truncate">
            {footer}
          </p>
        )}
        {subFooter && (
          <p className="relative mt-0.5 text-[11px] text-white/45">{subFooter}</p>
        )}
      </div>
    </div>
  );
}
