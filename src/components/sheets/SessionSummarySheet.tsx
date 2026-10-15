import { useRef, useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { getArchetype } from '@/lib/quizMeta';
import { resolveUser } from '@/lib/resolveUser';
import { toast } from 'sonner';
import type { Session } from '@/seed/types';
import {
  SessionCardArtwork,
  type CardChip,
  type CardCrewMember,
} from '@/components/SessionCardArtwork';
import { ShareableCardFrame } from '@/components/ShareableCardFrame';
import { shareCardImage } from '@/lib/shareCardImage';
import { getSessionNumber, formatCardDate } from '@/lib/sessionCard';

interface Props {
  session: Session | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FELT_FACES: Record<number, string> = { 1: '😖', 2: '😕', 3: '🙂', 4: '😄', 5: '🤩' };
const FELT_LABELS: Record<number, string> = {
  1: 'Rough',
  2: 'Meh',
  3: 'Good',
  4: 'Great',
  5: 'Best ever',
};
const DURATION_LABELS: Record<string, string> = {
  lt1h: 'Under 1h',
  '1to2h': '1–2h',
  '2to3h': '2–3h',
  gt3h: '3h+',
};
const ROPE_ORDER = ['5.8', '5.9', '5.10', '5.11', '5.12', '5.13+'];
function gradeRank(g: string): number {
  if (g.startsWith('V')) return parseInt(g.slice(1), 10) || 0;
  const i = ROPE_ORDER.indexOf(g);
  return i === -1 ? 0 : i;
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
  const artRef = useRef<HTMLDivElement | null>(null);
  const [sharingCard, setSharingCard] = useState(false);

  if (!session || !me) return null;

  // Session number: chronological order of user's sessions (shared helper —
  // the same numbering feeds the recap finish card).
  const sessionNumber = getSessionNumber(sessions, me.id, session.id);

  const participants = session.participant_ids.filter((id) => id !== me.id);
  const gym = session.gym_id ? gyms.find((g) => g.id === session.gym_id) : undefined;
  const where = gym?.short_name ?? session.area ?? 'Somewhere';

  // Cards collected from this session's participants
  const sessionCards = collectedCards.filter((c) => participants.includes(c.user_id));
  const recap = recaps[session.id];

  // Sends: the per-grade log wins over the quick count when present.
  const sendsLogEntries = recap?.sends_log
    ? Object.entries(recap.sends_log).filter(([, n]) => n > 0)
    : [];
  const sendsTotal =
    sendsLogEntries.length > 0
      ? sendsLogEntries.reduce((a, [, n]) => a + n, 0)
      : recap?.sends_count;
  const sendsBreakdown = sendsLogEntries
    .sort((a, b) => gradeRank(b[0]) - gradeRank(a[0]))
    .map(([g, n]) => `${n}×${g}`)
    .join(' · ');

  const link = `https://crux8.app/session/${session.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const shareCardText =
    participants.length === 0
      ? `Solo session at ${where} 🧗`
      : `Climbed with ${participants.length} ${participants.length === 1 ? 'cruxmate' : 'cruxmates'} at ${where}`;

  // Image-first share: the card as a PNG via navigator.share({files}),
  // download fallback; the deep link stays as the invite mechanism.
  const shareCard = async () => {
    const node = artRef.current;
    if (!node || sharingCard) return;
    setSharingCard(true);
    try {
      const r = await shareCardImage({
        node,
        fileName: `crux8-session-${sessionNumber}.png`,
        title: `Session #${sessionNumber} on Crux8`,
        text: shareCardText,
      });
      if (r === 'downloaded') toast.success('Image saved — post it anywhere 📸');
    } catch {
      toast('Could not render the image — copy the link instead');
    } finally {
      setSharingCard(false);
    }
  };

  // Same card template as the recap finish card (one-card decision).
  const cardCrew: CardCrewMember[] = participants.slice(0, 5).map((id) => {
    const u = resolveUser(id, me, users, directory);
    const card = collectedCards.find((c) => c.user_id === id);
    const arch = card ? getArchetype(card.archetype_id) : null;
    return {
      id,
      name: u?.display_name ?? 'Cruxmate',
      emoji: arch?.emoji ?? '🧗',
    };
  });
  const chips: CardChip[] = [
    ...(recap?.felt
      ? [{ label: `FELT ${FELT_LABELS[recap.felt].toUpperCase()}`, gold: true }]
      : []),
    ...(recap?.duration_bucket
      ? [{ label: DURATION_LABELS[recap.duration_bucket].toUpperCase() }]
      : []),
    ...(sendsTotal !== undefined
      ? [{ label: `${sendsTotal} ${sendsTotal === 1 ? 'SEND' : 'SENDS'}` }]
      : []),
    ...(recap?.gym_rating ? [{ label: `GYM ★ ${recap.gym_rating}` }] : []),
    { label: (recap?.vibe_pick ?? session.vibe).toUpperCase() },
  ];
  const extraRow = (
    <>
      {sessionCards.length > 0 && (
        <div>
          <p
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 3,
              color: '#6d675a',
            }}
          >
            🃏 {sessionCards.length} CARD
            {sessionCards.length === 1 ? '' : 'S'} COLLECTED
          </p>
          <div style={{ marginTop: 16, display: 'flex', gap: 14 }}>
            {sessionCards.map((c) => {
              const arch = getArchetype(c.archetype_id);
              return (
                <span
                  key={c.user_id}
                  style={{ fontSize: 56 }}
                  title={arch?.name_en}
                >
                  {arch?.emoji ?? '🧬'}
                </span>
              );
            })}
          </div>
        </div>
      )}
      {sendsBreakdown && (
        <p
          style={{
            marginTop: 16,
            fontSize: 27,
            fontWeight: 600,
            color: '#6d675a',
          }}
        >
          {sendsBreakdown}
        </p>
      )}
    </>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="text-center">
        <ShareableCardFrame nodeRef={artRef}>
          <SessionCardArtwork
            data={{
              number: sessionNumber,
              dateLabel: formatCardDate(session.starts_at),
              headlineA: 'Session',
              headlineB: 'complete.',
              crew: cardCrew,
              crewLine:
                participants.length === 0
                  ? 'Solo session'
                  : `Climbed with ${participants.length} ${
                      participants.length === 1 ? 'cruxmate' : 'cruxmates'
                    }`,
              crewSub:
                participants.length === 0 ? 'just you and the wall 🧗' : undefined,
              chips,
              extraRow,
              gymLine: (gym?.name ?? session.area ?? 'Outdoors').toUpperCase(),
            }}
          />
        </ShareableCardFrame>

        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleCopy}>
            Copy link
          </Button>
          <Button
            className="flex-1"
            onClick={() => void shareCard()}
            disabled={sharingCard}
          >
            {sharingCard ? 'Rendering…' : 'Share card'}
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-ink-400 break-all">{link}</p>
      </SheetContent>
    </Sheet>
  );
}
