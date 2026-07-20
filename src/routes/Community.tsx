import { useMemo, useState } from 'react';
import { Search } from 'iconoir-react';
import { Input } from '@/components/ui/Input';
import { GroupCard } from '@/components/cards/GroupCard';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

const CATEGORY_FILTERS = [
  { value: null, label: 'All' },
  { value: 'identity', label: 'Identity' },
  { value: 'alpine', label: 'Alpine' },
  { value: 'beginner', label: 'Beginners' },
  { value: 'trad', label: 'Trad' },
  { value: 'boulder', label: 'Boulder' },
  { value: 'backcountry', label: 'Backcountry' },
  { value: 'projecting', label: 'Projecting' },
];

export function Community() {
  const groups = useAppStore((s) => s.groups);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return groups.filter((g) => {
      if (cat && g.category !== cat) return false;
      if (q && !`${g.name} ${g.tagline}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [groups, cat, q]);

  return (
    <div className="pb-4">
      <div className="relative mb-3">
        <Search
          width={16}
          height={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search groups"
          className="pl-9"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 -mx-4 px-4">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setCat(f.value)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              cat === f.value
                ? 'bg-ink-900 text-white border-ink-900'
                : 'bg-white text-ink-700 border-ink-100',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((g) => (
          <GroupCard key={g.id} group={g} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-ink-500 py-8">No groups match.</p>
        )}
      </div>
    </div>
  );
}
