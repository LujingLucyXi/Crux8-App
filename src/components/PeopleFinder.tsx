import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'iconoir-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAppStore } from '@/store/useAppStore';
import { resolveUser, type ResolvedUser } from '@/lib/resolveUser';
import { UserProfileSheet } from '@/components/sheets/UserProfileSheet';
import { normalizeInviteCode, isValidInviteCode, inviteLink } from '@/lib/inviteCode';

/**
 * The Friends tab (2026-10-14 field report: the add action was only
 * reachable from a session roster's profile sheet — a host standing
 * next to a new friend in the gym had nowhere to add them).
 * 2026-10-17 (Lucy): everything friend-related lives in this one
 * surface, split into two clearly distinct sections — "Cruxmates",
 * the friend list (people who already are cruxmates, Message
 * button), and "Add cruxmate" (invite link, search, add-by-code, and
 * the directory of people you can still add). The mixed single list
 * made existing friends indistinguishable from strangers.
 * The lists cover only REAL directory users — seed (NPC) climbers
 * are excluded so nobody can search for, add, or collect cards for
 * mock people. The session roster remains the primary add path.
 */
export function PeopleFinder({
  hideInviteButton = false,
}: {
  /** Profile already carries the invite CTA in its invite card above —
   *  showing this one too put two identical gold buttons on one screen. */
  hideInviteButton?: boolean;
} = {}) {
  const nav = useNavigate();
  const me = useAppStore((s) => s.me);
  const users = useAppStore((s) => s.users);
  const directory = useAppStore((s) => s.directory);
  const cruxmates = useAppStore((s) => s.cruxmates);
  const requestCruxmate = useAppStore((s) => s.requestCruxmate);
  const cancelMateRequest = useAppStore((s) => s.cancelMateRequest);
  const mateRequestFor = useAppStore((s) => s.mateRequestFor);
  const ensureInviteCode = useAppStore((s) => s.ensureInviteCode);
  const loadAllDirectory = useAppStore((s) => s.loadAllDirectory);

  // Full directory on mount (Lucy 2026-10-24): new climbers must be
  // searchable/addable here, not only people met in a session.
  useEffect(() => {
    void loadAllDirectory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [q, setQ] = useState('');
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
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
          // Link inside the text, NOT the `url` field — WeChat turns a
          // shared `url` into an unopenable file (see InviteSection).
          text: `🧗 Join me on Crux8 — find climbing partners, join sessions, and collect climber DNA cards. Use my invite link to join: ${link}`,
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

  const term = q.trim().toLowerCase();
  const matches = (p: ResolvedUser) => p.display_name.toLowerCase().includes(term);

  // The friend list: my cruxmates, resolved like everyone else.
  const mates = useMemo<ResolvedUser[]>(() => {
    const list: ResolvedUser[] = [];
    for (const id of cruxmates) {
      const r = resolveUser(id, me, users, directory);
      if (r) list.push(r);
    }
    return list
      .filter((p) => !term || matches(p))
      .sort((a, b) => a.display_name.localeCompare(b.display_name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cruxmates, directory, me, users, term]);

  // The add list: the people directory, minus anyone already a
  // cruxmate (they live in the section above, never in both).
  const addable = useMemo<ResolvedUser[]>(() => {
    // Directory-only: seed NPC climbers (users) are excluded so real users
    // can never search for or add mock people.
    const ids = new Set<string>(Object.keys(directory));
    const list: ResolvedUser[] = [];
    for (const id of ids) {
      if (id === me?.id || cruxmates.includes(id)) continue;
      const r = resolveUser(id, me, users, directory);
      if (r) list.push(r);
    }
    const filtered = term ? list.filter(matches) : list.slice(0, 12);
    return filtered.sort((a, b) => a.display_name.localeCompare(b.display_name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directory, me, cruxmates, term]);

  const sectionTitle = 'text-xs font-semibold uppercase tracking-wider text-ink-500';

  const rowShell = (p: ResolvedUser, subtitle: ReactNode, action: ReactNode) => (
    <div
      key={p.id}
      className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-paper-100 px-4 py-3"
    >
      <button
        type="button"
        onClick={() => setProfileUserId(p.id)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        aria-label={`View ${p.display_name}'s profile`}
      >
        <Avatar photoUrl={p.photo_url ?? undefined} seed={p.display_name} size={36} alt={p.display_name} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-900 truncate">{p.display_name}</p>
          {subtitle}
        </div>
      </button>
      {action}
    </div>
  );

  return (
    <div className="mb-5">
      {/* One search governs both sections. */}
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

      {/* ── Cruxmates: the friend list ── */}
      <h3 className={`${sectionTitle} mt-5 mb-2`}>
        Cruxmates{mates.length > 0 ? ` · ${mates.length}` : ''}
      </h3>
      {mates.length === 0 ? (
        <p className="text-sm text-ink-500">
          {term
            ? 'No cruxmates match that search.'
            : 'No cruxmates yet — climbers you add show up here.'}
        </p>
      ) : (
        <div className="space-y-2">
          {mates.map((p) =>
            rowShell(
              p,
              <p className="text-xs font-semibold text-teal-600">✓ Cruxmate</p>,
              <button
                onClick={() => nav(`/chat/${p.id}`)}
                className="shrink-0 rounded-full bg-brand-600 px-4 py-2 text-xs font-bold text-[#161310]"
              >
                Message
              </button>,
            ),
          )}
        </div>
      )}

      {/* ── Add cruxmate: invite, code, and people you can still add ── */}
      <h3 className={`${sectionTitle} mt-6 mb-2`}>Add cruxmate</h3>
      {!hideInviteButton && (
        <Button className="w-full mb-3" onClick={inviteFriend}>
          Invite a friend to join Crux8
        </Button>
      )}
      {/* Invite code entry (2026-10-15): type a code from someone's card → their add page */}
      <div className="rounded-2xl border border-dashed border-ink-100 bg-paper-100 p-3">
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
      {addable.length === 0 ? (
        <p className="mt-3 text-sm text-ink-500">
          {term
            ? 'No matches yet — try another name, or share a session with them first.'
            : 'Everyone on Crux8 shows up here — newest faces first. Or scan a session QR at the gym.'}
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {addable.map((p) => {
            const reqDir = mateRequestFor(p.id);
            return rowShell(
              p,
              p.top_grade ? <p className="text-xs text-ink-500">{p.top_grade}</p> : null,
              reqDir === 'incoming' ? (
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
              ),
            );
          })}
        </div>
      )}
      <UserProfileSheet
        userId={profileUserId}
        open={!!profileUserId}
        onOpenChange={(o) => !o && setProfileUserId(null)}
      />
    </div>
  );
}
