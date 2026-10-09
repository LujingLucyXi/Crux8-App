import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TriangleFlag, ShieldCheck, Community, Rhombus } from 'iconoir-react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Logo } from '@/components/layout/Logo';
import { useAppStore } from '@/store/useAppStore';

const PILLARS = [
  { Icon: TriangleFlag, name: 'Adventure', desc: 'New lines. New places. New stories.' },
  { Icon: ShieldCheck, name: 'Trust', desc: 'Verified climbers. Real people. Climb with confidence.' },
  { Icon: Community, name: 'Together', desc: 'We climb better when we climb together.' },
  { Icon: Rhombus, name: 'Safety', desc: 'Look out for each other. Climb smart.' },
];

type Step = 'email' | 'code';

export function Landing() {
  const nav = useNavigate();
  const sendOtp = useAppStore((s) => s.sendOtp);
  const verifyOtp = useAppStore((s) => s.verifyOtp);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const resetSheet = () => {
    setStep('email');
    setCode('');
    setError('');
    setBusy(false);
  };

  const handleSendCode = async () => {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setError("That email doesn't look right — check it and try again.");
      return;
    }
    setBusy(true);
    setError('');
    const res = await sendOtp(normalized);
    setBusy(false);
    if (res.ok) {
      setStep('code');
    } else {
      setError(res.error);
    }
  };

  const handleVerify = async () => {
    if (code.trim().length < 6) return;
    setBusy(true);
    setError('');
    const res = await verifyOtp(email, code);
    setBusy(false);
    if (res.ok) {
      setSheetOpen(false);
      resetSheet();
      nav('/');
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="mx-auto max-w-[560px] px-6 py-12 flex flex-col items-center text-center">
        <Logo size={80} />
        <h1 className="mt-8 text-4xl font-bold text-ink-900 tracking-tight">CRUX8</h1>
        <p className="mt-3 text-xs font-semibold tracking-[0.24em] text-ink-500">
          TIE IN. SEND TOGETHER.
        </p>
        <p className="mt-4 text-lg font-medium text-ink-700 max-w-sm">
          Find your people. Climb stronger.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-3 w-full max-w-md">
          {PILLARS.map(({ Icon, name, desc }) => (
            <div
              key={name}
              className="rounded-2xl bg-white border border-ink-100 p-4 text-left"
            >
              <Icon width={22} height={22} className="text-ink-900" />
              <h3 className="mt-2 text-sm font-semibold uppercase tracking-wider text-ink-900">
                {name}
              </h3>
              <p className="mt-1 text-xs text-ink-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 w-full max-w-sm flex flex-col gap-2">
          <Button size="lg" onClick={() => { resetSheet(); setSheetOpen(true); }}>
            Sign up
          </Button>
          <Button size="lg" variant="outline" onClick={() => { resetSheet(); setSheetOpen(true); }}>
            Sign in
          </Button>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent title="Get started">
          {step === 'email' ? (
            <>
              <p className="text-sm text-ink-500 -mt-2 mb-4">
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
                    onKeyDown={(e) => { if (e.key === 'Enter') void handleSendCode(); }}
                  />
                </div>
                {error ? <p className="text-sm text-red-600 -mt-2">{error}</p> : null}
                <Button onClick={() => void handleSendCode()} disabled={busy || !email.trim()}>
                  {busy ? 'Sending…' : 'Send code'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-ink-500 -mt-2 mb-4">
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
                    onKeyDown={(e) => { if (e.key === 'Enter') void handleVerify(); }}
                  />
                </div>
                {error ? <p className="text-sm text-red-600 -mt-2">{error}</p> : null}
                <Button onClick={() => void handleVerify()} disabled={busy || code.trim().length < 6}>
                  {busy ? 'Verifying…' : 'Verify and continue'}
                </Button>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="text-sm font-medium text-ink-500 underline underline-offset-2"
                    onClick={() => { setStep('email'); setCode(''); setError(''); }}
                  >
                    Use a different email
                  </button>
                  <button
                    type="button"
                    className="text-sm font-medium text-ink-900 underline underline-offset-2 disabled:opacity-40"
                    disabled={busy}
                    onClick={() => void handleSendCode()}
                  >
                    Resend code
                  </button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
