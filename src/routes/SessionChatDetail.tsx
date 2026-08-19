import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavArrowLeft, Send, Community } from 'iconoir-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarStack } from '@/components/ui/Avatar';
import { ReactionPicker } from '@/components/chat/ReactionPicker';
import { useAppStore, scKey } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import type { AvatarConfig } from '@/lib/avatar';

export function SessionChatDetail() {
  const { sessionChatId } = useParams<{ sessionChatId: string }>();
  const nav = useNavigate();
  const sessionChats = useAppStore((s) => s.sessionChats);
  const users = useAppStore((s) => s.users);
  const me = useAppStore((s) => s.me);
  const sendSessionMessage = useAppStore((s) => s.sendSessionMessage);
  const toggleReactionSession = useAppStore((s) => s.toggleReactionSession);
  const markThreadRead = useAppStore((s) => s.markThreadRead);

  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const chat = sessionChatId ? sessionChats[sessionChatId] : null;
  const messages = chat?.messages ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  // Opening the thread (and any new message while it's open) marks it read.
  useEffect(() => {
    if (sessionChatId) markThreadRead(scKey(sessionChatId));
  }, [sessionChatId, messages.length, markThreadRead]);

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

  const participants = chat.participant_ids
    .filter((id) => id !== 'me')
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean) as { id: string; display_name: string; avatar: AvatarConfig }[];

  const handleSend = () => {
    const t = text.trim();
    if (!t || !sessionChatId) return;
    sendSessionMessage(sessionChatId, t);
    setText('');
  };

  const userName = (from: string) => {
    if (from === 'me') return 'You';
    if (from === 'system') return null;
    return users.find((u) => u.id === from)?.display_name ?? 'Someone';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] -mx-4">
      <div className="px-4 py-3 border-b border-ink-100 bg-white flex items-center gap-3">
        <button onClick={() => nav('/chat')} aria-label="Back">
          <NavArrowLeft width={22} height={22} className="text-ink-700" />
        </button>
        <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
          <Community width={18} height={18} className="text-teal-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink-900 truncate">{chat.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <AvatarStack users={participants} max={4} size={16} />
            <span className="text-[11px] text-ink-500">{chat.participant_ids.length} in chat</span>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-3">
          {messages.map((m, i) => {
            const isMe = m.from === 'me';
            const isSystem = m.from === 'system';
            const showTime =
              i === 0 || new Date(messages[i - 1].sent_at).toDateString() !== new Date(m.sent_at).toDateString();
            const author = users.find((u) => u.id === m.from);

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
                      config={author?.avatar}
                      alt={author?.display_name ?? '?'}
                      size={28}
                      fallback={author?.display_name}
                      className="mt-4"
                    />
                  )}
                  <div className={cn('flex flex-col max-w-[75%]', isMe ? 'items-end' : 'items-start')}>
                    {!isMe && (
                      <p className="text-[11px] font-medium text-ink-500 mb-0.5">
                        {userName(m.from)}
                      </p>
                    )}
                    <div
                      className={cn(
                        'rounded-2xl px-3.5 py-2 text-sm',
                        isMe
                          ? 'bg-ink-900 text-white rounded-tr-md'
                          : 'bg-white border border-ink-100 text-ink-900 rounded-tl-md',
                      )}
                    >
                      {m.text}
                    </div>
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
        className="px-4 py-3 border-t border-ink-100 bg-white flex gap-2"
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${chat.title}`}
        />
        <Button type="submit" size="icon" disabled={!text.trim()}>
          <Send width={18} height={18} />
        </Button>
      </form>
    </div>
  );
}
