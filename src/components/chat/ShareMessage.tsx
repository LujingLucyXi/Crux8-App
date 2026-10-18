import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ShareCard, parseShareLink } from './ShareCard';
import { cn } from '@/lib/utils';

/**
 * A chat message that auto-resolves Crux8 links (Lucy 2026-10-17:
 * "缺个 link auto resolve"). When the text carries a /session/<id> or
 * /call/<id> link, the message renders as the joinable ShareCard. If
 * the entity isn't in the local store yet — a session created after
 * this device last synced, which was exactly the invite-DM case — it
 * is fetched from the server by id and merged in, so the card appears
 * a beat later. Unresolvable links stay as the plain text bubble.
 */
export function ShareMessage({
  text,
  isMe,
  bubbleClassName,
}: {
  text: string;
  isMe: boolean;
  bubbleClassName: string;
}) {
  const share = parseShareLink(text);
  const session = useAppStore((s) =>
    share?.kind === 'session' ? s.sessions.find((x) => x.id === share.id) : undefined,
  );
  const call = useAppStore((s) =>
    share?.kind === 'call' ? s.climbCalls.find((x) => x.id === share.id) : undefined,
  );
  const ensureSessionById = useAppStore((s) => s.ensureSessionById);
  const ensureCallById = useAppStore((s) => s.ensureCallById);

  const shareId = share?.id;
  const shareKind = share?.kind;
  const resolved = Boolean(session || call);
  useEffect(() => {
    if (!shareId || resolved) return;
    if (shareKind === 'session') void ensureSessionById(shareId);
    else if (shareKind === 'call') void ensureCallById(shareId);
  }, [shareId, shareKind, resolved, ensureSessionById, ensureCallById]);

  if (share && (session || call)) {
    return <ShareCard call={call} session={session} />;
  }
  if (share) {
    // Never flash the raw text+link version (Lucy 2026-10-17): while
    // the entity resolves, render a placeholder in the card's own
    // shell — the real invitation card swaps into the same footprint.
    return (
      <div className="w-[270px] max-w-full rounded-2xl border border-brand-600/50 bg-paper-100 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
          🧗 Invitation
        </p>
        <p className="mt-1 text-sm text-ink-500">Loading invitation…</p>
      </div>
    );
  }
  return (
    <div
      className={cn(
        bubbleClassName,
        isMe
          ? 'bg-brand-600 text-[#161310] rounded-tr-md'
          : 'bg-paper-100 border border-ink-100 text-ink-900 rounded-tl-md',
      )}
    >
      {text}
    </div>
  );
}
