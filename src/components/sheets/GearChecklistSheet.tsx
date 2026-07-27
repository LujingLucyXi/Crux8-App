import { useMemo } from 'react';
import { Check } from 'iconoir-react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { gearFor } from '@/lib/gear';
import { GearGlyph } from '@/components/gear/GearGlyph';
import type { Session } from '@/seed/types';
import { cn } from '@/lib/utils';

interface Props {
  session: Session | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * When provided, the sheet acts as a PRE-RSVP gate: it shows the gear a
   * climber needs to know about before committing, and the primary button
   * confirms the RSVP. Without it, the sheet is the post-join review.
   */
  onConfirm?: () => void;
}

export function GearChecklistSheet({ session, open, onOpenChange, onConfirm }: Props) {
  const gear = useMemo(() => (session ? gearFor(session.category) : { required: [], recommended: [] }), [session]);
  const gearChecklists = useAppStore((s) => s.gearChecklists);
  const updateGearChecklist = useAppStore((s) => s.updateGearChecklist);
  const unrsvp = useAppStore((s) => s.unrsvp);

  const checklist = session ? gearChecklists[session.id] ?? {} : {};
  const preRsvp = typeof onConfirm === 'function';

  if (!session) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="Check what you're bringing">
        <p className="text-sm text-ink-500 -mt-2 mb-4">
          {preRsvp
            ? `Tap what you've got for ${session.title}, then join.`
            : `Tap what you've packed for ${session.title}.`}
        </p>

        {/* Bringing — tap-to-toggle tiles with a cute glyph each */}
        <ul className="grid grid-cols-1 gap-2 mb-5">
          {gear.required.map((item) => {
            const on = !!checklist[item];
            return (
              <li key={item}>
                <button
                  onClick={() => updateGearChecklist(session.id, item, !on)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-2xl border p-2.5 pr-3 text-left transition-colors',
                    on ? 'bg-teal-100 border-teal-600' : 'bg-white border-ink-100 hover:border-ink-300',
                  )}
                >
                  <GearGlyph item={item} />
                  <span className={cn('flex-1 text-sm', on ? 'text-ink-900 font-medium' : 'text-ink-900')}>
                    {item}
                  </span>
                  <span
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center border shrink-0',
                      on ? 'bg-teal-600 border-teal-600' : 'border-ink-300',
                    )}
                  >
                    {on && <Check width={14} height={14} strokeWidth={3} color="white" />}
                  </span>
                </button>
              </li>
            );
          })}
          {gear.required.length === 0 && (
            <li className="text-xs text-ink-500">Host will share gear notes.</li>
          )}
        </ul>

        {/* Recommended — a plain "nice to have" hint, not a checklist */}
        {gear.recommended.length > 0 && (
          <p className="text-xs text-ink-500 mb-6 leading-relaxed">
            <span className="font-semibold text-ink-700">Nice to have:</span>{' '}
            {gear.recommended.join(' · ')}
          </p>
        )}

        <div className="flex flex-col gap-2">
          {preRsvp ? (
            <>
              <Button
                className="bg-teal-600 hover:bg-teal-500 border-teal-600"
                onClick={() => {
                  onConfirm?.();
                  onOpenChange(false);
                }}
              >
                Confirm & RSVP
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Not now
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => onOpenChange(false)}>Save & close</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  unrsvp(session.id);
                  onOpenChange(false);
                }}
              >
                Not going after all
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
