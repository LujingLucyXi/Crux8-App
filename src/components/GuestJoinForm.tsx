import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppStore } from '@/store/useAppStore';

/**
 * Front-door guest join (Lucy, 2026-10-14): a scanned QR lets someone join
 * a live session with just a name — no email, no OTP, no onboarding wall.
 * Backed by Supabase anonymous sign-in (real UID, same-UID claim later).
 * When the project's anonymous toggle is off, signInAsGuest returns
 * code 'anonymous_disabled' and the plain-language error tells the guest
 * to use the email sign-in path instead.
 */
export function GuestJoinForm({
  onJoined,
  buttonLabel = 'Join as a guest',
}: {
  onJoined?: () => void;
  buttonLabel?: string;
}) {
  const signInAsGuest = useAppStore((s) => s.signInAsGuest);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await signInAsGuest(name);
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    setBusy(false);
    toast.success(`You're in, ${name.trim() || 'guest'} 🧗`);
    onJoined?.();
  };

  return (
    <div>
      <Input
        value={name}
        maxLength={30}
        onChange={(e) => setName(e.target.value)}
        placeholder="What should partners call you?"
        onKeyDown={(e) => {
          if (e.key === 'Enter') void submit();
        }}
      />
      <Button className="mt-3 w-full" size="lg" disabled={busy} onClick={() => void submit()}>
        {busy ? 'Joining…' : buttonLabel}
      </Button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
