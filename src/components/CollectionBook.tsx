import { useAppStore } from '@/store/useAppStore';
import { getArchetype, getHouse } from '@/lib/quizMeta';
import { resolveUser } from '@/lib/resolveUser';

/** Grid of DNA cards collected from cruxmates and sessions. */
export function CollectionBook() {
  const collectedCards = useAppStore((s) => s.collectedCards);
  const me = useAppStore((s) => s.me);
  const users = useAppStore((s) => s.users);
  const directory = useAppStore((s) => s.directory);

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
          Card collection 🃏
        </h2>
        {collectedCards.length > 0 && (
          <span className="text-[11px] text-ink-400 font-medium">
            {collectedCards.length} collected
          </span>
        )}
      </div>
      {collectedCards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 p-5 text-center">
          <p className="text-sm text-ink-700 font-medium">No cards yet</p>
          <p className="text-xs text-ink-500 mt-1">
            Add cruxmates or climb with someone to collect their DNA card.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          {collectedCards.map((card) => {
            const arch = getArchetype(card.archetype_id);
            const house = getHouse(card.house_id);
            const person = me ? resolveUser(card.user_id, me, users, directory) : undefined;
            return (
              <div
                key={card.user_id}
                className="rounded-2xl p-3 text-center border"
                style={{
                  background: house
                    ? `linear-gradient(135deg, ${house.color}18, ${house.color}40)`
                    : '#faf8f2',
                  borderColor: house?.color ?? '#e5ddc8',
                }}
              >
                <p className="text-3xl">{arch?.emoji ?? '🧬'}</p>
                <p className="mt-1 text-[11px] font-bold text-ink-900 leading-tight truncate">
                  {arch?.name_en ?? 'Mystery'}
                </p>
                <p className="text-[10px] text-ink-500 truncate">
                  {person?.display_name ?? 'Someone'}
                </p>
                {card.sessions_together > 1 && (
                  <p className="mt-0.5 text-[10px] font-semibold text-teal-600">
                    ×{card.sessions_together} sessions
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
