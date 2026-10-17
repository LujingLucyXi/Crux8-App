import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { getPendingIntent, pendingIntentPath } from '@/lib/pendingIntent';

/**
 * Landing route for Google's GIS redirect-mode sign-in. The /api
 * endpoint has already CSRF-checked the POST and handed the ID token
 * over in the URL fragment; this route exchanges it for a Supabase
 * session (the store's signInWithGoogleToken — the same exchange the
 * old popup button's callback used, so sign-up and sign-in are one
 * identical path: a new Google identity creates the account, a known
 * one signs in), then routes onward: back to the page that started
 * sign-in if AuthSheet stashed one, else to any pending deep-link
 * intent, else home.
 */
export default function GoogleAuth() {
  const nav = useNavigate();
  const signInWithGoogleToken = useAppStore((s) => s.signInWithGoogleToken);
  const [error, setError] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      // Scrub the token/error from the address bar immediately.
      window.history.replaceState(null, '', '/google-auth');
      const token = hash.get('id_token');
      if (!token) {
        setError(
          hash.get('error')
            ? 'Google sign-in could not be verified — please try again.'
            : 'That sign-in link is missing its token — please try again.',
        );
        return;
      }
      let nonce: string | undefined;
      let returnTo: string | null = null;
      try {
        nonce = sessionStorage.getItem('crux8-google-nonce') ?? undefined;
        returnTo = sessionStorage.getItem('crux8-google-return');
        sessionStorage.removeItem('crux8-google-nonce');
        sessionStorage.removeItem('crux8-google-return');
      } catch {
        /* storage unavailable — signInWithIdToken proceeds without */
      }
      const res = await signInWithGoogleToken(token, nonce);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const intent = getPendingIntent();
      const dest =
        returnTo && returnTo !== '/google-auth'
          ? returnTo
          : intent
            ? pendingIntentPath(intent)
            : '/';
      nav(dest, { replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-[#0B0B0D] px-6 text-center">
      <Logo size={72} />
      {error ? (
        <>
          <p className="max-w-sm text-sm leading-relaxed text-white/70">{error}</p>
          <Button size="lg" onClick={() => nav('/', { replace: true })}>
            Back to sign in
          </Button>
        </>
      ) : (
        <p className="text-sm font-semibold tracking-wide text-white/70">
          Signing you in with Google…
        </p>
      )}
    </div>
  );
}
