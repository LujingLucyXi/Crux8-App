import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'iconoir-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAppStore } from '@/store/useAppStore';
import { resolveUser, type ResolvedUser } from '@/lib/resolveUser';
import { normalizeInviteCode, isValidInviteCode, inviteLink } from '@/lib/inviteCode';

/**
 * Add-cruxmates front door (2026-10-14 field report: the add action was
 * only reachable from a session roster's profile sheet — a host standing
 * next to a new friend in the gym had nowhere to add them). Searches the
 * people the app already knows by name. 2026-10-15: the list covers only
 * REAL directory users — seed (NPC) climbers are excluded so nobody can
 * search for, add, or collect cards for mock people. The session roster
 * remains the primary add path.
 */
export function PeopleFinder({
  hideInviteButton = false,
  hideHeading = false,
}: {
  /** Profile already carries the invite CTA in its invite card above —
   *  showing this one too put two identical gold buttons on one screen. */
  hideInviteButton?: boolean;
  /** Hosts with their own title (Profile section, the Add-friends
   *  sheet) don't need the internal "Find people" header repeated. */
  hideHeading?: boolean;
} = {}) {
  const nav = useNavigate();
  const me = useAppStore((s) => s.me);
  const users = useAppStore((s) => s.users);
  const directory = useAppStore((s) => s.directory);
  const cruxmates = useAppStore((s) => s.cruxmates);
  const requestCruxmate = useAppStore((s) => s.requestCruxmate);
  const cancelMateRequest = useAppStore((s) => s.cancelMateRequest);
  const mateRequestFor = useAppStore((s) => s.mateRequestFor);
  const mateRequests = useAppStore((s) => s.mateRequests);
  const ensureInviteCode = useAppStore((s) => s.ensureInviteCode);
  const [q, setQ] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [codeHint, setCodeHint] = useState<string | null>(null);

  // Invite someone who isn't on Crux8 yet: native share carrying my
  // personal add link, framed as a join invitation (the link lands them
  // on my add page — guest name-only entry or email — and their add
  // still comes back to me as a request to approve).
  const inviteFriend = async () => {
    const code = ensureInviteCode();
    if (!code) {
      toast.error('Your invite code is not ready yet');
      return;
    }
    const link = inviteLink(code);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Crux8',
          text: `🧗 Join me on Crux8 — find climbing partners, join sessions, and collect climber DNA cards. Use my invite link to join:`,
          url: link,
        });
      } catch {
        /* user dismissed */
      }
    } else {
      try {
        await navigator.clipboard.writeText(link);
        toast.success('Invite link copied');
      } catch {
        toast.error('Could not copy the invite link');
      }
    }
  };

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
      {!hideHeading && (
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3">
          Find people
        </h2>
      )}
      {!hideInviteButton && (
        <Button className="w-full mb-3" onClick={inviteFriend}>
          Invite a friend to join Crux8
        </Button>
      )}
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
        <p className="text-xs font-semibold text-ink-700">Add a cruxmate via their code</p>
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
            const reqDir = isFriend ? null : mateRequestFor(p.id);
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
                ) : reqDir === 'incoming' ? (
                  <button
                    onClick={() => {
                      if (requestCruxmate(p.id) === 'accepted') {
                        toast.success(`You're cruxmates with ${p.display_name.split(' ')[0]} 🤝`);
                      }
                    }}
                    className="shrink-0 rounded-full bg-brand-600 px-4 py-2 text-xs font-bold text-[#161310]"
                  >
                    Follow back
                  </button>
                ) : reqDir === 'outgoing' ? (
                  <button
                    onClick={() => {
                      cancelMateRequest(p.id);
                      toast('Unfollowed');
                    }}
                    className="shrink-0 rounded-full border border-ink-100 px-4 py-2 text-xs font-semibold text-ink-500"
                  >
                    Following
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const res = requestCruxmate(p.id);
                      if (res === 'sent') toast.success(`Following ${p.display_name.split(' ')[0]}`);
                      else if (res === 'accepted') toast.success(`You're cruxmates with ${p.display_name.split(' ')[0]} 🤝`);
                    }}
                    className="shrink-0 rounded-full bg-brand-600 px-4 py-2 text-xs font-bold text-[#161310]"
                  >
                    Follow
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
