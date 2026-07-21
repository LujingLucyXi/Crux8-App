import type { ReactionKey } from '@/seed/types';

/**
 * Climbing-culture reaction emojis for chat messages.
 * Order = pick-order in the reaction picker (most-common first).
 */
export const REACTIONS: Array<{ key: ReactionKey; emoji: string; label: string }> = [
  { key: 'chalk', emoji: '🧂', label: 'Chalk cloud' },
  { key: 'shoe', emoji: '👟', label: 'Shoes on' },
  { key: 'knot', emoji: '🪢', label: 'Tied in' },
  { key: 'boulder', emoji: '🪨', label: 'Boulder' },
  { key: 'rope', emoji: '🧵', label: 'On belay' },
  { key: 'send', emoji: '🔥', label: 'Send!' },
  { key: 'crimp', emoji: '🤏', label: 'Crimpy' },
  { key: 'flex', emoji: '💪', label: 'Strong' },
];

export const REACTION_BY_KEY: Record<ReactionKey, { emoji: string; label: string }> =
  REACTIONS.reduce(
    (acc, r) => {
      acc[r.key] = { emoji: r.emoji, label: r.label };
      return acc;
    },
    {} as Record<ReactionKey, { emoji: string; label: string }>,
  );
