import { useState } from 'react';
import {
  DAY_PARTS,
  DAYS_MON_FIRST,
  USUAL_STYLES,
  legacySlotKey,
  slotKey,
  type DayPart,
  type UsualStyle,
} from '@/lib/availability';
import type { Gym } from '@/seed/types';
import { cn } from '@/lib/utils';

/**
 * "When & where I usually climb" editor (Lucy 2026-10-19; per-style
 * grids 2026-10-20) — shared by onboarding step 1's highlight card
 * and Edit profile. Boulder / Top rope / Lead get SEPARATE weekly
 * grids (tabbed, so the card stays compact), plus usual-gym chips.
 * Whatever is picked is public: it's how other climbers find and
 * invite you. Everything here is optional — an empty grid is fine.
 *
 * Chip colors use theme tokens on purpose: bg-white/70 looked fine
 * in light mode but turned into unreadable white blocks on the
 * dark card (Lucy's 2026-10-20 screenshot). paper-50 flips with
 * the theme in both modes.
 */
export function UsualTimesEditor({
  times,
  gymIds,
  gyms,
  onChange,
}: {
  times: string[];
  gymIds: string[];
  gyms: Gym[];
  onChange: (next: { times: string[]; gymIds: string[] }) => void;
}) {
  const [style, setStyle] = useState<UsualStyle>('boulder');

  // A slot counts as on for the active style when its style key is
  // set — or when a legacy (pre-style) key covers it; toggling then
  // upgrades the legacy key to the style key.
  const isOn = (dow: number, part: DayPart) =>
    times.includes(slotKey(style, dow, part)) || times.includes(legacySlotKey(dow, part));

  const countFor = (st: UsualStyle) =>
    times.filter((k) => k.startsWith(`${st}:`)).length;

  const toggleSlot = (dow: number, part: DayPart) => {
    const styled = slotKey(style, dow, part);
    const legacy = legacySlotKey(dow, part);
    const wasOn = times.includes(styled) || times.includes(legacy);
    const base = times.filter((x) => x !== styled && x !== legacy);
    onChange({ times: wasOn ? base : [...base, styled], gymIds });
  };
  const toggleGym = (id: string) => {
    onChange({
      times,
      gymIds: gymIds.includes(id) ? gymIds.filter((x) => x !== id) : [...gymIds, id],
    });
  };

  const chipCls = (on: boolean) =>
    cn(
      'border font-medium transition-colors',
      on
        ? 'bg-brand-600 text-[#161310] border-brand-600 font-semibold'
        : 'bg-paper-50 text-ink-700 border-ink-100',
    );

  return (
    <div>
      {/* Discipline tabs — each style keeps its own weekly grid. */}
      <div className="flex gap-1.5 mb-2.5" role="tablist" aria-label="Climbing style">
        {USUAL_STYLES.map(({ key, label }) => {
          const active = style === key;
          const count = countFor(key);
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setStyle(key)}
              className={cn(
                'flex-1 rounded-xl border px-2 py-2 text-xs transition-colors',
                active
                  ? 'bg-ink-900 text-paper-50 border-ink-900 font-bold'
                  : 'bg-paper-50 text-ink-600 border-ink-100 font-medium',
              )}
            >
              {label}
              {count > 0 && <span className="ml-1 opacity-70">· {count}</span>}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5">
        {DAYS_MON_FIRST.map(({ dow, short }) => (
          <div key={dow} className="flex items-center gap-1.5">
            <span className="w-9 shrink-0 text-xs font-semibold text-ink-600">{short}</span>
            <div className="flex flex-1 gap-1.5">
              {DAY_PARTS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSlot(dow, key)}
                  className={cn('flex-1 rounded-lg px-2 py-1.5 text-xs', chipCls(isOn(dow, key)))}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {gyms.length > 0 && (
        <>
          <p className="mt-4 mb-1.5 text-xs font-semibold text-ink-600">Gyms I usually climb at</p>
          <div className="flex flex-wrap gap-1.5">
            {gyms.map((g) => {
              const on = gymIds.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGym(g.id)}
                  className={cn('rounded-full px-3 py-1.5 text-xs', chipCls(on))}
                >
                  {g.short_name}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
