import { useState } from 'react';
import { NavArrowDown, Filter, Xmark } from 'iconoir-react';
import { format } from 'date-fns';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { useAppStore } from '@/store/useAppStore';
import { AREAS } from '@/seed/routes';
import { cn } from '@/lib/utils';

type FilterKey =
  | 'gym'
  | 'area'
  | 'date'
  | 'time'
  | 'style'
  | 'level'
  | 'type'
  | 'cost'
  | 'route'
  | 'role'
  | 'all';

const DATE_OPTS = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'this_week', label: 'This week' },
] as const;

const TIME_OPTS = [
  { value: 'morning', label: 'Morning · 6a–12p' },
  { value: 'afternoon', label: 'Afternoon · 12p–5p' },
  { value: 'evening', label: 'Evening · 5p–10p' },
] as const;

const BELAY_STYLES = [
  { value: 'top_rope', label: 'Top Rope' },
  { value: 'lead', label: 'Lead' },
];

const ROLE_OPTS = [
  { value: 'both', label: 'Either' },
  { value: 'belayer', label: 'Belayers only' },
  { value: 'climber', label: 'Climbers only' },
] as const;

const OUTDOOR_STYLES = [
  { value: 'outdoor_sport', label: 'Sport' },
  { value: 'trad', label: 'Trad' },
  { value: 'multi_pitch', label: 'Multi-pitch' },
  { value: 'outdoor_boulder', label: 'Boulder' },
];

const GRADE_BANDS = ['V0-5.7', '5.8-5.9', '5.10a-5.10c', '5.10d-5.11b', '5.11c-5.12b', '5.12c+'];

const EVENT_TYPES = [
  { value: 'community_night', label: 'Community night' },
  { value: 'identity', label: 'Identity' },
  { value: 'education', label: 'Education' },
  { value: 'mountaineering', label: 'Mountaineering' },
  { value: 'backcountry', label: 'Backcountry' },
  { value: 'comp', label: 'Comp' },
  { value: 'social', label: 'Social' },
];

export function FilterRow() {
  const filters = useAppStore((s) => s.filters);
  const gyms = useAppStore((s) => s.gyms);
  const groups = useAppStore((s) => s.groups);
  const setIndoor = useAppStore((s) => s.setIndoorFilter);
  const setOutdoor = useAppStore((s) => s.setOutdoorFilter);
  const setEvents = useAppStore((s) => s.setEventsFilter);
  const clearFilters = useAppStore((s) => s.clearFilters);

  const [open, setOpen] = useState<FilterKey | null>(null);

  const active = filters.tab === 'indoor' ? filters.indoor : filters.tab === 'outdoor' ? filters.outdoor : filters.events;
  const isBelaySub = filters.tab === 'indoor' && filters.indoor.sub_tab === 'belay';
  const hasFilters =
    filters.tab === 'indoor'
      ? Boolean(
          filters.indoor.gym_id ||
          filters.indoor.date ||
          filters.indoor.date_specific ||
          filters.indoor.time ||
          filters.indoor.styles.length ||
          filters.indoor.grade_band ||
          filters.indoor.role ||
          filters.indoor.weight_safe_only,
        )
      : filters.tab === 'outdoor'
      ? Boolean(filters.outdoor.area || filters.outdoor.date || filters.outdoor.time || filters.outdoor.styles.length || filters.outdoor.grade_band || filters.outdoor.route_id)
      : Boolean(filters.events.types.length || filters.events.date || filters.events.time || filters.events.host || filters.events.freeOnly);

  const dateLabel = () => {
    if (filters.tab !== 'indoor' && filters.tab !== 'outdoor' && filters.tab !== 'events') return 'Date';
    const spec = filters.tab === 'indoor' ? filters.indoor.date_specific : undefined;
    if (spec) return format(new Date(spec + 'T00:00:00'), 'MMM d');
    const dateVal = active.date;
    if (dateVal === 'today') return 'Today';
    if (dateVal === 'tomorrow') return 'Tomorrow';
    if (dateVal === 'this_week') return 'This week';
    return 'Date';
  };

  const chipCls = (isActive: boolean) =>
    cn(
      'shrink-0 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
      isActive ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-700 border-ink-100 hover:border-ink-300',
    );

  const gym = filters.indoor.gym_id ? gyms.find((g) => g.id === filters.indoor.gym_id) : undefined;

  return (
    <>
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 -mx-4 px-4">
        {filters.tab === 'indoor' && (
          <>
            <button className={chipCls(!!filters.indoor.gym_id)} onClick={() => setOpen('gym')}>
              {gym?.short_name ?? 'Gym'} <NavArrowDown width={12} height={12} />
            </button>
            <button className={chipCls(!!filters.indoor.date || !!filters.indoor.date_specific)} onClick={() => setOpen('date')}>
              {dateLabel()} <NavArrowDown width={12} height={12} />
            </button>
            <button className={chipCls(!!filters.indoor.time)} onClick={() => setOpen('time')}>
              {TIME_OPTS.find((t) => t.value === filters.indoor.time)?.label.split(' ')[0] ?? 'Time'} <NavArrowDown width={12} height={12} />
            </button>
            {/* Style only matters on Belay (top-rope vs lead).
                Boulder sub-tab is single-style, so we hide it there. */}
            {isBelaySub && (
              <>
                <button className={chipCls(filters.indoor.styles.length > 0)} onClick={() => setOpen('style')}>
                  {filters.indoor.styles.length > 0 ? `${filters.indoor.styles.length} styles` : 'Style'}
                  <NavArrowDown width={12} height={12} />
                </button>
                <button className={chipCls(!!filters.indoor.role)} onClick={() => setOpen('role')}>
                  {filters.indoor.role
                    ? ROLE_OPTS.find((r) => r.value === filters.indoor.role)?.label
                    : 'Role'}
                  <NavArrowDown width={12} height={12} />
                </button>
                <button
                  className={chipCls(filters.indoor.weight_safe_only)}
                  onClick={() =>
                    setIndoor({ weight_safe_only: !filters.indoor.weight_safe_only })
                  }
                >
                  ⚖ Weight-safe
                </button>
              </>
            )}
            {!isBelaySub && (
              <button className={chipCls(!!filters.indoor.grade_band)} onClick={() => setOpen('level')}>
                {filters.indoor.grade_band ?? 'Level'} <NavArrowDown width={12} height={12} />
              </button>
            )}
          </>
        )}
        {filters.tab === 'outdoor' && (
          <>
            <button className={chipCls(!!filters.outdoor.area)} onClick={() => setOpen('area')}>
              {filters.outdoor.area ?? 'Area'} <NavArrowDown width={12} height={12} />
            </button>
            <button className={chipCls(!!filters.outdoor.date)} onClick={() => setOpen('date')}>
              {DATE_OPTS.find((d) => d.value === filters.outdoor.date)?.label ?? 'Date'} <NavArrowDown width={12} height={12} />
            </button>
            <button className={chipCls(!!filters.outdoor.time)} onClick={() => setOpen('time')}>
              {TIME_OPTS.find((t) => t.value === filters.outdoor.time)?.label.split(' ')[0] ?? 'Time'} <NavArrowDown width={12} height={12} />
            </button>
            <button className={chipCls(filters.outdoor.styles.length > 0)} onClick={() => setOpen('style')}>
              {filters.outdoor.styles.length > 0 ? `${filters.outdoor.styles.length} styles` : 'Style'} <NavArrowDown width={12} height={12} />
            </button>
            <button className={chipCls(!!filters.outdoor.grade_band)} onClick={() => setOpen('level')}>
              {filters.outdoor.grade_band ?? 'Level'} <NavArrowDown width={12} height={12} />
            </button>
          </>
        )}
        {filters.tab === 'events' && (
          <>
            <button className={chipCls(filters.events.types.length > 0)} onClick={() => setOpen('type')}>
              {filters.events.types.length > 0 ? `${filters.events.types.length} types` : 'Type'} <NavArrowDown width={12} height={12} />
            </button>
            <button className={chipCls(!!filters.events.date)} onClick={() => setOpen('date')}>
              {DATE_OPTS.find((d) => d.value === filters.events.date)?.label ?? 'Date'} <NavArrowDown width={12} height={12} />
            </button>
            <button className={chipCls(filters.events.freeOnly)} onClick={() => setOpen('cost')}>
              {filters.events.freeOnly ? 'Free only' : 'Cost'} <NavArrowDown width={12} height={12} />
            </button>
          </>
        )}
        <button className={chipCls(false)} onClick={() => setOpen('all')} aria-label="More filters">
          <Filter width={13} height={13} />
        </button>
      </div>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="mb-3 inline-flex items-center gap-1 text-xs text-teal-600 font-medium"
        >
          <Xmark width={12} height={12} /> Clear filters
        </button>
      )}

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent title={open === 'all' ? 'Filters' : (open ?? '') as string}>
          {open === 'gym' && (
            <div className="flex flex-col gap-1">
              <button
                className="text-left px-3 py-3 rounded-xl hover:bg-paper-50 text-ink-500"
                onClick={() => {
                  setIndoor({ gym_id: undefined });
                  setOpen(null);
                }}
              >
                Any gym
              </button>
              {gyms.map((g) => (
                <button
                  key={g.id}
                  className={cn(
                    'text-left px-3 py-3 rounded-xl',
                    filters.indoor.gym_id === g.id ? 'bg-ink-900 text-white' : 'text-ink-900 hover:bg-paper-50',
                  )}
                  onClick={() => {
                    setIndoor({ gym_id: g.id });
                    setOpen(null);
                  }}
                >
                  {g.name}
                </button>
              ))}
            </div>
          )}

          {open === 'area' && (
            <div className="flex flex-col gap-1">
              <button
                className="text-left px-3 py-3 rounded-xl hover:bg-paper-50 text-ink-500"
                onClick={() => {
                  setOutdoor({ area: undefined });
                  setOpen(null);
                }}
              >
                Any area
              </button>
              {AREAS.map((a) => (
                <button
                  key={a}
                  className={cn(
                    'text-left px-3 py-3 rounded-xl',
                    filters.outdoor.area === a ? 'bg-ink-900 text-white' : 'text-ink-900 hover:bg-paper-50',
                  )}
                  onClick={() => {
                    setOutdoor({ area: a });
                    setOpen(null);
                  }}
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
                  className={cn(
                    'flex-1 rounded-xl border py-2 text-xs font-medium',
                    !active.date && !(filters.tab === 'indoor' && filters.indoor.date_specific)
                      ? 'bg-ink-900 text-white border-ink-900'
                      : 'bg-white text-ink-700 border-ink-100',
                  )}
                  onClick={() => {
                    if (filters.tab === 'indoor') setIndoor({ date: undefined, date_specific: undefined });
                    else if (filters.tab === 'outdoor') setOutdoor({ date: undefined });
                    else setEvents({ date: undefined });
                  }}
                >
                  Anytime
                </button>
                {DATE_OPTS.map((d) => (
                  <button
                    key={d.value}
                    className={cn(
                      'flex-1 rounded-xl border py-2 text-xs font-medium',
                      active.date === d.value && !(filters.tab === 'indoor' && filters.indoor.date_specific)
                        ? 'bg-ink-900 text-white border-ink-900'
                        : 'bg-white text-ink-700 border-ink-100',
                    )}
                    onClick={() => {
                      if (filters.tab === 'indoor') setIndoor({ date: d.value, date_specific: undefined });
                      else if (filters.tab === 'outdoor') setOutdoor({ date: d.value });
                      else setEvents({ date: d.value });
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
                  Or pick a specific date
                </p>
                <Input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={filters.tab === 'indoor' ? (filters.indoor.date_specific ?? '') : ''}
                  onChange={(e) => {
                    if (filters.tab === 'indoor') {
                      setIndoor({ date_specific: e.target.value || undefined, date: undefined });
                    }
                  }}
                  disabled={filters.tab !== 'indoor'}
                />
                {filters.tab !== 'indoor' && (
                  <p className="text-[10px] text-ink-300 mt-1">
                    Specific-date picker is Belay-first — coming to other tabs in v0.6.
                  </p>
                )}
              </div>
              <Button onClick={() => setOpen(null)}>Done</Button>
            </div>
          )}

          {open === 'time' && (
            <div className="flex flex-col gap-1">
              <button
                className="text-left px-3 py-3 rounded-xl hover:bg-paper-50 text-ink-500"
                onClick={() => {
                  if (filters.tab === 'indoor') setIndoor({ time: undefined });
                  else if (filters.tab === 'outdoor') setOutdoor({ time: undefined });
                  else setEvents({ time: undefined });
                  setOpen(null);
                }}
              >
                Any time
              </button>
              {TIME_OPTS.map((t) => (
                <button
                  key={t.value}
                  className={cn(
                    'text-left px-3 py-3 rounded-xl',
                    active.time === t.value ? 'bg-ink-900 text-white' : 'text-ink-900 hover:bg-paper-50',
                  )}
                  onClick={() => {
                    if (filters.tab === 'indoor') setIndoor({ time: t.value });
                    else if (filters.tab === 'outdoor') setOutdoor({ time: t.value });
                    else setEvents({ time: t.value });
                    setOpen(null);
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {open === 'style' && (
            <div className="flex flex-col gap-2">
              {/* Indoor only opens this sheet from the Belay sub-tab,
                  so top-rope / lead are the only relevant options there. */}
              {(filters.tab === 'indoor' ? BELAY_STYLES : OUTDOOR_STYLES).map((s) => {
                const styles = filters.tab === 'indoor' ? filters.indoor.styles : filters.outdoor.styles;
                const checked = styles.includes(s.value);
                return (
                  <label key={s.value} className="flex items-center gap-3 p-3 rounded-xl hover:bg-paper-50 cursor-pointer">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const next = v ? [...styles, s.value] : styles.filter((x) => x !== s.value);
                        if (filters.tab === 'indoor') setIndoor({ styles: next });
                        else setOutdoor({ styles: next });
                      }}
                    />
                    <span className="text-sm text-ink-900">{s.label}</span>
                  </label>
                );
              })}
              <Button className="mt-2" onClick={() => setOpen(null)}>Done</Button>
            </div>
          )}

          {open === 'level' && (
            <div className="grid grid-cols-2 gap-2">
              {GRADE_BANDS.map((b) => {
                const isActive = (filters.tab === 'indoor' ? filters.indoor.grade_band : filters.outdoor.grade_band) === b;
                return (
                  <button
                    key={b}
                    className={cn(
                      'rounded-xl border py-3 text-sm',
                      isActive ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-700 border-ink-100',
                    )}
                    onClick={() => {
                      if (filters.tab === 'indoor') setIndoor({ grade_band: isActive ? undefined : b });
                      else setOutdoor({ grade_band: isActive ? undefined : b });
                      setOpen(null);
                    }}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          )}

          {open === 'type' && (
            <div className="flex flex-col gap-2">
              {EVENT_TYPES.map((t) => {
                const checked = filters.events.types.includes(t.value);
                return (
                  <label key={t.value} className="flex items-center gap-3 p-3 rounded-xl hover:bg-paper-50 cursor-pointer">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const next = v
                          ? [...filters.events.types, t.value]
                          : filters.events.types.filter((x) => x !== t.value);
                        setEvents({ types: next });
                      }}
                    />
                    <span className="text-sm text-ink-900">{t.label}</span>
                  </label>
                );
              })}
              <Button className="mt-2" onClick={() => setOpen(null)}>Done</Button>
            </div>
          )}

          {open === 'cost' && (
            <div className="flex flex-col gap-1">
              <button
                className={cn(
                  'text-left px-3 py-3 rounded-xl',
                  !filters.events.freeOnly ? 'bg-ink-900 text-white' : 'text-ink-900 hover:bg-paper-50',
                )}
                onClick={() => {
                  setEvents({ freeOnly: false });
                  setOpen(null);
                }}
              >
                All events
              </button>
              <button
                className={cn(
                  'text-left px-3 py-3 rounded-xl',
                  filters.events.freeOnly ? 'bg-ink-900 text-white' : 'text-ink-900 hover:bg-paper-50',
                )}
                onClick={() => {
                  setEvents({ freeOnly: true });
                  setOpen(null);
                }}
              >
                Free only
              </button>
            </div>
          )}

          {open === 'role' && (
            <div className="flex flex-col gap-1">
              <button
                className={cn(
                  'text-left px-3 py-3 rounded-xl',
                  !filters.indoor.role ? 'bg-ink-900 text-white' : 'text-ink-900 hover:bg-paper-50',
                )}
                onClick={() => {
                  setIndoor({ role: undefined });
                  setOpen(null);
                }}
              >
                Any role
              </button>
              {ROLE_OPTS.map((r) => (
                <button
                  key={r.value}
                  className={cn(
                    'text-left px-3 py-3 rounded-xl',
                    filters.indoor.role === r.value ? 'bg-ink-900 text-white' : 'text-ink-900 hover:bg-paper-50',
                  )}
                  onClick={() => {
                    setIndoor({ role: r.value });
                    setOpen(null);
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {open === 'all' && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-ink-500">Reset filters or manage all at once.</p>
              <Button
                variant="outline"
                onClick={() => {
                  clearFilters();
                  setOpen(null);
                }}
              >
                Clear all filters
              </Button>
              <p className="text-xs text-ink-300 text-center">More filter controls land in v0.6.</p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
