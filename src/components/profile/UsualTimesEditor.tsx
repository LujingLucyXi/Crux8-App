import { DAY_PARTS, DAYS_MON_FIRST, slotKey, type DayPart } from '@/lib/availability';
import type { Gym } from '@/seed/types';
import { cn } from '@/lib/utils';

/**
 * "When & where I usually climb" editor (Lucy 2026-10-19) — shared by
 * onboarding (climb step) and Edit profile. A 7×3 grid of toggle
 * chips (day × daypart) plus usual-gym chips. Whatever is picked is
 * public: it's how other climbers find and invite you.
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
  const toggleSlot = (dow: number, part: DayPart) => {
    const k = slotKey(dow, part);
    onChange({
      times: times.includes(k) ? times.filter((x) => x !== k) : [...times, k],
      gymIds,
    });
  };
  const toggleGym = (id: string) => {
    onChange({
      times,
      gymIds: gymIds.includes(id) ? gymIds.filter((x) => x !== id) : [...gymIds, id],
    });
  };
  return (
    <div>
      <div className="flex flex-col gap-1.5">
        {DAYS_MON_FIRST.map(({ dow, short }) => (
          <div key={dow} className="flex items-center gap-1.5">
            <span className="w-9 shrink-0 text-xs font-semibold text-ink-500">{short}</span>
            <div className="flex flex-1 gap-1.5">
              {DAY_PARTS.map(({ key, label }) => {
                const on = times.includes(slotKey(dow, key));
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleSlot(dow, key)}
                    className={cn(
                      'flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors',
                      on
                        ? 'bg-brand-600 text-[#161310] border-brand-600 font-semibold'
                        : 'bg-paper-100 text-ink-600 border-ink-100',
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {gyms.length > 0 && (
        <>
          <p className="mt-4 mb-1.5 text-xs font-semibold text-ink-500">Gyms I usually climb at</p>
          <div className="flex flex-wrap gap-1.5">
            {gyms.map((g) => {
              const on = gymIds.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGym(g.id)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    on
                      ? 'bg-brand-600 text-[#161310] border-brand-600 font-semibold'
                      : 'bg-paper-100 text-ink-600 border-ink-100',
                  )}
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
