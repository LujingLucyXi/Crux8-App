import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Logo } from '@/components/layout/Logo';
import { useAppStore } from '@/store/useAppStore';
import { supabase, passwordErrorMessage } from '@/lib/supabase';

/**
 * Landing screen for the "Forgot password?" reset email.
 * The reset link carries auth params — we exchange them for a session,
 * then let the user set a new password.
 */
export function UpdatePassword() {
  const nav = useNavigate();
  const initAuth = useAppStore((s) => s.initAuth);
  const [status, setStatus] = useState<'loading' | 'ready' | 'invalid'>('loading');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      // PKCE-style links carry ?code= — exchange it explicitly so the
      // flow doesn't depend on the client's auto-detection behavior.
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          // Don't declare the link dead yet: the client may have already
          // exchanged the code during boot (detectSessionInUrl), or the
          // hash-based flow may have established the session. Only a
          // missing session means the link is really invalid.
          const existing = await supabase.auth.getSession();
          if (!existing.data.session) {
            setStatus('invalid');
            return;
          }
        }
      }
      const { data } = await supabase.auth.getSession();
      setStatus(data.session ? 'ready' : 'invalid');
    })();
  }, []);

  const submit = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError(passwordErrorMessage(error, 'Could not update your password — please try again.'));
      return;
    }
    // Pull the recovery session into the store so the app treats the user as signed in.
    await initAuth();
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="mx-auto max-w-[560px] px-6 py-12 flex flex-col items-center text-center">
        <Logo size={64} />
        <h1 className="mt-6 text-2xl font-bold text-ink-900">Set a new password</h1>
        {status === 'loading' ? (
          <p className="mt-4 text-sm text-ink-500">Checking your reset link…</p>
        ) : status === 'invalid' ? (
          <>
            <p className="mt-4 text-sm text-ink-500">
              This reset link is invalid or has expired. Request a new one from the sign-in screen.
            </p>
            <Button className="mt-6 w-full max-w-sm" onClick={() => nav('/')}>
              Back to sign in
            </Button>
          </>
        ) : done ? (
          <>
            <p className="mt-4 text-sm text-ink-500">
              Your password is updated. You&apos;re signed in — welcome back.
            </p>
            <Button className="mt-6 w-full max-w-sm" onClick={() => nav('/home')}>
              Continue to Crux8
            </Button>
          </>
        ) : (
          <div className="mt-6 w-full max-w-sm flex flex-col gap-4 text-left">
            <div>
              <Label>New password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void submit();
                }}
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button onClick={() => void submit()} disabled={busy}>
              {busy ? 'Updating…' : 'Update password'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
