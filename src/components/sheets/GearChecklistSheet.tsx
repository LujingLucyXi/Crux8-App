import { useMemo } from 'react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { gearFor } from '@/lib/gear';
import type { Session } from '@/seed/types';

interface Props {
  session: Session | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GearChecklistSheet({ session, open, onOpenChange }: Props) {
  const gear = useMemo(() => (session ? gearFor(session.category) : { required: [], recommended: [] }), [session]);
  const gearChecklists = useAppStore((s) => s.gearChecklists);
  const updateGearChecklist = useAppStore((s) => s.updateGearChecklist);
  const unrsvp = useAppStore((s) => s.unrsvp);

  const checklist = session ? gearChecklists[session.id] ?? {} : {};

  if (!session) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={`Gear for ${session.title}`}>
        <p className="text-sm text-ink-500 -mt-2 mb-4">
          Check what you're bringing. Your list saves as you go.
        </p>

        <section className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-4 rounded-full bg-coral-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">Required</h3>
          </div>
          <ul className="flex flex-col gap-2 pl-3 border-l-2 border-coral-100">
            {gear.required.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <Checkbox
                  id={`gear-req-${item}`}
                  checked={!!checklist[item]}
                  onCheckedChange={(v) => updateGearChecklist(session.id, item, !!v)}
                />
                <label htmlFor={`gear-req-${item}`} className="text-sm text-ink-900 cursor-pointer">
                  {item}
                </label>
              </li>
            ))}
            {gear.required.length === 0 && (
              <li className="text-xs text-ink-500">Host will share gear notes.</li>
            )}
          </ul>
        </section>

        {gear.recommended.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-4 rounded-full bg-ink-100" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">Recommended</h3>
            </div>
            <ul className="flex flex-col gap-2 pl-3 border-l-2 border-ink-100">
              {gear.recommended.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <Checkbox
                    id={`gear-rec-${item}`}
                    checked={!!checklist[item]}
                    onCheckedChange={(v) => updateGearChecklist(session.id, item, !!v)}
                  />
                  <label htmlFor={`gear-rec-${item}`} className="text-sm text-ink-700 cursor-pointer">
                    {item}
                  </label>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex flex-col gap-2">
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
