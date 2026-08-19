import { useState } from 'react';
import { toast } from 'sonner';
import { ShieldCheck, Group, Check } from 'iconoir-react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { useAppStore } from '@/store/useAppStore';
import type { VerificationCategory } from '@/seed/types';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetCategory?: VerificationCategory;
}

const CATEGORY_LABEL: Record<VerificationCategory, string> = {
  top_rope: 'Top Rope Belay',
  lead: 'Lead Belay',
  trad: 'Trad Lead',
};

/**
 * Belay self-attestation. No cert upload — the climber declares the skill, and
 * real trust is earned when partners confirm it after sessions (peer check).
 */
const CATEGORIES: VerificationCategory[] = ['top_rope', 'lead', 'trad'];

export function CertVerificationSheet({ open, onOpenChange, presetCategory }: Props) {
  const submitVerification = useAppStore((s) => s.submitVerification);
  const [selected, setSelected] = useState<VerificationCategory[]>(presetCategory ? [presetCategory] : []);
  const [checked, setChecked] = useState(false);

  const reset = () => {
    setSelected(presetCategory ? [presetCategory] : []);
    setChecked(false);
  };

  const toggle = (cat: VerificationCategory) =>
    setSelected((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));

  const handleSubmit = () => {
    selected.forEach((cat) => submitVerification(cat));
    toast(
      selected.length === 1
        ? `${CATEGORY_LABEL[selected[0]]} · self-reported`
        : `${selected.length} belay skills · self-reported`,
      { description: 'Partners can confirm these after you climb together.' },
    );
    onOpenChange(false);
    reset();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <SheetContent title="Self-report your belay skill">
        <p className="text-sm text-ink-500 -mt-2 mb-4">
          No cert upload. You declare what you can do, and your partners confirm it after real sessions — so trust is
          earned on the wall, not on paper.
        </p>

        <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">
          Which skills? <span className="normal-case font-medium text-ink-400">Select all that apply</span>
        </p>
        <div className="flex flex-col gap-2">
          {CATEGORIES.map((cat) => {
            const on = selected.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggle(cat)}
                aria-pressed={on}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border text-left transition-colors',
                  on ? 'border-brand-600 bg-brand-100' : 'border-ink-100 hover:border-ink-300',
                )}
              >
                <span
                  className={cn(
                    'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0',
                    on ? 'bg-brand-600 border-brand-600' : 'border-ink-300',
                  )}
                >
                  {on && <Check width={13} height={13} color="white" />}
                </span>
                <span className="text-sm text-ink-900 font-semibold">{CATEGORY_LABEL[cat]}</span>
              </button>
            );
          })}
        </div>

        <label className="mt-4 flex items-start gap-3 cursor-pointer rounded-xl border border-ink-100 p-3.5">
          <Checkbox checked={checked} onCheckedChange={(v) => setChecked(!!v)} />
          <span className="text-sm text-ink-700 leading-snug">
            I've passed a belay check for the skill(s) above at a gym (or have equivalent experience), and I'm
            comfortable belaying a partner safely.
          </span>
        </label>

        <div className="mt-4 rounded-xl bg-paper-50 border border-ink-100 p-3.5 flex gap-3">
          <Group width={18} height={18} className="text-brand-600 shrink-0 mt-0.5" />
          <p className="text-xs text-ink-600 leading-snug">
            After you climb, partners are asked to confirm your belay skill. A few confirmations turn “self-reported”
            into <span className="font-semibold text-ink-900">peer-confirmed</span>. Always do an in-person buddy check
            before the first climb.
          </p>
        </div>

        <div className="mt-6 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="flex-1" disabled={!checked || selected.length === 0} onClick={handleSubmit}>
            <ShieldCheck width={16} height={16} /> Self-report{selected.length > 1 ? ` (${selected.length})` : ''}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
