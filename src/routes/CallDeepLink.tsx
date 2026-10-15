import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { AuthSheet } from '@/components/AuthSheet';
import { Logo } from '@/components/layout/Logo';
import { GuestJoinForm } from '@/components/GuestJoinForm';
import { ClimbCallDetailSheet } from '@/components/sheets/ClimbCallDetailSheet';
import { savePendingIntent, consumePendingIntentFor } from '@/lib/pendingIntent';
import { useAppStore } from '@/store/useAppStore';

/**
 * Deep link for a shared climb call: /call/:callId
 * - Logged in → opens the call detail sheet directly (request-to-pair works).
 * - Logged out → sign-in prompt first, then the call.
 * - Unknown/expired call → friendly empty state.
 * - The join intent is stashed before any auth detour and consumed on
 *   return, so a shared link survives sign-in and lands back here.
 */
export function CallDeepLink() {
  const { callId } = useParams();
  const nav = useNavigate();
  const me = useAppStore((s) => s.me);
  const climbCalls = useAppStore((s) => s.climbCalls);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(true);

  const call = climbCalls.find((c) => c.id === callId);

  // Stash the join target before any auth detour so the shared link
  // survives sign-in + onboarding and lands back on this call.
  useEffect(() => {
    if (!me && call) savePendingIntent({ type: 'call', id: call.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id, call?.id]);

  // Back from the detour: consume the intent (the call detail below
  // already carries the request-to-pair action).
  useEffect(() => {
    if (me && call) consumePendingIntentFor('call', call.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id, call?.id]);

  if (!call) {
    return (
      <div className="min-h-screen bg-paper-50">
        <div className="mx-auto max-w-[560px] px-6 py-10">
          <div className="flex flex-col items-center text-center">
            <Logo size={56} />
          </div>
          <div className="mt-8 rounded-2xl bg-paper-100 border border-ink-100 p-6 text-center">
            <p className="text-3xl">🧗</p>
            <h2 className="mt-3 text-xl font-semibold text-ink-900">This climb call is gone</h2>
            <p className="mt-2 text-sm text-ink-500">
              It may have expired or been taken down. Check the Find tab for live calls near you.
            </p>
            <Button className="mt-6 w-full" onClick={() => nav('/find')}>
              Find climb calls
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
            <h2 className="mt-3 text-xl font-semibold text-ink-900">Someone wants a partner</h2>
            <p className="mt-2 text-sm text-ink-500">
              See this climb call with just your name — no sign-up.
            </p>
            <div className="mt-5 text-left">
              <GuestJoinForm buttonLabel="View as a guest" />
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
              Guests view instantly; sign in anytime to keep your history on this device.
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
      <ClimbCallDetailSheet
        call={call}
        open={detailOpen}
        onOpenChange={(o) => {
          setDetailOpen(o);
          if (!o) nav('/find');
        }}
      />
    </>
  );
}
