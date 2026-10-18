import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatBubble, Community, Plus } from 'iconoir-react';
import { NewCrewSheet } from '@/components/sheets/NewCrewSheet';
import { Avatar, AvatarStack } from '@/components/ui/Avatar';
import { UserProfileSheet } from '@/components/sheets/UserProfileSheet';
import { useAppStore, dmKey, scKey } from '@/store/useAppStore';
import { isUuid } from '@/lib/db';
import { parseShareLink } from '@/components/chat/ShareCard';

// My own invitation messages are stored in recipient-speak ('lucy
// xi invited you to climb…') because that's what lands in THEIR
// inbox; under my own name in my own list it reads oddly (Lucy
// 2026-10-17). On the sender's side the preview is just this:
const SENDER_INVITE_PREVIEW = '🧗 Invitation sent';
import { formatChatTimestamp } from '@/lib/date';
import { resolveUser } from '@/lib/resolveUser';
import { cn } from '@/lib/utils';
import type { AvatarConfig } from '@/lib/avatar';

export function Chat() {
  const nav = useNavigate();
  const [crewOpen, setCrewOpen] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const cruxmates = useAppStore((s) => s.cruxmates);
  const messageRequests = useAppStore((s) => s.messageRequests);
  const fetchMessageRequests = useAppStore((s) => s.fetchMessageRequests);
  const users = useAppStore((s) => s.users);
  const directory = useAppStore((s) => s.directory);
  const chats = useAppStore((s) => s.chats);
  const sessionChats = useAppStore((s) => s.sessionChats);
  const chatReads = useAppStore((s) => s.chatReads);
  const invites = useAppStore((s) => s.invites);
  const groups = useAppStore((s) => s.groups);
  const me = useAppStore((s) => s.me);

  const isThreadUnread = (key: string, last: { from: string; sent_at: string } | undefined) => {
    // Cruxy's thread never shows an unread dot either — same rule as
    // the header badge (Lucy 2026-10-17: do not count Cruxy).
    if (key === 'dm:cruxy') return false;
    if (!last || last.from === 'me' || last.from === 'system') return false;
    const readAt = chatReads[key];
    return !readAt || last.sent_at > readAt;
  };

  const sessionChatList = Object.values(sessionChats)
    .filter((sc) => sc.messages.length > 0)
    .sort((a, b) => {
      const aLast = a.messages[a.messages.length - 1]?.sent_at ?? '';
      const bLast = b.messages[b.messages.length - 1]?.sent_at ?? '';
      return bLast.localeCompare(aLast);
    });

  // Message requests (2026-10-16): pending inbound requests get their
  // own section; accepted request threads join the DM list below.
  useEffect(() => {
    void fetchMessageRequests();
  }, [fetchMessageRequests]);
  const pendingInRequests = messageRequests.filter(
    (r) => me && r.to_id === me.id && r.status === 'pending',
  );
  const acceptedCounterpartIds = messageRequests
    .filter((r) => r.status === 'accepted' && me && (r.from_id === me.id || r.to_id === me.id))
    .map((r) => (r.from_id === me?.id ? r.to_id : r.from_id));
  // Most recent chat floats to the top (Lucy 2026-10-17): DM rows
  // used to render in friendship-formation order, so the person you
  // just talked to sat at the bottom under never-messaged contacts.
  // Anyone I actually have messages with belongs in this list even
  // if the follow graph hasn't synced them in yet — a conversation
  // is a fact, not a derivation (Lucy 2026-10-17 web report).
  const messagedIds = Object.entries(chats)
    .filter(([id, msgs]) => msgs.length > 0 && id !== 'cruxy' && isUuid(id))
    .map(([id]) => id);
  const dmIds = [...new Set([...cruxmates, ...acceptedCounterpartIds, ...messagedIds])]
    .map((id, idx) => {
      const msgs = chats[id] ?? [];
      return { id, idx, lastAt: msgs.length ? msgs[msgs.length - 1].sent_at : '' };
    })
    .sort((a, b) => {
      if (a.lastAt && b.lastAt) return b.lastAt.localeCompare(a.lastAt);
      if (a.lastAt) return -1;
      if (b.lastAt) return 1;
      return a.idx - b.idx;
    })
    .map((x) => x.id);

  const hasPendingInvites = invites.some((i) => i.status === 'pending');
  const isEmpty =
    dmIds.length === 0 &&
    pendingInRequests.length === 0 &&
    sessionChatList.length === 0 &&
    !hasPendingInvites;
  if (isEmpty) {
    return (
      <div className="pt-16 flex flex-col items-center text-center">
        <ChatBubble width={40} height={40} className="text-ink-300" />
        <p className="mt-4 text-sm text-ink-500 max-w-xs">
          RSVP to a session or add a CruxMate to start chatting.
        </p>
        <button
          onClick={() => setCrewOpen(true)}
          className="mt-5 flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-extrabold text-[#161310]"
        >
          <Plus width={15} height={15} /> Start a crew
        </button>
        <NewCrewSheet open={crewOpen} onOpenChange={setCrewOpen} />
      </div>
    );
  }

  const crewChatList = sessionChatList.filter((sc) => sc.source === 'group');
  const pureSessionChatList = sessionChatList.filter((sc) => sc.source !== 'group');

  // Sections themselves float by recency (Lucy 2026-10-17: 'most
  // recent chat should float on top'): whichever of crew / session /
  // DM had the latest message renders first. Message requests stay
  // pinned above — they need an answer, not a ranking.
  const latestOf = (list: typeof sessionChatList) =>
    list.length ? list[0].messages[list[0].messages.length - 1].sent_at : '';
  const crewLatest = latestOf(crewChatList);
  const sessionLatest = latestOf(pureSessionChatList);
  const dmLatest = (() => {
    for (const id of dmIds) {
      const msgs = chats[id] ?? [];
      if (msgs.length) return msgs[msgs.length - 1].sent_at;
    }
    return '';
  })();
  const rank = (at: string, others: string[]) => others.filter((o) => o > at).length;
  const crewOrder = rank(crewLatest, [sessionLatest, dmLatest]);
  const sessionOrder = rank(sessionLatest, [crewLatest, dmLatest]);
  const dmOrder = rank(dmLatest, [crewLatest, sessionLatest]);

  const renderThreadRow = (sc: (typeof sessionChatList)[number]) => {
    const last = sc.messages[sc.messages.length - 1];
    const unread = isThreadUnread(scKey(sc.id), last);
    // Group threads are keyed by group id — a crew (e.g. a house hangout)
    // shows its own picture as the profile pic when it has one. House
    // hangouts fall back to the house cover by id, so the picture shows
    // even on group records created before avatar/cover backfills ran
    // (Lucy 2026-10-16: hangout pic sometimes missing/broken).
    const group = sc.source === 'group' ? groups.find((g) => g.id === sc.id) : undefined;
    const groupPic =
      group?.avatar_url ||
      group?.cover_url ||
      (group?.house_id ? `/covers/house-${group.house_id}.jpg` : undefined);
    const participants = sc.participant_ids
      .filter((id) => id !== 'me')
      .map((id) => users.find((u) => u.id === id))
      .filter(Boolean) as { id: string; display_name: string; avatar: AvatarConfig }[];
    return (
      <li key={sc.id}>
        <button
          onClick={() => nav(`/chat/session/${sc.id}`)}
          className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-paper-100 transition-colors text-left"
        >
          <div className="relative shrink-0">
            {groupPic ? (
              <img
                src={groupPic}
                alt=""
                className="w-11 h-11 rounded-full object-cover border border-ink-100"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center">
                <Community width={20} height={20} className="text-teal-600" />
              </div>
            )}
            {unread && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-coral-500 ring-2 ring-paper-50" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-semibold text-ink-900 truncate">{sc.title}</p>
              {last && (
                <span className={cn('text-[11px] shrink-0', unread ? 'text-coral-500 font-semibold' : 'text-ink-500')}>
                  {formatChatTimestamp(last.sent_at)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className={cn('text-sm truncate flex-1', unread ? 'text-ink-900 font-medium' : 'text-ink-500')}>
                {last
                  ? last.from === 'me' || last.from === me?.id
                    ? parseShareLink(last.text)
                      ? SENDER_INVITE_PREVIEW
                      : `You: ${last.text}`
                    : last.from === 'system'
                      ? last.text
                      : `${(me ? resolveUser(last.from, me, users, directory)?.display_name : undefined)?.split(' ')[0] ?? 'Someone'}: ${last.text}`
                  : 'Say hi!'}
              </p>
              <AvatarStack users={participants} max={3} size={18} />
            </div>
          </div>
        </button>
      </li>
    );
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink-900">Chats</h1>
        {/* Crew chats live here, so crew creation does too (Lucy
            2026-10-16: "people should be able to start a crew"). */}
        <button
          onClick={() => setCrewOpen(true)}
          className="flex shrink-0 items-center gap-1 rounded-full bg-brand-600 px-3.5 py-2 text-xs font-extrabold text-[#161310]"
        >
          <Plus width={14} height={14} /> Start a crew
        </button>
      </div>
      <NewCrewSheet open={crewOpen} onOpenChange={setCrewOpen} />

      {/* Message requests — a follow from someone starts here; tapping
          opens the thread with Accept / Decline */}
      {pendingInRequests.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
            Message requests · {pendingInRequests.length}
          </h2>
          <ul className="flex flex-col gap-1">
            {pendingInRequests.map((r) => {
              const user = me ? resolveUser(r.from_id, me, users, directory) : undefined;
              if (!user) return null;
              return (
                <li key={r.id}>
                  <button
                    onClick={() => nav(`/chat/${r.from_id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-brand-100/60 hover:bg-brand-100 transition-colors text-left"
                  >
                    <span
                      role="button"
                      aria-label={`View ${user.display_name}'s profile`}
                      className="shrink-0 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProfileUserId(r.from_id);
                      }}
                    >
                      <Avatar photoUrl={user.photo_url ?? undefined} config={user.avatar} alt={user.display_name} size={44} fallback={user.display_name} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-semibold text-ink-900 truncate">{user.display_name}</p>
                        <span className="text-[11px] shrink-0 text-ink-500">
                          {formatChatTimestamp(r.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-ink-500 truncate">Wants to chat with you — tap to review</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="flex flex-col">
      {/* Crew chats (group threads) */}
      {crewChatList.length > 0 && (
        <section className="mb-5" style={{ order: crewOrder }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
            Crew chats · {crewChatList.length}
          </h2>
          <ul className="flex flex-col gap-1">{crewChatList.map(renderThreadRow)}</ul>
        </section>
      )}

      {/* Session chats */}
      {pureSessionChatList.length > 0 && (
        <section className="mb-5" style={{ order: sessionOrder }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
            Session chats · {pureSessionChatList.length}
          </h2>
          <ul className="flex flex-col gap-1">{pureSessionChatList.map(renderThreadRow)}</ul>
        </section>
      )}

      {/* 1:1 DMs — cruxmates plus anyone whose message request was
          accepted (either direction) */}
      {dmIds.length > 0 && (
        <section style={{ order: dmOrder }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
            Direct messages · {dmIds.length}
          </h2>
          <ul className="flex flex-col gap-1">
            {dmIds.map((id) => {
              // resolveUser, NOT users.find: real cruxmates live in the
              // directory — a users-only lookup dropped them from the DM
              // list while the header still counted them (2026-10-15).
              const user = me ? resolveUser(id, me, users, directory) : undefined;
              if (!user) return null;
              const msgs = chats[id] ?? [];
              const last = msgs[msgs.length - 1];
              const unread = isThreadUnread(dmKey(id), last);
              return (
                <li key={id}>
                  <button
                    onClick={() => nav(`/chat/${id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-paper-100 transition-colors text-left"
                  >
                    <div
                      className="relative shrink-0 cursor-pointer"
                      role="button"
                      aria-label={`View ${user.display_name}'s profile`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setProfileUserId(id);
                      }}
                    >
                      <Avatar photoUrl={user.photo_url ?? undefined} config={user.avatar} alt={user.display_name} size={44} fallback={user.display_name} />
                      {unread && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-coral-500 ring-2 ring-paper-50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-semibold text-ink-900 truncate">{user.display_name}</p>
                        {last && (
                          <span className={cn('text-[11px] shrink-0', unread ? 'text-coral-500 font-semibold' : 'text-ink-500')}>
                            {formatChatTimestamp(last.sent_at)}
                          </span>
                        )}
                      </div>
                      <p className={cn('text-sm truncate', unread ? 'text-ink-900 font-medium' : 'text-ink-500')}>
                        {last
                          ? last.from === 'me' && parseShareLink(last.text)
                            ? SENDER_INVITE_PREVIEW
                            : (last.from === 'me' ? 'You: ' : '') + last.text
                          : 'Say hi!'}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      </div>
      <UserProfileSheet
        userId={profileUserId}
        open={!!profileUserId}
        onOpenChange={(o) => !o && setProfileUserId(null)}
      />
    </div>
  );
}
