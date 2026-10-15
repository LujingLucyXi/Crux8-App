import { useState } from 'react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import type { ClimbCall, Session } from '@/seed/types';
import { formatSessionWhen } from '@/lib/date';
import { hasStarted, sessionPhase } from '@/lib/sessionPhase';
import { ClimbCallDetailSheet } from '@/components/sheets/ClimbCallDetailSheet';
import { SessionDetailSheet } from '@/components/sheets/SessionDetailSheet';
import { cn } from '@/lib/utils';

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
  const sessionLifecycle = useAppStore((s) => s.sessionLifecycle);
  const requestPair = useAppStore((s) => s.requestPair);
  const rsvp = useAppStore((s) => s.rsvp);
  const [detailOpen, setDetailOpen] = useState(false);

  if (!me) return null;

  const shell = (label: string, children: React.ReactNode) => (
    <div className="w-[270px] max-w-full rounded-2xl border border-brand-600/50 bg-paper-100 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">{label}</p>
      {children}
    </div>
  );

  if (call) {
    const gym = call.gym_id ? gyms.find((g) => g.id === call.gym_id) : undefined;
    const place = gym?.short_name ?? call.area ?? 'Outdoor';
    const isMine = call.user_id === me.id;
    const joined = call.participant_ids.includes(me.id);
    const closed = call.status !== 'live';
    const full = call.participant_ids.length >= call.capacity;
    const title = call.title ?? `${CALL_CAT_LABEL[call.category] ?? 'Climb'} · ${call.grade}`;
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
              {session.participant_ids.length} {done ? 'climbed' : 'climbing'}
            </p>
            {done ? (
              <>
                <p className="mt-1.5 text-xs font-semibold text-brand-600">🎉 Session completed</p>
                <button
                  onClick={() => setDetailOpen(true)}
                  className="mt-2.5 w-full rounded-xl border border-ink-100 py-2 text-sm font-semibold text-ink-700"
                >
                  View session →
                </button>
              </>
            ) : joined ? (
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
