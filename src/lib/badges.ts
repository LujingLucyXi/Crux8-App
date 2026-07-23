import type { Session, Rating } from '@/seed/types';
import type { BadgeId, Verification } from '@/store/useAppStore';
import type { VerificationCategory } from '@/seed/types';

/**
 * Badge metadata + progress. The store owns *whether* a badge is earned;
 * this module answers "how close am I?" so Home can show a progress ring
 * instead of a binary lock icon.
 */

export interface BadgeMeta {
  id: BadgeId;
  emoji: string;
  label: string;
  hint: string;
  target: number;
}

export const BADGE_META: Record<BadgeId, BadgeMeta> = {
  first_session: { id: 'first_session', emoji: '🧗', label: 'First Session', hint: 'Join any climb', target: 1 },
  first_send:    { id: 'first_send',    emoji: '⭐', label: 'First Send',    hint: 'Rate a past session', target: 1 },
  verified_belayer: { id: 'verified_belayer', emoji: '🛡', label: 'Verified Belayer', hint: 'Verify one belay cert', target: 1 },
  adventurer:    { id: 'adventurer',    emoji: '🌲', label: 'Adventurer',    hint: 'Join an outdoor climb', target: 1 },
  community:     { id: 'community',     emoji: '🎪', label: 'Community',     hint: 'Join a group', target: 1 },
  cruxmate_x5:   { id: 'cruxmate_x5',   emoji: '🤝', label: 'CruxMate ×5',   hint: 'Add 5 CruxMates', target: 5 },
  trust_champion:{ id: 'trust_champion',emoji: '🏆', label: 'Trust Champion',hint: 'Verify all 3 belay certs', target: 3 },
};

export const BADGE_ORDER: BadgeId[] = [
  'first_session', 'first_send', 'verified_belayer', 'adventurer',
  'community', 'cruxmate_x5', 'trust_champion',
];

interface Ctx {
  meId: string;
  sessions: Session[];
  cruxmates: string[];
  myGroupMemberships: string[];
  verifications: Record<VerificationCategory, Verification>;
  ratings: Record<string, Rating>;
}

export interface BadgeProgress extends BadgeMeta {
  current: number;
  earned: boolean;
  pct: number;
}

export function computeBadgeProgress(ctx: Ctx, earnedIds: BadgeId[]): BadgeProgress[] {
  const { meId, sessions, cruxmates, myGroupMemberships, verifications, ratings } = ctx;
  const mine = sessions.filter((s) => s.participant_ids.includes(meId));
  const verifiedCount = (['top_rope', 'lead', 'trad'] as VerificationCategory[])
    .filter((c) => verifications[c]?.status === 'verified').length;

  const current: Record<BadgeId, number> = {
    first_session: Math.min(mine.length, 1),
    first_send: Math.min(Object.keys(ratings).length, 1),
    verified_belayer: Math.min(verifiedCount, 1),
    adventurer: Math.min(mine.filter((s) => s.location_type === 'outdoor').length, 1),
    community: Math.min(myGroupMemberships.length, 1),
    cruxmate_x5: cruxmates.length,
    trust_champion: verifiedCount,
  };

  return BADGE_ORDER.map((id) => {
    const meta = BADGE_META[id];
    const cur = Math.min(current[id], meta.target);
    const earned = earnedIds.includes(id) || cur >= meta.target;
    return { ...meta, current: cur, earned, pct: Math.round((cur / meta.target) * 100) };
  });
}

/** Badges not yet earned, closest-to-done first — for the Home carousel. */
export function nextUpBadges(all: BadgeProgress[], k = 4): BadgeProgress[] {
  return all.filter((b) => !b.earned).sort((a, b) => b.pct - a.pct).slice(0, k);
}
