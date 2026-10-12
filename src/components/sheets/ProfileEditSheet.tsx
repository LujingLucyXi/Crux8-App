import { useState } from 'react';
import { toast } from 'sonner';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { useAppStore } from '@/store/useAppStore';
import type { Profile } from '@/seed/types';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CITIES = [
  { value: 'greater-seattle', label: 'Greater Seattle Area' },
  { value: 'denver', label: 'Denver' },
  { value: 'sf-bay-area', label: 'San Francisco / Bay Area' },
  { value: 'salt-lake-city', label: 'Salt Lake City' },
];

const TOP_GRADES = [
  '5.8', '5.9', '5.10a', '5.10b', '5.10c', '5.10d',
  '5.11a', '5.11b', '5.11c', '5.11d',
  '5.12a', '5.12b', '5.12c', '5.12d', '5.13+',
];

const TAGS = [
  '🧗 Crimp Lord', '🪨 Boulder Bro', '🚀 Dyno Fiend', '🧊 Slab Master',
  '🦶 Heel-Hook Hero', '🔥 Flash Machine', '🎯 Project Junkie', '🧂 Chalk Addict',
  '🌅 Dawn Patrol', '🪢 Belay Bestie', '🤝 Soft Catch', '⛰️ Peak Bagger',
  '🥾 Trail Runner', '🏔️ Alpine Start', '❄️ Snow Plodder', '🌲 Choss Lover',
  '☕ Coffee First', '🚐 Van Life', '😅 Type 2 Fun', '🧭 Scrambler',
  '💪 Weekend Warrior', '🧗‍♀️ Gym Rat',
];
const MAX_TAGS = 5;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3">{title}</h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

export function ProfileEditSheet({ open, onOpenChange }: Props) {
  const me = useAppStore((s) => s.me);
  const gyms = useAppStore((s) => s.gyms);
  const updateProfile = useAppStore((s) => s.updateProfile);

  const [displayName, setDisplayName] = useState(me?.display_name ?? '');
  const [pronouns, setPronouns] = useState(me?.pronouns ?? '');
  const [signature, setSignature] = useState(me?.signature ?? '');
  const [location, setLocation] = useState(me?.location ?? 'greater-seattle');
  const [homeGymId, setHomeGymId] = useState(me?.home_gym_id ?? '');
  const [topGrade, setTopGrade] = useState(me?.top_grade ?? '');
  const [tags, setTags] = useState<string[]>(me?.tags ?? []);
  const [saving, setSaving] = useState(false);

  if (!me) return null;

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : prev.length < MAX_TAGS ? [...prev, t] : prev));

  const save = () => {
    setSaving(true);
    const patch: Partial<Profile> = {
      display_name: displayName.trim() || me.display_name,
      pronouns: pronouns.trim() || undefined,
      signature: signature.trim() || undefined,
      location,
      home_gym_id: homeGymId || me.home_gym_id,
      top_grade: topGrade || me.top_grade,
      tags,
    };
    updateProfile(patch);
    setSaving(false);
    toast('Profile updated');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="Edit profile">
        <div className="flex flex-col gap-3 mt-2 pb-6">
          <Section title="Basics">
            <div>
              <Label>Display name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={30} />
            </div>
            <div>
              <Label>Pronouns</Label>
              <Input
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                placeholder="she/her, he/him, they/them…"
                maxLength={20}
              />
            </div>
            <div>
              <Label>Signature</Label>
              <Input
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="One-liner under your name"
                maxLength={60}
              />
            </div>
          </Section>

          <Section title="Location">
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900"
            >
              {CITIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <div>
              <Label>Home gym</Label>
              <select
                value={homeGymId}
                onChange={(e) => setHomeGymId(e.target.value)}
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900"
              >
                {gyms.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </Section>

          <Section title="Climbing">
            <div>
              <Label>Top grade</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {TOP_GRADES.map((g) => (
                  <button
                    key={g}
                    onClick={() => setTopGrade(g)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs font-medium',
                      topGrade === g
                        ? 'bg-ink-900 text-white border-ink-900'
                        : 'bg-white text-ink-700 border-ink-100',
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>
                Tags <span className="text-ink-400 font-normal">({tags.length}/{MAX_TAGS})</span>
              </Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {TAGS.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTag(t)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs font-medium',
                      tags.includes(t)
                        ? 'bg-ink-900 text-white border-ink-900'
                        : 'bg-white text-ink-700 border-ink-100',
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Button onClick={save} disabled={saving} className="w-full mt-1">
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
