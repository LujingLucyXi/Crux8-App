import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavArrowLeft, Send, ShieldCheck } from 'iconoir-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ReactionPicker } from '@/components/chat/ReactionPicker';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

export function ChatDetail() {
  const { userId } = useParams<{ userId: string }>();
  const nav = useNavigate();
  const users = useAppStore((s) => s.users);
  const chats = useAppStore((s) => s.chats);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const toggleReactionDm = useAppStore((s) => s.toggleReactionDm);
  const me = useAppStore((s) => s.me);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const user = users.find((u) => u.id === userId);
  const messages = userId ? chats[userId] ?? [] : [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  if (!user) {
    return (
      <div className="pt-10 text-center">
        <p className="text-sm text-ink-500">User not found.</p>
        <button onClick={() => nav('/chat')} className="mt-3 text-teal-600 text-sm font-medium">
          Back
        </button>
      </div>
    );
  }

  const handleSend = () => {
    const t = text.trim();
    if (!t || !userId) return;
    sendMessage(userId, t);
    setText('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] -mx-4">
      <div className="px-4 py-3 border-b border-ink-100 bg-white flex items-center gap-3">
        <button onClick={() => nav('/chat')} aria-label="Back">
          <NavArrowLeft width={22} height={22} className="text-ink-700" />
        </button>
        <Avatar config={user.avatar} alt={user.display_name} size={36} fallback={user.display_name} />
        <div className="flex-1">
          <p className="font-semibold text-ink-900">{user.display_name}</p>
          <div className="flex gap-1 mt-0.5">
            {(['top_rope', 'lead', 'trad'] as const)
              .filter((c) => user.verifications[c] === 'verified')
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
      </div>

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
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm',
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
                      onToggle={(key) => userId && toggleReactionDm(userId, m.id, key)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="px-4 py-3 border-t border-ink-100 bg-white flex gap-2"
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" />
        <Button type="submit" size="icon" disabled={!text.trim()}>
          <Send width={18} height={18} />
        </Button>
      </form>
    </div>
  );
}
