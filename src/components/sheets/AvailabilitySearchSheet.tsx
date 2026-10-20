import { useState } from 'react';
import { Search } from 'iconoir-react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAppStore } from '@/store/useAppStore';
import { searchClimbersByAvailability, type DirectoryProfile } from '@/lib/db';
import {
  DAY_PARTS,
  DAYS_MON_FIRST,
  USUAL_STYLES,
  legacySlotKey,
  nextSlotDate,
  parseSlot,
  slotKey,
  summarizeUsualTimes,
  type DayPart,
  type UsualStyle,
} from '@/lib/availability';
import { cn } from '@/lib/utils';

/**
 * Find climbers by their usual climb times (Lucy 2026-10-19): pick a
 * day + daypart (+ gym), see who usually climbs then, and send a
 * climb invite pre-filled for that exact slot — the invite lands
 * when they like to climb, which is the whole point.
 */
export function AvailabilitySearchSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const me = useAppStore((s) => s.me);
  const gyms = useAppStore((s) => s.gyms);
  const setPreselect = useAppStore((s) => s.setNewSessionPreselect);
  const setNewSessionOpen = useAppStore((s) => s.setNewSessionOpen);

  const [style, setStyle] = useState<UsualStyle | null>(null);
  const [days, setDays] = useState<number[]>([new Date().getDay()]);
  const [parts, setParts] = useState<DayPart[]>([]);
  const [gymId, setGymId] = useState('');
  const [results, setResults] = useState<DirectoryProfile[] | null>(null);
  const [loading, setLoading] = useState(false);

  const gymName = (id?: string | null) => gyms.find((g) => g.id === id)?.short_name;

  // Keys for the current filters: style-prefixed keys for the chosen
  // discipline (or all three), plus legacy no-style keys so climbers
  // who set their times before styles existed still match.
  const buildKeys = () => {
    const partList = parts.length > 0 ? parts : DAY_PARTS.map((p) => p.key);
    const styles = style ? [style] : USUAL_STYLES.map((x) => x.key);
    const styled = days.flatMap((d) =>
      partList.flatMap((p) => styles.map((st) => slotKey(st, d, p))),
    );
    const legacy = days.flatMap((d) => partList.map((p) => legacySlotKey(d, p)));
    return [...styled, ...legacy];
  };

  const runSearch = async () => {
    if (!me || days.length === 0) return;
    const keys = buildKeys();
    setLoading(true);
    const rows = await searchClimbersByAvailability(keys, me.id);
    setLoading(false);
    // Gym narrowing client-side: usual gyms win; home gym counts when
    // they haven't listed usual gyms.
    const filtered = gymId
      ? rows.filter((r) => {
          const usual = r.usual_gym_ids ?? [];
          return usual.length > 0 ? usual.includes(gymId) : r.home_gym_id === gymId;
        })
      : rows;
    setResults(filtered);
  };

  const invite = (person: DirectoryProfile) => {
    // Land the invite in the person's own matching slot — the first
    // of their usual slots the current search actually matched.
    const wanted = new Set(buildKeys());
    const hit = (person.usual_times ?? []).find((k) => wanted.has(k));
    const parsed = hit ? parseSlot(hit) : null;
    const when = parsed ? nextSlotDate(parsed.dow, parsed.part) : null;
    setPreselect(person.id, when ? when.toISOString() : null);
    onOpenChange(false);
    setNewSessionOpen(true);
  };

  const toggleDay = (dow: number) =>
    setDays((prev) => (prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow]));
  const togglePart = (p: DayPart) =>
    setParts((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="Who climbs when?">
        <h2 className="text-lg font-bold text-ink-900">Who climbs when?</h2>
        <p className="text-xs text-ink-500 mt-0.5">
          Find climbers by the times they usually climb — then invite them right into their slot.
        </p>

        <p className="mt-4 mb-1.5 text-xs font-semibold text-ink-500">Style</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setStyle(null)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium',
              style === null
                ? 'bg-brand-600 text-[#161310] border-brand-600 font-semibold'
                : 'bg-paper-100 text-ink-600 border-ink-100',
            )}
          >
            Any style
          </button>
          {USUAL_STYLES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStyle(style === key ? null : key)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium',
                style === key
                  ? 'bg-brand-600 text-[#161310] border-brand-600 font-semibold'
                  : 'bg-paper-100 text-ink-600 border-ink-100',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="mt-4 mb-1.5 text-xs font-semibold text-ink-500">Day</p>
        <div className="flex flex-wrap gap-1.5">
          {DAYS_MON_FIRST.map(({ dow, short }) => (
            <button
              key={dow}
              onClick={() => toggleDay(dow)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium',
                days.includes(dow)
                  ? 'bg-brand-600 text-[#161310] border-brand-600 font-semibold'
                  : 'bg-paper-100 text-ink-600 border-ink-100',
              )}
            >
              {short}
              {dow === new Date().getDay() ? ' · today' : ''}
            </button>
          ))}
        </div>

        <p className="mt-4 mb-1.5 text-xs font-semibold text-ink-500">Time of day</p>
        <div className="flex gap-1.5">
          {DAY_PARTS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => togglePart(key)}
              className={cn(
                'flex-1 rounded-xl border px-2 py-2 text-xs font-medium',
                parts.includes(key)
                  ? 'bg-brand-600 text-[#161310] border-brand-600 font-semibold'
                  : 'bg-paper-100 text-ink-600 border-ink-100',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="mt-4 mb-1.5 text-xs font-semibold text-ink-500">Gym</p>
        <select
          value={gymId}
          onChange={(e) => setGymId(e.target.value)}
          className="w-full rounded-xl border border-ink-100 bg-paper-100 px-3.5 py-2.5 text-sm text-ink-900"
        >
          <option value="">Any gym</option>
          {gyms.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        <Button className="w-full mt-4" onClick={runSearch} disabled={loading || days.length === 0}>
          <Search width={15} height={15} className="mr-1.5" />
          {loading ? 'Searching…' : 'Find climbers'}
        </Button>

        {results !== null && (
          <div className="mt-4 pb-2">
            {results.length === 0 ? (
              <p className="text-sm text-ink-500 text-center py-4">
                Nobody&apos;s published those times yet. Try another slot — and set your own usual
                times in your profile so people can find you too.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {results.map((r) => {
                  const gymLabel = (r.usual_gym_ids?.length ? r.usual_gym_ids : r.home_gym_id ? [r.home_gym_id] : [])
                    .map(gymName)
                    .filter(Boolean)
                    .join(' · ');
                  return (
                    <li
                      key={r.id}
                      className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-paper-100 p-3"
                    >
                      <Avatar photoUrl={r.photo_url ?? undefined} config={r.avatar ?? undefined} alt={r.display_name} size={40} fallback={r.display_name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink-900 truncate">{r.display_name}</p>
                        <p className="text-xs text-ink-500 truncate">
                          🕐 {summarizeUsualTimes(r.usual_times ?? [])}
                        </p>
                        <p className="text-xs text-ink-400 truncate">
                          {[r.top_grade ? `Top ${r.top_grade}` : null, r.boulder_grade ? `Boulder ${r.boulder_grade}` : null, gymLabel || null]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => invite(r)}>
                        Invite
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
