import { useNavigate } from 'react-router-dom';
import { ChatBubble, Community } from 'iconoir-react';
import { Avatar, AvatarStack } from '@/components/ui/Avatar';
import { useAppStore } from '@/store/useAppStore';
import { formatChatTimestamp } from '@/lib/date';

export function Chat() {
  const nav = useNavigate();
  const cruxmates = useAppStore((s) => s.cruxmates);
  const users = useAppStore((s) => s.users);
  const chats = useAppStore((s) => s.chats);
  const sessionChats = useAppStore((s) => s.sessionChats);
  const me = useAppStore((s) => s.me);

  const sessionChatList = Object.values(sessionChats)
    .filter((sc) => sc.messages.length > 0)
    .sort((a, b) => {
      const aLast = a.messages[a.messages.length - 1]?.sent_at ?? '';
      const bLast = b.messages[b.messages.length - 1]?.sent_at ?? '';
      return bLast.localeCompare(aLast);
    });

  const isEmpty = cruxmates.length === 0 && sessionChatList.length === 0;
  if (isEmpty) {
    return (
      <div className="pt-16 flex flex-col items-center text-center">
        <ChatBubble width={40} height={40} className="text-ink-300" />
        <p className="mt-4 text-sm text-ink-500 max-w-xs">
          RSVP to a session or add a CruxMate to start chatting.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900 mb-4">Chats</h1>

      {/* Session chats (group) */}
      {sessionChatList.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
            Session chats · {sessionChatList.length}
          </h2>
          <ul className="flex flex-col gap-1">
            {sessionChatList.map((sc) => {
              const last = sc.messages[sc.messages.length - 1];
              const participants = sc.participant_ids
                .filter((id) => id !== 'me')
                .map((id) => users.find((u) => u.id === id))
                .filter(Boolean) as { id: string; display_name: string; avatar_url: string }[];
              return (
                <li key={sc.id}>
                  <button
                    onClick={() => nav(`/chat/session/${sc.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white transition-colors text-left"
                  >
                    <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                      <Community width={20} height={20} className="text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-semibold text-ink-900 truncate">{sc.title}</p>
                        {last && (
                          <span className="text-[11px] text-ink-500 shrink-0">
                            {formatChatTimestamp(last.sent_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-sm text-ink-500 truncate flex-1">
                          {last
                            ? last.from === 'me'
                              ? `You: ${last.text}`
                              : last.from === 'system'
                              ? last.text
                              : `${users.find((u) => u.id === last.from)?.display_name?.split(' ')[0] ?? 'Someone'}: ${last.text}`
                            : 'Say hi!'}
                        </p>
                        <AvatarStack users={participants} max={3} size={18} />
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* 1:1 DMs */}
      {cruxmates.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
            CruxMates · {cruxmates.length}
          </h2>
          <ul className="flex flex-col gap-1">
            {cruxmates.map((id) => {
              const user = users.find((u) => u.id === id);
              if (!user) return null;
              const msgs = chats[id] ?? [];
              const last = msgs[msgs.length - 1];
              return (
                <li key={id}>
                  <button
                    onClick={() => nav(`/chat/${id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white transition-colors text-left"
                  >
                    <Avatar src={user.avatar_url} alt={user.display_name} size={44} fallback={user.display_name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-semibold text-ink-900 truncate">{user.display_name}</p>
                        {last && (
                          <span className="text-[11px] text-ink-500 shrink-0">
                            {formatChatTimestamp(last.sent_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-ink-500 truncate">
                        {last ? (last.from === 'me' ? 'You: ' : '') + last.text : 'Say hi!'}
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
  );
}
