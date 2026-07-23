import { NavLink } from 'react-router-dom';
import { Home, Compass, Calendar, User, Plus } from 'iconoir-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  onFabClick: () => void;
}

/**
 * 5 slots: Home · Find · [+] · Climbs · Profile.
 * Chat lives in the header (with an unread dot) — standard pattern that
 * keeps the bottom bar at the 4-destination sweet spot.
 */
const items = [
  { to: '/home', label: 'Home', Icon: Home },
  { to: '/find', label: 'Find', Icon: Compass },
  null, // FAB slot
  { to: '/sessions', label: 'Climbs', Icon: Calendar },
  { to: '/profile', label: 'Profile', Icon: User },
] as const;

export function BottomNav({ onFabClick }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-ink-100">
      <div className="mx-auto max-w-[560px] relative">
        <div className="grid grid-cols-5 h-16">
          {items.map((item, i) =>
            item ? (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                    isActive ? 'text-ink-900' : 'text-ink-500',
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
          onClick={onFabClick}
          aria-label="Post a session, call, or event"
          className="absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 rounded-full bg-ink-900 text-white flex items-center justify-center border-4 border-white hover:bg-ink-700 active:scale-95 transition-all"
        >
          <Plus width={26} height={26} strokeWidth={2.5} />
        </button>
      </div>
    </nav>
  );
}
