import { useState } from 'react';
import { toast } from 'sonner';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { useAppStore } from '@/store/useAppStore';
import type { Gym } from '@/seed/types';

/**
 * "Don't see your gym?" — users suggest a gym that's missing from the
 * list. Suggestions are stored locally and (for signed-in users with real
 * uuid ids) inserted into the gym_suggestions table for review.
 *
 * When the caller passes `disciplines` + `onAdded`, the suggested gym is
 * also added to the user's local gym list on the spot and `onAdded` fires
 * with its id, so the form they were filling in gets the new gym filled
 * in immediately instead of dead-ending at "we'll review it".
 */
export function SuggestGymSheet({
  open,
  onOpenChange,
  disciplines,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  disciplines?: Gym['disciplines'];
  onAdded?: (gymId: string) => void;
}) {
  const suggestGym = useAppStore((s) => s.suggestGym);
  const addLocalGym = useAppStore((s) => s.addLocalGym);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const n = name.trim();
    if (!n) return;
    setSending(true);
    await suggestGym(n, city.trim(), note.trim());
    if (disciplines && onAdded) {
      const gym = addLocalGym(n, city.trim(), disciplines);
      onAdded(gym.id);
      toast.success('Added — it\u2019s selected in your form.');
    } else {
      toast.success('Thanks! We\u2019ll review it and add it to the list.');
    }
    setSending(false);
    setName('');
    setCity('');
    setNote('');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <div className="flex flex-col gap-4 pb-6">
          <div>
            <h3 className="font-display text-lg font-bold text-ink-900">Suggest a gym</h3>
            <p className="mt-0.5 text-sm text-ink-500">
              Missing a climbing gym from the list? Tell us and we&apos;ll add it.
            </p>
          </div>
          <div>
            <Label>Gym name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 80))}
              placeholder="e.g. Momentum Millcreek"
            />
          </div>
          <div>
            <Label>City (optional)</Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value.slice(0, 60))}
              placeholder="e.g. Seattle, WA"
            />
          </div>
          <div>
            <Label>Anything else? (optional)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 140))}
              placeholder="Address, bouldering or ropes, etc."
            />
          </div>
          <Button onClick={submit} disabled={!name.trim() || sending}>
            {sending ? 'Sending\u2026' : 'Send suggestion'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
