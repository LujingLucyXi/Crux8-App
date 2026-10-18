import { useEffect, useState, type ReactNode } from 'react';
import { NavArrowDown, Xmark, Calendar } from 'iconoir-react';
import { format } from 'date-fns';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppStore } from '@/store/useAppStore';
import { bandsForStyles } from '@/lib/gradeBand';
import { AREAS } from '@/seed/routes';
import { cn } from '@/lib/utils';

type Key = 'gym' | 'area' | 'date';

const DATE_OPTS = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
] as const;

const TIME_OPTS = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
] as const;

const ROLE_OPTS = [
  { value: 'belayer', label: 'Needs belayer' },
  { value: 'climber', label: 'Needs climber' },
  { value: 'take_turns', label: 'Take turns' },
] as const;

/**
 * Find filters, broken into labeled rows (Lucy 2026-10-17: 'break
 * the climb search options down to more rows and simplify — the
 * selection range is too long'). The old design was ONE
 * horizontally scrolling chip strip (half the filters lived
 * off-screen) plus a modal sheet per filter. Now each dimension is
 * its own visible row with its options inline — no scrolling, no
 * sheets except the two long lists (gyms, areas) and the calendar.
 * Rope-only rows (belay roles, weight-safe) hide for bouldering.
 */
export function FilterRow() {
  const filters = useAppStore((s) => s.filters);
  const gyms = useAppStore((s) => s.gyms);
  const setFilter = useAppStore((s) => s.setFilter);
  const clearFilters = useAppStore((s) => s.clearFilters);
  const [open, setOpen] = useState<Key | null>(null);

  const { l1, env } = filters;
  const styleSel = filters.climb_styles ?? [];
  const ropeInPlay =
    styleSel.length === 0 ||
    styleSel.some((x) => ['top_rope', 'lead', 'outdoor_sport', 'trad', 'multi_pitch'].includes(x));
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

  // Going boulder-only retires any rope-role selection with the rows.
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
  const showRole = l1 === 'climb' && ropeInPlay;
  const showFree = l1 === 'event';

  const hasFilters = Boolean(
    filters.gym_id || filters.area || filters.date || filters.date_specific ||
    filters.time || filters.grade_band || filters.looking_for || filters.weight_safe_only || filters.free_only,
  );

  const gym = filters.gym_id ? gyms.find((g) => g.id === filters.gym_id) : undefined;

  const chip = (active: boolean) =>
    cn(
      'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
      active
        ? 'enamel bg-[linear-gradient(160deg,#8B5CF6,#6D28D9)] text-white border-transparent'
        : 'bg-paper-100 text-ink-700 border-ink-100 hover:border-brand-400',
    );

  const Row = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex items-start gap-2">
      <span className="w-[52px] shrink-0 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );

  const specificLabel = filters.date_specific
    ? format(new Date(filters.date_specific + 'T00:00:00'), 'MMM d')
    : null;

  return (
    <>
      <div className="flex flex-col gap-2.5 mb-4">
        {(showGym || showArea) && (
          <Row label="Where">
            {showGym && (
              <button className={chip(!!filters.gym_id)} onClick={() => setOpen('gym')}>
                {gym?.short_name ?? 'Any gym'} <NavArrowDown width={12} height={12} />
              </button>
            )}
            {showArea && (
              <button className={chip(!!filters.area)} onClick={() => setOpen('area')}>
                {filters.area ?? 'Any area'} <NavArrowDown width={12} height={12} />
              </button>
            )}
          </Row>
        )}

        <Row label="When">
          <button
            className={chip(!filters.date && !filters.date_specific)}
            onClick={() => setFilter({ date: undefined, date_specific: undefined })}
          >
            Anytime
          </button>
          {DATE_OPTS.map((d) => (
            <button
              key={d.value}
              className={chip(filters.date === d.value && !filters.date_specific)}
              onClick={() => setFilter({ date: d.value, date_specific: undefined })}
            >
              {d.label}
            </button>
          ))}
          <button className={chip(!!filters.date_specific)} onClick={() => setOpen('date')}>
            <Calendar width={12} height={12} /> {specificLabel ?? 'Pick a date'}
          </button>
        </Row>

        <Row label="Time">
          <button className={chip(!filters.time)} onClick={() => setFilter({ time: undefined })}>
            Any
          </button>
          {TIME_OPTS.map((t) => (
            <button
              key={t.value}
              className={chip(filters.time === t.value)}
              onClick={() => setFilter({ time: filters.time === t.value ? undefined : t.value })}
            >
              {t.label}
            </button>
          ))}
        </Row>

        {showLevel && (
          <Row label="Level">
            <button
              className={chip(!filters.grade_band)}
              onClick={() => setFilter({ grade_band: undefined })}
            >
              Any
            </button>
            {levelBands.map((b) => (
              <button
                key={b}
                className={chip(filters.grade_band === b)}
                onClick={() => setFilter({ grade_band: filters.grade_band === b ? undefined : b })}
              >
                {b}
              </button>
            ))}
          </Row>
        )}

        {showRole && (
          <Row label="Looking for">
            <button
              className={chip(!filters.looking_for)}
              onClick={() => setFilter({ looking_for: undefined })}
            >
              Anyone
            </button>
            {ROLE_OPTS.map((r) => (
              <button
                key={r.value}
                className={chip(filters.looking_for === r.value)}
                onClick={() =>
                  setFilter({ looking_for: filters.looking_for === r.value ? undefined : r.value })
                }
              >
                {r.label}
              </button>
            ))}
            <button
              className={chip(filters.weight_safe_only)}
              onClick={() => setFilter({ weight_safe_only: !filters.weight_safe_only })}
            >
              ⚖ Weight-safe
            </button>
          </Row>
        )}

        {showFree && (
          <Row label="Cost">
            <button
              className={chip(filters.free_only)}
              onClick={() => setFilter({ free_only: !filters.free_only })}
            >
              Free only
            </button>
          </Row>
        )}

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="self-start inline-flex items-center gap-1 text-xs text-teal-600 font-medium"
          >
            <Xmark width={12} height={12} /> Clear filters
          </button>
        )}
      </div>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent title={open === 'date' ? 'Pick a date' : open === 'gym' ? 'Gym' : 'Area'}>
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
              <Input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={filters.date_specific ?? ''}
                onChange={(e) => setFilter({ date_specific: e.target.value || undefined, date: undefined })}
              />
              {filters.date_specific && (
                <Button
                  variant="outline"
                  onClick={() => setFilter({ date_specific: undefined })}
                >
                  Clear specific date
                </Button>
              )}
              <Button onClick={() => setOpen(null)}>Done</Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
