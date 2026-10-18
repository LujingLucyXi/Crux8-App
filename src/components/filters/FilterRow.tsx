import { useEffect, useState } from 'react';
import { NavArrowDown, Filter, Xmark } from 'iconoir-react';
import { format } from 'date-fns';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppStore } from '@/store/useAppStore';
import { bandsForStyles } from '@/lib/gradeBand';
import { AREAS } from '@/seed/routes';
import { cn } from '@/lib/utils';

type Key = 'gym' | 'area' | 'date' | 'time' | 'level' | 'role' | 'all';

const DATE_OPTS = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
] as const;

const TIME_OPTS = [
  { value: 'morning', label: 'Morning · 6a–12p' },
  { value: 'afternoon', label: 'Afternoon · 12p–5p' },
  { value: 'evening', label: 'Evening · 5p–10p' },
] as const;

// Level bands come from lib/gradeBand: boulder styles see V bands,
// rope styles see YDS bands — one mixed list served both before,
// which put rope grades in front of boulderers (Lucy 2026-10-17).

const ROLE_OPTS = [
  { value: 'belayer', label: 'Needs belayer' },
  { value: 'climber', label: 'Needs climber' },
  { value: 'take_turns', label: 'Take turns' },
] as const;

/**
 * Secondary refinement chips for Find. Styles now live inline in Find as a
 * visible multi-select — this row handles the rest: location, date, time,
 * level, rope-role + weight-safe (climb), free-only (event).
 */
export function FilterRow() {
  const filters = useAppStore((s) => s.filters);
  const gyms = useAppStore((s) => s.gyms);
  const setFilter = useAppStore((s) => s.setFilter);
  const clearFilters = useAppStore((s) => s.clearFilters);
  const [open, setOpen] = useState<Key | null>(null);

  const { l1, env } = filters;
  const levelBands = bandsForStyles(filters.climb_styles ?? []);
  // A band from the other grading system can't survive a style
  // change (Boulder picked while '5.10a–5.10c' was selected).
  const gradeBand = filters.grade_band;
  useEffect(() => {
    if (gradeBand && !levelBands.includes(gradeBand)) {
      setFilter({ grade_band: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeBand, filters.climb_styles]);

  // Going boulder-only retires any rope-role selection with the chips.
  const lookingFor = filters.looking_for;
  const weightSafe = filters.weight_safe_only;
  useEffect(() => {
    if (!ropeInPlay && (lookingFor || weightSafe)) {
      setFilter({ looking_for: undefined, weight_safe_only: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ropeInPlay, lookingFor, weightSafe]);
  const showGym = l1 === 'climb' && env === 'indoor';
  const showArea = (l1 === 'climb' && env === 'outdoor') || l1 === 'hike';
  const showLevel = l1 === 'climb';
  // Belay roles + weight-safety are ROPE concepts: bouldering has no
  // belayer (Lucy 2026-10-17: 'boulder shouldn't have these roles').
  // They show when rope styles are in play or nothing is selected.
  const styleSel = filters.climb_styles ?? [];
  const ropeInPlay =
    styleSel.length === 0 ||
    styleSel.some((x) => ['top_rope', 'lead', 'outdoor_sport', 'trad', 'multi_pitch'].includes(x));
  const showRole = l1 === 'climb' && ropeInPlay;
  const showFree = l1 === 'event';

  const hasFilters = Boolean(
    filters.gym_id || filters.area || filters.date || filters.date_specific ||
    filters.time || filters.grade_band || filters.looking_for || filters.weight_safe_only || filters.free_only,
  );

  const gym = filters.gym_id ? gyms.find((g) => g.id === filters.gym_id) : undefined;
  const chip = (active: boolean) =>
    cn(
      'shrink-0 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
      active ? 'enamel bg-[linear-gradient(160deg,#8B5CF6,#6D28D9)] text-white border-transparent' : 'bg-paper-100 text-ink-700 border-ink-100 hover:border-brand-400',
    );

  const dateLabel = () => {
    if (filters.date_specific) return format(new Date(filters.date_specific + 'T00:00:00'), 'MMM d');
    return DATE_OPTS.find((d) => d.value === filters.date)?.label ?? 'Date';
  };

  return (
    <>
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 -mx-4 px-4">
        {showGym && (
          <button className={chip(!!filters.gym_id)} onClick={() => setOpen('gym')}>
            {gym?.short_name ?? 'Gym'} <NavArrowDown width={12} height={12} />
          </button>
        )}
        {showArea && (
          <button className={chip(!!filters.area)} onClick={() => setOpen('area')}>
            {filters.area ?? 'Area'} <NavArrowDown width={12} height={12} />
          </button>
        )}
        <button className={chip(!!filters.date || !!filters.date_specific)} onClick={() => setOpen('date')}>
          {dateLabel()} <NavArrowDown width={12} height={12} />
        </button>
        <button className={chip(!!filters.time)} onClick={() => setOpen('time')}>
          {TIME_OPTS.find((t) => t.value === filters.time)?.label.split(' ')[0] ?? 'Time'} <NavArrowDown width={12} height={12} />
        </button>
        {showLevel && (
          <button className={chip(!!filters.grade_band)} onClick={() => setOpen('level')}>
            {filters.grade_band ?? 'Level'} <NavArrowDown width={12} height={12} />
          </button>
        )}
        {showRole && (
          <>
            <button className={chip(!!filters.looking_for)} onClick={() => setOpen('role')}>
              {filters.looking_for ? ROLE_OPTS.find((r) => r.value === filters.looking_for)?.label : 'Looking for'}
              <NavArrowDown width={12} height={12} />
            </button>
            <button
              className={chip(filters.weight_safe_only)}
              onClick={() => setFilter({ weight_safe_only: !filters.weight_safe_only })}
            >
              ⚖ Weight-safe
            </button>
          </>
        )}
        {showFree && (
          <button className={chip(filters.free_only)} onClick={() => setFilter({ free_only: !filters.free_only })}>
            Free only
          </button>
        )}
        <button className={chip(false)} onClick={() => setOpen('all')} aria-label="More filters">
          <Filter width={13} height={13} />
        </button>
      </div>

      {hasFilters && (
        <button onClick={clearFilters} className="mb-3 inline-flex items-center gap-1 text-xs text-teal-600 font-medium">
          <Xmark width={12} height={12} /> Clear filters
        </button>
      )}

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent title={open === 'all' ? 'Filters' : (open ?? '') as string}>
          {open === 'gym' && (
            <div className="flex flex-col gap-1">
              <button className="text-left px-3 py-3 rounded-xl hover:bg-paper-50 text-ink-500" onClick={() => { setFilter({ gym_id: undefined }); setOpen(null); }}>
                Any gym
              </button>
              {gyms.map((g) => (
                <button
                  key={g.id}
                  className={cn('text-left px-3 py-3 rounded-xl', filters.gym_id === g.id ? 'bg-brand-600 text-[#161310]' : 'text-ink-900 hover:bg-paper-50')}
                  onClick={() => { setFilter({ gym_id: g.id }); setOpen(null); }}
                >
                  {g.name}
                </button>
              ))}
            </div>
          )}

          {open === 'area' && (
            <div className="flex flex-col gap-1">
              <button className="text-left px-3 py-3 rounded-xl hover:bg-paper-50 text-ink-500" onClick={() => { setFilter({ area: undefined }); setOpen(null); }}>
                Any area
              </button>
              {AREAS.map((a) => (
                <button
                  key={a}
                  className={cn('text-left px-3 py-3 rounded-xl', filters.area === a ? 'bg-brand-600 text-[#161310]' : 'text-ink-900 hover:bg-paper-50')}
                  onClick={() => { setFilter({ area: a }); setOpen(null); }}
                >
                  {a}
                </button>
              ))}
            </div>
          )}

          {open === 'date' && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <button
                  className={cn('flex-1 rounded-xl border py-2 text-xs font-medium', !filters.date && !filters.date_specific ? 'bg-brand-600 text-[#161310] border-brand-600' : 'bg-paper-100 text-ink-700 border-ink-100')}
                  onClick={() => setFilter({ date: undefined, date_specific: undefined })}
                >
                  Anytime
                </button>
                {DATE_OPTS.map((d) => (
                  <button
                    key={d.value}
                    className={cn('flex-1 rounded-xl border py-2 text-xs font-medium', filters.date === d.value && !filters.date_specific ? 'bg-brand-600 text-[#161310] border-brand-600' : 'bg-paper-100 text-ink-700 border-ink-100')}
                    onClick={() => setFilter({ date: d.value, date_specific: undefined })}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Or pick a specific date</p>
                <Input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={filters.date_specific ?? ''}
                  onChange={(e) => setFilter({ date_specific: e.target.value || undefined, date: undefined })}
                />
              </div>
              <Button onClick={() => setOpen(null)}>Done</Button>
            </div>
          )}

          {open === 'time' && (
            <div className="flex flex-col gap-1">
              <button className="text-left px-3 py-3 rounded-xl hover:bg-paper-50 text-ink-500" onClick={() => { setFilter({ time: undefined }); setOpen(null); }}>
                Any time
              </button>
              {TIME_OPTS.map((t) => (
                <button
                  key={t.value}
                  className={cn('text-left px-3 py-3 rounded-xl', filters.time === t.value ? 'bg-brand-600 text-[#161310]' : 'text-ink-900 hover:bg-paper-50')}
                  onClick={() => { setFilter({ time: t.value }); setOpen(null); }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {open === 'level' && (
            <div className="grid grid-cols-2 gap-2">
              {levelBands.map((b) => {
                const active = filters.grade_band === b;
                return (
                  <button
                    key={b}
                    className={cn('rounded-xl border py-3 text-sm', active ? 'bg-brand-600 text-[#161310] border-brand-600' : 'bg-paper-100 text-ink-700 border-ink-100')}
                    onClick={() => { setFilter({ grade_band: active ? undefined : b }); setOpen(null); }}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          )}

          {open === 'role' && (
            <div className="flex flex-col gap-1">
              <button
                className={cn('text-left px-3 py-3 rounded-xl', !filters.looking_for ? 'bg-brand-600 text-[#161310]' : 'text-ink-900 hover:bg-paper-50')}
                onClick={() => { setFilter({ looking_for: undefined }); setOpen(null); }}
              >
                Any role
              </button>
              {ROLE_OPTS.map((r) => (
                <button
                  key={r.value}
                  className={cn('text-left px-3 py-3 rounded-xl', filters.looking_for === r.value ? 'bg-brand-600 text-[#161310]' : 'text-ink-900 hover:bg-paper-50')}
                  onClick={() => { setFilter({ looking_for: r.value }); setOpen(null); }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {open === 'all' && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-ink-500">Reset all active filters.</p>
              <Button variant="outline" onClick={() => { clearFilters(); setOpen(null); }}>
                Clear all filters
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
