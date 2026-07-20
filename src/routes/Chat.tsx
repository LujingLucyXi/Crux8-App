import { useNavigate } from 'react-router-dom';
import { ChatBubble } from 'iconoir-react';
import { Avatar } from '@/components/ui/Avatar';
import { useAppStore } from '@/store/useAppStore';
import { formatChatTimestamp } from '@/lib/date';

export function Chat() {
  const nav = useNavigate();
  const cruxmates = useAppStore((s) => s.cruxmates);
  const users = useAppStore((s) => s.users);
  const chats = useAppStore((s) => s.chats);

  if (cruxmates.length === 0) {
    return (
      <div className="pt-16 flex flex-col items-center text-center">
        <ChatBubble width={40} height={40} className="text-ink-300" />
        <p className="mt-4 text-sm text-ink-500 max-w-xs">
          Add a CruxMate from any session or profile to start chatting.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900 mb-4">Chats</h1>
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
    </div>
  );
}
