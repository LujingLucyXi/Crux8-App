import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { resolveUser } from '@/lib/resolveUser';
import { toast } from 'sonner';
import type { ClimbCall } from '@/seed/types';

interface Props {
  call: ClimbCall | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStarted?: (sessionId: string) => void;
}

/**
 * Confirm who's actually here, then start the live session.
 * Starting collects DNA cards mutually for everyone present.
 */
export function StartSessionSheet({ call, open, onOpenChange, onStarted }: Props) {
  const me = useAppStore((s) => s.me);
  const users = useAppStore((s) => s.users);
  const directory = useAppStore((s) => s.directory);
  const startCallSession = useAppStore((s) => s.startCallSession);
  const [present, setPresent] = useState<string[]>([]);
  const [starting, setStarting] = useState(false);

  if (!call || !me) return null;

  const participants = call.participant_ids.filter((id) => id !== me.id);
  // Initialize present list on open
  const allPresent = [me.id, ...participants.filter((id) => present.includes(id) || present.length === 0)];

  const toggle = (id: string) => {
    setPresent((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Default: everyone checked on first open
  const effectivePresent = present.length === 0 && !starting ? [me.id, ...participants] : present.length === 0 ? [me.id] : present;

  const handleStart = async () => {
    setStarting(true);
    try {
      const sessionId = await startCallSession(call.id, effectivePresent);
      if (sessionId) {
        toast.success(
          effectivePresent.length < 2
            ? 'Session started — others can still join 🧗'
            : 'Session started! Cards collected 🃏',
        );
        onOpenChange(false);
        setPresent([]);
        onStarted?.(sessionId);
      } else {
        toast.error('Could not start session');
      }
    } finally {
      setStarting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setPresent([]); setStarting(false); } }}>
      <SheetContent>
        <h2 className="text-lg font-bold text-ink-900">Who's here?</h2>
        <p className="text-sm text-ink-500 mt-1">
          Confirm who's actually climbing. Everyone present collects each other's DNA cards. Just you for now? You can start solo — others can still join the session later.
        </p>
        <div className="mt-4 space-y-2">
          {[me.id, ...participants].map((id) => {
            const u = resolveUser(id, me, users, directory);
            const checked = effectivePresent.includes(id);
            const isMe = id === me.id;
            return (
              <button
                key={id}
                disabled={isMe}
                onClick={() => toggle(id)}
                className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                  checked ? 'border-brand-600 bg-brand-600' : 'border-ink-100 bg-paper-100'
                } ${isMe ? '' : 'hover:border-ink-300'}`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                  checked ? 'bg-[#161310] border-[#161310] text-brand-400' : 'border-ink-300'
                }`}>
                  {checked && '✓'}
                </span>
                <span className={`font-medium text-sm ${checked ? 'text-[#161310]' : 'text-ink-900'}`}>
                  {u?.display_name ?? 'Someone'}{isMe ? ' (you)' : ''}
                </span>
              </button>
            );
          })}
        </div>
        <Button
          className="mt-5 w-full bg-teal-600 hover:bg-teal-500 border-teal-600"
          size="lg"
          disabled={starting}
          onClick={handleStart}
        >
          {starting ? 'Starting…' : `Start session 🧗 (${effectivePresent.length})`}
        </Button>
        <p className="mt-2 text-center text-[11px] text-ink-400">
          {effectivePresent.length < 2
            ? 'No cards to collect yet — they come when a cruxmate climbs with you'
            : `${effectivePresent.length - 1} card${effectivePresent.length - 1 === 1 ? '' : 's'} will be collected`}
        </p>
      </SheetContent>
    </Sheet>
  );
}
