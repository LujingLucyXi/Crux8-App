import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { AuthSheet } from '@/components/AuthSheet';
import { Logo } from '@/components/layout/Logo';
import { GuestJoinForm } from '@/components/GuestJoinForm';
import { SessionDetailSheet } from '@/components/sheets/SessionDetailSheet';
import { savePendingIntent, consumePendingIntentFor } from '@/lib/pendingIntent';
import { useAppStore } from '@/store/useAppStore';

/**
 * Deep link for a shared session: /session/:sessionId
 * - Logged in → opens the session detail sheet directly (RSVP works).
 * - Logged out → sign-in prompt first, then the session.
 * - Unknown/finished session → friendly empty state.
 * - The join intent is stashed before any auth detour and consumed on
 *   return, so a scanned QR survives sign-in and lands back here.
 */
export function SessionDeepLink() {
  const { sessionId } = useParams();
  const nav = useNavigate();
  const me = useAppStore((s) => s.me);
  const sessions = useAppStore((s) => s.sessions);
  const sessionsLoading = useAppStore((s) => s.sessionsLoading);
  const rsvp = useAppStore((s) => s.rsvp);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(true);

  const session = sessions.find((s) => s.id === sessionId);

  // Stash the join target before any auth detour so the QR survives
  // sign-in + onboarding and lands back on this session.
  useEffect(() => {
    if (!me && session) savePendingIntent({ type: 'session', id: session.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id, session?.id]);

  // Back from the detour: consume the intent (the session detail below
  // already carries the join button for live/upcoming sessions).
  useEffect(() => {
    if (me && session) consumePendingIntentFor('session', session.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id, session?.id]);

  if (!session && sessionsLoading) {
    // A scanned link often lands before the session list has loaded —
    // declaring "gone" here made live sessions look dead to exactly
    // the friends who scanned the host's code (Lucy field report,
    // 2026-10-16). Wait for the fetch before judging.
    return (
      <div className="min-h-screen bg-paper-50">
        <div className="mx-auto flex max-w-[560px] flex-col items-center px-6 py-16 text-center">
          <Logo size={56} />
          <p className="mt-6 text-sm font-medium text-ink-500">Loading your session…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-paper-50">
        <div className="mx-auto max-w-[560px] px-6 py-10">
          <div className="flex flex-col items-center text-center">
            <Logo size={56} />
          </div>
          <div className="mt-8 rounded-2xl bg-paper-100 border border-ink-100 p-6 text-center">
            <p className="text-3xl">🧗</p>
            <h2 className="mt-3 text-xl font-semibold text-ink-900">This session is gone</h2>
            <p className="mt-2 text-sm text-ink-500">
              It may have finished or been taken down. Check Find for sessions near you.
            </p>
            <Button className="mt-6 w-full" onClick={() => nav('/find')}>
              Find sessions
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="min-h-screen bg-paper-50">
        <div className="mx-auto max-w-[560px] px-6 py-10">
          <div className="flex flex-col items-center text-center">
            <Logo size={56} />
          </div>
          <div className="mt-8 rounded-2xl bg-paper-100 border border-ink-100 p-6 text-center">
            <p className="text-3xl">🧗</p>
            <h2 className="mt-3 text-xl font-semibold text-ink-900">You're invited to climb</h2>
            <p className="mt-2 text-sm text-ink-500">
              Join this session right now — just your name, no sign-up.
            </p>
            <div className="mt-5 text-left">
              <GuestJoinForm
                buttonLabel="Join this session as a guest"
                onJoined={() => {
                  // Lucy, 2026-10-14: guests join the scanned session directly.
                  if (session) void rsvp(session.id, { viaShare: true });
                }}
              />
            </div>
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-ink-100" />
              <span className="text-xs text-ink-400">or</span>
              <div className="h-px flex-1 bg-ink-100" />
            </div>
            <Button variant="outline" className="w-full" onClick={() => setSheetOpen(true)}>
              Sign in with email
            </Button>
            <p className="mt-2 text-[11px] text-ink-400">
              Guests join instantly; sign in anytime to keep your history on this device.
            </p>
          </div>
        </div>
        <AuthSheet open={sheetOpen} onOpenChange={setSheetOpen} title="Sign in" initialTab="code" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-paper-50" />
      <SessionDetailSheet
        session={session}
        open={detailOpen}
        onOpenChange={(o) => {
          setDetailOpen(o);
          if (!o) nav('/sessions');
        }}
      />
    </>
  );
}
