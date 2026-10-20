import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { NewSessionSheet } from '@/components/sheets/NewSessionSheet';
import { CardRevealSheet } from '@/components/sheets/CardRevealSheet';
import { CelebrationHost } from '@/components/fx/CelebrationHost';
import { useAppStore } from '@/store/useAppStore';

export function AppShell() {
  const newSheetOpen = useAppStore((s) => s.newSessionOpen);
  const setNewSheetOpen = useAppStore((s) => s.setNewSessionOpen);
  const meId = useAppStore((s) => s.me?.id);
  const resumePendingBefriend = useAppStore((s) => s.resumePendingBefriend);
  const fetchMateRequests = useAppStore((s) => s.fetchMateRequests);
  const fetchInvites = useAppStore((s) => s.fetchInvites);
  const fetchMyGroups = useAppStore((s) => s.fetchMyGroups);
  const fetchCheckin = useAppStore((s) => s.fetchCheckin);
  const fetchMyMessages = useAppStore((s) => s.fetchMyMessages);

  // Invite-link auto-befriend, resumed whenever a signed-in identity
  // materializes: a Google sign-in returns to whatever route the
  // redirect lands on, not necessarily back to /add — the friendship
  // must not depend on the landing page (Lucy 2026-10-17: a Google
  // joiner's auto-befriend never landed; both sides lost it on
  // restart because only local state ever held it).
  useEffect(() => {
    if (meId) void resumePendingBefriend();
  }, [meId, resumePendingBefriend]);

  // Near-live notifications: follows and invites written by other
  // people reach the bell + Notifications page on app focus and on a
  // slow heartbeat while the app is open — before this, a follow
  // only surfaced after the recipient happened to remount a section
  // or restart the app (Lucy 2026-10-17: 'I followed him and he
  // never saw it').
  useEffect(() => {
    if (!meId) return;
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      void fetchMateRequests();
      void fetchInvites();
      void fetchMyGroups();
      void fetchCheckin();
      void fetchMyMessages();
      void resumePendingBefriend();
    };
    const onVisible = () => refresh();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    const t = window.setInterval(refresh, 60_000);
    refresh();
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.clearInterval(t);
    };
  }, [meId, fetchMateRequests, fetchInvites, fetchMyGroups, fetchCheckin, fetchMyMessages, resumePendingBefriend]);

  return (
    <div className="min-h-screen bg-paper-50">
      <Header />
      <main className="mx-auto max-w-[560px] px-4 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <BottomNav onFabClick={() => setNewSheetOpen(true)} />
      <NewSessionSheet open={newSheetOpen} onOpenChange={setNewSheetOpen} />
      <CardRevealSheet />
      <CelebrationHost />
    </div>
  );
}
