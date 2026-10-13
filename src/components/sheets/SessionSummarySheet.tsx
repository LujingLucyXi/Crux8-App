import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { getArchetype, getHouse } from '@/lib/quizMeta';
import { resolveUser } from '@/lib/resolveUser';
import { toast } from 'sonner';
import type { Session } from '@/seed/types';

interface Props {
  session: Session | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Collectible session summary card: numbered, house-themed, shareable.
 * Shows who was there, cards collected, and the vibe.
 */
export function SessionSummarySheet({ session, open, onOpenChange }: Props) {
  const me = useAppStore((s) => s.me);
  const users = useAppStore((s) => s.users);
  const directory = useAppStore((s) => s.directory);
  const gyms = useAppStore((s) => s.gyms);
  const sessions = useAppStore((s) => s.sessions);
  const collectedCards = useAppStore((s) => s.collectedCards);
  const recaps = useAppStore((s) => s.recaps);

  if (!session || !me) return null;

  // Session number: chronological order of user's sessions
  const mySessions = sessions
    .filter((s) => s.participant_ids.includes(me.id) || s.host_id === me.id)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const sessionNumber = mySessions.findIndex((s) => s.id === session.id) + 1;

  const participants = session.participant_ids.filter((id) => id !== me.id);
  const gym = session.gym_id ? gyms.find((g) => g.id === session.gym_id) : undefined;
  const where = gym?.short_name ?? session.area ?? 'Somewhere';
  const when = new Date(session.starts_at).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric',
  });

  // Cards collected from this session's participants
  const sessionCards = collectedCards.filter((c) => participants.includes(c.user_id));
  const recap = recaps[session.id];

  // Dominant house among participants for theming
  const houseCounts = new Map<string, number>();
  for (const c of sessionCards) {
    houseCounts.set(c.house_id, (houseCounts.get(c.house_id) ?? 0) + 1);
  }
  const topHouseId = [...houseCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const topHouse = topHouseId ? getHouse(topHouseId) : null;

  const link = `https://crux8.app/session/${session.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Session #${sessionNumber} on Crux8`,
          text: `Climbed with ${participants.length} ${participants.length === 1 ? 'partner' : 'partners'} at ${where}`,
          url: link,
        });
      } catch { /* dismissed */ }
    } else {
      handleCopy();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">
          Session #{sessionNumber || '—'}
        </p>

        {/* Collectible card */}
        <div
          className="mx-auto mt-4 rounded-3xl p-6 shadow-xl text-left"
          style={{
            background: topHouse
              ? `linear-gradient(135deg, ${topHouse.color}30, ${topHouse.color}70)`
              : 'linear-gradient(135deg, #2A2210, #16161A)',
            border: `2px solid ${topHouse?.color ?? '#C9A24B'}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-ink-900">{session.title}</h3>
              <p className="text-xs text-ink-500">{where} · {when}</p>
            </div>
            {topHouse && (
              <span className="text-3xl">{topHouse.emoji}</span>
            )}
          </div>

          {/* Crew */}
          <div className="mt-4 flex items-center gap-2">
            <div className="flex -space-x-2">
              {participants.slice(0, 5).map((id) => {
                const u = resolveUser(id, me, users, directory);
                const card = collectedCards.find((c) => c.user_id === id);
                const arch = card ? getArchetype(card.archetype_id) : null;
                return (
                  <span
                    key={id}
                    title={u?.display_name}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-paper-100 text-xl shadow"
                  >
                    {arch?.emoji ?? '🧗'}
                  </span>
                );
              })}
            </div>
            <span className="text-xs text-ink-600 font-medium">
              {participants.length} climbing {participants.length === 1 ? 'partner' : 'partners'}
            </span>
          </div>

          {/* Cards collected */}
          {sessionCards.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                🃏 {sessionCards.length} card{sessionCards.length === 1 ? '' : 's'} collected
              </p>
              <div className="mt-1.5 flex gap-1.5">
                {sessionCards.map((c) => {
                  const arch = getArchetype(c.archetype_id);
                  return (
                    <span key={c.user_id} className="text-2xl" title={arch?.name_en}>
                      {arch?.emoji ?? '🧬'}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vibe */}
          <div className="mt-4 flex items-center justify-between">
            <span className="inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-ink-700 capitalize">
              {session.vibe} vibes
            </span>
            <span className="text-[10px] text-ink-400 font-medium">crux8.app</span>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleCopy}>
            Copy link
          </Button>
          <Button className="flex-1" onClick={handleNativeShare}>
            Share session
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-ink-400 break-all">{link}</p>
      </SheetContent>
    </Sheet>
  );
}
