import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'iconoir-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAppStore } from '@/store/useAppStore';
import { resolveUser, type ResolvedUser } from '@/lib/resolveUser';
import { normalizeInviteCode, isValidInviteCode } from '@/lib/inviteCode';

/**
 * Add-cruxmates front door (2026-10-14 field report: the add action was
 * only reachable from a session roster's profile sheet — a host standing
 * next to a new friend in the gym had nowhere to add them). Searches the
 * people the app already knows by name. 2026-10-15: the list covers only
 * REAL directory users — seed (NPC) climbers are excluded so nobody can
 * search for, add, or collect cards for mock people. The session roster
 * remains the primary add path.
 */
export function PeopleFinder() {
  const nav = useNavigate();
  const me = useAppStore((s) => s.me);
  const users = useAppStore((s) => s.users);
  const directory = useAppStore((s) => s.directory);
  const cruxmates = useAppStore((s) => s.cruxmates);
  const addCruxMate = useAppStore((s) => s.addCruxMate);
  const [q, setQ] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [codeHint, setCodeHint] = useState<string | null>(null);

  const submitCode = () => {
    const code = normalizeInviteCode(codeInput);
    if (!code) {
      setCodeHint(null);
      return;
    }
    if (!isValidInviteCode(code)) {
      setCodeHint('Codes look like CLIMB-8K42 — check it and try again.');
      return;
    }
    setCodeHint(null);
    nav(`/add/${code}`);
  };

  const people = useMemo<ResolvedUser[]>(() => {
    // Directory-only: seed NPC climbers (users) are excluded so real users
    // can never search for or add mock people.
    const ids = new Set<string>(Object.keys(directory));
    const list: ResolvedUser[] = [];
    for (const id of ids) {
      if (id === me?.id) continue;
      const r = resolveUser(id, me, users, directory);
      if (r) list.push(r);
    }
    const term = q.trim().toLowerCase();
    const filtered = term
      ? list.filter((p) => p.display_name.toLowerCase().includes(term))
      : list.slice(0, 12);
    return filtered.sort((a, b) => a.display_name.localeCompare(b.display_name));
  }, [directory, me, q]);

  return (
    <div className="mb-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3">
        Find people
      </h2>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">
          <Search width={18} height={18} />
        </span>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name"
          className="pl-10"
        />
      </div>
      {/* Invite code entry (2026-10-15): type a code from someone's card → their add page */}
      <div className="mt-3 rounded-2xl border border-dashed border-ink-100 bg-paper-100 p-3">
        <p className="text-xs font-semibold text-ink-700">Have an invite code?</p>
        <div className="mt-2 flex gap-2">
          <Input
            value={codeInput}
            onChange={(e) => {
              setCodeInput(e.target.value.toUpperCase());
              setCodeHint(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitCode();
            }}
            placeholder="CLIMB-8K42"
            className="font-mono uppercase"
            aria-label="Invite code"
          />
          <Button variant="outline" className="shrink-0" onClick={submitCode}>
            Add
          </Button>
        </div>
        {codeHint && <p className="mt-1.5 text-xs text-coral-600">{codeHint}</p>}
      </div>
      {people.length === 0 ? (
        <p className="mt-3 text-sm text-ink-500">
          {q.trim()
            ? 'No matches yet — they show up here once you have shared a session.'
            : 'Your directory fills up as you meet climbers in sessions. Or scan a session QR at the gym — everyone who joins lands on the session roster.'}
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {people.map((p) => {
            const isFriend = cruxmates.includes(p.id);
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-paper-100 px-4 py-3"
              >
                <Avatar photoUrl={p.photo_url ?? undefined} seed={p.display_name} size={36} alt={p.display_name} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-900 truncate">{p.display_name}</p>
                  {p.top_grade && <p className="text-xs text-ink-500">{p.top_grade}</p>}
                </div>
                {isFriend ? (
                  <span className="text-xs font-bold text-teal-600 shrink-0">✓ Cruxmate</span>
                ) : (
                  <button
                    onClick={() => addCruxMate(p.id)}
                    className="shrink-0 rounded-full bg-brand-600 px-4 py-2 text-xs font-bold text-[#161310]"
                  >
                    Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
