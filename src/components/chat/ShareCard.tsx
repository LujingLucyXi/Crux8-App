import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import type { ClimbCall, Session } from '@/seed/types';
import { formatSessionWhen } from '@/lib/date';
import { hasStarted, sessionPhase } from '@/lib/sessionPhase';
import { ClimbCallDetailSheet } from '@/components/sheets/ClimbCallDetailSheet';
import { SessionDetailSheet } from '@/components/sheets/SessionDetailSheet';
import { SessionSummarySheet } from '@/components/sheets/SessionSummarySheet';
import { SessionCardArtwork } from '@/components/SessionCardArtwork';
import { ShareableCardFrame } from '@/components/ShareableCardFrame';
import {
  buildSessionCardData,
  vibeLabelFor,
  type CardParticipant,
} from '@/lib/cardData';
import { resolveUser } from '@/lib/resolveUser';
import { normalizeInviteCode, isValidInviteCode } from '@/lib/inviteCode';
import { cn } from '@/lib/utils';

const FELT_LABELS: Record<number, string> = {
  1: 'Rough',
  2: 'Meh',
  3: 'Good',
  4: 'Great',
  5: 'Best ever',
};
const DURATION_LABELS: Record<string, string> = {
  lt1h: 'Under 1h',
  '1to2h': '1–2h',
  '2to3h': '2–3h',
  gt3h: '3h+',
};

/**
 * In-app shares (crew chats, session chats, invite DMs) post a message
 * containing a crux8.app link. When the shared call/session is known to
 * this client, the message renders as a card with a Join action instead
 * of a raw link (Lucy's rule, 2026-10-13).
 */
export function parseShareLink(text: string): { kind: 'call' | 'session'; id: string } | null {
  const m = text.match(/crux8\.app\/(call|session)\/([0-9a-fA-F]{8}-[0-9a-fA-F-]{27,})/);
  if (!m) return null;
  return { kind: m[1] as 'call' | 'session', id: m[2] };
}

const CALL_CAT_LABEL: Record<string, string> = {
  top_rope: 'Top rope',
  lead: 'Lead',
  boulder: 'Boulder',
  outdoor_sport: 'Sport',
  trad: 'Trad',
  multi_pitch: 'Multi-pitch',
  outdoor_boulder: 'Outdoor boulder',
};

export function ShareCard({ call, session }: { call?: ClimbCall; session?: Session }) {
  const me = useAppStore((s) => s.me);
  const gyms = useAppStore((s) => s.gyms);
  const users = useAppStore((s) => s.users);
  const directory = useAppStore((s) => s.directory);
  const collectedCards = useAppStore((s) => s.collectedCards);
  const recaps = useAppStore((s) => s.recaps);
  const sessionLifecycle = useAppStore((s) => s.sessionLifecycle);
  const requestPair = useAppStore((s) => s.requestPair);
  const rsvp = useAppStore((s) => s.rsvp);
  const invites = useAppStore((s) => s.invites);
  const sentInvites = useAppStore((s) => s.sentInvites);
  const acceptInvite = useAppStore((s) => s.acceptInvite);
  const denyInvite = useAppStore((s) => s.denyInvite);
  const [detailOpen, setDetailOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const artRef = useRef<HTMLDivElement | null>(null);

  if (!me) return null;

  const shell = (label: string, children: React.ReactNode) => (
    <div className="w-[270px] max-w-full rounded-2xl border border-brand-600/50 bg-paper-100 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">{label}</p>
      {children}
    </div>
  );

  // Invitation format (Lucy 2026-10-16, from her invite-flow test:
  // an invite that lands in a DM must LOOK like an invitation —
  // inviter, the climb, Accept / Decline — not a generic share card).
  // Matches my server invite for this target; the Invites section in
  // Chats renders the same invite with the same actions.
  const myInvite =
    invites.find(
      (i) =>
        i.to_id === me.id &&
        i.status === 'pending' &&
        i.target_id === (session?.id ?? call?.id) &&
        i.kind === (session ? 'session' : 'call'),
    ) ??
    invites.find(
      (i) =>
        i.to_id === me.id &&
        i.target_id === (session?.id ?? call?.id) &&
        i.kind === (session ? 'session' : 'call'),
    );
  const invitationCard = (title: string, place: string, startsAt: string) => {
    if (!myInvite) return null;
    const inviter = resolveUser(myInvite.from_id, me, users, directory);
    const inviterName = inviter?.display_name ?? 'A cruxmate';
    if (myInvite.status === 'denied') {
      return shell(
        '🧗 Invitation',
        <>
          <p className="mt-1 text-sm font-semibold text-ink-900">{title}</p>
          <p className="mt-0.5 text-xs text-ink-500">
            {place} · {formatSessionWhen(startsAt)}
          </p>
          <p className="mt-2 text-xs font-medium text-ink-400">You declined this invite</p>
        </>,
      );
    }
    if (myInvite.status === 'accepted') {
      return shell(
        '🧗 Invitation',
        <>
          <p className="mt-1 text-sm font-semibold text-ink-900">{title}</p>
          <p className="mt-0.5 text-xs text-ink-500">
            {place} · {formatSessionWhen(startsAt)}
          </p>
          <p className="mt-2 text-xs font-semibold text-brand-600">✓ You accepted — you&apos;re in</p>
          <button
            onClick={() => setDetailOpen(true)}
            className="mt-2.5 w-full rounded-xl border border-ink-100 py-2 text-sm font-semibold text-ink-700"
          >
            View →
          </button>
        </>,
      );
    }
    return shell(
      '🧗 Invitation',
      <>
        <p className="mt-1 text-sm text-ink-700">
          <span className="font-semibold text-ink-900">{inviterName}</span> invited you to climb
        </p>
        <p className="mt-1 font-semibold text-ink-900 text-sm leading-snug">{title}</p>
        <p className="text-xs text-ink-500 mt-0.5">
          {place} · {formatSessionWhen(startsAt)}
        </p>
        <div className="mt-2.5 flex gap-2">
          <button
            onClick={() => {
              acceptInvite(myInvite);
              toast.success("You're in! 🎉");
            }}
            className="flex-1 rounded-xl bg-brand-600 py-2 text-sm font-bold text-[#161310]"
          >
            Accept
          </button>
          <button
            onClick={() => denyInvite(myInvite)}
            className="flex-1 rounded-xl border border-ink-100 py-2 text-sm font-semibold text-ink-700"
          >
            Decline
          </button>
        </div>
      </>,
    );
  };

  // Sender's seat (Lucy 2026-10-17: 'I want boulder session
  // invite' — the card the SENDER sees in the DM was a generic
  // share; an invitation should look like one from both seats).
  const sentInvite = sentInvites.find(
    (i) =>
      i.from_id === me.id &&
      i.target_id === (session?.id ?? call?.id) &&
      i.kind === (session ? 'session' : 'call'),
  );
  const sentInvitationCard = (title: string, place: string, startsAt: string) => {
    if (!sentInvite) return null;
    const invitee = resolveUser(sentInvite.to_id, me, users, directory);
    const first = invitee?.display_name.split(' ')[0] ?? 'Your cruxmate';
    return shell(
      '🧗 Invitation',
      <>
        <p className="mt-1 text-sm text-ink-700">
          You invited <span className="font-semibold text-ink-900">{first}</span> to climb
        </p>
        <p className="mt-1 font-semibold text-ink-900 text-sm leading-snug">{title}</p>
        <p className="text-xs text-ink-500 mt-0.5">
          {place} · {formatSessionWhen(startsAt)}
        </p>
        {sentInvite.status === 'accepted' ? (
          <p className="mt-2 text-xs font-semibold text-brand-600">✓ {first} accepted — they&apos;re in</p>
        ) : sentInvite.status === 'denied' ? (
          <p className="mt-2 text-xs font-medium text-ink-400">{first} declined</p>
        ) : (
          <p className="mt-2 text-xs font-medium text-ink-400">Waiting for {first} to respond</p>
        )}
        <button
          onClick={() => setDetailOpen(true)}
          className="mt-2.5 w-full rounded-xl border border-ink-100 py-2 text-sm font-semibold text-ink-700"
        >
          View →
        </button>
      </>,
    );
  };

  if (call) {
    const gym = call.gym_id ? gyms.find((g) => g.id === call.gym_id) : undefined;
    const place = gym?.short_name ?? call.area ?? 'Outdoor';
    const isMine = call.user_id === me.id;
    const joined = call.participant_ids.includes(me.id);
    const closed = call.status !== 'live';
    const full = call.participant_ids.length >= call.capacity;
    const title = call.title ?? `${CALL_CAT_LABEL[call.category] ?? 'Climb'} · ${call.grade}`;
    if (myInvite) {
      return (
        <>
          {invitationCard(title, place, call.starts_at)}
          <ClimbCallDetailSheet call={detailOpen ? call : null} open={detailOpen} onOpenChange={setDetailOpen} />
        </>
      );
    }
    if (sentInvite) {
      return (
        <>
          {sentInvitationCard(title, place, call.starts_at)}
          <ClimbCallDetailSheet call={detailOpen ? call : null} open={detailOpen} onOpenChange={setDetailOpen} />
        </>
      );
    }
    return (
      <>
        {shell(
          '🧗 Climb call',
          <>
            <p className="mt-1 font-semibold text-ink-900 text-sm leading-snug">{title}</p>
            <p className="text-xs text-ink-500 mt-0.5">
              {place} · {formatSessionWhen(call.starts_at)}
            </p>
            <p className="text-xs text-ink-500">
              {call.participant_ids.length} in
            </p>
            {isMine || joined ? (
              <button
                onClick={() => setDetailOpen(true)}
                className="mt-2.5 w-full rounded-xl border border-ink-100 py-2 text-sm font-semibold text-ink-700"
              >
                {isMine ? 'View your call' : 'View call →'}
              </button>
            ) : closed ? (
              <button disabled className="mt-2.5 w-full rounded-xl bg-ink-100 py-2 text-sm font-semibold text-ink-500">
                Started — closed
              </button>
            ) : full ? (
              <button disabled className="mt-2.5 w-full rounded-xl bg-ink-100 py-2 text-sm font-semibold text-ink-500">
                Full
              </button>
            ) : (
              <button
                onClick={() => {
                  requestPair(call.id);
                  toast.success('Request sent 🤝');
                }}
                className="mt-2.5 w-full rounded-xl bg-brand-600 py-2 text-sm font-bold text-[#161310]"
              >
                Request to pair
              </button>
            )}
          </>,
        )}
        <ClimbCallDetailSheet call={detailOpen ? call : null} open={detailOpen} onOpenChange={setDetailOpen} />
      </>
    );
  }

  if (session) {
    const gym = session.gym_id ? gyms.find((g) => g.id === session.gym_id) : undefined;
    const place = gym?.short_name ?? session.area ?? 'Location TBD';
    const joined = session.participant_ids.includes(me.id);
    const started = hasStarted(session, sessionLifecycle[session.id]);
    const done = sessionPhase(session, sessionLifecycle[session.id]) === 'done';
    const full = session.participant_ids.length >= session.capacity;
    const gated =
      session.is_verified_only ||
      session.requires_attestation ||
      session.category === 'top_rope' ||
      session.category === 'lead';

    // A finished session shared to a crew renders the fun part, not a
    // link: the v20 stamped-postmark summary card itself, built per
    // viewer from their own recap (same builder as the summary sheet).
    // Tapping it opens the full summary sheet. (Lucy 2026-10-15.)
    if (done) {
      const recap = recaps[session.id];
      const cardParticipants: CardParticipant[] = [
        {
          id: me.id,
          displayName: me.display_name,
          photoUrl: me.photo_url ?? null,
          avatarConfig: me.avatar,
          archetypeId:
            collectedCards.find((c) => c.user_id === me.id)?.archetype_id ??
            me.quiz_result_type ??
            null,
        },
        ...session.participant_ids
          .filter((id) => id !== me.id)
          .map((id): CardParticipant => {
            const u = resolveUser(id, me, users, directory);
            const npc = users.find((x) => x.id === id) as
              | { quiz_result_type?: string }
              | undefined;
            return {
              id,
              displayName: u?.display_name ?? 'Cruxmate',
              photoUrl: u?.photo_url ?? null,
              avatarConfig: u?.avatar,
              archetypeId:
                collectedCards.find((c) => c.user_id === id)?.archetype_id ??
                npc?.quiz_result_type ??
                null,
            };
          }),
      ];
      const inviteCode =
        me.invite_code && isValidInviteCode(normalizeInviteCode(me.invite_code))
          ? normalizeInviteCode(me.invite_code)
          : null;
      const cardData = buildSessionCardData({
        sessionTitle: session.title,
        startsAt: session.starts_at,
        area: session.area,
        ownerId: me.id,
        participants: cardParticipants,
        recap: {
          durationLabel: recap?.duration_bucket
            ? DURATION_LABELS[recap.duration_bucket]
            : undefined,
          feltLabel: recap?.felt ? FELT_LABELS[recap.felt] : undefined,
          vibeLabel: vibeLabelFor(recap?.vibe_pick ?? session.vibe),
          note: recap?.note,
        },
        gym: gym
          ? {
              id: gym.id,
              name: gym.name,
              shortName: gym.short_name,
              city: gym.city,
              lat: (gym as { lat?: number }).lat,
              lng: (gym as { lng?: number }).lng,
            }
          : null,
        inviteCode,
      });
      return (
        <>
          <button
            onClick={() => setSummaryOpen(true)}
            className="block w-[270px] max-w-full text-left"
            aria-label="View session card"
          >
            <ShareableCardFrame nodeRef={artRef}>
              <SessionCardArtwork data={cardData} />
            </ShareableCardFrame>
          </button>
          <SessionSummarySheet
            session={summaryOpen ? session : null}
            open={summaryOpen}
            onOpenChange={setSummaryOpen}
          />
        </>
      );
    }

    // Invitation format wins over the generic share card (see above).
    if (myInvite) {
      return (
        <>
          {invitationCard(session.title, place, session.starts_at)}
          <SessionDetailSheet session={detailOpen ? session : null} open={detailOpen} onOpenChange={setDetailOpen} />
        </>
      );
    }
    if (sentInvite) {
      return (
        <>
          {sentInvitationCard(session.title, place, session.starts_at)}
          <SessionDetailSheet session={detailOpen ? session : null} open={detailOpen} onOpenChange={setDetailOpen} />
        </>
      );
    }

    return (
      <>
        {shell(
          '🧗 Session',
          <>
            <p className="mt-1 font-semibold text-ink-900 text-sm leading-snug">{session.title}</p>
            <p className="text-xs text-ink-500 mt-0.5">
              {place} · {formatSessionWhen(session.starts_at)}
            </p>
            <p className="text-xs text-ink-500">
              {session.participant_ids.length} climbing
            </p>
            {joined ? (
              <button
                onClick={() => setDetailOpen(true)}
                className="mt-2.5 w-full rounded-xl border border-ink-100 py-2 text-sm font-semibold text-ink-700"
              >
                View session →
              </button>
            ) : full ? (
              <button disabled className="mt-2.5 w-full rounded-xl bg-ink-100 py-2 text-sm font-semibold text-ink-500">
                Full
              </button>
            ) : started ? (
              gated ? (
                <button
                  onClick={() => setDetailOpen(true)}
                  className={cn('mt-2.5 w-full rounded-xl bg-brand-600 py-2 text-sm font-bold text-[#161310]')}
                >
                  ● Live — view &amp; join
                </button>
              ) : (
                <button
                  onClick={() => {
                    void rsvp(session.id, { viaShare: true });
                    toast.success(`You're in for ${session.title}`);
                  }}
                  className="mt-2.5 w-full rounded-xl bg-brand-600 py-2 text-sm font-bold text-[#161310]"
                >
                  ● Join live session
                </button>
              )
            ) : gated ? (
              <button
                onClick={() => setDetailOpen(true)}
                className={cn('mt-2.5 w-full rounded-xl bg-brand-600 py-2 text-sm font-bold text-[#161310]')}
              >
                View &amp; join
              </button>
            ) : (
              <button
                onClick={() => {
                  void rsvp(session.id);
                  toast.success(`You're in for ${session.title}`);
                }}
                className="mt-2.5 w-full rounded-xl bg-brand-600 py-2 text-sm font-bold text-[#161310]"
              >
                RSVP
              </button>
            )}
          </>,
        )}
        <SessionDetailSheet session={detailOpen ? session : null} open={detailOpen} onOpenChange={setDetailOpen} />
      </>
    );
  }

  return null;
}
