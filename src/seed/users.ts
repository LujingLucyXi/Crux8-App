import type { NpcUser } from './types';
import type { AvatarConfig } from '@/lib/avatar';

/**
 * 8 seeded NPC climbers. IDs are stable so sessions/events/groups can
 * reference them. Each has a hand-picked punk-rock avatar config.
 *
 * The mocked signed-in user is `me` (see also seeded profile row in the
 * store). Pre-populate `store.cruxmates` with usr_lilly / usr_marcus /
 * usr_priya so Chat + Profile tabs demo populated.
 */



export const SEED_USERS: NpcUser[] = [
  {
    id: 'usr_lilly',
    display_name: 'Lilly Chen',
    pronouns: 'she/her',
    avatar: { skin: 'honey',     hair: 'undercut', hairColor: 'bubblegum',   eyes: 'stoked',  accessory: 'nosering',  backdrop: 'coral' } as AvatarConfig,
    home_gym_id: 'gym_vertical_world',
    top_grade: '5.11a',
    preferred_styles: ['top_rope', 'lead', 'outdoor_sport'],
    verifications: { top_rope: 'verified', lead: 'verified' },
  },
  {
    id: 'usr_marcus',
    display_name: 'Marcus Rivera',
    pronouns: 'he/him',
    avatar: { skin: 'umber',     hair: 'locs',     hairColor: 'jet',         eyes: 'deadpan', accessory: 'gauges',    backdrop: 'ink' } as AvatarConfig,
    home_gym_id: 'gym_stone_gardens_ballard',
    top_grade: '5.11c',
    preferred_styles: ['lead', 'trad', 'outdoor_sport'],
    verifications: { top_rope: 'verified', lead: 'verified', trad: 'verified' },
  },
  {
    id: 'usr_priya',
    display_name: 'Priya Patel',
    pronouns: 'she/they',
    avatar: { skin: 'clay',      hair: 'mohawk',   hairColor: 'ultraviolet', eyes: 'sharp',   accessory: 'bandana',   backdrop: 'teal' } as AvatarConfig,
    home_gym_id: 'gym_sbp_poplar',
    top_grade: 'V6',
    preferred_styles: ['boulder', 'top_rope'],
    verifications: { top_rope: 'verified' },
  },
  {
    id: 'usr_sam',
    display_name: 'Sam Wong',
    pronouns: 'they/them',
    avatar: { skin: 'sand',      hair: 'buzz',     hairColor: 'bleach',      eyes: 'wink',    accessory: 'chalkdust', backdrop: 'gold' } as AvatarConfig,
    home_gym_id: 'gym_movement_bellevue',
    top_grade: '5.10c',
    preferred_styles: ['top_rope', 'lead'],
    verifications: { top_rope: 'verified', lead: 'verified' },
  },
  {
    id: 'usr_jordan',
    display_name: 'Jordan Reyes',
    pronouns: 'he/they',
    avatar: { skin: 'espresso',  hair: 'liberty',  hairColor: 'toxic',       eyes: 'stoked',  accessory: 'none',      backdrop: 'slate' } as AvatarConfig,
    home_gym_id: 'gym_blochaus',
    top_grade: 'V4',
    preferred_styles: ['boulder'],
    verifications: {},
  },
  {
    id: 'usr_ash',
    display_name: 'Ash Nguyen',
    pronouns: 'she/her',
    avatar: { skin: 'porcelain', hair: 'bangs',    hairColor: 'cherry',      eyes: 'shades',  accessory: 'nosering',  backdrop: 'sky' } as AvatarConfig,
    home_gym_id: 'gym_stone_gardens_bellevue',
    top_grade: '5.10d',
    preferred_styles: ['top_rope', 'lead', 'outdoor_sport'],
    verifications: { top_rope: 'verified', lead: 'verified' },
  },
  {
    id: 'usr_kai',
    display_name: 'Kai Okafor',
    pronouns: 'he/him',
    avatar: { skin: 'clay',      hair: 'topknot',  hairColor: 'jet',         eyes: 'sharp',   accessory: 'beanie',    backdrop: 'ink' } as AvatarConfig,
    home_gym_id: 'gym_vertical_world',
    top_grade: '5.12a',
    preferred_styles: ['lead', 'trad', 'outdoor_sport'],
    verifications: { top_rope: 'verified', lead: 'verified', trad: 'verified' },
  },
  {
    id: 'usr_riley',
    display_name: 'Riley Mendez',
    pronouns: 'she/her',
    avatar: { skin: 'sand',      hair: 'shaved',   hairColor: 'cyan',        eyes: 'tired',   accessory: 'gauges',    backdrop: 'teal' } as AvatarConfig,
    home_gym_id: 'gym_sbp_fremont',
    top_grade: 'V5',
    preferred_styles: ['boulder', 'top_rope'],
    verifications: { top_rope: 'verified' },
  },
];

export const USER_BY_ID = Object.fromEntries(SEED_USERS.map((u) => [u.id, u] as const));

// Pre-seeded CruxMate (friend) list for the mocked signed-in user.
export const SEED_CRUXMATES = ['usr_lilly', 'usr_marcus', 'usr_priya'];
