import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea } from '@/components/ui/Input';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

/** Where tester feedback goes. Change this to your support inbox. */
const FEEDBACK_EMAIL = 'lucyxi2026@gmail.com';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const KINDS = [
  { value: 'bug', label: '🐞 Bug report' },
  { value: 'idea', label: '💡 Suggestion' },
  { value: 'other', label: '💬 Other' },
];

export function FeedbackSheet({ open, onOpenChange }: Props) {
  const me = useAppStore((s) => s.me);
  const [kind, setKind] = useState('bug');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const reset = () => {
    setKind('bug');
    setSubject('');
    setMessage('');
  };

  const send = () => {
    const kindLabel = KINDS.find((k) => k.value === kind)?.label ?? kind;
    const fullSubject = `[Crux8 ${kindLabel}] ${subject.trim() || 'Feedback'}`;
    const body = `${message.trim()}\n\n—\nFrom: ${me?.display_name ?? 'anonymous'} (${me?.id ?? 'no id'})`;
    const url = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(fullSubject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
    reset();
    onOpenChange(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <SheetContent title="Report a problem">
        <div className="flex flex-col gap-4 mt-2">
          <p className="text-sm text-ink-500">
            Found a bug or have an idea? Tell us — it goes straight to the team.
          </p>
          <div>
            <Label>What's this about?</Label>
            <div className="flex gap-2 mt-1">
              {KINDS.map((k) => (
                <button
                  key={k.value}
                  onClick={() => setKind(k.value)}
                  className={cn(
                    'flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-colors',
                    kind === k.value
                      ? 'bg-brand-600 text-[#161310] border-brand-600'
                      : 'bg-paper-100 text-ink-700 border-ink-100',
                  )}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Short summary"
              maxLength={80}
            />
          </div>
          <div>
            <Label>Details</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What happened? What did you expect? Steps to reproduce…"
              rows={5}
              maxLength={1000}
            />
          </div>
          <Button onClick={send} disabled={!message.trim()} className="w-full">
            Send feedback
          </Button>
          <p className="text-xs text-ink-400 text-center">
            This opens your email app with the message ready to send.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
