import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { DnaCard } from '@/components/DnaCard';
import { getArchetype, getHouse } from '@/lib/quizMeta';
import { useAppStore } from '@/store/useAppStore';

/**
 * Full DNA card view, opened by tapping the profile's DNA banner
 * (Lucy 2026-10-20). Two nudges live here:
 *  - the OWNER has no card: if it's you, the take-the-test CTA is
 *    the whole point of the sheet; if it's someone else, it just
 *    explains the face-down card.
 *  - the VIEWER has no card (whatever profile they're browsing):
 *    a gold nudge to take the test and start collecting — every
 *    profile visit is a quiz funnel.
 */
export function DnaDetailSheet({
  archetypeId,
  displayName,
  isMe,
  open,
  onOpenChange,
}: {
  archetypeId?: string | null;
  displayName: string;
  isMe: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const me = useAppStore((s) => s.me);
  const arch = archetypeId ? getArchetype(archetypeId) : null;
  const house = arch ? getHouse(arch.house_id) : null;
  const viewerHasDna = !!me?.quiz_result_type;

  const takeTest = () => {
    window.open(
      `https://play.crux8.app?name=${encodeURIComponent(me?.display_name ?? '')}`,
      '_blank',
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="Climber DNA">
        <div className="px-1 pb-2">
          {arch ? (
            <>
              <DnaCard
                archetypeId={arch.id}
                footer={displayName}
                subFooter={house ? `${house.emoji} ${house.name}` : undefined}
                className="mx-auto max-w-[280px]"
              />
              {arch.tagline_en && (
                <p className="mt-4 text-center text-sm italic text-ink-600">“{arch.tagline_en}”</p>
              )}
              <p className="mt-2 text-center text-xs text-ink-500">
                Climb a session with {isMe ? 'your cruxmates' : displayName} and this card lands in
                the Vault.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto flex max-w-[280px] flex-col items-center rounded-[26px] border border-dashed border-[#C9A24B]/60 bg-[#12100C] px-5 py-8 text-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-[#C9A24B]/70 text-4xl font-black text-[#C9A24B]">
                  ?
                </span>
                <p className="mt-4 text-sm font-bold text-[#F5EFE0]">Still face-down</p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">
                  {isMe
                    ? 'Your Climber DNA card is waiting to be revealed. Take the 60-second test and it becomes the card your cruxmates collect from you.'
                    : `${displayName} hasn't taken the Climber DNA test yet — once they do, climbing together collects their card.`}
                </p>
              </div>
              {isMe && (
                <Button variant="punch" className="mt-4 w-full" onClick={takeTest}>
                  Reveal my DNA — take the test 🧬
                </Button>
              )}
            </>
          )}

          {/* Viewer nudge: browsing someone's card without owning one. */}
          {!isMe && arch && !viewerHasDna && (
            <div className="mt-5 rounded-2xl border border-[#C9A24B]/50 bg-brand-100 p-4">
              <p className="text-sm font-bold text-ink-900">Your card is still face-down too</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-600">
                Take the 60-second Climber DNA test to reveal your archetype — and start collecting
                cards like this one.
              </p>
              <Button variant="punch" className="mt-3 w-full" onClick={takeTest}>
                Take the test 🧬
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
