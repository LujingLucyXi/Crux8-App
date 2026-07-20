import type { Group } from './types';

/**
 * 12 seeded public community groups.
 *
 * `me` (the mocked signed-in user, id = 'me') is pre-added as an admin of
 * `grp_seattle_queer_climbers` so the "+ Post to group" surface is testable
 * on first launch without needing an admin-elevation flow.
 *
 * Cover images use picsum.photos with deterministic seeds — always resolves,
 * never 404s, and produces a consistent image per group across reloads.
 * Swap for curated climbing photography before shipping to production.
 */
const cover = (seed: string) => `https://picsum.photos/seed/cruxmate-${seed}/800/400`;

export const SEED_GROUPS: Group[] = [
  {
    id: 'grp_pnw_climbers',
    name: 'PNW Climbers',
    tagline: 'The biggest tent — everyone from V0 sends to Squamish trad.',
    category: 'general',
    member_count: 3214,
    cover_url: cover('pnw'),
    description:
      'The default meeting place for climbers across the Puget Sound. Sessions posted daily across all Seattle gyms + weekend trips to Vantage, Index, and Leavenworth.',
    admin_ids: ['usr_marcus'],
    recent_activity: '2 sessions posted today',
  },
  {
    id: 'grp_seattle_queer_climbers',
    name: 'Seattle Queer Climbers',
    tagline: 'Monthly Queer Climb Night + weekly send sessions.',
    category: 'identity',
    member_count: 482,
    cover_url: cover('sqc'),
    description:
      'A welcoming space for LGBTQIA+ climbers in Seattle. Monthly meetups at rotating gyms plus weekly sessions posted by members.',
    admin_ids: ['me', 'usr_priya'],
    recent_activity: 'Queer Climb Night this Friday',
  },
  {
    id: 'grp_women_plus_who_send',
    name: 'Women+ Who Send',
    tagline: 'Women, trans, and non-binary climbers in the Cascades.',
    category: 'identity',
    member_count: 621,
    cover_url: cover('wws'),
    description:
      'Weekly Women+ Send Sesh + monthly outdoor trips + a community coaching program pairing intermediate climbers with mentors.',
    admin_ids: ['usr_ash', 'usr_lilly'],
    recent_activity: 'Send Sesh this Sunday · 4 going',
  },
  {
    id: 'grp_bipoc_climbers_pnw',
    name: 'BIPOC Climbers PNW',
    tagline: 'Community for BIPOC climbers across the Pacific Northwest.',
    category: 'identity',
    member_count: 293,
    cover_url: cover('bipoc'),
    description:
      'Monthly meetups at gyms across Seattle + outdoor trip carpools + a mentorship program for new climbers.',
    admin_ids: ['usr_kai'],
    recent_activity: 'Monthly meetup this Friday',
  },
  {
    id: 'grp_cascade_alpine_club',
    name: 'Cascade Alpine Club',
    tagline: 'Rock, alpine, and multi-pitch education + trips.',
    category: 'alpine',
    member_count: 1104,
    cover_url: cover('cac'),
    description:
      'AMGA-instructor-led education on trad, multi-pitch, and alpine terrain. Members-only mentorship for the classic Cascades objectives.',
    admin_ids: ['usr_marcus', 'usr_kai'],
    recent_activity: 'Intro to Trad Anchors this Saturday',
  },
  {
    id: 'grp_rainier_mountaineers',
    name: 'Rainier Mountaineers',
    tagline: 'Volcanoes, snow travel, and glacier skills.',
    category: 'alpine',
    member_count: 852,
    cover_url: cover('rainier'),
    description:
      'AIARE-affiliated education plus scheduled climbs of Rainier, Baker, and Adams every season. Field days require prereq classroom sessions.',
    admin_ids: ['usr_kai'],
    recent_activity: 'Snow Assessment clinic Wed',
  },
  {
    id: 'grp_trad_dads_seattle',
    name: 'Trad Dads Seattle',
    tagline: 'Old-school + patient. Trad partners at every grade.',
    category: 'trad',
    member_count: 211,
    cover_url: cover('trad'),
    description:
      'Partner-finding for trad climbers who value patience, cleanliness, and matching gear + rope systems. Weekly Index runs + monthly Leavenworth trips.',
    admin_ids: ['usr_marcus'],
    recent_activity: 'Index trip this Sunday · 1 spot',
  },
  {
    id: 'grp_everett_boulderers',
    name: 'Everett Boulderers',
    tagline: 'North-end boulder crew. Indoors + Gold Bar.',
    category: 'boulder',
    member_count: 343,
    cover_url: cover('everett'),
    description:
      'Weekly indoor sessions at Vertical World + monthly Gold Bar Boulders days. Pad carpools coordinated in the group chat.',
    admin_ids: ['usr_jordan'],
    recent_activity: 'Gold Bar day Sunday',
  },
  {
    id: 'grp_beginners_belay_buddies',
    name: 'Beginners Belay Buddies',
    tagline: 'New to climbing? Start here.',
    category: 'beginner',
    member_count: 782,
    cover_url: cover('beginners'),
    description:
      'A no-judgment community for climbers in their first 12 months. Structured "learn to belay" nights + partner-finding for beginner grades.',
    admin_ids: ['usr_sam'],
    recent_activity: 'Belay class this Thursday',
  },
  {
    id: 'grp_send_train',
    name: 'Send Train',
    tagline: 'Structured projecting + training feedback.',
    category: 'projecting',
    member_count: 194,
    cover_url: cover('send'),
    description:
      'For climbers at 5.11+/V5+ working on specific projects. Weekly sessions organized by target style + grade. Peer training feedback via the group chat.',
    admin_ids: ['usr_kai', 'usr_ash'],
    recent_activity: 'Projecting session tomorrow',
  },
  {
    id: 'grp_backcountry_coalition',
    name: 'Backcountry Ski + Climb Coalition',
    tagline: 'Ski in winter, climb in summer, no downtime.',
    category: 'backcountry',
    member_count: 461,
    cover_url: cover('backcountry'),
    description:
      'Multi-season community for climbers who ski and skiers who climb. Alpine skills carry over both directions — we coordinate objectives year-round.',
    admin_ids: ['usr_kai', 'usr_marcus'],
    recent_activity: 'Late-season Baker attempt planning',
  },
  {
    id: 'grp_movement_community',
    name: 'Movement Community',
    tagline: 'Members of any Movement gym in the region.',
    category: 'gym',
    member_count: 2418,
    cover_url: cover('movement'),
    description:
      'Movement staff + members. Session-swap board, gym event calendar, and coach-led clinics posted here first.',
    admin_ids: ['usr_sam'],
    recent_activity: '3 sessions today at Movement Bellevue',
  },
];

export const GROUP_BY_ID = Object.fromEntries(SEED_GROUPS.map((g) => [g.id, g] as const));
