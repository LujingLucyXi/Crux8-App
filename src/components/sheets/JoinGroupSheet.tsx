import { useState } from 'react';
import { toast } from 'sonner';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import type { Group } from '@/seed/types';

interface Props {
  group: Group | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Join flow for a request-only group. Renders the admin-designed survey
 * questions, collects answers, and files a pending request for admin review.
 * Open-policy groups never reach this sheet (they join instantly).
 */
export function JoinGroupSheet({ group, open, onOpenChange }: Props) {
  const requestToJoinGroup = useAppStore((s) => s.requestToJoinGroup);
  const questions = group?.survey_questions ?? [];
  const [answers, setAnswers] = useState<string[]>([]);

  if (!group) return null;

  const setAnswer = (i: number, v: string) =>
    setAnswers((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });

  const allAnswered = questions.every((_, i) => (answers[i] ?? '').trim().length > 0);

  const submit = () => {
    requestToJoinGroup(group.id, questions.map((_, i) => answers[i] ?? ''));
    onOpenChange(false);
    setAnswers([]);
    toast.success('Request sent — an admin will review it.');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={`Request to join ${group.name}`}>
        <p className="text-sm text-ink-500 -mt-2">
          This is a request-only crew. Answer a few questions so the admins can get to know you.
        </p>
        <div className="mt-5 flex flex-col gap-4">
          {questions.map((q, i) => (
            <label key={i} className="block">
              <span className="text-sm font-medium text-ink-800">{q}</span>
              <textarea
                value={answers[i] ?? ''}
                onChange={(e) => setAnswer(i, e.target.value)}
                rows={2}
                className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-teal-500 resize-none"
                placeholder="Your answer…"
              />
            </label>
          ))}
        </div>
        <Button className="w-full mt-6" disabled={!allAnswered} onClick={submit}>
          Send join request
        </Button>
      </SheetContent>
    </Sheet>
  );
}
