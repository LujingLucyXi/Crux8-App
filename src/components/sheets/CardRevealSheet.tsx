import { useEffect, useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { getArchetype, getHouse } from '@/lib/quizMeta';
import { resolveUser } from '@/lib/resolveUser';

/**
 * Full-screen celebration when a DNA card is collected.
 * Triggered by lastCollectedCard in the store; clears on dismiss.
 */
export function CardRevealSheet() {
  const lastCollectedCard = useAppStore((s) => s.lastCollectedCard);
  const clearLastCollectedCard = useAppStore((s) => s.clearLastCollectedCard);
  const me = useAppStore((s) => s.me);
  const users = useAppStore((s) => s.users);
  const directory = useAppStore((s) => s.directory);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (lastCollectedCard) setOpen(true);
  }, [lastCollectedCard]);

  const handleClose = (o: boolean) => {
    setOpen(o);
    if (!o) clearLastCollectedCard();
  };

  if (!lastCollectedCard) return null;
  const card = lastCollectedCard;
  const arch = getArchetype(card.archetype_id);
  const house = getHouse(card.house_id);
  const person = me ? resolveUser(card.user_id, me, users, directory) : undefined;
  const isRepeat = card.sessions_together > 1;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">
          {isRepeat ? 'Sessions together' : 'New card collected'}
        </p>
        <div
          className="mx-auto mt-4 w-48 rounded-3xl p-6 shadow-xl"
          style={{
            background: house
              ? `linear-gradient(135deg, ${house.color}22, ${house.color}55)`
              : 'linear-gradient(135deg, #f5f0e6, #e8dcc3)',
            border: `2px solid ${house?.color ?? '#d4c5a0'}`,
          }}
        >
          <p className="text-6xl">{arch?.emoji ?? '🧬'}</p>
          <h3 className="mt-3 text-lg font-bold text-ink-900">
            {arch?.name_en ?? 'Mystery Climber'}
          </h3>
          {house && (
            <span
              className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
              style={{ background: house.color }}
            >
              {house.emoji} {house.name}
            </span>
          )}
          <p className="mt-3 text-xs text-ink-500">
            {person?.display_name ?? 'Someone'}
            {isRepeat && ` · ${card.sessions_together} sessions together`}
          </p>
        </div>
        <p className="mt-4 text-sm text-ink-600">
          {isRepeat
            ? `Another session with ${person?.display_name ?? 'them'} — the bond grows.`
            : card.source === 'cruxmate'
              ? 'A new cruxmate, a new card for your collection.'
              : 'You climbed together — their card is yours.'}
        </p>
        <Button className="mt-5 w-full" onClick={() => handleClose(false)}>
          Add to collection
        </Button>
      </SheetContent>
    </Sheet>
  );
}
