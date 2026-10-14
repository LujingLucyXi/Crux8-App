import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { AuthSheet } from '@/components/AuthSheet';
import { Logo } from '@/components/layout/Logo';
import { SessionDetailSheet } from '@/components/sheets/SessionDetailSheet';
import { useAppStore } from '@/store/useAppStore';

/**
 * Deep link for a shared session: /session/:sessionId
 * - Logged in → opens the session detail sheet directly (RSVP works).
 * - Logged out → sign-in prompt first, then the session.
 * - Unknown/finished session → friendly empty state.
 */
export function SessionDeepLink() {
  const { sessionId } = useParams();
  const nav = useNavigate();
  const me = useAppStore((s) => s.me);
  const sessions = useAppStore((s) => s.sessions);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(true);

  const session = sessions.find((s) => s.id === sessionId);

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
              Sign in to see this session and RSVP.
            </p>
            <Button className="mt-6 w-full" size="lg" onClick={() => setSheetOpen(true)}>
              Sign in to view
            </Button>
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
