import { useMemo, useState } from 'react';
import { Search, NavArrowDown } from 'iconoir-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import type { ResolvedUser } from '@/lib/resolveUser';

/**
 * Cruxmate invite picker (Lucy's rule, 2026-10-13): a DROPDOWN with
 * suggested cruxmates. Collapsed it shows who's picked; opening it
 * reveals the suggestion list — capped at 8 visible rows (scrollable)
 * with a search box once there are more than 8 cruxmates to choose
 * from. In invite mode one tap sends the invite (Cruxy shows
 * "✓ Joined", she auto-accepts); in select mode (creation forms)
 * tapping toggles selection and the invites fire on submit.
 */
interface Props {
  invitable: ResolvedUser[];
  invited: string[];
  onInvite: (userId: string, name: string) => void;
  /** Select mode (creation forms): tapping toggles selection instead of
   *  sending immediately; `invited` carries the selected ids. */
  selectMode?: boolean;
}

export function CruxmatePicker({ invitable, invited, onInvite, selectMode }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const showSearch = invitable.length > 8;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return invitable;
    return invitable.filter((u) => u.display_name.toLowerCase().includes(q));
  }, [invitable, query]);

  const pickedNames = invitable
    .filter((u) => invited.includes(u.id))
    .map((u) => u.display_name.split(' ')[0]);
  const summary =
    pickedNames.length === 0
      ? selectMode
        ? 'Choose cruxmates…'
        : 'Invite cruxmates…'
      : pickedNames.length <= 2
        ? pickedNames.join(', ')
        : `${pickedNames.slice(0, 2).join(', ')} +${pickedNames.length - 2}`;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 rounded-xl border border-ink-100 bg-paper-100 px-3.5 py-2.5 text-sm text-left"
      >
        <span className={cn('flex-1 truncate', pickedNames.length ? 'text-ink-900 font-medium' : 'text-ink-400')}>
          {summary}
        </span>
        {pickedNames.length > 0 && (
          <span className="text-[11px] font-semibold text-teal-600 shrink-0">
            {selectMode ? `${pickedNames.length} added` : `${pickedNames.length} invited`}
          </span>
        )}
        <NavArrowDown
          width={16}
          height={16}
          className={cn('text-ink-400 shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="mt-2">
          {showSearch && (
            <div className="relative mb-2">
              <Search width={15} height={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cruxmates…"
                className="w-full rounded-xl border border-ink-100 bg-paper-100 py-2 pl-9 pr-3 text-sm text-ink-900 outline-none focus:border-brand-600 placeholder:text-ink-400"
              />
            </div>
          )}
          <div className="max-h-[368px] overflow-y-auto rounded-xl border border-ink-100 divide-y divide-ink-50">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-ink-500">No cruxmates match that search.</p>
            ) : (
              filtered.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar
                    photoUrl={u.photo_url ?? undefined}
                    config={u.avatar}
                    alt={u.display_name}
                    size={32}
                    fallback={u.display_name}
                  />
                  <p className="flex-1 text-sm font-medium text-ink-900 truncate">{u.display_name}</p>
                  <button
                    type="button"
                    onClick={() => onInvite(u.id, u.display_name)}
                    disabled={!selectMode && invited.includes(u.id)}
                    className="text-xs font-semibold text-teal-600 shrink-0 disabled:text-ink-400"
                  >
                    {selectMode
                      ? invited.includes(u.id)
                        ? '✓ Added'
                        : 'Add'
                      : invited.includes(u.id)
                        ? u.id === 'cruxy'
                          ? '✓ Joined'
                          : '✓ Invited'
                        : 'Invite'}
                  </button>
                </div>
              ))
            )}
          </div>
          {invitable.length > 8 && (
            <p className="mt-1.5 text-[11px] text-ink-400">
              Showing {filtered.length} of {invitable.length} cruxmates — scroll or search
            </p>
          )}
        </div>
      )}
    </div>
  );
}
