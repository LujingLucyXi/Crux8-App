import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck } from 'iconoir-react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { OGBadge } from '@/components/OGBadge';
import { ArchetypeEmblem } from '@/components/ArchetypeEmblem';
import { useAppStore } from '@/store/useAppStore';
import { resolveUser } from '@/lib/resolveUser';
import { fetchMyFoundingNo } from '@/lib/db';
import { getArchetype, getHouse } from '@/lib/quizMeta';
import { sessionPhase } from '@/lib/sessionPhase';
import { formatSessionWhen } from '@/lib/date';

const STYLE_LABEL: Record<string, string> = {
  top_rope: 'Top rope',
  lead: 'Lead',
  trad: 'Trad',
  bouldering: 'Bouldering',
  outdoor_sport: 'Outdoor sport',
  outdoor_boulder: 'Outdoor boulder',
  hiking: 'Hiking',
};

interface Props {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileSheet({ userId, open, onOpenChange }: Props) {
  const nav = useNavigate();
  const users = useAppStore((s) => s.users);
  const me = useAppStore((s) => s.me);
  const directory = useAppStore((s) => s.directory);
  const gyms = useAppStore((s) => s.gyms);
  const cruxmates = useAppStore((s) => s.cruxmates);
  const directoryVerifications = useAppStore((s) => s.directoryVerifications);
  const requestCruxmate = useAppStore((s) => s.requestCruxmate);
  const cancelMateRequest = useAppStore((s) => s.cancelMateRequest);
  const mateRequestFor = useAppStore((s) => s.mateRequestFor);
  const mateRequests = useAppStore((s) => s.mateRequests);
  const messageRequests = useAppStore((s) => s.messageRequests);
  const sessions = useAppStore((s) => s.sessions);
  const sessionLifecycle = useAppStore((s) => s.sessionLifecycle);
  const inviteCruxmatesToSession = useAppStore((s) => s.inviteCruxmatesToSession);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invitedIds, setInvitedIds] = useState<string[]>([]);

  // Founding number (public view; null until the migration runs or
  // for accounts past the first 88). Fetched per person on open.
  const [foundingNo, setFoundingNo] = useState<number | null>(null);
  useEffect(() => {
    setFoundingNo(null);
    setInvitedIds([]);
    setInviteOpen(false);
    if (!open || !userId) return;
    let live = true;
    void fetchMyFoundingNo(userId).then((n) => {
      if (live) setFoundingNo(n);
    });
    return () => {
      live = false;
    };
  }, [open, userId]);

  const user = userId ? resolveUser(userId, me, users, directory) : undefined;
  if (!user) return null;
  // Sessions this person can be invited to climb at (Lucy 2026-10-16:
  // from a friend's profile page, invite the cruxmate — or someone you
  // follow — to climb): ones I'm in, they're not, still upcoming or
  // live, with room left.
  const invitableSessions = me
    ? sessions
        .filter(
          (s) =>
            s.participant_ids.includes(me.id) &&
            !s.participant_ids.includes(user.id) &&
            s.participant_ids.length < s.capacity,
        )
        .filter((s) => {
          const ph = sessionPhase(s, sessionLifecycle[s.id]);
          return ph === 'upcoming' || ph === 'live';
        })
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
        .slice(0, 5)
    : [];
  const archetype = getArchetype(user.quiz_result_type);
  const house = getHouse(user.quiz_house_id) ?? (archetype ? getHouse(archetype.house_id) : null);
  // NPC seed users carry verifications inline; real users' come from their
  // public profile status (directoryVerifications).
  const npcUser = users.find((u) => u.id === user.id);
  const userVerifications =
    npcUser?.verifications ?? directoryVerifications[user.id];
  const homeGymId = npcUser?.home_gym_id ?? user.home_gym_id;
  const gym = gyms.find((g) => g.id === homeGymId);
  const isCruxmate = cruxmates.includes(user.id);
  const reqDir = isCruxmate ? null : mateRequestFor(user.id);

  const handleAddButton = () => {
    if (reqDir === 'incoming') {
      if (requestCruxmate(user.id) === 'accepted') {
        toast.success(`You're cruxmates with ${user.display_name.split(' ')[0]} 🤝`);
      }
      return;
    }
    if (reqDir === 'outgoing') {
      cancelMateRequest(user.id);
      toast('Unfollowed');
      return;
    }
    const res = requestCruxmate(user.id);
    if (res === 'sent') toast.success(`Following ${user.display_name.split(' ')[0]}`);
    else if (res === 'accepted') toast.success(`You're cruxmates with ${user.display_name.split(' ')[0]} 🤝`);
    else if (res === 'instant') toast(`${user.display_name} added as a CruxMate`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title=" ">
        <div className="flex flex-col items-center -mt-4 mb-5">
          <Avatar photoUrl={user.photo_url ?? undefined} config={user.avatar} alt={user.display_name} size={96} fallback={user.display_name} />
          <h2 className="mt-3 text-xl font-semibold text-ink-900">{user.display_name}</h2>
          {npcUser?.pronouns && <p className="text-sm text-ink-500">{npcUser.pronouns}</p>}
          {user.signature && (
            <p className="mt-1 max-w-[280px] text-center text-sm italic text-ink-500">
              “{user.signature}”
            </p>
          )}
          {typeof foundingNo === 'number' && (
            <span className="mt-2.5 flex items-center gap-2">
              <OGBadge size={30} variant="neon" />
              <span className="text-left leading-tight">
                <span className="block text-[11px] font-extrabold tracking-wide text-ink-900">
                  OG · Founding member
                </span>
                <span className="block text-[11px] font-medium text-ink-500">
                  #{foundingNo} of the first 88
                </span>
              </span>
            </span>
          )}
          {archetype && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-gold-500">
              <ArchetypeEmblem archetypeId={archetype.id} className="inline-block h-4 w-4" fallbackClassName="text-sm" />
              {archetype.name_en}
              {house ? <span className="font-medium text-ink-500">· {house.emoji} {house.name}</span> : null}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
            <span className="rounded-full border border-teal-600 text-teal-600 text-[11px] font-medium px-2.5 py-0.5">
              {gym?.short_name ?? 'no home gym'}
            </span>
            {user.top_grade && (
              <span className="rounded-full border border-gold-500 text-gold-500 text-[11px] font-medium px-2.5 py-0.5">
                Top: {user.top_grade}
              </span>
            )}
            {user.boulder_grade && (
              <span className="rounded-full border border-gold-500 text-gold-500 text-[11px] font-medium px-2.5 py-0.5">
                Boulder: {user.boulder_grade}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1 justify-center">
            {(['top_rope', 'lead', 'trad'] as const).map((cat) => {
              const s = userVerifications?.[cat];
              const isVerified = s === 'verified';
              const isSelf = s === 'self_attested';
              return (
                <span
                  key={cat}
                  className={
                    isVerified
                      ? 'inline-flex items-center gap-1 rounded-full bg-teal-600 text-white text-[10px] font-semibold px-2 py-0.5'
                      : isSelf
                        ? 'inline-flex items-center gap-1 rounded-full border border-brand-600 text-brand-600 text-[10px] font-semibold px-2 py-0.5'
                        : 'inline-flex items-center gap-1 rounded-full border border-ink-100 text-ink-300 text-[10px] font-semibold px-2 py-0.5'
                  }
                >
                  {isVerified ? (
                    <ShieldCheck width={11} height={11} />
                  ) : isSelf ? (
                    <span aria-hidden>•</span>
                  ) : null}
                  {cat.replace('_', ' ')}
                  {isVerified ? ' · peer-confirmed' : isSelf ? ' · self-reported' : ''}
                </span>
              );
            })}
          </div>
        </div>

        {(user.about || (user.preferred_styles && user.preferred_styles.length > 0) || user.location) && (
          <div className="mb-4 rounded-2xl border border-ink-100 bg-paper-100 px-4 py-3.5">
            {user.about && (
              <>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">About</h3>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-700">{user.about}</p>
              </>
            )}
            {user.preferred_styles && user.preferred_styles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {user.preferred_styles.map((st) => (
                  <span key={st} className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-semibold text-ink-700">
                    {STYLE_LABEL[st] ?? st.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
            {user.location && <p className="mt-3 text-xs text-ink-500">📍 {user.location}</p>}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button
            variant={isCruxmate ? 'outline' : 'primary'}
            onClick={() => {
              if (isCruxmate) {
                // Unfollow: drops my follow row too, so the mutual
                // state ends on their side at their next sync.
                cancelMateRequest(user.id);
                toast('Unfollowed');
              } else {
                handleAddButton();
              }
            }}
          >
            {isCruxmate
              ? 'Unfollow'
              : reqDir === 'incoming'
                ? 'Follow back'
                : reqDir === 'outgoing'
                  ? 'Following — tap to unfollow'
                  : 'Follow'}
          </Button>
          {(isCruxmate ||
            reqDir === 'outgoing' ||
            (me &&
              messageRequests.some(
                (r) =>
                  r.status === 'accepted' &&
                  ((r.from_id === me.id && r.to_id === user.id) ||
                    (r.from_id === user.id && r.to_id === me.id)),
              ))) && (
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                nav(`/chat/${user.id}`);
              }}
            >
              Message
            </Button>
          )}
          {(isCruxmate || reqDir === 'outgoing') && (
            <Button variant="outline" onClick={() => setInviteOpen((v) => !v)}>
              Invite to climb 🧗
            </Button>
          )}
          {inviteOpen && (isCruxmate || reqDir === 'outgoing') && (
            <div className="flex flex-col gap-2">
              {invitableSessions.length === 0 ? (
                <p className="rounded-xl bg-paper-50 border border-ink-100 p-3 text-center text-xs text-ink-500">
                  No climbs to invite them to yet — sessions you&apos;re part of will show up here.
                </p>
              ) : (
                invitableSessions.map((s) => {
                  const sGym = gyms.find((g) => g.id === s.gym_id);
                  const invited = invitedIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 rounded-xl border border-ink-100 bg-paper-100 px-3.5 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-900">{s.title}</p>
                        <p className="text-xs text-ink-500">
                          {formatSessionWhen(s.starts_at)} · {sGym?.short_name ?? s.area ?? ''}
                        </p>
                      </div>
                      <button
                        disabled={invited}
                        onClick={() => {
                          inviteCruxmatesToSession(s.id, [user.id]);
                          setInvitedIds((prev) => [...prev, s.id]);
                          toast.success(`Invite sent to ${user.display_name.split(' ')[0]}`);
                        }}
                        className="shrink-0 rounded-full bg-brand-600 px-3.5 py-1.5 text-xs font-bold text-[#161310] disabled:opacity-50"
                      >
                        {invited ? 'Invited ✓' : 'Invite'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
