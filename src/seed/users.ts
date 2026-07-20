import type { NpcUser } from './types';

/**
 * 8 seeded NPC climbers. IDs are stable so sessions/events/groups can
 * reference them. Avatar URLs use pravatar.cc (no signup, always available).
 *
 * The mocked signed-in user is `me` (see also seeded profile row in the
 * store). Pre-populate `store.cruxmates` with usr_lilly / usr_marcus /
 * usr_priya so Chat + Profile tabs demo populated.
 */

const avatar = (seed: number, size = 128) => `https://i.pravatar.cc/${size}?img=${seed}`;

export const SEED_USERS: NpcUser[] = [
  {
    id: 'usr_lilly',
    display_name: 'Lilly Chen',
    pronouns: 'she/her',
    avatar_url: avatar(1),
    home_gym_id: 'gym_vertical_world',
    top_grade: '5.11a',
    preferred_styles: ['top_rope', 'lead', 'outdoor_sport'],
    verifications: { top_rope: 'verified', lead: 'verified' },
  },
  {
    id: 'usr_marcus',
    display_name: 'Marcus Rivera',
    pronouns: 'he/him',
    avatar_url: avatar(2),
    home_gym_id: 'gym_stone_gardens_ballard',
    top_grade: '5.11c',
    preferred_styles: ['lead', 'trad', 'outdoor_sport'],
    verifications: { top_rope: 'verified', lead: 'verified', trad: 'verified' },
  },
  {
    id: 'usr_priya',
    display_name: 'Priya Patel',
    pronouns: 'she/they',
    avatar_url: avatar(3),
    home_gym_id: 'gym_sbp_poplar',
    top_grade: 'V6',
    preferred_styles: ['boulder', 'top_rope'],
    verifications: { top_rope: 'verified' },
  },
  {
    id: 'usr_sam',
    display_name: 'Sam Wong',
    pronouns: 'they/them',
    avatar_url: avatar(4),
    home_gym_id: 'gym_movement_bellevue',
    top_grade: '5.10c',
    preferred_styles: ['top_rope', 'lead'],
    verifications: { top_rope: 'verified', lead: 'verified' },
  },
  {
    id: 'usr_jordan',
    display_name: 'Jordan Reyes',
    pronouns: 'he/they',
    avatar_url: avatar(5),
    home_gym_id: 'gym_blochaus',
    top_grade: 'V4',
    preferred_styles: ['boulder'],
    verifications: {},
  },
  {
    id: 'usr_ash',
    display_name: 'Ash Nguyen',
    pronouns: 'she/her',
    avatar_url: avatar(6),
    home_gym_id: 'gym_stone_gardens_bellevue',
    top_grade: '5.10d',
    preferred_styles: ['top_rope', 'lead', 'outdoor_sport'],
    verifications: { top_rope: 'verified', lead: 'verified' },
  },
  {
    id: 'usr_kai',
    display_name: 'Kai Okafor',
    pronouns: 'he/him',
    avatar_url: avatar(7),
    home_gym_id: 'gym_vertical_world',
    top_grade: '5.12a',
    preferred_styles: ['lead', 'trad', 'outdoor_sport'],
    verifications: { top_rope: 'verified', lead: 'verified', trad: 'verified' },
  },
  {
    id: 'usr_riley',
    display_name: 'Riley Mendez',
    pronouns: 'she/her',
    avatar_url: avatar(8),
    home_gym_id: 'gym_sbp_fremont',
    top_grade: 'V5',
    preferred_styles: ['boulder', 'top_rope'],
    verifications: { top_rope: 'verified' },
  },
];

export const USER_BY_ID = Object.fromEntries(SEED_USERS.map((u) => [u.id, u] as const));

// Pre-seeded CruxMate (friend) list for the mocked signed-in user.
export const SEED_CRUXMATES = ['usr_lilly', 'usr_marcus', 'usr_priya'];
