// Shared auth sheet: email-code OTP and email+password in one place.
// Used by both the landing page and the /claim route so every entry
// point offers the same sign-in options.
import { useEffect, useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

type Tab = 'code' | 'password';
type PwMode = 'signin' | 'signup';

interface AuthSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  onSuccess?: () => void;
  /** Which tab/mode the sheet opens on (e.g. Sign up → password/create-account). */
  initialTab?: Tab;
  initialPwMode?: PwMode;
}

const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim().toLowerCase());

export function AuthSheet({
  open,
  onOpenChange,
  title = 'Get started',
  onSuccess,
  initialTab = 'code',
  initialPwMode = 'signin',
}: AuthSheetProps) {
  const sendOtp = useAppStore((s) => s.sendOtp);
  const verifyOtp = useAppStore((s) => s.verifyOtp);
  const signUpWithPassword = useAppStore((s) => s.signUpWithPassword);
  const signInWithPassword = useAppStore((s) => s.signInWithPassword);
  const resetPassword = useAppStore((s) => s.resetPassword);

  const [tab, setTab] = useState<Tab>('code');

  // --- email-code state ---
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  // --- password state ---
  const [pwMode, setPwMode] = useState<PwMode>('signin');
  const [pwEmail, setPwEmail] = useState('');
  const [password, setPassword] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // (Re)open → start on the caller's tab/mode with a clean form.
  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setPwMode(initialPwMode);
      setStep('email');
      setCode('');
      setPassword('');
      setBusy(false);
      setError('');
      setNotice('');
    }
  }, [open, initialTab, initialPwMode]);

  const reset = () => {
    setStep('email');
    setCode('');
    setPassword('');
    setPwMode('signin');
    setBusy(false);
    setError('');
    setNotice('');
  };

  const succeed = () => {
    reset();
    onOpenChange(false);
    onSuccess?.();
  };

  const switchPwMode = (m: PwMode) => {
    setPwMode(m);
    setError('');
    setNotice('');
  };

  const submitEmail = async () => {
    const normalized = email.trim().toLowerCase();
    if (!looksLikeEmail(normalized)) {
      setError("That email doesn't look right — check it and try again.");
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    const res = await sendOtp(normalized);
    setBusy(false);
    if (res.ok) setStep('code');
    else setError(res.error);
  };

  const submitCode = async () => {
    if (code.trim().length < 6) return;
    setBusy(true);
    setError('');
    setNotice('');
    const res = await verifyOtp(email, code);
    setBusy(false);
    if (res.ok) succeed();
    else setError(res.error);
  };

  const submitPassword = async () => {
    const normalized = pwEmail.trim().toLowerCase();
    if (!looksLikeEmail(normalized)) {
      setError("That email doesn't look right — check it and try again.");
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    const res =
      pwMode === 'signup'
        ? await signUpWithPassword(normalized, password)
        : await signInWithPassword(normalized, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (pwMode === 'signup' && 'needsConfirmation' in res && res.needsConfirmation) {
      setNotice('Account created — check your email for the confirmation link, then sign in.');
      setPwMode('signin');
      setPassword('');
      return;
    }
    succeed();
  };

  const submitReset = async () => {
    const normalized = pwEmail.trim().toLowerCase();
    if (!looksLikeEmail(normalized)) {
      setError('Enter your email above first, then tap “Forgot password?”.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    const res = await resetPassword(normalized);
    setBusy(false);
    if (res.ok) setNotice('Reset link sent — check your email.');
    else setError(res.error);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <SheetContent title={title}>
        {/* method switcher */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-paper-50 p-1 text-sm font-semibold">
          {(['code', 'password'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setError('');
                setNotice('');
              }}
              className={cn(
                'rounded-lg py-2 transition-colors',
                tab === t ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500',
              )}
            >
              {t === 'code' ? 'Email code' : 'Password'}
            </button>
          ))}
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {notice ? <p className="mt-3 text-sm font-medium text-emerald-700">{notice}</p> : null}

        {tab === 'code' ? (
          step === 'email' ? (
            <>
              <p className="text-sm text-ink-500 mb-4">
                Sign in with your email — we'll send you a 6-digit code. No password needed.
              </p>
              <div className="flex flex-col gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void submitEmail();
                    }}
                  />
                </div>
                <Button onClick={() => void submitEmail()} disabled={busy || !email.trim()}>
                  {busy ? 'Sending…' : 'Send code'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-ink-500 mb-4">
                We sent a 6-digit code to <span className="font-semibold text-ink-900">{email.trim()}</span>.
                It expires in a few minutes.
              </p>
              <div className="flex flex-col gap-4">
                <div>
                  <Label>Code</Label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void submitCode();
                    }}
                  />
                </div>
                <Button onClick={() => void submitCode()} disabled={busy || code.trim().length < 6}>
                  {busy ? 'Verifying…' : 'Verify and continue'}
                </Button>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="text-sm font-medium text-ink-500 underline underline-offset-2"
                    onClick={() => {
                      setStep('email');
                      setCode('');
                      setError('');
                    }}
                  >
                    Use a different email
                  </button>
                  <button
                    type="button"
                    className="text-sm font-medium text-ink-900 underline underline-offset-2 disabled:opacity-40"
                    disabled={busy}
                    onClick={() => void submitEmail()}
                  >
                    Resend code
                  </button>
                </div>
              </div>
            </>
          )
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <Label>Email</Label>
              <Input
                value={pwEmail}
                onChange={(e) => setPwEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void submitPassword();
                }}
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={pwMode === 'signup' ? 'At least 6 characters' : 'Your password'}
                type="password"
                autoComplete={pwMode === 'signup' ? 'new-password' : 'current-password'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void submitPassword();
                }}
              />
            </div>
            <Button onClick={() => void submitPassword()} disabled={busy}>
              {busy ? 'Please wait…' : pwMode === 'signup' ? 'Create account' : 'Sign in'}
            </Button>
            {pwMode === 'signin' ? (
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="font-medium text-ink-500 underline underline-offset-2"
                  onClick={() => void submitReset()}
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  className="font-medium text-ink-900 underline underline-offset-2"
                  onClick={() => switchPwMode('signup')}
                >
                  New here? Create account
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="text-center text-sm font-medium text-ink-500 underline underline-offset-2"
                onClick={() => switchPwMode('signin')}
              >
                Already have an account? Sign in
              </button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
