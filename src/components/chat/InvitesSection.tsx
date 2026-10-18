import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAppStore, isInviteActionable, crewAddNotices } from '@/store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { resolveUser } from '@/lib/resolveUser';
import { formatSessionWhen } from '@/lib/date';
import { getArchetype } from '@/lib/quizMeta';
import { ArchetypeEmblem } from '@/components/ArchetypeEmblem';
import { Avatar } from '@/components/ui/Avatar';
import { UserProfileSheet } from '@/components/sheets/UserProfileSheet';
import { SessionDetailSheet } from '@/components/sheets/SessionDetailSheet';
import type { Invite, MateRequest, Session } from '@/seed/types';

/**
 * The invite inbox: pending personal invites with Accept / Deny.
 * Ignoring is free — an invite stays actionable until its climb starts
 * or ends, then it renders as a greyed "Ended" row. Accepting joins the
 * same way the share cards do (RSVP for sessions, request-to-pair for
 * calls); verification-gated sessions detour through their detail sheet
 * so the attestation still happens.
 */
export function InvitesSection({
  invitesFirst = false,
  hideHeading = false,
}: {
  /** Notifications page: climb invitations lead (Lucy 2026-10-17 —
   * they belong in Notifications, prominent, not buried in Chats). */
  invitesFirst?: boolean;
  hideHeading?: boolean;
} = {}) {
  const navigate = useNavigate();
  const me = useAppStore((s) => s.me);
  const notices = useAppStore((s) =>
    crewAddNotices({
      invites: s.invites,
      dismissedNotices: s.dismissedNotices,
      myGroupMemberships: s.myGroupMemberships,
    }),
  );
  const dismissNotice = useAppStore((s) => s.dismissNotice);
  const openGroupChat = useAppStore((s) => s.openGroupChat);
  const invites = useAppStore((s) => s.invites);
  const sessions = useAppStore((s) => s.sessions);
  const climbCalls = useAppStore((s) => s.climbCalls);
  const sessionLifecycle = useAppStore((s) => s.sessionLifecycle);
  const gyms = useAppStore((s) => s.gyms);
  const users = useAppStore((s) => s.users);
  const directory = useAppStore((s) => s.directory);
  const acceptInvite = useAppStore((s) => s.acceptInvite);
  const denyInvite = useAppStore((s) => s.denyInvite);
  const groups = useAppStore((s) => s.groups);
  const myGroupMemberships = useAppStore((s) => s.myGroupMemberships);
  const ensureGroupDoc = useAppStore((s) => s.ensureGroupDoc);
  const fetchInvites = useAppStore((s) => s.fetchInvites);
  const mateRequests = useAppStore((s) => s.mateRequests);
  const fetchMateRequests = useAppStore((s) => s.fetchMateRequests);
  const acceptMateRequest = useAppStore((s) => s.acceptMateRequest);
  const dismissFollower = useAppStore((s) => s.dismissFollower);
  const dismissedFollowers = useAppStore((s) => s.dismissedFollowers);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [detailSession, setDetailSession] = useState<Session | null>(null);

  useEffect(() => {
    void fetchInvites();
    void fetchMateRequests();
  }, [fetchInvites, fetchMateRequests]);

  // Crew invites name a crew the recipient may not have locally yet —
  // fetch its document so the card can show the crew's name and
  // Accept can join it.
  useEffect(() => {
    for (const inv of invites) {
      if (
        inv.kind === 'group' &&
        inv.status === 'pending' &&
        !groups.some((g) => g.id === inv.target_id)
      ) {
        void ensureGroupDoc(inv.target_id);
      }
    }
  }, [invites, groups, ensureGroupDoc]);

  if (!me) return null;
  const state = { me, sessions, climbCalls, sessionLifecycle };
  const pending = invites.filter((i) => i.status === 'pending');
  // Followers I haven't followed back yet (follow model: no accept/deny —
  // following back is the approval; "Not now" just hides the row here).
  const myFollowing = new Set(
    mateRequests
      .filter((r) => r.status !== 'denied' && r.from_id === me.id)
      .map((r) => r.to_id),
  );
  const matePending = mateRequests.filter(
    (r) =>
      r.status !== 'denied' &&
      r.to_id === me.id &&
      !myFollowing.has(r.from_id) &&
      !dismissedFollowers.includes(r.from_id),
  );
  if (pending.length === 0 && matePending.length === 0) return null;

  const rows = pending
    .map((inv) => {
      if (inv.kind === 'group') {
        const g = groups.find((x) => x.id === inv.target_id);
        const sender = resolveUser(inv.from_id, me, users, directory);
        return {
          inv,
          sender,
          gymName: 'Crew invitation',
          title: g?.name ?? 'A crew',
          alreadyIn: myGroupMemberships.includes(inv.target_id),
          actionable: isInviteActionable(inv, state),
          startsAt: inv.created_at,
        };
      }
      const target =
        inv.kind === 'call'
          ? climbCalls.find((c) => c.id === inv.target_id)
          : sessions.find((s) => s.id === inv.target_id);
      if (!target) return null;
      const sender = resolveUser(inv.from_id, me, users, directory);
      const gymName =
        target.location_type === 'indoor'
          ? (gyms.find((g) => g.id === target.gym_id)?.short_name ?? 'the gym')
          : (target.area ?? 'outdoors');
      const title =
        inv.kind === 'call'
          ? `${'category' in target && target.category === 'lead' ? 'Lead' : 'Top-rope'} · ${'grade' in target ? target.grade : ''}`
          : target.title;
      const alreadyIn = target.participant_ids.includes(me.id);
      const actionable = isInviteActionable(inv, state);
      return { inv, sender, gymName, title, alreadyIn, actionable, startsAt: target.starts_at };
    })
    .filter((r): r is NonNullable<typeof r> => !!r);

  const actionableCount = rows.filter((r) => r.actionable).length;

  // New followers: the sender's avatar + name + archetype, Follow back.
  // These ride the same inbox and the same badge as call/session invites.
  const mateRows = matePending
    .map((r) => {
      const sender = resolveUser(r.from_id, me, users, directory);
      if (!sender) return null;
      const dir = directory[r.from_id] as { quiz_result_type?: string } | undefined;
      const npc = users.find((u) => u.id === r.from_id) as
        | { quiz_result_type?: string }
        | undefined;
      const archetypeId = dir?.quiz_result_type ?? npc?.quiz_result_type;
      const arch = archetypeId ? getArchetype(archetypeId) : null;
      return { req: r, sender, arch };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  // The section must survive on follower rows alone — an earlier version
  // returned null whenever no session/call invite resolved, which hid
  // pending mate requests entirely.
  if (rows.length === 0 && mateRows.length === 0 && notices.length === 0) return null;

  const totalCount = actionableCount + mateRows.length + notices.length;

  // Crew-add notifications (Lucy 2026-10-17): being added to a crew
  // was silent — the added person just eventually noticed a new
  // crew. An informational card: who added you, which crew, a door
  // into the crew chat, and a dismiss.
  const noticeCards = notices.map((inv) => {
    const g = groups.find((x) => x.id === inv.target_id);
    const sender = resolveUser(inv.from_id, me, users, directory);
    return (
      <div key={inv.id} className="rounded-2xl border border-ink-100 bg-paper-100 p-3.5">
        <div className="flex items-start gap-3">
          <Avatar
            photoUrl={sender?.photo_url ?? undefined}
            config={sender?.avatar}
            seed={sender?.display_name ?? 'Crew'}
            alt={sender?.display_name ?? ''}
            size={36}
            fallback={sender?.display_name}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-900 truncate">
              {sender?.display_name ?? 'A cruxmate'} added you to a crew
            </p>
            <p className="text-xs text-ink-500 mt-0.5 truncate">
              🧑‍🤝‍🧑 {g?.name ?? 'Crew'} ·{' '}
              {new Date(inv.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </p>
            <div className="mt-2.5 flex gap-2">
              <button
                onClick={() => {
                  dismissNotice(inv.id);
                  openGroupChat(inv.target_id);
                  navigate(`/chat/session/${inv.target_id}`);
                }}
                className="flex-1 rounded-xl bg-brand-600 text-[#161310] text-xs font-bold py-2.5 active:scale-[0.98] transition"
              >
                Open crew chat
              </button>
              <button
                onClick={() => dismissNotice(inv.id)}
                className="rounded-xl border border-ink-200 px-3 text-xs font-semibold text-ink-500"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  });

  const onAccept = (inv: Invite) => {
    if (inv.kind === 'session') {
      const s = sessions.find((x) => x.id === inv.target_id);
      if (s && (s.is_verified_only || s.requires_attestation)) {
        setDetailSession(s);
        toast('One quick check first — open the session to finish joining');
        return;
      }
    }
    acceptInvite(inv);
    toast.success(
      inv.kind === 'group'
        ? "You're in the crew 🎉"
        : inv.kind === 'call'
          ? 'Request sent — the host will confirm 🤝'
          : "You're in! See you there 🧗",
    );
  };

  const mateCards = mateRows.map(({ req, sender, arch }) => (
    <div
      key={req.id}
      className="rounded-2xl border border-brand-600/50 bg-paper-100 p-3.5"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setProfileUserId(sender.id)}
          aria-label={`View ${sender.display_name}'s profile`}
          className="shrink-0"
        >
          <Avatar
            photoUrl={sender.photo_url ?? undefined}
            config={sender.avatar}
            seed={sender.display_name}
            alt={sender.display_name}
            size={40}
            fallback={sender.display_name}
          />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-900 truncate">
            {sender.display_name}
          </p>
          <p className="text-xs text-ink-500 truncate">followed you</p>
          {arch && (
            <p className="mt-0.5 text-[11px] text-gold-500 truncate">
              <ArchetypeEmblem
                archetypeId={arch.id}
                className="mr-1 inline-block h-4 w-4 align-[-2px]"
                fallbackClassName="text-xs"
              />
              {arch.name_en}
            </p>
          )}
        </div>
      </div>
      <div className="mt-2.5 flex gap-2">
        <button
          onClick={() => {
            acceptMateRequest(req.id);
            toast.success(`You're cruxmates with ${sender.display_name.split(' ')[0]} 🤝`);
          }}
          className="flex-1 rounded-xl bg-brand-600 text-[#161310] text-xs font-bold py-2.5 active:scale-[0.98] transition"
        >
          Follow back
        </button>
        <button
          onClick={() => {
            dismissFollower(sender.id);
            toast('Not now');
          }}
          className="flex-1 rounded-xl border border-ink-100 text-ink-700 text-xs font-semibold py-2.5 active:scale-[0.98] transition"
        >
          Not now
        </button>
      </div>
    </div>
  ));

  const inviteCards = rows.map(({ inv, sender, gymName, title, alreadyIn, actionable, startsAt }) => (
    <div key={inv.id} className="rounded-2xl border border-brand-600/50 bg-paper-100 p-3.5">
      <p className="text-sm font-semibold text-ink-900 truncate">
        {sender?.display_name ?? 'A cruxmate'} invited you
      </p>
      <p className="text-xs text-ink-500 mt-0.5 truncate">
        {title} · {gymName} · {formatSessionWhen(startsAt)}
      </p>
      {alreadyIn ? (
        <p className="mt-2 text-xs font-semibold text-teal-600">✓ You&apos;re in</p>
      ) : actionable ? (
        <div className="mt-2.5 flex gap-2">
          <button
            onClick={() => onAccept(inv)}
            className="flex-1 rounded-xl bg-brand-600 text-[#161310] text-xs font-bold py-2.5 active:scale-[0.98] transition"
          >
            Accept
          </button>
          <button
            onClick={() => {
              denyInvite(inv);
              toast('Invite declined');
            }}
            className="flex-1 rounded-xl border border-ink-100 text-ink-700 text-xs font-semibold py-2.5 active:scale-[0.98] transition"
          >
            Deny
          </button>
        </div>
      ) : (
        <p className="mt-2 text-xs text-ink-400">This climb already started or ended — invite closed.</p>
      )}
    </div>
  ));

  return (
    <section className="mb-5">
      {!hideHeading && (
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
          Invites{totalCount > 0 ? ` · ${totalCount}` : ''}
        </h2>
      )}
      <div className="flex flex-col gap-2">
        {invitesFirst ? (
          <>
            {inviteCards}
            {noticeCards}
            {mateCards}
          </>
        ) : (
          <>
            {mateCards}
            {inviteCards}
            {noticeCards}
          </>
        )}
      </div>
      <SessionDetailSheet
        session={detailSession}
        open={!!detailSession}
        onOpenChange={(o) => !o && setDetailSession(null)}
      />
      <UserProfileSheet
        userId={profileUserId}
        open={!!profileUserId}
        onOpenChange={(o) => !o && setProfileUserId(null)}
      />
    </section>
  );
}
