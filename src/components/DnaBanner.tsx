import { getArchetype, getHouse } from '@/lib/quizMeta';
import { ArchetypeEmblem } from '@/components/ArchetypeEmblem';

/**
 * The DNA identity banner (Lucy 2026-10-20): a climber's archetype
 * shown as a distinctive golden identity strip on profiles — the
 * mini collectible card, not a text line — so people recognize who
 * they're looking at by their card. Tapping opens the full card.
 * No archetype yet = the face-down state: a dark slot with a gold ?
 * medallion, same size, same place (identity slot stays constant).
 */
export function DnaBanner({
  archetypeId,
  onClick,
}: {
  archetypeId?: string | null;
  onClick?: () => void;
}) {
  const arch = archetypeId ? getArchetype(archetypeId) : null;
  const house = arch ? getHouse(arch.house_id) : null;

  if (!arch) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center gap-3 rounded-[22px] border border-dashed border-[#C9A24B]/50 bg-[#12100C] px-4 py-3 text-left active:scale-[0.99] transition"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-[#C9A24B]/70 text-2xl font-black text-[#C9A24B]">
          ?
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9A24B]">
            Climber DNA
          </span>
          <span className="block mt-0.5 text-sm font-bold text-[#F5EFE0]">Not revealed yet</span>
          <span className="block text-xs text-white/50">
            This card is still face-down — tap to see how it works.
          </span>
        </span>
        <span className="text-[#C9A24B] text-lg">›</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-[22px] p-[2px] text-left active:scale-[0.99] transition shadow-[0_14px_34px_-12px_rgba(201,162,75,0.55)]"
      style={{ background: 'linear-gradient(135deg, #FFE9A8, #C9A24B 55%, #B07E2B)' }}
    >
      <span
        className="flex flex-1 items-center gap-3 rounded-[20px] px-4 py-3"
        style={{ background: 'linear-gradient(165deg, #F9E29A 0%, #EFC95E 48%, #DFAF37 100%)' }}
      >
        <ArchetypeEmblem archetypeId={arch.id} className="h-14 w-14 shrink-0" fallbackClassName="text-4xl" />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-[#7A5B14]">
            Climber DNA
          </span>
          <span
            className="block mt-0.5 truncate text-base font-extrabold text-[#161310]"
            style={{ fontFamily: 'Archivo, sans-serif' }}
          >
            {arch.name_en}
          </span>
          {arch.tagline_en && (
            <span className="block truncate text-xs italic text-[#5C4712]">“{arch.tagline_en}”</span>
          )}
          {house && (
            <span
              className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
              style={{ background: house.color }}
            >
              {house.emoji} {house.name}
            </span>
          )}
        </span>
        <span className="text-[#7A5B14] text-lg">›</span>
      </span>
    </button>
  );
}
