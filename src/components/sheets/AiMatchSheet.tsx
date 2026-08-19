import { useMemo, useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { SessionCard } from '@/components/cards/SessionCard';
import { useAppStore } from '@/store/useAppStore';
import { rankMatches } from '@/lib/match';
import type { Session } from '@/seed/types';
import { SessionDetailSheet } from './SessionDetailSheet';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiMatchSheet({ open, onOpenChange }: Props) {
  const me = useAppStore((s) => s.me);
  const sessions = useAppStore((s) => s.sessions);
  const users = useAppStore((s) => s.users);
  const gyms = useAppStore((s) => s.gyms);
  const [detail, setDetail] = useState<Session | null>(null);

  const matches = useMemo(() => (me ? rankMatches(me, sessions, 5) : []), [me, sessions]);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent title="Smart Match Finder">
          <p className="text-sm text-ink-500 -mt-2 mb-4">
            Ranked by your top grade, preferred styles, home gym, timing, and vibe.
          </p>
          <div className="flex flex-col gap-3">
            {matches.map(({ session, score }) => {
              const gym = session.gym_id ? gyms.find((g) => g.id === session.gym_id) : undefined;
              return (
                <SessionCard
                  key={session.id}
                  session={session}
                  users={users}
                  gymName={gym?.short_name}
                  matchScore={score}
                  onClick={() => setDetail(session)}
                />
              );
            })}
            {matches.length === 0 && (
              <p className="text-sm text-ink-500 text-center py-8">No sessions to match yet.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <SessionDetailSheet session={detail} open={!!detail} onOpenChange={(o) => !o && setDetail(null)} />
    </>
  );
}
