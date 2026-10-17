import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavArrowLeft, Send, ShieldCheck } from 'iconoir-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ReactionPicker } from '@/components/chat/ReactionPicker';
import { ShareCard, parseShareLink } from '@/components/chat/ShareCard';
import { useAppStore, dmKey } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { resolveUser } from '@/lib/resolveUser';

export function ChatDetail() {
  const { userId } = useParams<{ userId: string }>();
  const nav = useNavigate();
  const users = useAppStore((s) => s.users);
  const directory = useAppStore((s) => s.directory);
  const directoryVerifications = useAppStore((s) => s.directoryVerifications);
  const ensureDirectoryProfiles = useAppStore((s) => s.ensureDirectoryProfiles);
  const chats = useAppStore((s) => s.chats);
  const climbCalls = useAppStore((s) => s.climbCalls);
  const sessions = useAppStore((s) => s.sessions);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const dmAccessFor = useAppStore((s) => s.dmAccessFor);
  const sendMessageRequest = useAppStore((s) => s.sendMessageRequest);
  const respondToMessageRequest = useAppStore((s) => s.respondToMessageRequest);
  const messageRequests = useAppStore((s) => s.messageRequests);
  const fetchMessageRequests = useAppStore((s) => s.fetchMessageRequests);
  const requestCruxmate = useAppStore((s) => s.requestCruxmate);
  const toggleReactionDm = useAppStore((s) => s.toggleReactionDm);
  const markThreadRead = useAppStore((s) => s.markThreadRead);
  const setNewSessionPreselectInvite = useAppStore((s) => s.setNewSessionPreselectInvite);
  const setNewSessionOpen = useAppStore((s) => s.setNewSessionOpen);
  const me = useAppStore((s) => s.me);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Resolve through me/NPC/directory — this page used to search ONLY
  // the seed roster, so every REAL cruxmate (directory accounts, incl.
  // guests) dead-ended at "User not found" (Lucy 2026-10-16).
  const user = userId && me ? resolveUser(userId, me, users, directory) : undefined;
  const npc = users.find((u) => u.id === userId);
  const verifMap = npc?.verifications ?? (userId ? directoryVerifications[userId] : undefined) ?? {};
  const messages = userId ? chats[userId] ?? [] : [];
  const [triedFetch, setTriedFetch] = useState(false);
  useEffect(() => {
    if (userId && !user) {
      setTriedFetch(false);
      void ensureDirectoryProfiles([userId]).then(() => setTriedFetch(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, !!user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  // Opening the thread (and any new message while it's open) marks it read.
  useEffect(() => {
    if (userId) markThreadRead(dmKey(userId));
  }, [userId, messages.length, markThreadRead]);

  // Keep the request handshake fresh while a thread is open.
  useEffect(() => {
    void fetchMessageRequests();
  }, [fetchMessageRequests]);

  // Invitation cards in this thread read the invites store — refresh
  // it on open so a session invite shows its invitation format here
  // immediately, not only after a trip to Notifications.
  const fetchInvites = useAppStore((s) => s.fetchInvites);
  useEffect(() => {
    void fetchInvites();
  }, [fetchInvites]);

  // Server messages for this thread (2026-10-17): pulls anything the
  // other side sent, or that I sent from another device.
  const fetchThreadMessages = useAppStore((s) => s.fetchThreadMessages);
  useEffect(() => {
    if (userId) void fetchThreadMessages('dm', userId);
  }, [userId, fetchThreadMessages]);

  if (!user) {
    return (
      <div className="pt-10 text-center">
        <p className="text-sm text-ink-500">{triedFetch ? 'User not found.' : 'Loading…'}</p>
        <button onClick={() => nav('/chat')} className="mt-3 text-teal-600 text-sm font-medium">
          Back
        </button>
      </div>
    );
  }

  // Message-request gating (Lucy, 2026-10-16): cruxmates chat freely;
  // a followee starts as a request — the first message rides along with
  // the request, then the composer locks until they accept.
  const access = userId ? dmAccessFor(userId) : 'open';
  const first = user.display_name.split(' ')[0];
  const pendingInRow = userId
    ? messageRequests.find((r) => r.from_id === userId && r.to_id === me?.id && r.status === 'pending')
    : undefined;

  const handleSend = () => {
    const t = text.trim();
    if (!t || !userId) return;
    if (access === 'request') sendMessageRequest(userId);
    sendMessage(userId, t);
    setText('');
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)] -mx-4">
      <div className="px-4 py-3 border-b border-ink-100 bg-paper-100 flex items-center gap-3">
        <button onClick={() => nav('/chat')} aria-label="Back">
          <NavArrowLeft width={22} height={22} className="text-ink-700" />
        </button>
        <Avatar photoUrl={user.photo_url ?? undefined} config={user.avatar} alt={user.display_name} size={36} fallback={user.display_name} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink-900 truncate">{user.display_name}</p>
          <div className="flex gap-1 mt-0.5">
            {(['top_rope', 'lead', 'trad'] as const)
              .filter((c) => verifMap[c] === 'verified')
              .map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-0.5 rounded-full bg-teal-100 text-teal-600 text-[9px] font-semibold px-1.5 py-0.5"
                >
                  <ShieldCheck width={9} height={9} />
                  {c === 'top_rope' ? 'TR' : c === 'lead' ? 'Lead' : 'Trad'}
                </span>
              ))}
          </div>
        </div>
        {access === 'open' && userId && (
          <button
            type="button"
            onClick={() => {
              // Same invitation as the profile card's Invite to climb
              // (Lucy 2026-10-17: chat gets its own invite button —
              // '和点进头像是一样的'). The lean two-step invite sheet
              // opens with this person preselected; sending creates
              // the session/call and drops the invitation card right
              // back into this conversation.
              setNewSessionPreselectInvite(userId);
              setNewSessionOpen(true);
            }}
            className="shrink-0 rounded-full bg-brand-600 px-3.5 py-2 text-xs font-bold text-[#161310]"
          >
            🧗 Invite to climb
          </button>
        )}
      </div>

      {access === 'request' && (
        <div className="px-4 py-2.5 bg-brand-100 border-b border-ink-100 text-center">
          <p className="text-xs text-ink-700">
            This starts as a <b>message request</b> — {first} has to accept before you can keep
            chatting. Your first message goes with the request.
          </p>
        </div>
      )}
      {access === 'pending_out' && (
        <div className="px-4 py-2.5 bg-brand-100 border-b border-ink-100 text-center">
          <p className="text-xs text-ink-700">
            Request sent — waiting for {first} to accept.
          </p>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-ink-500 pt-8">Say hi.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m, i) => {
              const isMe = m.from === 'me';
              const showTime =
                i === 0 || new Date(messages[i - 1].sent_at).toDateString() !== new Date(m.sent_at).toDateString();
              return (
                <div key={m.id}>
                  {showTime && (
                    <p className="text-center text-[11px] text-ink-300 my-2">
                      {format(new Date(m.sent_at), 'EEE, MMM d')}
                    </p>
                  )}
                  <div className={cn('flex flex-col', isMe ? 'items-end' : 'items-start')}>
                    {(() => {
                      const share = parseShareLink(m.text);
                      const sharedCall = share?.kind === 'call' ? climbCalls.find((c) => c.id === share.id) : undefined;
                      const sharedSession = share?.kind === 'session' ? sessions.find((s) => s.id === share.id) : undefined;
                      if (sharedCall || sharedSession) {
                        return <ShareCard call={sharedCall} session={sharedSession} />;
                      }
                      return (
                        <div
                          className={cn(
                            'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm',
                            isMe
                              ? 'bg-brand-600 text-[#161310] rounded-tr-md'
                              : 'bg-paper-100 border border-ink-100 text-ink-900 rounded-tl-md',
                          )}
                        >
                          {m.text}
                        </div>
                      );
                    })()}
                    <ReactionPicker
                      reactions={m.reactions}
                      meId={me?.id ?? 'me'}
                      align={isMe ? 'right' : 'left'}
                      onToggle={(key) => userId && toggleReactionDm(userId, m.id, key)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {access === 'pending_in' && pendingInRow ? (
        <div className="px-4 py-3 border-t border-ink-100 bg-paper-100">
          <p className="text-sm text-ink-900 text-center">
            <b>{first}</b> wants to chat with you.
          </p>
          <div className="mt-2.5 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => respondToMessageRequest(pendingInRow.id, false)}
            >
              Decline
            </Button>
            <Button className="flex-1" onClick={() => respondToMessageRequest(pendingInRow.id, true)}>
              Accept — open chat
            </Button>
          </div>
        </div>
      ) : access === 'pending_out' ? (
        <div className="px-4 py-3 border-t border-ink-100 bg-paper-100 text-center">
          <p className="text-xs text-ink-500">
            The chat opens when {first} accepts your request.
          </p>
        </div>
      ) : access === 'declined' ? (
        <div className="px-4 py-3 border-t border-ink-100 bg-paper-100 text-center">
          <p className="text-xs text-ink-500">This message request was declined.</p>
        </div>
      ) : access === 'follow_first' ? (
        <div className="px-4 py-3 border-t border-ink-100 bg-paper-100 text-center">
          <p className="text-xs text-ink-500 mb-2">
            You can message people you follow — it starts as a request they accept.
          </p>
          <Button
            onClick={() => {
              if (userId) requestCruxmate(userId);
            }}
          >
            Follow {first} to message
          </Button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="px-4 py-3 border-t border-ink-100 bg-paper-100 flex gap-2"
        >
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" />
          <Button type="submit" size="icon" disabled={!text.trim()}>
            <Send width={18} height={18} />
          </Button>
        </form>
      )}
    </div>
  );
}
