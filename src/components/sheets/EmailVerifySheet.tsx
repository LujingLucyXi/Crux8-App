import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';

/**
 * Prove the account email is yours — Discord-style deferred
 * verification (2026-10-16). Signup never waits for this; it exists
 * so a password reset can always reach you. Sends the same 6-digit
 * code as email-code sign-in; entering it flips profiles.email_verified.
 */
export function EmailVerifySheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const me = useAppStore((s) => s.me);
  const sendOtp = useAppStore((s) => s.sendOtp);
  const verifyOtp = useAppStore((s) => s.verifyOtp);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const [step, setStep] = useState<'intro' | 'code'>('intro');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const email = me?.email ?? '';

  const close = (v: boolean) => {
    if (!v) {
      setStep('intro');
      setCode('');
      setError('');
    }
    onOpenChange(v);
  };

  const send = async () => {
    if (!email) return;
    setBusy(true);
    setError('');
    const res = await sendOtp(email);
    setBusy(false);
    if (res.ok) setStep('code');
    else setError(res.error);
  };

  const verify = async () => {
    if (!email || code.trim().length < 6) return;
    setBusy(true);
    setError('');
    const res = await verifyOtp(email, code);
    setBusy(false);
    if (res.ok) {
      updateProfile({ email_verified: true });
      toast.success('Email verified ✓ — account recovery is secured.');
      close(false);
    } else {
      setError(res.error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent title="Verify your email">
        {step === 'intro' ? (
          <div>
            <p className="text-sm text-ink-700">
              Your account works without this — verifying just proves{' '}
              <b>{email || 'your email'}</b> is really yours, so a password reset can always
              reach you if you're ever locked out.
            </p>
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            <Button className="mt-4 w-full" onClick={send} disabled={busy || !email}>
              {busy ? 'Sending…' : 'Send me a code'}
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-ink-700">
              Enter the 6-digit code sent to <b>{email}</b>.
            </p>
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            <div className="mt-4">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                inputMode="numeric"
                autoFocus
              />
            </div>
            <Button className="mt-3 w-full" onClick={verify} disabled={busy || code.length < 6}>
              {busy ? 'Checking…' : 'Verify'}
            </Button>
            <button
              type="button"
              onClick={send}
              disabled={busy}
              className="mt-2.5 w-full text-center text-sm font-medium text-teal-600"
            >
              Resend code
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
