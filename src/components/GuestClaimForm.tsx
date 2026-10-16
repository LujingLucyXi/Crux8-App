import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppStore } from '@/store/useAppStore';

/**
 * Convert a guest (anonymous) account into a real one by email.
 *
 * This is the post-value account prompt Lucy specified on 2026-10-16:
 * guests may enter through a specific session invite, but after the
 * session they are reminded to create/sign into an account. The claim
 * keeps the same user id, so the finished session, card and history
 * carry over.
 */
export function GuestClaimForm({ onDone }: { onDone?: () => void }) {
  const claimGuestAccount = useAppStore((s) => s.claimGuestAccount);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="rounded-2xl border border-ink-100 bg-paper-100 p-4 text-left">
        <p className="text-sm font-semibold text-ink-900">Account link sent ✓</p>
        <p className="mt-1 text-xs text-ink-500">
          Check your inbox to finish creating your account.
        </p>
        {onDone && (
          <Button variant="outline" className="mt-3 w-full" onClick={onDone}>
            Done
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink-100 bg-paper-100 p-4 text-left">
      <p className="text-sm font-semibold text-ink-900">Create your account</p>
      <p className="mt-1 text-xs text-ink-500">
        Add your email and we’ll send a link to finish. Your session, card and history stay with this account.
      </p>
      <Input
        className="mt-3"
        type="email"
        inputMode="email"
        placeholder="you@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div className="mt-3 flex gap-2">
        {onDone && (
          <Button variant="outline" className="flex-1" onClick={onDone}>
            Later
          </Button>
        )}
        <Button
          className="flex-1"
          disabled={busy || !email.includes('@')}
          onClick={async () => {
            setBusy(true);
            setError(null);
            const res = await claimGuestAccount(email);
            setBusy(false);
            if (!res.ok) {
              setError(res.error);
              return;
            }
            setSent(true);
            toast.success('Claim link sent — check your inbox ✉️');
          }}
        >
          {busy ? 'Sending…' : 'Send link'}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
