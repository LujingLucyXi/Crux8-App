import type { Profile } from '@/seed/types';

/**
 * Profile completeness (Lucy 2026-10-16): orientation was cut down to
 * the essentials because its length alone was driving drop-off, so the
 * remaining profile details are collected gradually instead. This
 * meter powers the reminder: what's filled, what's missing, and the
 * percentage shown on the Profile page. Every missing item is
 * completable in Edit Profile (or the quiz) — nothing here may point
 * at a dead end.
 */
export interface CompletenessItem {
  key: string;
  label: string;
  done: boolean;
}

export function profileCompleteness(
  me: Profile,
  opts: { belayAttested: boolean },
): { pct: number; items: CompletenessItem[]; missing: CompletenessItem[] } {
  const items: CompletenessItem[] = [
    { key: 'photo', label: 'Add a profile photo', done: !!me.photo_url },
    { key: 'activities', label: 'Pick your activities', done: !!me.activities?.length },
    { key: 'grades', label: 'Add your climbing grades', done: !!me.boulder_grade },
    { key: 'belay', label: 'Add your belay skills', done: opts.belayAttested },
    { key: 'bio', label: 'Write a short bio', done: !!(me.about?.trim() || me.signature?.trim()) },
    { key: 'quiz', label: 'Reveal your Climber DNA', done: !!me.quiz_result_type },
    { key: 'dob', label: 'Add your date of birth', done: !!me.dob },
  ];
  const doneCount = items.filter((i) => i.done).length;
  return {
    pct: Math.round((doneCount / items.length) * 100),
    items,
    missing: items.filter((i) => !i.done),
  };
}
