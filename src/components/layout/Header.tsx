import { Menu, ChatBubbleEmpty } from 'iconoir-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, countUnreadThreads } from '@/store/useAppStore';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Logo } from './Logo';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = useNavigate();
  const me = useAppStore((s) => s.me);
  const signOut = useAppStore((s) => s.signOut);
  const resetAll = useAppStore((s) => s.resetAll);
  // Real per-thread unread: a thread counts only when its latest message is
  // incoming and arrived after I last opened it. Clears as I read each thread.
  const unreadCount = useAppStore((s) =>
    countUnreadThreads({
      cruxmates: s.cruxmates,
      chats: s.chats,
      sessionChats: s.sessionChats,
      chatReads: s.chatReads,
    }),
  );

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-ink-100 pt-[env(safe-area-inset-top)]">
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
            <button onClick={() => nav('/profile')} aria-label="Profile">
              <Avatar photoUrl={me?.photo_url} config={me?.avatar} alt={me?.display_name} size={30} fallback={me?.display_name} />
            </button>
          </div>
        </div>
      </header>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent title="Menu">
          <div className="flex flex-col gap-1 mt-2">
            <button className="text-left px-3 py-3 rounded-xl hover:bg-paper-50 text-ink-900 font-medium">
              About Crux8
            </button>
            <button className="text-left px-3 py-3 rounded-xl hover:bg-paper-50 text-ink-900 font-medium">
              Trust & safety
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
            <Button
              variant="destructive"
              className="justify-start"
              onClick={() => {
                if (confirm('Reset everything and start over?')) {
                  resetAll();
                  setMenuOpen(false);
                  nav('/');
                }
              }}
            >
              Reset all data (dev)
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
