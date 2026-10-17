// Shared types for CruxMate seed data.
// Keep this file in sync with src/store/types.ts once Lovable scaffolds the app.

export type Category =
  | 'top_rope'
  | 'lead'
  | 'boulder'
  | 'outdoor_sport'
  | 'trad'
  | 'multi_pitch'
  | 'outdoor_boulder'
  | 'hiking'
  | 'event';

import type { AvatarConfig } from '@/lib/avatar';

export type Style = 'top_rope' | 'lead' | 'boulder' | 'outdoor_sport' | 'trad' | 'hiking' | 'events';

/** Top-level activities a user is into (mirrors the Find L1 nav). */
export type Activity = 'climb' | 'hike' | 'events';

/** One normalized Climber DNA axis (0-100), as stored on the profile. */
export interface QuizDnaAxis {
  key: string;
  label: string;
  emoji: string;
  value: number;
}
export type QuizDna = QuizDnaAxis[];

export type Vibe = 'chill' | 'projecting' | 'training' | 'social';

export type HikeType = 'trail' | 'scramble' | 'snow' | 'backpack' | 'expedition';

export type LocationType = 'indoor' | 'outdoor' | 'event';

export type VerificationCategory = 'top_rope' | 'lead' | 'trad';

export type VerificationStatus = 'unverified' | 'pending' | 'self_attested' | 'verified' | 'rejected';

export type EventType =
  | 'community_night'
  | 'identity'
  | 'education'
  | 'mountaineering'
  | 'backcountry'
  | 'comp'
  | 'social';

export type GroupCategory =
  | 'general'
  | 'identity'
  | 'alpine'
  | 'trad'
  | 'boulder'
  | 'beginner'
  | 'projecting'
  | 'backcountry'
  | 'gym';

export interface Gym {
  id: string;
  name: string;
  short_name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  disciplines: Array<'top_rope' | 'lead' | 'boulder' | 'autobelay'>;
  here_now: number;          // seeded live presence count
  neighborhood?: string;     // e.g. 'West Seattle'
  boutique?: boolean;        // small independent / DIY gym
}

export interface CheckIn {
  gym_id: string;
  at: string;                // ISO timestamp of check-in
}

export interface Route {
  id: string;
  name: string;
  area: string;
  grade: string;             // e.g. '5.9', '5.10a', 'V6'
  style: 'sport' | 'trad' | 'multi_pitch' | 'boulder';
  pitches: number;
  mp_url: string;
}

export interface Session {
  id: string;
  category: Category;
  title: string;
  subtitle: string;          // grade range or level text
  starts_at: string;         // ISO
  ends_at: string;           // ISO
  started_at?: string;       // ISO — manual Start tap (Supabase row, synced)
  finished_at?: string;      // ISO — manual Finish tap (Supabase row, synced)
  gym_id?: string;           // indoor
  area?: string;             // outdoor
  route_id?: string;         // outdoor optional
  hike_type?: HikeType;       // only when category === 'hiking'
  host_id: string;
  participant_ids: string[]; // includes host
  capacity: number;          // 2-10, or UNCAPPED_CAPACITY (99) = "10+"
  vibe: Vibe;
  location_type: LocationType;
  is_verified_only: boolean;
  requires_attestation: boolean; // trad-flag
  posted_by_group_id?: string;
  note?: string;
}

export interface EventItem {
  id: string;
  title: string;
  tagline: string;
  type: EventType;
  starts_at: string;
  ends_at: string;
  venue: string;             // gym name or free-text venue
  gym_id?: string;
  cost_cents: number;        // 0 = free
  capacity: number | null;   // null = unlimited
  attendee_ids: string[];
  waitlist_ids: string[];
  host_group_id?: string;
  age_restricted: boolean;
  description: string;
  gear_note?: string;
  /** Promoted on the Home page's "Featured on Crux8" rail. */
  featured?: boolean;
  /** Short promo label shown on the featured card (e.g. "Launch", "New"). */
  promo_label?: string;
  /** Paid multi-gym pass (e.g. "Around the World" gym crawl). */
  ticket?: TicketInfo;
  /** Part of the Crux8 Mystery Crew program (surprise matched crew). */
  mystery?: boolean;
}

/** A paid, multi-gym pass sold through Crux8's mock checkout. */
export interface TicketInfo {
  price_cents: number;         // total charged to the buyer (e.g. 6000)
  gym_ids: string[];           // partner gyms the pass covers
  per_gym_payout_cents: number; // revenue share to each gym per ticket (e.g. 1500)
  platform_cents: number;      // Crux8's cut per ticket (e.g. 1500)
  sales_url: string;           // shareable (mock) sales link
}

/** A pending request to join a request-only group, with survey answers. */
export interface GroupJoinRequest {
  user_id: string;
  answers: string[];          // parallel to Group.survey_questions
  requested_at: string;       // ISO
}

export interface Group {
  id: string;
  name: string;
  tagline: string;
  category: GroupCategory;
  member_count: number;
  cover_url: string;          // background banner
  description: string;
  admin_ids: string[];
  recent_activity: string;
  // ── extended (group management) ──
  avatar_url?: string;                 // square group logo / profile pic
  owner_id?: string;                   // who created the group (super-admin)
  member_ids?: string[];               // known members (NPCs + 'me')
  join_policy?: 'open' | 'request';    // open = instant; request = admin approval
  survey_questions?: string[];         // questions shown on a join request
  pending?: GroupJoinRequest[];        // awaiting admin review
  // ── house hangout (auto-created crew per house × city) ──
  kind?: 'standard' | 'house_hangout'; // default 'standard'
  house_id?: string;                   // set when kind === 'house_hangout'
}

export interface NpcUser {
  id: string;
  display_name: string;
  pronouns?: string;
  avatar: AvatarConfig;
  home_gym_id: string;
  top_grade: string;
  preferred_styles: Style[];
  verifications: Partial<Record<VerificationCategory, VerificationStatus>>;
  signature?: string;        // short one-liner shown next to the name
  tags?: string[];           // fun flair chips (label incl. emoji)
}

// The mocked signed-in user profile (client-side only in v0.5).
export interface Profile {
  id: string;
  display_name: string;
  pronouns?: string;
  dob?: string;
  avatar: AvatarConfig;
  /** Optional uploaded photo (downscaled data URL). Wins over `avatar`. */
  photo_url?: string;
  home_gym_id: string;
  top_grade: string;
  /** Boulder grade (V-scale), separate from the rope grade — boulderers
   *  had no way to state theirs before 2026-10-16. */
  boulder_grade?: string;
  preferred_styles: Style[];
  about?: string;
  // ── profile identity (set during onboarding) ──
  signature?: string;        // short one-liner shown next to the name
  tags?: string[];           // fun climbing/hiking flair chips (label incl. emoji)
  location?: string;         // launch-city slug, e.g. 'greater-seattle'
  activities?: Activity[];   // preferred top-level activities
  onboarded?: boolean;       // false right after signup; true once onboarding completes.
                             // undefined = pre-existing user (treated as onboarded).
  isGuest?: boolean;         // true for anonymous-sign-in guests (front door, 2026-10-14).
                             // Local-only: guests join friction-free and are prompted to
                             // claim/finish their profile after their first session.
  // ── personal invite code (add link / share card, 2026-10-15) ──
  invite_code?: string;      // e.g. CLIMB-8K42; resolves via /add/:code.
                             // Persisted to profiles.invite_code when the column
                             // exists (fire-and-forget), else local-only.
  // ── email ownership proof (Discord-style deferred verification,
  // 2026-10-16): signup never waits for it; the flag flips true once
  // the user proves the inbox is theirs via an in-app code. It's what
  // makes password resets actually reachable.
  email?: string;            // the account email (from the auth user)
  email_verified?: boolean;
  created_at?: string;       // profile row creation time (fresh-signup detection)
  founding_no?: number;      // Founding Member number (first 88 accounts; server view)
  // ── hiking (set during onboarding; section is skippable) ──
  hike_distance?: string;    // e.g. '5-10'
  hike_pace?: string;        // e.g. 'steady'
  // ── quiz DNA (claimed via /claim; no waitlist involved) ──
  quiz_result_type?: string; // archetype id, e.g. 'send-machine'
  quiz_dna?: QuizDna;        // 6-axis DNA bars, normalized
  quiz_house_id?: string;    // e.g. 'send'
  // Weight + height are hidden from other users. Used only to compute
  // the `weight-safe` chip on 1:1 climb calls.
  weight_kg?: number;
  height_cm?: number;
}

/**
 * 1:1 climb call — a user broadcasts availability for a rope partner.
 * Distinct from Session (which is a group activity with capacity).
 * Only used for rope-based climbing (top_rope, lead). Boulder is a
 * session concept, not a call concept.
 */
export interface ClimbCall {
  id: string;
  user_id: string;                    // who's calling ('me' or an NPC)
  title?: string;                     // optional custom name set by host
  /** What the host NEEDS from you (not what they are). */
  looking_for: 'belayer' | 'climber' | 'take_turns';
  category: 'top_rope' | 'lead';
  grade: string;                      // e.g. '5.10a–5.11c'
  location_type: 'indoor' | 'outdoor';
  gym_id?: string;                    // set when indoor
  area?: string;                      // exact location text (crag) when outdoor
  starts_at: string;                  // ISO
  ends_at: string;                    // ISO
  note?: string;                      // "Projecting 5.11a — soft catches please"
  is_friend_only: boolean;
  status: 'live' | 'expired' | 'matched';
  weight_kg?: number;                 // caller's weight, used for weight-safe matching
  capacity: number;                   // 2-6 — set by host, includes host
  participant_ids: string[];          // includes host; grows as others pair up
}

/**
 * Climbing-culture reaction emojis. Pop these up on any chat message.
 * Design pass — order matters, most-used first.
 */
export type ReactionKey =
  | 'chalk'         // 🧂 chalk cloud — send/beta help
  | 'shoe'          // 👟 climb shoes — heading to the gym
  | 'knot'          // 🪢 knot — tied in / ready to belay
  | 'boulder'       // 🪨 rock — sending / trying hard
  | 'rope'          // 🧵 rope — belay logistics
  | 'send'          // 🔥 send — psyched / just sent
  | 'crimp'         // 🤏 pinch — tiny holds
  | 'flex';         // 💪 flex — got it done

export interface Reaction {
  key: ReactionKey;
  by: string;                     // userId that reacted
}

export interface ChatMessage {
  id: string;
  from: string;
  text: string;
  sent_at: string;
  reactions?: Reaction[];
}

/**
 * A collected DNA card — someone's climber identity captured at the moment you connected.
 * Earned by adding a cruxmate or by starting a session together.
 */
export interface CollectedCard {
  user_id: string;           // whose card it is
  archetype_id: string;      // their archetype when collected
  house_id: string;          // their house when collected
  collected_at: string;      // ISO of first collection
  sessions_together: number; // increments each session you climb together (1 = the collection moment)
  source: 'cruxmate' | 'session';
}

/**
 * Post-session recap. Replaces the old 1–5 peer star rating, which suffered
 * from grade inflation (everyone rates 5) and social friction (rating a
 * friend low is awkward). Instead:
 *   - `props` are positive-only climbing-emoji kudos shown publicly.
 *   - `partner_checks` are PRIVATE, exception-based safety signals. Default
 *     is "all_good" (one tap). A "flag" is never shown to the flagged user;
 *     only patterns across many sessions route to trust review.
 */
export type PartnerCheck = 'all_good' | 'flagged';

export interface PartnerFlag {
  reason: 'unsafe_belay' | 'no_show' | 'uncomfortable' | 'other';
  note?: string;
}

/** Peer confirmation of a partner's belay credential, captured in the recap. */
export type BelayConfirm = 'has_cert' | 'no_cert' | 'unsure';

export interface SessionRecap {
  session_id: string;
  logged_at: string;                          // ISO
  props: Record<string, ReactionKey[]>;       // partnerUserId -> emoji props I gave
  partner_checks: Record<string, PartnerCheck>; // partnerUserId -> all_good | flagged
  partner_flags: Record<string, PartnerFlag>;   // partnerUserId -> private detail (flagged only)
  belay_confirms: Record<string, BelayConfirm>; // partnerUserId -> peer belay-cert confirmation
  // "Your session" summary (Strava-style, ALL optional — feeds the share card)
  felt?: number;              // 1–5 stoke scale: how it felt
  vibe_pick?: Vibe;           // the vibe YOU felt (vs the host's planned vibe)
  duration_bucket?: 'lt1h' | '1to2h' | '2to3h' | 'gt3h';
  /** One-line note for the share card (per user, per session — printed in the owner's hand). */
  note?: string;
  sends_count?: number;       // 0–5, where 5 means 5+ (quick count; sends_log wins when present)
  sends_log?: Record<string, number>; // grade -> sends, e.g. { V5: 3, V4: 2, V6: 1 }
  gym_rating?: number;        // 1–5 stars for the gym (indoor sessions)
}

// Helper: date offset from "now" so the seed always feels fresh.
export const daysFromNow = (n: number, hour: number, minute = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

// Duration helper: takes a start ISO and returns end ISO N hours later.
export const plusHours = (startIso: string, hours: number): string => {
  const d = new Date(startIso);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
};

/** Sentinel capacity meaning "10+" (uncapped). Stored as 99; displayed as "10+". */
export const UNCAPPED_CAPACITY = 99;
/** Display string for a session capacity: "6" or "10+". */
export const formatCapacity = (capacity: number): string =>
  capacity >= UNCAPPED_CAPACITY ? '10+' : String(capacity);

/** A personal invite to a climb call or session. Server-backed
 *  (public.invites) so it reaches the invitee's own device; the invitee
 *  can accept or deny at any time until the target ends, or ignore it. */
export interface Invite {
  id: string;
  kind: 'call' | 'session';
  target_id: string;
  from_id: string;
  to_id: string;
  status: 'pending' | 'accepted' | 'denied';
  created_at: string;
}

/**
 * A cruxmate request: person-to-person, needs the other side's accept.
 * Server-backed in public.cruxmate_requests; the recipient answers from
 * the same Invites inbox as call/session invites. Card collection happens
 * on accept, not on send.
 */
export interface MateRequest {
  id: string;
  from_id: string;
  to_id: string;
  status: 'pending' | 'accepted' | 'denied';
  created_at: string;
}

/**
 * A message request (Lucy, 2026-10-16): you may start a DM with someone
 * you follow, but it lands as a request — the chatbox only opens for
 * both sides once the recipient accepts. Cruxmates skip the request.
 * Server-backed in public.message_requests.
 */
export interface MessageRequest {
  id: string;
  from_id: string;
  to_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}
