import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { QUIZ_ARCHETYPES } from '@/lib/quizMeta';
import { ArchetypeEmblem } from '@/components/ArchetypeEmblem';

/**
 * Profile summary for the card collection (Lucy 2026-10-15: the full
 * collectible set made Profile crowded — Profile shows progress only,
 * the cards themselves live in the Vault at /collection).
 */
export function CollectionBook() {
  const nav = useNavigate();
  const collectedCards = useAppStore((s) => s.collectedCards);

  const total = QUIZ_ARCHETYPES.length;
  const collectedArchetypes = new Set(collectedCards.map((c) => c.archetype_id));
  const collectedCount = QUIZ_ARCHETYPES.filter((a) => collectedArchetypes.has(a.id)).length;
  const pct = Math.round((collectedCount / total) * 100);
  const preview = QUIZ_ARCHETYPES.filter((a) => collectedArchetypes.has(a.id)).slice(0, 5);

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
          Card collection 🃏
        </h2>
        <span className="text-[11px] text-ink-400 font-medium">
          {collectedCount} of {total} DNA cards
        </span>
      </div>
      <button
        onClick={() => nav('/collection')}
        className="w-full text-left rounded-[26px] bg-[#0d0d10] p-4 border border-[#C9A24B]/40 active:scale-[0.99] transition"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-extrabold text-[#F5EFE0]" style={{ fontFamily: 'Archivo, sans-serif' }}>
            {collectedCount === total
              ? 'Collection complete! 🎉'
              : `${total - collectedCount} card${total - collectedCount === 1 ? '' : 's'} to go`}
          </p>
          <p className="text-xs font-bold text-[#C9A24B]">{pct}%</p>
        </div>
        <div className="mt-2.5 h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FFD97A] via-[#C9A24B] to-[#FF8A5C] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex -space-x-2">
            {preview.length > 0 ? (
              preview.map((a) => (
                <ArchetypeEmblem
                  key={a.id}
                  archetypeId={a.id}
                  className="h-8 w-8 ring-2 ring-[#0d0d10]"
                  fallbackClassName="text-lg"
                />
              ))
            ) : (
              <span className="text-xs text-white/40">No cards yet — your vault awaits</span>
            )}
          </div>
          <span className="text-sm font-bold text-[#C9A24B]">Enter the vault →</span>
        </div>
      </button>
    </section>
  );
}
