/**
 * GIS redirect-mode landing endpoint (Vercel function).
 *
 * Google's in-page sign-in button runs in REDIRECT mode for Crux8:
 * the button navigates the whole page to Google (no popup — popups
 * from Google's iframe are silently blocked on iOS Safari, which
 * killed the popup-mode button on 2026-10-16), and Google POSTs the
 * resulting ID token here. This endpoint verifies Google's
 * double-submit CSRF cookie, then hands the token to the SPA in a
 * URL fragment (fragments are never sent to servers or logged):
 *   303 → https://crux8.app/google-auth#id_token=…
 * The /google-auth route exchanges it via Supabase signInWithIdToken.
 * Supabase is not in the OAuth chain, so Google's consent screen
 * names Crux8 — never the *.supabase.co domain.
 */
export default function handler(req: any, res: any) {
  const APP = 'https://crux8.app';
  const fail = (why: string) => {
    res.writeHead(303, { Location: `${APP}/google-auth#error=${why}` });
    res.end();
  };
  if (req.method !== 'POST') return fail('method');
  const body = (req.body ?? {}) as Record<string, unknown>;
  const credential = typeof body.credential === 'string' ? body.credential : '';
  const csrfBody = typeof body.g_csrf_token === 'string' ? body.g_csrf_token : '';
  const cookie = String(req.headers?.cookie ?? '');
  const m = cookie.match(/(?:^|;\s*)g_csrf_token=([^;]+)/);
  const csrfCookie = m ? decodeURIComponent(m[1]) : '';
  if (!credential || !csrfBody || !csrfCookie || csrfBody !== csrfCookie) {
    return fail('csrf');
  }
  res.writeHead(303, {
    Location: `${APP}/google-auth#id_token=${encodeURIComponent(credential)}`,
  });
  res.end();
}
