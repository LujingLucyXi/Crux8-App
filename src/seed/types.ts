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

export type Vibe = 'chill' | 'projecting' | 'training' | 'social';

export type HikeType = 'trail' | 'scramble' | 'snow' | 'backpack';

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
  gym_id?: string;           // indoor
  area?: string;             // outdoor
  route_id?: string;         // outdoor optional
  hike_type?: HikeType;       // only when category === 'hiking'
  host_id: string;
  participant_ids: string[]; // includes host
  capacity: number;
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
  preferred_styles: Style[];
  about?: string;
  // ── profile identity (set during onboarding) ──
  signature?: string;        // short one-liner shown next to the name
  tags?: string[];           // fun climbing/hiking flair chips (label incl. emoji)
  location?: string;         // city / area, e.g. 'Seattle, WA'
  activities?: Activity[];   // preferred top-level activities
  onboarded?: boolean;       // false right after signup; true once onboarding completes.
                             // undefined = pre-existing user (treated as onboarded).
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
