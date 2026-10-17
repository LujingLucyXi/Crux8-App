import { InvitesSection } from '@/components/chat/InvitesSection';
import { useAppStore, countActionableInvites } from '@/store/useAppStore';

/**
 * Notifications (Lucy 2026-10-17): climb invitations belong here —
 * prominent, with their own bell + badge — not buried inside Chats.
 * One home for everything that needs your answer: climb invitations
 * first, then people who followed you.
 */
export function Notifications() {
  const pendingInvites = useAppStore((s) =>
    countActionableInvites({
      me: s.me,
      invites: s.invites,
      sessions: s.sessions,
      climbCalls: s.climbCalls,
      sessionLifecycle: s.sessionLifecycle,
    }),
  );
  const pendingFollowers = useAppStore((s) =>
    s.me
      ? s.mateRequests.filter(
          (r) =>
            r.status !== 'denied' &&
            r.to_id === s.me!.id &&
            !s.dismissedFollowers.includes(r.from_id) &&
            !s.mateRequests.some(
              (o) =>
                o.from_id === s.me!.id && o.to_id === r.from_id && o.status !== 'denied',
            ),
        ).length
      : 0,
  );
  const allClear = pendingInvites === 0 && pendingFollowers === 0;

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 mb-4">Notifications</h1>
      <InvitesSection invitesFirst hideHeading />
      {allClear && (
        <div className="rounded-2xl border border-ink-100 bg-paper-100 p-6 text-center">
          <p className="text-2xl">🔔</p>
          <p className="mt-2 text-sm font-semibold text-ink-900">You&apos;re all caught up</p>
          <p className="mt-1 text-xs text-ink-500">
            Climb invitations and new followers will show up here.
          </p>
        </div>
      )}
    </div>
  );
}
