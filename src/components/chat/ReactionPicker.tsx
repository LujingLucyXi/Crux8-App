import { useState } from 'react';
import { Emoji } from 'iconoir-react';
import { REACTIONS, REACTION_BY_KEY } from '@/lib/reactions';
import type { Reaction, ReactionKey } from '@/seed/types';
import { cn } from '@/lib/utils';

interface Props {
  reactions?: Reaction[];
  meId: string;
  onToggle: (key: ReactionKey) => void;
  align?: 'left' | 'right';
}

/**
 * Renders existing reaction chips + a compact picker button.
 * Reactions grouped by key with count; tap yours to remove.
 */
export function ReactionPicker({ reactions, meId, onToggle, align = 'left' }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  // Group by key + count + track if I reacted
  const groups = (reactions ?? []).reduce(
    (acc, r) => {
      if (!acc[r.key]) acc[r.key] = { count: 0, mine: false };
      acc[r.key].count += 1;
      if (r.by === meId) acc[r.key].mine = true;
      return acc;
    },
    {} as Record<string, { count: number; mine: boolean }>,
  );

  return (
    <div
      className={cn('mt-1 flex gap-1 flex-wrap items-center relative', align === 'right' && 'justify-end')}
    >
      {Object.entries(groups).map(([key, { count, mine }]) => {
        const meta = REACTION_BY_KEY[key as ReactionKey];
        if (!meta) return null;
        return (
          <button
            key={key}
            onClick={() => onToggle(key as ReactionKey)}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors',
              mine
                ? 'bg-teal-100 border-teal-600 text-teal-600'
                : 'bg-white border-ink-100 text-ink-700 hover:border-ink-300',
            )}
            title={meta.label}
          >
            <span>{meta.emoji}</span>
            <span>{count}</span>
          </button>
        );
      })}
      <button
        onClick={() => setPickerOpen((v) => !v)}
        aria-label="Add reaction"
        className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-ink-100 text-ink-500 hover:border-ink-300 hover:text-ink-700"
      >
        <Emoji width={12} height={12} />
      </button>
      {pickerOpen && (
        <div
          className={cn(
            'absolute -top-11 z-10 flex gap-1 rounded-full bg-white border border-ink-100 shadow-sm px-2 py-1.5',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {REACTIONS.map((r) => (
            <button
              key={r.key}
              onClick={() => {
                onToggle(r.key);
                setPickerOpen(false);
              }}
              title={r.label}
              className="text-lg hover:scale-125 transition-transform"
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
