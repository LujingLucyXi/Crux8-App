import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavArrowLeft, Send, Community } from 'iconoir-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarStack } from '@/components/ui/Avatar';
import { ReactionPicker } from '@/components/chat/ReactionPicker';
import { ShareCard, parseShareLink } from '@/components/chat/ShareCard';
import { useAppStore, scKey } from '@/store/useAppStore';
import { formatSessionWhen } from '@/lib/date';
import { SessionDetailSheet } from '@/components/sheets/SessionDetailSheet';
import { ClimbCallDetailSheet } from '@/components/sheets/ClimbCallDetailSheet';
import { cn } from '@/lib/utils';
import { resolveUser, type ResolvedUser } from '@/lib/resolveUser';

export function SessionChatDetail() {
  const { sessionChatId } = useParams<{ sessionChatId: string }>();
  const nav = useNavigate();
  const sessionChats = useAppStore((s) => s.sessionChats);
  const climbCalls = useAppStore((s) => s.climbCalls);
  const sessions = useAppStore((s) => s.sessions);
  const users = useAppStore((s) => s.users);
  const directory = useAppStore((s) => s.directory);
  const groups = useAppStore((s) => s.groups);
  const gyms = useAppStore((s) => s.gyms);
  const me = useAppStore((s) => s.me);
  const sendSessionMessage = useAppStore((s) => s.sendSessionMessage);
  const ensureDirectoryProfiles = useAppStore((s) => s.ensureDirectoryProfiles);
  const toggleReactionSession = useAppStore((s) => s.toggleReactionSession);
  const markThreadRead = useAppStore((s) => s.markThreadRead);
  const fetchThreadMessages = useAppStore((s) => s.fetchThreadMessages);

  const [text, setText] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chat = sessionChatId ? sessionChats[sessionChatId] : null;
  const messages = chat?.messages ?? [];

  // Server messages for this thread (2026-10-17): session / call /
  // group chats hydrate from chat_messages on open, so what was said
  // on another device (or by someone else) is here.
  useEffect(() => {
    if (sessionChatId && chat) void fetchThreadMessages(chat.source, sessionChatId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionChatId, chat?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  // Opening the thread (and any new message while it's open) marks it read.
  useEffect(() => {
    if (sessionChatId) markThreadRead(scKey(sessionChatId));
  }, [sessionChatId, messages.length, markThreadRead]);

  // Sender names resolve through the directory — make sure every
  // participant/sender in this thread is fetched, so a name (not a
  // placeholder) can sit on each message.
  useEffect(() => {
    if (!chat) return;
    void ensureDirectoryProfiles([
      ...chat.participant_ids,
      ...messages.map((m) => m.from),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat?.id]);

  if (!chat) {
    return (
      <div className="pt-10 text-center">
        <p className="text-sm text-ink-500">Chat not found.</p>
        <button onClick={() => nav('/chat')} className="mt-3 text-teal-600 text-sm font-medium">
          Back
        </button>
      </div>
    );
  }

  // Legacy persisted/seed chats can still carry the 'me' literal alongside real ids.
  const participants = chat.participant_ids
    .filter((id) => id !== 'me' && id !== me?.id)
    .map((id) => resolveUser(id, me, users, directory))
    .filter((u): u is ResolvedUser => !!u)
    .map((p) => ({
      id: p.id,
      display_name: p.display_name,
      avatar: p.avatar,
      photo_url: p.photo_url ?? undefined,
    }));

  const handleSend = () => {
    const t = text.trim();
    if (!t || !sessionChatId) return;
    sendSessionMessage(sessionChatId, t);
    setText('');
  };

  const userName = (from: string) => {
    if (from === 'me' || from === me?.id) return me?.display_name ?? 'You';
    if (from === 'system') return null;
    return resolveUser(from, me, users, directory)?.display_name ?? 'Someone';
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)] -mx-4">
      <div className="px-4 py-3 border-b border-ink-100 bg-paper-100 flex items-center gap-3">
        <button onClick={() => nav('/chat')} aria-label="Back">
          <NavArrowLeft width={22} height={22} className="text-ink-700" />
        </button>
        {(() => {
          // Group threads are keyed by group id — show the crew's own
          // picture (e.g. the house photo on a hangout) when it has one,
          // with the house cover as the by-id fallback (same chain as
          // the chat list — a missing group pic must never strand the
          // placeholder).
          const group = chat.source === 'group' ? groups.find((g) => g.id === chat.id) : undefined;
          const pic =
            group?.avatar_url ||
            group?.cover_url ||
            (group?.house_id ? `/covers/house-${group.house_id}.jpg` : undefined);
          return pic ? (
            <img
              src={pic}
              alt=""
              className="w-9 h-9 rounded-full object-cover border border-ink-100 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
              <Community width={18} height={18} className="text-teal-600" />
            </div>
          );
        })()}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink-900 truncate">{chat.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <AvatarStack users={participants} max={4} size={16} />
            <span className="text-[11px] text-ink-500">{chat.participant_ids.length} in chat</span>
          </div>
        </div>
      </div>

      {/* Time + place strip (Lucy 2026-10-17: session chats showed
          neither). The session/call is looked up live by the chat's
          id, so edits show here too; tapping opens the full sheet. */}
      {(() => {
        const linkedSession = chat.source === 'session' ? sessions.find((x) => x.id === chat.id) : undefined;
        const linkedCall = chat.source === 'call' ? climbCalls.find((x) => x.id === chat.id) : undefined;
        const startsAt = linkedSession?.starts_at ?? linkedCall?.starts_at;
        if (!startsAt) {
          return chat.subtitle ? (
            <div className="border-b border-ink-100 bg-paper-50 px-4 py-2 text-xs text-ink-600">
              📍 {chat.subtitle}
            </div>
          ) : null;
        }
        const place = linkedSession
          ? (gyms.find((g) => g.id === linkedSession.gym_id)?.name ?? linkedSession.area ?? 'Outdoor')
          : (gyms.find((g) => g.id === linkedCall?.gym_id)?.name ?? linkedCall?.area ?? 'Outdoor');
        return (
          <button
            onClick={() => setDetailOpen(true)}
            className="block w-full border-b border-ink-100 bg-paper-50 px-4 py-2 text-left text-xs text-ink-600"
          >
            📅 {formatSessionWhen(startsAt)} <span className="text-ink-300">·</span> 📍 {place}
          </button>
        );
      })()}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-3">
          {messages.map((m, i) => {
            const isMe = m.from === 'me' || m.from === me?.id;
            const isSystem = m.from === 'system';
            const author = resolveUser(m.from, me, users, directory);
            const showTime =
              i === 0 || new Date(messages[i - 1].sent_at).toDateString() !== new Date(m.sent_at).toDateString();

            if (isSystem) {
              return (
                <div key={m.id} className="flex flex-col items-center">
                  {showTime && (
                    <p className="text-[11px] text-ink-300 my-2">
                      {format(new Date(m.sent_at), 'EEE, MMM d')}
                    </p>
                  )}
                  <p className="text-[11px] text-ink-500 italic bg-paper-50 border border-ink-100 rounded-full px-3 py-1">
                    {m.text}
                  </p>
                </div>
              );
            }

            return (
              <div key={m.id}>
                {showTime && (
                  <p className="text-center text-[11px] text-ink-300 my-2">
                    {format(new Date(m.sent_at), 'EEE, MMM d')}
                  </p>
                )}
                <div className={cn('flex gap-2', isMe ? 'justify-end' : 'justify-start')}>
                  {!isMe && (
                    <Avatar
                      photoUrl={author?.photo_url ?? undefined}
                      config={author?.avatar}
                      alt={author?.display_name ?? '?'}
                      size={28}
                      fallback={author?.display_name}
                      className="mt-4"
                    />
                  )}
                  <div className={cn('flex flex-col max-w-[75%]', isMe ? 'items-end' : 'items-start')}>
                    {/* Every message in a group/session thread carries its
                        sender's name (Lucy 2026-10-16) — including your
                        own, so who said what is never ambiguous. */}
                    <p className="text-[11px] font-semibold text-ink-700 mb-0.5">
                      {userName(m.from)}
                    </p>
                    {(() => {
                      // Shared calls/sessions render as joinable cards, not
                      // raw link text, when this client knows the entity.
                      const share = parseShareLink(m.text);
                      const sharedCall = share?.kind === 'call' ? climbCalls.find((c) => c.id === share.id) : undefined;
                      const sharedSession = share?.kind === 'session' ? sessions.find((s) => s.id === share.id) : undefined;
                      if (sharedCall || sharedSession) {
                        return <ShareCard call={sharedCall} session={sharedSession} />;
                      }
                      return (
                        <div
                          className={cn(
                            'rounded-2xl px-3.5 py-2 text-sm',
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
                      onToggle={(key) => sessionChatId && toggleReactionSession(sessionChatId, m.id, key)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="px-4 py-3 border-t border-ink-100 bg-paper-100"
      >
        <div className="relative">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Message ${chat.title}`}
            className="h-11 rounded-full pr-12 text-base"
          />
          <Button
            type="submit"
            disabled={!text.trim()}
            className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full p-0"
          >
            <Send width={16} height={16} />
          </Button>
        </div>
      </form>

      <SessionDetailSheet
        session={detailOpen && chat.source === 'session' ? (sessions.find((x) => x.id === chat.id) ?? null) : null}
        open={detailOpen && chat.source === 'session'}
        onOpenChange={setDetailOpen}
      />
      <ClimbCallDetailSheet
        call={detailOpen && chat.source === 'call' ? (climbCalls.find((x) => x.id === chat.id) ?? null) : null}
        open={detailOpen && chat.source === 'call'}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
