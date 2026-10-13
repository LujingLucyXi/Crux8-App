import { useState } from 'react';
import { toast } from 'sonner';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { useAppStore } from '@/store/useAppStore';

/**
 * "Don't see your gym?" — users suggest a gym that's missing from the
 * list. Suggestions are stored locally and (for signed-in users with real
 * uuid ids) inserted into the gym_suggestions table for review.
 */
export function SuggestGymSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const suggestGym = useAppStore((s) => s.suggestGym);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const n = name.trim();
    if (!n) return;
    setSending(true);
    await suggestGym(n, city.trim(), note.trim());
    setSending(false);
    toast.success('Thanks! We\u2019ll review it and add it to the list.');
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
