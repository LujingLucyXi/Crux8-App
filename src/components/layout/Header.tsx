import { Menu, ChatBubbleEmpty, Group, Bell, Plus } from 'iconoir-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore, countUnreadThreads, countActionableInvites, crewAddNotices } from '@/store/useAppStore';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { InfoSheet } from '@/components/sheets/InfoSheet';
import { FeedbackSheet } from '@/components/sheets/FeedbackSheet';
import { NewCrewSheet } from '@/components/sheets/NewCrewSheet';
import { PeopleFinder } from '@/components/PeopleFinder';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Logo } from './Logo';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoKind, setInfoKind] = useState<'about' | 'trust' | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [crewOpen, setCrewOpen] = useState(false);
  const nav = useNavigate();
  const { pathname } = useLocation();
  // The add-friends sheet navigates to /add/:code on code submit — a route
  // change doesn't auto-dismiss sheets, so close it whenever we navigate.
  useEffect(() => {
    setAddOpen(false);
  }, [pathname]);
  const me = useAppStore((s) => s.me);
  const signOut = useAppStore((s) => s.signOut);
  const groups = useAppStore((s) => s.groups);
  const myGroupMemberships = useAppStore((s) => s.myGroupMemberships);
  const myCrews = groups.filter((g) => myGroupMemberships.includes(g.id));
  // Real per-thread unread: a thread counts only when its latest message is
  // incoming and arrived after I last opened it. Clears as I read each thread.
  const unreadThreads = useAppStore((s) =>
    countUnreadThreads({
      cruxmates: s.cruxmates,
      chats: s.chats,
      sessionChats: s.sessionChats,
      chatReads: s.chatReads,
    }),
  );
  // Pending invites are notifications too — they ride the same badge and
  // clear when answered or when the climb starts/ends.
  const pendingInvites = useAppStore((s) =>
    countActionableInvites({
      me: s.me,
      invites: s.invites,
      sessions: s.sessions,
      climbCalls: s.climbCalls,
      sessionLifecycle: s.sessionLifecycle,
    }),
  );
  // Followers I haven't followed back ride the same badge.
  const pendingMateRequests = useAppStore((s) =>
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
  const unreadCount = unreadThreads;
  // Notifications get their own bell + badge (Lucy 2026-10-17: climb
  // invitations in Notifications are 'more visible' than inside
  // Chats). The chat badge now means unread conversations only.
  // Crew-add notifications ride the same badge until dismissed.
  const crewNotices = useAppStore((s) =>
    crewAddNotices({
      invites: s.invites,
      dismissedNotices: s.dismissedNotices,
      myGroupMemberships: s.myGroupMemberships,
    }).length,
  );
  const notifCount = pendingInvites + pendingMateRequests + crewNotices;

  return (
    <>
      <header className="sticky top-0 z-20 bg-paper-100/95 backdrop-blur border-b border-ink-100 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto max-w-[560px] flex items-center justify-between h-14 px-4">
          <button
            aria-label="Menu"
            onClick={() => setMenuOpen(true)}
            className="p-1.5 -ml-1.5 rounded-lg text-ink-700 hover:bg-paper-50"
          >
            <Menu width={22} height={22} />
          </button>
          <button
            onClick={() => nav('/home')}
            aria-label="Crux8 home"
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 -mx-1.5 hover:bg-paper-50 transition-colors"
          >
            <Logo size={26} />
            <span className="font-bold tracking-[0.18em] text-ink-900 text-sm">CRUX8</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => nav('/notifications')}
              aria-label={notifCount > 0 ? `Notifications, ${notifCount} new` : 'Notifications'}
              className="relative p-1.5 rounded-lg text-ink-700 hover:bg-paper-50"
            >
              <Bell width={22} height={22} />
              {notifCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-coral-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>
            <button
              onClick={() => nav('/chat')}
              aria-label={unreadCount > 0 ? `Chats, ${unreadCount} unread` : 'Chats'}
              className="relative p-1.5 rounded-lg text-ink-700 hover:bg-paper-50"
            >
              <ChatBubbleEmpty width={22} height={22} />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-coral-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setAddOpen(true)}
              aria-label="Friends"
              className="relative p-1.5 rounded-lg text-ink-700 hover:bg-paper-50"
            >
              <Group width={22} height={22} />
            </button>
            <button onClick={() => nav('/profile')} aria-label="Profile">
              <Avatar photoUrl={me?.photo_url} config={me?.avatar} alt={me?.display_name} size={30} fallback={me?.display_name} />
            </button>
          </div>
        </div>
      </header>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent title="Menu">
          <div className="flex flex-col gap-1 mt-2">
            <button
              className="text-left px-3 py-2 rounded-xl hover:bg-paper-50 text-ink-900 font-medium"
              onClick={() => {
                setMenuOpen(false);
                setInfoKind('about');
              }}
            >
              About Crux8
            </button>
            <button
              className="text-left px-3 py-2 rounded-xl hover:bg-paper-50 text-ink-900 font-medium"
              onClick={() => {
                setMenuOpen(false);
                setInfoKind('trust');
              }}
            >
              Trust & safety
            </button>
            <button
              className="text-left px-3 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold flex items-center gap-2"
              onClick={() => {
                setMenuOpen(false);
                setFeedbackOpen(true);
              }}
            >
              🐞 Report a problem
            </button>
            <div className="h-px bg-ink-100 my-2" />
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => {
                signOut();
                setMenuOpen(false);
                nav('/');
              }}
            >
              Sign out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent title="Friends">
          <div className="mt-2">
            <PeopleFinder />
            {/* My crews live in the Friends tab too (Lucy 2026-10-17:
                everything friend-related in one place — the Start a
                crew button previously existed only on the Crews page
                and the Chats empty state, and she couldn't find it). */}
            <div className="mt-1 border-t border-ink-100 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
                My crews{myCrews.length > 0 ? ` · ${myCrews.length}` : ''}
              </h3>
              {myCrews.length === 0 ? (
                <p className="text-sm text-ink-500 mb-3">
                  You're not in any crews yet.
                </p>
              ) : (
                <div className="space-y-2 mb-3">
                  {myCrews.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => nav(`/community/${g.id}`)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-ink-100 bg-paper-100 px-4 py-3 text-left"
                    >
                      <Avatar
                        photoUrl={
                          g.avatar_url ??
                          `https://picsum.photos/seed/cruxmate-logo-${g.id.replace('grp_', '')}/200/200`
                        }
                        size={36}
                        alt={g.name}
                        fallback={g.name}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink-900 truncate">{g.name}</p>
                        <p className="text-xs text-ink-500">
                          {g.member_count} member{g.member_count === 1 ? '' : 's'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <Button
                className="w-full"
                onClick={() => {
                  setAddOpen(false);
                  setCrewOpen(true);
                }}
              >
                <Plus width={15} height={15} className="mr-1" /> Start a crew
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <NewCrewSheet open={crewOpen} onOpenChange={setCrewOpen} />
      {infoKind && (
        <InfoSheet open onOpenChange={(v) => !v && setInfoKind(null)} kind={infoKind} />
      )}
      <FeedbackSheet open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
}
