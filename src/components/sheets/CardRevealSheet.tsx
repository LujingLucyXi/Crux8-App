import { useEffect, useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { DnaCard } from '@/components/DnaCard';
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
  const person = me ? resolveUser(card.user_id, me, users, directory) : undefined;
  const isRepeat = card.sessions_together > 1;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">
          {isRepeat ? 'Sessions together' : 'New card collected'}
        </p>
        <div className="mx-auto mt-4 w-64 max-w-full">
          <DnaCard
            archetypeId={card.archetype_id}
            footer={person?.display_name ?? 'Someone'}
            subFooter={isRepeat ? `${card.sessions_together} sessions together` : undefined}
          />
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
