import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { AuthSheet } from '@/components/AuthSheet';
import { Logo } from '@/components/layout/Logo';
import { ClimbCallDetailSheet } from '@/components/sheets/ClimbCallDetailSheet';
import { useAppStore } from '@/store/useAppStore';

/**
 * Deep link for a shared climb call: /call/:callId
 * - Logged in → opens the call detail sheet directly (request-to-pair works).
 * - Logged out → sign-in prompt first, then the call.
 * - Unknown/expired call → friendly empty state.
 */
export function CallDeepLink() {
  const { callId } = useParams();
  const nav = useNavigate();
  const me = useAppStore((s) => s.me);
  const climbCalls = useAppStore((s) => s.climbCalls);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(true);

  const call = climbCalls.find((c) => c.id === callId);

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
              Sign in to see this climb call and request to pair up.
            </p>
            <Button className="mt-6 w-full" size="lg" onClick={() => setSheetOpen(true)}>
              Sign in to view
            </Button>
          </div>
        </div>
        <AuthSheet open={sheetOpen} onOpenChange={setSheetOpen} title="Sign in" />
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
