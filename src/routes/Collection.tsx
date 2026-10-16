import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { QUIZ_ARCHETYPES, QUIZ_HOUSES, getArchetype } from '@/lib/quizMeta';
import { DnaCard } from '@/components/DnaCard';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { resolveUser } from '@/lib/resolveUser';
import type { CollectedCard } from '@/seed/types';

/**
 * The Vault — the card collection's own home (Lucy 2026-10-15: Profile
 * carries only a progress summary; the collectibles live here).
 * All 15 DNA cards as Play-styled collectible objects, grouped by
 * house; collected cards open a detail sheet with every giver.
 */
export function Collection() {
  const nav = useNavigate();
  const me = useAppStore((s) => s.me);
  const users = useAppStore((s) => s.users);
  const directory = useAppStore((s) => s.directory);
  const collectedCards = useAppStore((s) => s.collectedCards);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const total = QUIZ_ARCHETYPES.length;
  const collectedByArchetype = new Map<string, CollectedCard[]>();
  for (const card of collectedCards) {
    const list = collectedByArchetype.get(card.archetype_id) ?? [];
    list.push(card);
    collectedByArchetype.set(card.archetype_id, list);
  }
  const collectedCount = QUIZ_ARCHETYPES.filter((a) => collectedByArchetype.has(a.id)).length;
  const pct = Math.round((collectedCount / total) * 100);

  const personName = (userId: string) =>
    me ? (resolveUser(userId, me, users, directory)?.display_name ?? 'Someone') : 'Someone';

  const selectedArch = selectedId ? getArchetype(selectedId) : null;
  const selectedCards = selectedId ? (collectedByArchetype.get(selectedId) ?? []) : [];
  const selectedSessions = selectedCards.reduce((n, c) => n + c.sessions_together, 0);

  return (
    <div>
      <button
        onClick={() => nav('/profile')}
        className="text-sm font-semibold text-ink-500 active:scale-[0.98] transition"
      >
        ← Profile
      </button>
      <h1 className="mt-2 text-2xl font-extrabold text-ink-900" style={{ fontFamily: 'Archivo, sans-serif' }}>
        The Vault 🃏
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Every climber DNA card you've collected — from cruxmates and sessions together.
      </p>

      {/* Set progress */}
      <div className="mt-4 rounded-[26px] bg-[#0d0d10] p-5 border border-[#C9A24B]/40">
        <div className="flex items-baseline justify-between">
          <p className="text-base font-extrabold text-[#F5EFE0]" style={{ fontFamily: 'Archivo, sans-serif' }}>
            {collectedCount} of {total} DNA cards
          </p>
          <p className="text-sm font-bold text-[#C9A24B]">{pct}%</p>
        </div>
        <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FFD97A] via-[#C9A24B] to-[#FF8A5C] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2.5 text-xs text-white/50">
          {collectedCount === total
            ? 'Collection complete! 🎉 Legend of the wall.'
            : `${total - collectedCount} to go — become cruxmates or climb a session together to collect a card.`}
        </p>
      </div>

      {/* My own card */}
      {me?.quiz_result_type && (
        <section className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
            Your card
          </h2>
          <DnaCard
            archetypeId={me.quiz_result_type}
            footer={me.display_name}
            subFooter="This is the card other climbers collect from you"
            className="mx-auto max-w-[300px]"
          />
        </section>
      )}

      {/* The set, by house */}
      {QUIZ_HOUSES.map((house) => {
        const archetypes = QUIZ_ARCHETYPES.filter((a) => a.house_id === house.id);
        const houseCollected = archetypes.filter((a) => collectedByArchetype.has(a.id)).length;
        return (
          <section key={house.id} className="mt-7">
            <div className="flex items-center gap-2.5 mb-3">
              <img
                src={`/covers/house-${house.id}.jpg`}
                alt=""
                className="h-9 w-14 rounded-lg object-cover border border-ink-100"
              />
              <p className="text-sm font-extrabold" style={{ color: house.color, fontFamily: 'Archivo, sans-serif' }}>
                {house.emoji} {house.name}
              </p>
              <span className="text-xs text-ink-400 font-semibold">
                {houseCollected}/{archetypes.length}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {archetypes.map((arch) => {
                const cards = collectedByArchetype.get(arch.id);
                const got = !!cards && cards.length > 0;
                const sessions = got ? cards.reduce((n, c) => n + c.sessions_together, 0) : 0;
                return (
                  <button
                    key={arch.id}
                    onClick={() => setSelectedId(arch.id)}
                    className="text-left active:scale-[0.98] transition"
                  >
                    <DnaCard
                      archetypeId={arch.id}
                      size="mini"
                      locked={!got}
                      footer={got ? `from ${personName(cards[0].user_id)}${cards.length > 1 ? ` +${cards.length - 1}` : ''}` : undefined}
                      subFooter={got && sessions > 1 ? `×${sessions} sessions together` : undefined}
                    />
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Card detail */}
      <Sheet open={!!selectedArch} onOpenChange={(o) => { if (!o) setSelectedId(null); }}>
        <SheetContent title=" ">
          {selectedArch && (
            <div>
              <DnaCard
                archetypeId={selectedArch.id}
                locked={selectedCards.length === 0}
                footer={
                  selectedCards.length > 0
                    ? `from ${personName(selectedCards[0].user_id)}${selectedCards.length > 1 ? ` +${selectedCards.length - 1}` : ''}`
                    : undefined
                }
                subFooter={
                  selectedCards.length > 0 && selectedSessions > 1
                    ? `×${selectedSessions} sessions together`
                    : undefined
                }
                className="mx-auto max-w-[300px]"
              />
              {selectedCards.length > 0 ? (
                <div className="mt-5 space-y-2">
                  {selectedCards.map((c) => (
                    <div
                      key={c.user_id}
                      className="flex items-center justify-between rounded-2xl border border-ink-100 bg-paper-100 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink-900 truncate">
                          {personName(c.user_id)}
                        </p>
                        <p className="text-[11px] text-ink-500">
                          {c.source === 'cruxmate' ? '🤝 Became cruxmates' : '🧗 Climbed together'} ·{' '}
                          {new Date(c.collected_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      {c.sessions_together > 1 && (
                        <span className="shrink-0 text-xs font-bold text-teal-600">
                          ×{c.sessions_together} sessions
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-center text-sm text-ink-500">
                  Find a {selectedArch.name_en} on the wall — climb a session together or follow
                  each other back to collect this card.
                </p>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
