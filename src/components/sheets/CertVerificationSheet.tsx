import { useState } from 'react';
import { toast } from 'sonner';
import * as RadioGroup from '@radix-ui/react-radio-group';
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

export function CertVerificationSheet({ open, onOpenChange, presetCategory }: Props) {
  const submitVerification = useAppStore((s) => s.submitVerification);
  const [category, setCategory] = useState<VerificationCategory>(presetCategory ?? 'top_rope');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [attested, setAttested] = useState(false);
  const [photoName, setPhotoName] = useState<string | null>(null);

  const reset = () => {
    setStep(1);
    setAttested(false);
    setPhotoName(null);
  };

  const handleSubmit = () => {
    submitVerification(category, photoName ?? undefined);
    toast('Verification submitted', {
      description: `${CATEGORY_LABEL[category]} — reviewing (auto-approves in 5s in demo).`,
    });
    onOpenChange(false);
    reset();
    setTimeout(() => {
      toast(`${CATEGORY_LABEL[category]} verified ✓`, {
        description: 'You can now RSVP to matching rope sessions.',
      });
    }, 5100);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <SheetContent title="Verify your belay cert">
        <p className="text-sm text-ink-500 -mt-2 mb-5">Step {step} of 3</p>

        {step === 1 && (
          <>
            <RadioGroup.Root
              value={category}
              onValueChange={(v) => setCategory(v as VerificationCategory)}
              className="flex flex-col gap-2"
            >
              {(['top_rope', 'lead', 'trad'] as VerificationCategory[]).map((cat) => (
                <RadioGroup.Item
                  key={cat}
                  value={cat}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-xl border text-left',
                    'data-[state=checked]:border-ink-900 data-[state=checked]:bg-paper-50',
                    'border-ink-100',
                  )}
                >
                  <div className="w-4 h-4 rounded-full border-2 border-ink-300 data-[state=checked]:border-ink-900 relative">
                    <div className="absolute inset-1 rounded-full bg-ink-900 hidden [[data-state=checked]_&]:block" />
                  </div>
                  <span className="text-sm text-ink-900 font-medium">{CATEGORY_LABEL[cat]}</span>
                </RadioGroup.Item>
              ))}
            </RadioGroup.Root>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={() => setStep(2)}>
                Next
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="border-2 border-dashed border-ink-100 rounded-2xl p-6 text-center">
              <p className="text-sm text-ink-500 mb-3">
                {photoName ? `Selected: ${photoName}` : 'Upload a photo of your cert (mocked in v0.5)'}
              </p>
              <input
                type="file"
                accept="image/*"
                id="cert-file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setPhotoName(f.name);
                }}
              />
              <label
                htmlFor="cert-file"
                className="inline-flex items-center gap-2 rounded-xl border border-ink-900 bg-white text-ink-900 text-sm font-medium px-4 py-2 cursor-pointer hover:bg-paper-50"
              >
                Choose file
              </label>
            </div>
            <label className="mt-5 flex items-start gap-3 cursor-pointer">
              <Checkbox checked={attested} onCheckedChange={(v) => setAttested(!!v)} />
              <span className="text-sm text-ink-700 leading-snug">
                I confirm this certification is mine and current within the last 24 months.
              </span>
            </label>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="flex-1" onClick={() => setStep(3)} disabled={!photoName || !attested}>
                Next
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="rounded-2xl bg-paper-50 border border-ink-100 p-4">
              <p className="text-xs uppercase tracking-wider text-ink-500 mb-2">Review</p>
              <dl className="grid grid-cols-3 gap-2 text-sm">
                <dt className="text-ink-500">Category</dt>
                <dd className="col-span-2 text-ink-900 font-medium">{CATEGORY_LABEL[category]}</dd>
                <dt className="text-ink-500">File</dt>
                <dd className="col-span-2 text-ink-900 truncate">{photoName}</dd>
                <dt className="text-ink-500">Attested</dt>
                <dd className="col-span-2 text-ink-900">Yes</dd>
              </dl>
            </div>
            <p className="mt-3 text-xs text-ink-500">
              In production, a coach reviews your cert within 24 hours. In this demo, verification auto-approves 5 seconds after submission.
            </p>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleSubmit}>
                Submit
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
