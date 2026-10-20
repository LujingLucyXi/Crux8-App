import { NavLink } from 'react-router-dom';
import { Home, Compass, Calendar, User, Plus, Album } from 'iconoir-react';
import { cn } from '@/lib/utils';
import { tapTick } from '@/lib/native';

interface BottomNavProps {
  onFabClick: () => void;
}

/**
 * 6 slots: Home · Find · Cards · [+] · Climbs · Profile.
 * The card collection (the Vault) is its own tab now (Lucy
 * 2026-10-20: a unique section, separate from Profile). Chat lives
 * in the header with its unread badge. The FAB sits over slot 4, so
 * it centers at 3.5/6 of the bar rather than 50%.
 */
const items = [
  { to: '/home', label: 'Home', Icon: Home },
  { to: '/find', label: 'Find', Icon: Compass },
  { to: '/collection', label: 'Cards', Icon: Album },
  null, // FAB slot
  { to: '/sessions', label: 'Climbs', Icon: Calendar },
  { to: '/profile', label: 'Profile', Icon: User },
] as const;

export function BottomNav({ onFabClick }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-paper-100 border-t border-ink-100 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-[560px] relative">
        <div className="grid grid-cols-6 h-16">
          {items.map((item, i) =>
            item ? (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
                    isActive ? 'text-brand-600' : 'text-ink-500',
                  )
                }
              >
                <item.Icon width={22} height={22} />
                <span>{item.label}</span>
              </NavLink>
            ) : (
              <div key={i} />
            ),
          )}
        </div>
        <button
          onClick={() => {
            void tapTick();
            onFabClick();
          }}
          aria-label="Post a session, call, or event"
          className="absolute -translate-x-1/2 -top-6 w-14 h-14 rounded-full bg-brand-gradient text-white flex items-center justify-center border-4 border-white shadow-brand hover:brightness-105 active:scale-95 transition-all"
          style={{ left: '58.333%' }}
        >
          <Plus width={26} height={26} strokeWidth={2.5} />
        </button>
      </div>
    </nav>
  );
}
