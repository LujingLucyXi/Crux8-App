import { useAppStore } from '@/store/useAppStore';
import { QUIZ_ARCHETYPES, QUIZ_HOUSES } from '@/lib/quizMeta';
import { ArchetypeEmblem } from '@/components/ArchetypeEmblem';
import { resolveUser } from '@/lib/resolveUser';

/**
 * The DNA card collection — all 15 archetypes, grouped by house, with
 * set-completion progress (mirrors the play.crux8.app collection).
 * A card is "collected" once any cruxmate/session with that archetype
 * has given you their card; the tile names who it came from.
 */
export function CollectionBook() {
  const collectedCards = useAppStore((s) => s.collectedCards);
  const me = useAppStore((s) => s.me);
  const users = useAppStore((s) => s.users);
  const directory = useAppStore((s) => s.directory);

  const total = QUIZ_ARCHETYPES.length;
  const collectedByArchetype = new Map<string, typeof collectedCards>();
  for (const card of collectedCards) {
    const list = collectedByArchetype.get(card.archetype_id) ?? [];
    list.push(card);
    collectedByArchetype.set(card.archetype_id, list);
  }
  const collectedCount = QUIZ_ARCHETYPES.filter((a) => collectedByArchetype.has(a.id)).length;
  const pct = Math.round((collectedCount / total) * 100);

  const personName = (userId: string) =>
    me ? (resolveUser(userId, me, users, directory)?.display_name ?? 'Someone') : 'Someone';

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

      {/* Set progress */}
      <div className="rounded-2xl border border-ink-100 bg-paper-100 p-3.5 mb-4">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-bold text-ink-900">
            {collectedCount === total
              ? 'Collection complete! 🎉'
              : `${total - collectedCount} card${total - collectedCount === 1 ? '' : 's'} to go`}
          </p>
          <p className="text-xs font-semibold text-brand-600">{pct}%</p>
        </div>
        <div className="mt-2 h-2 rounded-full bg-ink-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-ink-500">
          Collect a climber's DNA card when you become cruxmates or climb a session together.
        </p>
      </div>

      {QUIZ_HOUSES.map((house) => {
        const archetypes = QUIZ_ARCHETYPES.filter((a) => a.house_id === house.id);
        const houseCollected = archetypes.filter((a) => collectedByArchetype.has(a.id)).length;
        return (
          <div key={house.id} className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <img
                src={`/covers/house-${house.id}.jpg`}
                alt=""
                className="h-6 w-9 rounded-md object-cover border border-ink-100"
              />
              <p className="text-xs font-bold text-ink-900">
                {house.emoji} {house.name}
              </p>
              <span className="text-[11px] text-ink-400 font-medium">
                {houseCollected}/{archetypes.length}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {archetypes.map((arch) => {
                const cards = collectedByArchetype.get(arch.id);
                const got = !!cards && cards.length > 0;
                const sessions = got
                  ? cards.reduce((n, c) => n + c.sessions_together, 0)
                  : 0;
                return (
                  <div
                    key={arch.id}
                    className="rounded-2xl p-3 text-center border"
                    style={
                      got
                        ? {
                            background: `linear-gradient(135deg, ${house.color}18, ${house.color}40)`,
                            borderColor: house.color,
                          }
                        : { background: '#faf8f2', borderColor: '#e5ddc8' }
                    }
                  >
                    <div className={`flex justify-center ${got ? '' : 'grayscale opacity-35'}`}>
                      <ArchetypeEmblem
                        archetypeId={arch.id}
                        className="h-12 w-12"
                        fallbackClassName="text-3xl"
                      />
                    </div>
                    <p
                      className={`mt-1 text-[11px] font-bold leading-tight ${
                        got ? 'text-ink-900' : 'text-ink-400'
                      }`}
                    >
                      {arch.name_en.replace(/^THE\s+/i, '')}
                    </p>
                    {got ? (
                      <>
                        <p className="text-[10px] text-ink-500 truncate">
                          from {personName(cards[0].user_id)}
                          {cards.length > 1 ? ` +${cards.length - 1}` : ''}
                        </p>
                        {sessions > 1 && (
                          <p className="mt-0.5 text-[10px] font-semibold text-teal-600">
                            ×{sessions} sessions
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-[10px] text-ink-400">Not collected yet</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
