import { useRef, useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { resolveUser } from '@/lib/resolveUser';
import { toast } from 'sonner';
import type { Session } from '@/seed/types';
import {
  SessionCardArtwork,
} from '@/components/SessionCardArtwork';
import {
  buildSessionCardData,
  vibeLabelFor,
  type CardParticipant,
} from '@/lib/cardData';
import { normalizeInviteCode, isValidInviteCode } from '@/lib/inviteCode';
import { ShareableCardFrame } from '@/components/ShareableCardFrame';
import { shareCardImage } from '@/lib/shareCardImage';
import { getSessionNumber } from '@/lib/sessionCard';

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

  // v20 expedition-postmark card: one template per user from THEIR recap.
  // Crew = ALL participants (owner first); chips + field note = owner's recap only.
  // Never prints: grades, sends, session numbers.
  const recap = recaps[session.id];
  const cardParticipants: CardParticipant[] = [
    {
      id: me.id,
      displayName: me.display_name,
      photoUrl: me.photo_url ?? null,
      avatarConfig: me.avatar,
      archetypeId:
        collectedCards.find((c) => c.user_id === me.id)?.archetype_id ??
        me.quiz_result_type ??
        null,
    },
    ...participants.map((id): CardParticipant => {
      const u = resolveUser(id, me, users, directory);
      const npc = users.find((x) => x.id === id) as
        | { quiz_result_type?: string }
        | undefined;
      return {
        id,
        displayName: u?.display_name ?? 'Cruxmate',
        photoUrl: u?.photo_url ?? null,
        avatarConfig: u?.avatar,
        archetypeId:
          collectedCards.find((c) => c.user_id === id)?.archetype_id ??
          npc?.quiz_result_type ??
          null,
      };
    }),
  ];
  const inviteCode =
    me.invite_code && isValidInviteCode(normalizeInviteCode(me.invite_code))
      ? normalizeInviteCode(me.invite_code)
      : null;
  const cardData = buildSessionCardData({
    sessionTitle: session.title,
    startsAt: session.starts_at,
    area: session.area,
    ownerId: me.id,
    participants: cardParticipants,
    recap: {
      durationLabel: recap?.duration_bucket
        ? DURATION_LABELS[recap.duration_bucket]
        : undefined,
      feltLabel: recap?.felt ? FELT_LABELS[recap.felt] : undefined,
      vibeLabel: vibeLabelFor(recap?.vibe_pick ?? session.vibe),
      note: recap?.note,
    },
    gym: gym
      ? {
          id: gym.id,
          name: gym.name,
          shortName: gym.short_name,
          city: gym.city,
          lat: (gym as { lat?: number }).lat,
          lng: (gym as { lng?: number }).lng,
        }
      : null,
    inviteCode,
  });

  const link = `https://crux8.app/session/${session.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const shareCard = async () => {
    const node = artRef.current;
    if (!node || sharingCard) return;
    setSharingCard(true);
    try {
      const r = await shareCardImage({
        node,
        fileName: `crux8-session-${session.id}.png`,
        title: 'Crux8 session',
        text: shareCardText,
      });
      if (r === 'downloaded') toast.success('Image saved — post it anywhere 📸');
    } catch {
      toast('Could not render the image — copy the link instead');
    } finally {
      setSharingCard(false);
    }
  };

  const shareCardText =
    participants.length === 0
      ? `Solo session at ${where} 🧗`
      : `Climbed with ${participants.length} ${
          participants.length === 1 ? 'cruxmate' : 'cruxmates'
        } at ${where}`;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="text-center">
        <ShareableCardFrame nodeRef={artRef}>
          <SessionCardArtwork data={cardData} />
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
