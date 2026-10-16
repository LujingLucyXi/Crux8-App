import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Profile,
  Session,
  EventItem,
  Group,
  GroupCategory,
  NpcUser,
  Gym,
  Route,
  ChatMessage,
  SessionRecap,
  PartnerCheck,
  PartnerFlag,
  BelayConfirm,
  ClimbCall,
  CheckIn,
  ReactionKey,
  VerificationCategory,
  VerificationStatus,
  Style,
  CollectedCard,
  Invite,
  MateRequest,
  MessageRequest,
} from '@/seed/types';
import {
  SEED_GYMS,
  SEED_ROUTES,
  SEED_EVENTS,
  SEED_GROUPS,
  SEED_USERS,
  SEED_CRUXMATES,
} from '@/seed';
import { uid } from '@/lib/utils';
import { avatarFromSeed } from '@/lib/avatar';
import { getHouse } from '@/lib/quizMeta';
import { QUIZ_ARCHETYPES, getHouseForArchetype } from '@/lib/quizMeta';
import {
  supabase,
  fetchMyProfile,
  profileRowToProfile,
  profilePatchToRow,
  otpErrorMessage, passwordErrorMessage,
} from '@/lib/supabase';
import {
  XP,
  levelFromXp,
  totalSendXp,
  type SendLog,
  BRAND_COLORS,
  SEND_COLORS,
  LEVELUP_COLORS,
  CHECKIN_COLORS,
} from '@/lib/rewards';
import { celebrate } from '@/store/useCelebration';
import {
  fetchSessions as dbFetchSessions,
  createSession as dbCreateSession,
  updateSession as dbUpdateSession,
  setSessionLifecycle as dbSetSessionLifecycle,
  setMyVerifications as dbSetMyVerifications,
  submitBelayConfirmRemote,
  submitGymSuggestion,
  fetchPublicVerifications,
  fetchBelayConfirmCounts,
  setSessionRsvp,
  fetchClimbCalls as dbFetchClimbCalls,
  createClimbCall as dbCreateClimbCall,
  updateClimbCallRemote,
  createInviteRemote,
  fetchMyInvites,
  setInviteStatusRemote,
  createMateRequestRemote,
  fetchMyMateRequests,
  deleteMateRequestRemote,
  createMessageRequestRemote,
  fetchMyMessageRequests,
  setMessageRequestStatusRemote,
  isUuid,
  type ClimbCallPatch,
  setCallPairing,
  fetchDirectoryProfiles,
  type DirectoryProfile,
} from '@/lib/db';
import { resolveUser } from '@/lib/resolveUser';
import { normalizeInviteCode, isValidInviteCode, randomInviteCode } from '@/lib/inviteCode';
import { hasStarted, sessionPhase, type SessionLifecycle } from '@/lib/sessionPhase';

export type Verification = { status: VerificationStatus; photo_url?: string; verified_at?: string; attested_at?: string };

/**
 * Flat Find filter model. IA:
 *   Level 1  — Climb · Hike · Event · Crew
 *   Level 2  — Climb only: Indoor · Outdoor
 *   Styles   — always-visible multi-select (climb styles / hike types / event types)
 *   Refine   — date · time · location · grade · weight-safe (secondary chips)
 */
export interface Filters {
  l1: 'climb' | 'hike' | 'event' | 'crew';
  env: 'indoor' | 'outdoor';                 // climb Level 2
  climb_styles: string[];                    // category values (top_rope, lead, boulder, …)
  hike_types: string[];                      // 'trail' | 'scramble' | 'snow' | 'backpack'
  event_types: string[];
  looking_for?: 'belayer' | 'climber' | 'take_turns'; // rope only
  weight_safe_only: boolean;
  gym_id?: string;
  area?: string;
  date?: 'today' | 'tomorrow';
  date_specific?: string;
  time?: 'morning' | 'afternoon' | 'evening';
  grade_band?: string;
  free_only: boolean;                        // events
}

export interface SessionChat {
  id: string;                                     // === source session/event/call id
  source: 'session' | 'event' | 'call' | 'group';
  title: string;                                  // for chat list rendering
  subtitle?: string;                              // gym or venue
  participant_ids: string[];
  messages: ChatMessage[];
}

export type BadgeId =
  | 'first_session'
  | 'first_recap'
  | 'verified_belayer'
  | 'adventurer'
  | 'community'
  | 'cruxmate_x5'
  | 'trust_champion';

interface Store {
  // core data
  me: Profile | null;
  gyms: Gym[];
  routes: Route[];
  sessions: Session[];
  events: EventItem[];
  groups: Group[];
  users: NpcUser[];
  climbCalls: ClimbCall[];
  /** Real profiles seen on sessions/calls (Supabase), keyed by user id. */
  directory: Record<string, DirectoryProfile>;

  // relations
  myGroupMemberships: string[];
  ticketPurchases: string[];            // eventIds of ticketed passes I've bought
  ticketRedemptions: Record<string, Record<string, string>>; // eventId -> gymId -> redeemed_at ISO
  mysteryMemberUntil: string | null;    // ISO expiry of the $15/mo Mystery Crew pass (null = not a member)
  cruxmates: string[];
  collectedCards: CollectedCard[];              // DNA cards collected from people I've connected with
  sessionCardsCollected: string[];              // session ids whose co-participants I've already collected cards from (finish sweep runs once per session)
  lastCollectedCard: CollectedCard | null;      // most recent collection (drives the reveal UI)
  chats: Record<string, ChatMessage[]>;                 // 1:1 DMs, keyed by userId
  sessionChats: Record<string, SessionChat>;            // group chats, keyed by session/event/call id
  chatReads: Record<string, string>;                    // thread key -> ISO of last time I read it
  verifications: Record<VerificationCategory, Verification>;
  /** Real users' public verification statuses (from profiles via RPC). */
  directoryVerifications: Record<string, Partial<Record<VerificationCategory, VerificationStatus>>>;
  /** Distinct partners who confirmed my belay skills, per category. */
  myConfirmCounts: Partial<Record<VerificationCategory, number>>;
  gearChecklists: Record<string, Record<string, boolean>>;
  badges: BadgeId[];
  recaps: Record<string, SessionRecap>;       // sessionId -> recap
  /** Manual start/finish stamps per session (see lib/sessionPhase rules). */
  sessionLifecycle: Record<string, { started_at?: string; finished_at?: string }>;
  /** Session ids Cruxy (the demo cruxmate) has auto-accepted. Local overlay:
   *  she has no Supabase account, so her membership is merged back in after
   *  every sessions fetch. */
  cruxySessions: string[];
  inviteCruxy: (sessionId: string) => void;
  /** Climb calls Cruxy has auto-accepted (same local overlay as sessions). */
  cruxyCalls: string[];
  inviteCruxyToCall: (callId: string) => void;
  /** Gyms I've suggested that aren't listed yet (kept locally as well). */
  gymSuggestions: { name: string; city?: string; note?: string; at: string }[];
  suggestGym: (name: string, city: string, note: string) => Promise<void>;
  addLocalGym: (name: string, city: string, disciplines: Gym['disciplines']) => Gym;
  /** Sessions I've left. The server forgets my RSVP, so this local record
   *  is what keeps them in my Past history. */
  leftSessions: string[];
  /** Server-backed personal invites addressed to me (call/session). */
  invites: Invite[];
  fetchInvites: () => Promise<void>;
  acceptInvite: (invite: Invite) => void;
  denyInvite: (invite: Invite) => void;
  /** Follow graph (public.cruxmate_requests rows are FOLLOWS — the
   *  Instagram model, Lucy 2026-10-15): a row from_id→to_id means "from
   *  follows to". Friendship is derived: both directions exist ⟺
   *  cruxmates. Following back IS the approval; there is no accept/deny.
   *  Cards are collected when the mutual state forms, never on a
   *  one-sided follow. */
  mateRequests: MateRequest[];
  fetchMateRequests: () => Promise<void>;
  /** Message requests (2026-10-16): a DM to someone you follow (not yet
   *  a cruxmate) starts as a request; the chat opens when they accept. */
  messageRequests: MessageRequest[];
  fetchMessageRequests: () => Promise<void>;
  sendMessageRequest: (toId: string) => void;
  respondToMessageRequest: (id: string, accept: boolean) => void;
  dmAccessFor: (userId: string) => DmAccess;
  /** Follow someone: real users get a follow row (which completes the
   *  mutual state instantly if they already follow me); seed NPCs
   *  (incl. Cruxy) have no follow graph and resolve instantly.
   *  Returns what happened so callers can pick the right copy. */
  requestCruxmate: (userId: string) => 'sent' | 'requested' | 'accepted' | 'already' | 'instant';
  /** Unfollow: removes my follow row (and the cruxmate state, if any). */
  cancelMateRequest: (userId: string) => void;
  /** Follow back from the inbox, by incoming row id. */
  acceptMateRequest: (id: string) => void;
  /** Followers I've hidden from the inbox ("Not now") — local only. */
  dismissedFollowers: string[];
  dismissFollower: (userId: string) => void;
  /** One-sided follow between me and userId, if any ('outgoing' = I
   *  follow them, 'incoming' = they follow me; mutual reads as null —
   *  the cruxmate state speaks for it). */
  mateRequestFor: (userId: string) => 'outgoing' | 'incoming' | null;
  pairRequests: string[];               // callIds we've requested to pair on
  checkin: CheckIn | null;              // my current gym check-in
  gymPresence: Record<string, number>; // gymId -> people here now

  // rewards / progression
  xp: number;
  sends: SendLog[];
  lastCheckinDay: string | null;        // yyyy-mm-dd of last XP-earning check-in

  // UI state
  filters: Filters;
  seededAt: number | null;
  /** True while sessions load from Supabase. */
  sessionsLoading: boolean;
  /** Global open state for the post-session/call sheet (FAB + empty-state CTAs). */
  newSessionOpen: boolean;
  setNewSessionOpen: (open: boolean) => void;

  // ---------- actions ----------
  seedIfEmpty: () => void;
  /** Make sure every signed-in user has Cruxy's welcome thread. Idempotent. */
  ensureCruxyThread: () => void;
  /** Keep the gym list in lockstep with the shipped seed (gyms are
   *  reference data — new/renamed gyms must reach existing installs). */
  syncSeedGyms: () => void;
  /** Load sessions / climb calls from Supabase (real backend). */
  fetchSessions: () => Promise<void>;
  fetchClimbCalls: () => Promise<void>;
  /** Fetch unknown user ids into `directory` for display resolution. */
  ensureDirectoryProfiles: (ids: string[]) => Promise<void>;
  // Real auth (Supabase email OTP). Replaces the old mock `signUp`.
  sendOtp: (email: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  verifyOtp: (email: string, code: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  /** Wipe the previous account's on-device data when a DIFFERENT user signs in. */
  prepareForUser: (userId: string) => void;
  // Email + password auth (alternative to OTP; same account system).
  signUpWithPassword: (
    email: string,
    password: string,
  ) => Promise<
    | { ok: true; needsConfirmation: boolean }
    | { ok: false; error: string; code?: 'already_registered' | 'already_registered_unconfirmed' }
  >;
  signInWithPassword: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  resetPassword: (email: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  /**
   * Guest join (front door, 2026-10-14): Supabase anonymous sign-in with a
   * name only. The guest gets a real UID, joins the scanned session, and
   * is prompted to claim/finish their profile after the session ends —
   * orientation is a post-value conversion step, never an entry gate.
   * Requires the project's "Allow anonymous sign-ins" toggle; when it is
   * off this returns code 'anonymous_disabled' and callers fall back to
   * the email-code sign-in path.
   */
  signInAsGuest: (
    displayName: string,
  ) => Promise<{ ok: true } | { ok: false; error: string; code?: 'anonymous_disabled' }>;
  /**
   * Convert an anonymous guest account to a permanent one by email.
   * Same UID, so the session joins and history carry over. E2E depends
   * on the anonymous-sign-ins toggle being on (unverifiable until then).
   */
  claimGuestAccount: (email: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  /** Reconcile persisted state with the Supabase session on app boot. */
  initAuth: () => Promise<void>;
  completeOnboarding: (patch: Partial<Profile>) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  /**
   * Personal invite code (2026-10-15): returns my code, generating +
   * persisting it on first need. Persists through the normal profile
   * write-through; when the DB column doesn't exist yet the write
   * fails gracefully and the code stays local-only.
   */
  ensureInviteCode: () => string | null;
  signOut: () => Promise<void>;
  resetAll: () => void;

  rsvp: (sessionId: string, opts?: { viaShare?: boolean }) => Promise<void>;
  unrsvp: (sessionId: string) => Promise<void>;
  rsvpEvent: (eventId: string, waitlist?: boolean) => void;
  unrsvpEvent: (eventId: string) => void;
  buyTicket: (eventId: string) => void;
  stampPass: (eventId: string, gymId: string) => void;
  subscribeMysteryPass: () => void;

  postSession: (session: Omit<Session, 'id' | 'host_id' | 'participant_ids'>) => Promise<Session>;
  /**
   * Start a live session from a climb call. Creates the Session, collects cards
   * mutually for everyone present, and marks the call matched.
   * Returns the new session id.
   */
  startCallSession: (callId: string, presentUserIds: string[]) => Promise<string | null>;
  updateSession: (id: string, patch: Partial<Session>) => Promise<void>;
  postEvent: (event: Omit<EventItem, 'id' | 'attendee_ids' | 'waitlist_ids'>) => EventItem;
  postClimbCall: (call: Omit<ClimbCall, 'id' | 'user_id' | 'status' | 'participant_ids'>) => Promise<ClimbCall>;
  updateClimbCall: (id: string, patch: ClimbCallPatch) => Promise<void>;
  /** Host ends their own live call: it retires everywhere (status 'expired'). */
  cancelClimbCall: (id: string) => Promise<void>;
  requestPair: (callId: string) => Promise<void>;
  cancelPairRequest: (callId: string) => Promise<void>;

  checkIn: (gymId: string) => void;
  checkOut: () => void;

  addXp: (amount: number) => void;
  logSend: (input: { grade: string; discipline: SendLog['discipline']; style: SendLog['style']; note?: string }) => void;

  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
  createGroup: (input: {
    name: string;
    tagline: string;
    category: GroupCategory;
    description: string;
    join_policy: 'open' | 'request';
    survey_questions?: string[];
  }) => string | null;
  requestToJoinGroup: (groupId: string, answers: string[]) => void;
  approveJoinRequest: (groupId: string, userId: string) => void;
  declineJoinRequest: (groupId: string, userId: string) => void;
  addGroupAdmin: (groupId: string, userId: string) => void;
  removeGroupAdmin: (groupId: string, userId: string) => void;
  removeGroupMember: (groupId: string, userId: string) => void;
  updateGroup: (groupId: string, patch: Partial<Group>) => void;
  openGroupChat: (groupId: string) => void;
  /** Find or create the house hangout crew for (house × user's city); joins it. Returns group id. */
  ensureHouseHangout: (houseId: string) => string | null;

  addCruxMate: (userId: string) => void;
  /**
   * Collect someone's DNA card. Returns the card (new or updated), or null if
   * they have no DNA to collect. Repeat collections bump sessions_together.
   * `silent` collects into the collection without opening the reveal sheet
   * (used when the requester observes an accept on sync — the accepter gets
   * the reveal moment, the requester gets the card quietly).
   */
  collectCard: (userId: string, source: 'cruxmate' | 'session', opts?: { silent?: boolean }) => CollectedCard | null;
  /** Collect cards from everyone I climbed a FINISHED session with.
   *  Idempotent per session (sessionCardsCollected), silent by design —
   *  the finish flow has exactly one card surface (the summary card). */
  collectSessionCards: (sessionId: string) => void;
  clearLastCollectedCard: () => void;
  removeCruxMate: (userId: string) => void;

  sendMessage: (userId: string, text: string) => void;
  sendSessionMessage: (sessionChatId: string, text: string) => void;
  /** Post a climb call card into a crew's group chat. */
  shareClimbCallToGroup: (callId: string, groupId: string) => void;
  inviteCruxmatesToCall: (callId: string, userIds: string[]) => void;
  shareSessionToGroup: (sessionId: string, groupId: string) => void;
  inviteCruxmatesToSession: (sessionId: string, userIds: string[]) => void;
  markThreadRead: (key: string) => void;
  toggleReactionDm: (userId: string, msgId: string, key: ReactionKey) => void;
  toggleReactionSession: (sessionChatId: string, msgId: string, key: ReactionKey) => void;
  ensureSessionChat: (
    id: string,
    source: 'session' | 'event' | 'call' | 'group',
    title: string,
    subtitle: string | undefined,
    participantIds: string[],
  ) => void;

  submitVerification: (category: VerificationCategory) => void;
  /** Withdraw a self-report (Edit profile). Peer-confirmed stays. */
  removeVerification: (category: VerificationCategory) => void;

  updateGearChecklist: (sessionId: string, item: string, checked: boolean) => void;

  logSessionRecap: (sessionId: string) => void;
  /** Stamp a session started (manual tap only; never automatic). */
  startSession: (sessionId: string) => void;
  /** Stamp a session finished (manual tap only; never automatic). */
  finishSession: (sessionId: string) => void;
  togglePartnerProp: (sessionId: string, partnerId: string, key: ReactionKey) => void;
  setPartnerCheck: (sessionId: string, partnerId: string, check: PartnerCheck, flag?: PartnerFlag) => void;
  setBelayConfirm: (sessionId: string, partnerId: string, value: BelayConfirm) => void;
  /** "Your session" summary fields — every one optional (Strava-style recap). */
  setRecapSummary: (
    sessionId: string,
    patch: Partial<
      Pick<SessionRecap, 'felt' | 'vibe_pick' | 'duration_bucket' | 'sends_count' | 'sends_log' | 'gym_rating' | 'note'>
    >,
  ) => void;

  setFilter: (patch: Partial<Filters>) => void;
  setL1: (l1: Filters['l1']) => void;
  clearFilters: () => void;

  checkBadges: () => void;
}

// Thread-key helpers: namespace DM and session-chat reads in one map.
export const dmKey = (userId: string) => `dm:${userId}`;

/** How a DM with this person may be used right now (Lucy, 2026-10-16):
 *  cruxmates chat freely; someone you follow starts as a request and
 *  the chatbox opens only when they accept. */
export type DmAccess =
  | 'open'
  | 'request'
  | 'pending_out'
  | 'pending_in'
  | 'declined'
  | 'follow_first';
export const scKey = (sessionChatId: string) => `sc:${sessionChatId}`;

/**
 * Cruxy — the friendly onboarding bot. Rule-based replies (no backend needed)
 * so new users get a living chat thread instead of mocked-up conversations.
 */
function cruxyReply(input: string): string {
  const t = ` ${input.toLowerCase()} `;
  // Word-boundary matching: 'hi' should not fire on 'this' or 'which'.
  const has = (...words: string[]) =>
    words.some((w) => t.includes(` ${w} `) || t.includes(` ${w}?`) || t.includes(` ${w}!`) || t.includes(` ${w}.`) || t.includes(` ${w},`));
  const hasPhrase = (...phrases: string[]) => phrases.some((p) => t.includes(p));

  if (has('hi', 'hello', 'hey', 'yo', 'sup', 'hiya', 'howdy')) {
    return 'Hey hey! 🧗 Great to see you here. Want help posting your first session, or finding partners to climb with?';
  }
  if (has('post', 'create', 'host') || hasPhrase('new session')) {
    return 'Posting a session is easy: tap the + button, pick indoor or outdoor, set the time and vibe, and hit post. Partners in your area will see it on the Find tab!';
  }
  if (has('find', 'partner', 'partners', 'belay', 'buddy', 'buddies', 'mate', 'mates')) {
    return 'Head to the Find tab — you\'ll see open sessions and climb calls near you. Tap one to RSVP or message the host. That\'s how partners happen here. 🤝';
  }
  if (has('call', 'calls') || hasPhrase('climb call')) {
    return 'A climb call is a shout for a rope partner: post when and where you want to climb, and others request to pair. When you\'re actually meeting up, hit "Start session" to log it and collect each other\'s cards! 🃏';
  }
  if (has('card', 'cards', 'collect', 'collection')) {
    return 'Your card collection lives on your profile! You collect someone\'s DNA card when you add them as a cruxmate or climb a session together. Rarer archetypes = rarer cards. 🃏';
  }
  if (has('quiz', 'dna', 'archetype', 'house')) {
    return 'Your Climber DNA comes from the quiz at play.crux8.app — it sorts you into an archetype and a house. Claim it from the link, and you\'ll auto-join your house hangout crew! 🧬';
  }
  if (has('crew', 'crews', 'group', 'groups', 'hangout')) {
    return 'Crews are where the community lives. Your house hangout is auto-created from your quiz — same house, same city. You can also browse and join crews on the Community tab. 💬';
  }
  if (has('share', 'invite', 'link')) {
    return 'You can share any climb call or session: open it, tap Share, and post it to a crew chat or send the link anywhere. Anyone with the link can view it and request to pair! 🔗';
  }
  if (has('session', 'sessions') || hasPhrase('start session')) {
    return 'Sessions are group climbs with a time and place. RSVP on the Find tab, or start one from a climb call once you\'ve paired up. Afterward you\'ll get a shareable session card! 🧗';
  }
  if (has('grade', 'grades', 'level', 'beginner', 'newbie')) {
    return 'All levels are welcome here! When you post, set the grade range so partners know what to expect. There\'s a crew for every level. 💪';
  }
  if (has('event', 'events')) {
    return 'Events are ticketed happenings — check the Events tab for what\'s coming up near you. 🎟️';
  }
  if (has('help', 'stuck') || hasPhrase('how do', 'how can', 'what can you', 'how to')) {
    return 'I can help with the basics: posting sessions, climb calls, finding partners, crews, cards, and getting around the app. What are you trying to do? 😄';
  }
  if (has('thank', 'thanks', 'thx', 'ty')) {
    return 'Anytime! Now go touch some plastic (or real rock). 🪨';
  }
  if (has('bye', 'later', 'cya', 'goodnight')) {
    return 'See you at the crag! 👋';
  }
  if (has('who', 'what') && has('you', 'cruxy')) {
    return 'I\'m Cruxy, your climbing buddy bot! I\'m still learning, but I can point you around the app. Try asking about sessions, partners, or cards. 🧗';
  }
  return 'Hmm, I\'m still learning that one! Try asking about posting a session, finding partners, crews, or your card collection — or tap around, the app is pretty explorable. 🧗';
}

/** Cruxy's welcome thread for a brand-new user. */
function cruxyWelcomeMessages(): ChatMessage[] {
  return [
    { id: uid('msg'), from: 'cruxy', text: 'Hey, welcome to Crux8! 🧗 I\'m Cruxy, your climbing buddy bot.', sent_at: new Date(Date.now() - 60000).toISOString() },
    { id: uid('msg'), from: 'cruxy', text: 'Post a session from the + button to find partners, or browse the Find tab to join someone else\'s climb. Ask me anything — try "how do I post a session?"', sent_at: new Date(Date.now() - 30000).toISOString() },
  ];
}

/**
 * A thread is "unread" when its most recent message came from someone other
 * than me AND was sent after the last time I opened that thread. My own
 * messages never count, and threads I've opened since the last message clear.
 */
export function countUnreadThreads(s: {
  cruxmates: string[];
  chats: Record<string, ChatMessage[]>;
  sessionChats: Record<string, SessionChat>;
  chatReads: Record<string, string>;
}): number {
  const isUnread = (key: string, last: ChatMessage | undefined): boolean => {
    if (!last || last.from === 'me' || last.from === 'system') return false;
    const readAt = s.chatReads[key];
    return !readAt || last.sent_at > readAt;
  };

  let count = 0;
  for (const userId of s.cruxmates) {
    const msgs = s.chats[userId] ?? [];
    if (isUnread(dmKey(userId), msgs[msgs.length - 1])) count++;
  }
  for (const sc of Object.values(s.sessionChats)) {
    if (sc.messages.length === 0) continue;
    if (isUnread(scKey(sc.id), sc.messages[sc.messages.length - 1])) count++;
  }
  return count;
}

/**
 * An invite is ACTIONABLE while it's pending, its target still exists,
 * the climb hasn't started/ended, and I'm not already in. Ignored
 * invites stay actionable until the session/call ends — that's the
 * point: decide later, it waits for you.
 */
export function isInviteActionable(
  invite: Invite,
  s: {
    me: { id: string } | null;
    sessions: Session[];
    climbCalls: ClimbCall[];
    sessionLifecycle: Record<string, SessionLifecycle>;
  },
): boolean {
  if (invite.status !== 'pending' || !s.me) return false;
  if (invite.kind === 'call') {
    const call = s.climbCalls.find((c) => c.id === invite.target_id);
    if (!call || call.status !== 'live') return false;
    return !call.participant_ids.includes(s.me.id);
  }
  const session = s.sessions.find((x) => x.id === invite.target_id);
  if (!session) return false;
  if (session.participant_ids.includes(s.me.id)) return false;
  const phase = sessionPhase(session, s.sessionLifecycle[session.id]);
  // An invite is a share: it stays actionable while the session is
  // upcoming AND while it's live (recipients can still get in via the
  // invite). It dies only when the session finishes or lapses.
  return phase === 'upcoming' || phase === 'live';
}

export function countActionableInvites(s: {
  me: { id: string } | null;
  invites: Invite[];
  sessions: Session[];
  climbCalls: ClimbCall[];
  sessionLifecycle: Record<string, SessionLifecycle>;
}): number {
  return s.invites.filter((i) => isInviteActionable(i, s)).length;
}

/** Short display label for a launch-city slug, e.g. 'greater-seattle' → 'Seattle'. */
function cityShortLabel(slug: string): string {
  const map: Record<string, string> = {
    'greater-seattle': 'Seattle',
  };
  return map[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const initialVerifications: Record<VerificationCategory, Verification> = {
  top_rope: { status: 'unverified' },
  lead: { status: 'unverified' },
  trad: { status: 'unverified' },
};

const initialFilters: Filters = {
  l1: 'climb',
  env: 'indoor',
  climb_styles: [],
  hike_types: [],
  event_types: [],
  weight_safe_only: false,
  free_only: false,
};

/** Guards the onAuthStateChange subscription in initAuth (module singleton). */
let initAuthSubscribed = false;

/**
 * Best-effort write-through of profile changes to the Supabase `profiles`
 * table (RLS: the user can only update their own row). Fire-and-forget: the
 * local store is the source of truth for the UI; a failure only logs.
 */
async function persistProfilePatch(userId: string, patch: Partial<Profile>): Promise<void> {
  // Invite-code stability (2026-10-16): a code is first-writer-wins,
  // forever. Two devices generated different codes for one account
  // while the column was new (each code local-only at first), and a
  // later write from the stale device silently replaced the server
  // code — LUCY-9BA2 became LUCY-2HXK and every already-shared 9BA2
  // link lost its inviter. Never overwrite a server-held valid code
  // with a different one; the boot rebuild adopts the server's value.
  if (patch.invite_code) {
    const existing = await fetchMyProfile(userId).catch(() => null);
    const serverCode = existing?.invite_code ? normalizeInviteCode(existing.invite_code) : '';
    if (serverCode && isValidInviteCode(serverCode) && serverCode !== patch.invite_code) {
      patch = { ...patch };
      delete patch.invite_code;
    }
  }
  const row = profilePatchToRow(patch);
  if (Object.keys(row).length === 0) return;
  // Upsert (not update): self-heals when the row is missing — e.g. the
  // auto-create trigger never ran, or a user predates the profiles table.
  const { error } = await supabase.from('profiles').upsert({ id: userId, ...row });
  if (error) console.warn('[auth] profiles upsert failed', error.message);
}

/**
 * Make sure the Supabase `profiles` row exists for an auth user.
 * The on_auth_user_created trigger normally creates it; this is the
 * fallback for races or users who predate the table.
 */
async function ensureProfileRow(userId: string, email: string | null | undefined): Promise<void> {
  const existing = await fetchMyProfile(userId).catch(() => null);
  if (!existing) {
    await supabase
      .from('profiles')
      .insert({ id: userId, email })
      .then(({ error: insErr }) => {
        if (insErr) console.warn('[auth] profiles insert fallback failed', insErr.message);
      });
  }
}

export const useAppStore = create<Store>()(
  persist(
    (set, get) => ({
      me: null,
      gyms: [],
      routes: [],
      sessions: [],
      events: [],
      groups: [],
      users: [],
      climbCalls: [],
      directory: {},
      directoryVerifications: {},
      myConfirmCounts: {},
      myGroupMemberships: [],
      ticketPurchases: [],
      ticketRedemptions: {},
      mysteryMemberUntil: null,
      cruxmates: [],
      collectedCards: [],
      sessionCardsCollected: [],
      lastCollectedCard: null,
      chats: {},
      sessionChats: {},
      chatReads: {},
      verifications: initialVerifications,
      gearChecklists: {},
      badges: [],
      recaps: {},
      sessionLifecycle: {},
      cruxySessions: [],
      cruxyCalls: [],
      gymSuggestions: [],
      leftSessions: [],
      invites: [],
      mateRequests: [],
      messageRequests: [],
      dismissedFollowers: [],
      pairRequests: [],
      checkin: null,
      gymPresence: {},
      xp: 0,
      sends: [],
      lastCheckinDay: null,
      filters: initialFilters,
      seededAt: null,
      sessionsLoading: false,
      newSessionOpen: false,
      setNewSessionOpen: (open: boolean) => set({ newSessionOpen: open }),

      syncSeedGyms: () => {
        const cur = get().gyms;
        // User-suggested gyms (gym_local_*) live after the seed roster and
        // must survive the re-sync — compare and rebuild the seed part only.
        const isLocal = (g: Gym) => g.id.startsWith('gym_local_');
        const locals = cur.filter(isLocal);
        const persistedSeed = cur.filter((g) => !isLocal(g));
        const inSync =
          persistedSeed.length === SEED_GYMS.length &&
          persistedSeed.every((g, i) => {
            const s = SEED_GYMS[i];
            return (
              g.id === s.id && g.name === s.name && g.short_name === s.short_name
            );
          });
        if (inSync) return;
        const gymPresence = { ...get().gymPresence };
        for (const g of SEED_GYMS) {
          if (gymPresence[g.id] === undefined) gymPresence[g.id] = g.here_now;
        }
        set({ gyms: [...SEED_GYMS, ...locals], gymPresence });
      },

      /** Make sure every signed-in user has Cruxy's welcome thread. Idempotent. */
      ensureCruxyThread: () => {
        const { chats, cruxmates, users } = get();
        const patch: Partial<{
          chats: Record<string, ChatMessage[]>;
          cruxmates: string[];
          users: NpcUser[];
        }> = {};
        if (!cruxmates.includes('cruxy')) patch.cruxmates = [...cruxmates, 'cruxy'];
        if (!chats['cruxy'] || chats['cruxy'].length === 0) {
          patch.chats = { ...chats, cruxy: cruxyWelcomeMessages() };
        }
        // States persisted before Cruxy joined the seed roster have the
        // cruxmate + thread but no user record — the Chats list then renders
        // an invisible row (count + unread badge, no thread). Backfill it.
        if (!users.some((u) => u.id === 'cruxy')) {
          const cruxyUser = SEED_USERS.find((u) => u.id === 'cruxy');
          if (cruxyUser) patch.users = [cruxyUser, ...users];
        }
        if (Object.keys(patch).length > 0) set(patch);
      },

      seedIfEmpty: () => {
        if (get().seededAt) return;
        set({
          gyms: SEED_GYMS,
          routes: SEED_ROUTES,
          events: [],
          groups: [],
          users: SEED_USERS,
          gymPresence: Object.fromEntries(SEED_GYMS.map((g) => [g.id, g.here_now])),
          cruxmates: SEED_CRUXMATES,
          myGroupMemberships: [],
          badges: ['first_session', 'community'],
          chats: {},
          seededAt: Date.now(),
        });
        // Sessions and climb calls now come from Supabase (real backend).
        void get().fetchSessions();
        void get().fetchClimbCalls();
        void get().fetchInvites();
        void get().fetchMateRequests();
        void get().fetchMessageRequests();
        get().ensureCruxyThread();
      },

      fetchSessions: async () => {
        set({ sessionsLoading: true });
        try {
          // Cruxy's memberships are a local overlay (no Supabase account) —
          // merge them back in before the 0-person filter.
          const cruxySessions = get().cruxySessions;
          const fetched = (await dbFetchSessions())
            .map((s) =>
              cruxySessions.includes(s.id) && !s.participant_ids.includes('cruxy')
                ? { ...s, participant_ids: [...s.participant_ids, 'cruxy'] }
                : s,
            )
            // Sessions everyone has left (0 going) never surface anywhere.
            .filter((s) => s.participant_ids.length > 0);
          // Union-merge (same shield climb calls already had): a fetch
          // must never delete a session I'M IN that's still in the fetch
          // window — hosts watched their session vanish on refresh when
          // the local copy and the server momentarily disagreed (account
          // switches, cross-device creates, mid-flight races). Server rows
          // win on fields; local-only copies where I'm a participant ride
          // along. Sessions I left have me removed from participant_ids,
          // so they can't resurrect through this path.
          const meId = get().me?.id;
          const fetchedIds = new Set(fetched.map((s) => s.id));
          const cutoff = new Date(Date.now() - 7 * 86400_000).toISOString();
          const localOnly = meId
            ? get().sessions.filter(
                (s) =>
                  !fetchedIds.has(s.id) &&
                  s.participant_ids.includes(meId) &&
                  s.ends_at > cutoff,
              )
            : [];
          const sessions = [...fetched, ...localOnly].sort((a, b) =>
            a.starts_at.localeCompare(b.starts_at),
          );
          set({ sessions });
          // Finished-session card sweep: covers finishes stamped by
          // OTHER devices (the host ended it elsewhere) — my finishSession
          // only fires when this device taps End. Idempotent per session.
          if (meId) {
            for (const s of sessions) {
              if (s.participant_ids.includes(meId)) {
                get().collectSessionCards(s.id);
              }
            }
          }
          await get().ensureDirectoryProfiles(
            sessions.flatMap((s) => [s.host_id, ...s.participant_ids]),
          );
        } catch (e) {
          console.error('[sessions] fetch failed', e);
        } finally {
          set({ sessionsLoading: false });
        }
      },

      fetchClimbCalls: async () => {
        try {
          const cruxyCalls = get().cruxyCalls;
          const fetched = (await dbFetchClimbCalls()).map((c) =>
            cruxyCalls.includes(c.id) && !c.participant_ids.includes('cruxy')
              ? { ...c, participant_ids: [...c.participant_ids, 'cruxy'] }
              : c,
          );
          // Union-merge: a created call returned a real server row, so a
          // fetch that omits a still-live, in-window local call must not
          // delete it — hosts watched their previous call vanish on every
          // refresh. Server rows win on fields; local-only live calls ride
          // along until their window passes. One exception: a LOCAL
          // retirement (matched/expired) always beats a fetched 'live' —
          // the server update can lag or be blocked, and a started/ended
          // call must never resurrect as live on this device.
          const localById = new Map(get().climbCalls.map((c) => [c.id, c]));
          const merged = fetched.map((c) => {
            const local = localById.get(c.id);
            return local && local.status !== 'live' && c.status === 'live'
              ? { ...c, status: local.status }
              : c;
          });
          const fetchedIds = new Set(fetched.map((c) => c.id));
          const nowIso = new Date().toISOString();
          const localOnly = get().climbCalls.filter(
            (c) => !fetchedIds.has(c.id) && c.status === 'live' && c.ends_at > nowIso,
          );
          const climbCalls = [...merged, ...localOnly].sort((a, b) =>
            a.starts_at.localeCompare(b.starts_at),
          );
          set({ climbCalls });
          await get().ensureDirectoryProfiles(
            climbCalls.flatMap((c) => [c.user_id, ...c.participant_ids]),
          );
        } catch (e) {
          console.error('[calls] fetch failed', e);
        }
      },

      ensureDirectoryProfiles: async (ids) => {
        const me = get().me;
        const known = new Set([
          ...(me ? [me.id] : []),
          ...get().users.map((u) => u.id),
          ...Object.keys(get().directory),
        ]);
        const missing = [...new Set(ids)].filter((id) => id && !known.has(id));
        if (missing.length === 0) return;
        try {
          const profiles = await fetchDirectoryProfiles(missing);
          const directory = { ...get().directory };
          for (const p of profiles) directory[p.id] = p;
          set({ directory });
          // Public belay verification statuses ride along (badge display).
          const remote = await fetchPublicVerifications(missing).catch(
            () => ({}) as Record<string, Record<string, string>>,
          );
          if (Object.keys(remote).length > 0) {
            const dv = { ...get().directoryVerifications };
            for (const [id, v] of Object.entries(remote)) {
              dv[id] = v as Partial<Record<VerificationCategory, VerificationStatus>>;
            }
            set({ directoryVerifications: dv });
          }
        } catch (e) {
          console.error('[directory] fetch failed', e);
        }
      },

      /**
       * Email OTP login (Supabase). Step 1: sends a 6-digit code to the email.
       * Creates the auth user on first send; the DB trigger auto-creates the
       * `profiles` row. Code-based (not magic-link redirect) so it works
       * inside the Capacitor shell.
       */
      sendOtp: async (email) => {
        const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase() });
        if (error) {
          return { ok: false as const, error: otpErrorMessage(error, 'Could not send the code — please try again.') };
        }
        return { ok: true as const };
      },

      /**
       * Account-switch guard: local state is per-DEVICE, so without this a
       * second account signing in on the same phone inherits the first
       * account's crews, chats, cruxmates and overlays. When the incoming
       * user differs from the one whose data is on the device, wipe every
       * user-scoped slice back to seed and reseed for the new account.
       */
      prepareForUser: (userId) => {
        const prev = get().me;
        if (!prev || prev.id === userId) return;
        set({
          sessions: [],
          climbCalls: [],
          events: [],
          groups: [],
          users: [],
          directory: {},
          directoryVerifications: {},
          myConfirmCounts: {},
          myGroupMemberships: [],
          ticketPurchases: [],
          ticketRedemptions: {},
          mysteryMemberUntil: null,
          cruxmates: [],
          chats: {},
          sessionChats: {},
          chatReads: {},
          pairRequests: [],
          collectedCards: [],
          sessionCardsCollected: [],
          lastCollectedCard: null,
          verifications: initialVerifications,
          gearChecklists: {},
          badges: [],
          recaps: {},
          sessionLifecycle: {},
          cruxySessions: [],
          cruxyCalls: [],
          gymSuggestions: [],
          leftSessions: [],
          invites: [],
          mateRequests: [],
      messageRequests: [],
          dismissedFollowers: [],
          checkin: null,
          gymPresence: {},
          xp: 0,
          sends: [],
          lastCheckinDay: null,
          filters: initialFilters,
          seededAt: null,
        });
        try {
          localStorage.removeItem('crux8-onboarding-draft');
        } catch {
          /* storage unavailable */
        }
        get().seedIfEmpty();
        // seedIfEmpty early-returns when seededAt is already set — but the
        // cruxy cruxmate + user-record pair can still be desynced in a
        // persisted state (regression 2026-10-15), so repair it explicitly.
        get().ensureCruxyThread();
      },

      /** Email OTP login, step 2: verifies the 6-digit code and signs the user in. */
      verifyOtp: async (email, code) => {
        const normalizedEmail = email.trim().toLowerCase();
        const { data, error } = await supabase.auth.verifyOtp({
          email: normalizedEmail,
          token: code.trim(),
          type: 'email',
        });
        if (error || !data.user) {
          return { ok: false as const, error: otpErrorMessage(error, 'Could not verify the code — please try again.') };
        }
        const user = data.user;
        await ensureProfileRow(user.id, user.email);
        const row = await fetchMyProfile(user.id).catch(() => null);
        get().prepareForUser(user.id);
        set({ me: profileRowToProfile(user.id, user.email ?? normalizedEmail, row) });
        get().ensureCruxyThread();
        return { ok: true as const };
      },

      /**
       * Password sign-up. With "Confirm email" on (Supabase default), this
       * sends a confirmation link and returns needsConfirmation — no session
       * yet. If confirmation is off, the user is signed in immediately.
       */
      signUpWithPassword: async (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        });
        if (error || !data.user) {
          return { ok: false as const, error: passwordErrorMessage(error, 'Could not create your account — please try again.') };
        }
        const user = data.user;
        // Supabase stays silent on existing emails (anti-enumeration): it returns the
        // existing user with identities populated, no session, and sends no email.
        // Detect that so the UI can say "already registered, try signing in" instead
        // of the confusing "check your email" message.
        if ((user.identities?.length ?? 0) > 0) {
          if (user.email_confirmed_at) {
            return {
              ok: false as const,
              code: 'already_registered' as const,
              error: 'This email is already registered — try signing in instead.',
            };
          }
          return {
            ok: false as const,
            code: 'already_registered_unconfirmed' as const,
            error: 'This email is already registered but not confirmed yet — check your inbox for the confirmation link.',
          };
        }
        // No session yet → email confirmation required before first sign-in.
        if (!data.session) {
          return { ok: true as const, needsConfirmation: true };
        }
        await ensureProfileRow(user.id, user.email);
        const row = await fetchMyProfile(user.id).catch(() => null);
        get().prepareForUser(user.id);
        set({ me: profileRowToProfile(user.id, user.email ?? normalizedEmail, row) });
        get().ensureCruxyThread();
        return { ok: true as const, needsConfirmation: false };
      },

      /** Password sign-in for an existing account. */
      signInWithPassword: async (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error || !data.user) {
          return { ok: false as const, error: passwordErrorMessage(error, 'Could not sign you in — please try again.') };
        }
        const user = data.user;
        await ensureProfileRow(user.id, user.email);
        const row = await fetchMyProfile(user.id).catch(() => null);
        get().prepareForUser(user.id);
        set({ me: profileRowToProfile(user.id, user.email ?? normalizedEmail, row) });
        get().ensureCruxyThread();
        return { ok: true as const };
      },

      /**
       * Send a password-reset email (uses the "Reset password" template).
       * The link lands on /update-password, which exchanges it for a session
       * and lets the user set a new password.
       */
      resetPassword: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) {
          return { ok: false as const, error: passwordErrorMessage(error, 'Could not send the reset email — please try again.') };
        }
        return { ok: true as const };
      },

      /**
       * Reconcile persisted state with the Supabase session on app boot.
       * - No session (signed out, expired, or a stale mock `me` from the demo):
       *   clear `me` so the login sheet takes over.
       * - Session: refresh `me` from the `profiles` table.
       * Also keeps `me` in sync if the session ends elsewhere.
       */
      initAuth: async () => {
        const applySessionUser = async (userId: string, email: string, isGuest: boolean) => {
          // Guest sessions are constructed by signInAsGuest with the chosen
          // name (written to the profile row fire-and-forget). Don't clobber
          // an in-memory guest profile with the email-fallback rebuild —
          // just refresh the name if the server row has a newer one.
          const cur = get().me;
          if (cur?.id === userId && cur.isGuest) {
            const row = await fetchMyProfile(userId).catch(() => null);
            if (row?.display_name && row.display_name !== cur.display_name) {
              set({ me: { ...cur, display_name: row.display_name } });
            }
            return;
          }
          get().prepareForUser(userId);
          const row = await fetchMyProfile(userId).catch(() => null);
          get().prepareForUser(userId);
          const profile = profileRowToProfile(userId, email, row);
          // Photo survival (Lucy 2026-10-16: uploaded photo "never got
          // kept", drawn avatar came back): this rebuild REPLACES `me`
          // with the server row on every launch / token refresh, so a
          // photo the server never stored (its write-through is
          // fire-and-forget and can fail silently) was wiped on the
          // next launch. A local photo for the SAME user wins over a
          // server blank, and we re-push it to heal the server row.
          const localBefore = get().me;
          if (localBefore?.id === userId && !profile.photo_url && localBefore.photo_url) {
            profile.photo_url = localBefore.photo_url;
            void persistProfilePatch(userId, { photo_url: localBefore.photo_url });
          }
          set({ me: isGuest ? { ...profile, isGuest: true } : profile });
          // Hydrate belay verification status from the profile row (the
          // server is the source of truth; it may have flipped a skill to
          // peer-confirmed since this device last looked).
          if (row?.verifications) {
            const merged = { ...get().verifications };
            for (const cat of ['top_rope', 'lead', 'trad'] as VerificationCategory[]) {
              const st = row.verifications[cat];
              if (st === 'verified') {
                merged[cat] = { status: 'verified' };
              } else if (st === 'self_attested' && merged[cat].status !== 'verified') {
                merged[cat] = { status: 'self_attested', attested_at: merged[cat].attested_at };
              }
            }
            set({ verifications: merged });
          }
          void fetchBelayConfirmCounts(userId).then((counts) =>
            set({
              myConfirmCounts: counts as Partial<Record<VerificationCategory, number>>,
            }),
          );
          get().ensureCruxyThread();
        };
        const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
        const sessionUser = data.session?.user ?? null;
        if (!sessionUser) {
          if (get().me) set({ me: null });
        } else {
          await applySessionUser(sessionUser.id, sessionUser.email ?? '', sessionUser.is_anonymous === true);
        }
        // The server is the source of truth: pull fresh sessions + calls
        // on EVERY launch, not only at first seed. Without this, a session
        // created on another device — or lost to any local-state
        // divergence — never lands here, and hosts watched sessions
        // "disappear on refresh" while their rows sat safe server-side.
        void get().fetchSessions();
        void get().fetchClimbCalls();
        if (!initAuthSubscribed) {
          initAuthSubscribed = true;
          supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
              // Reset links land wherever Supabase's allowlist sends them —
              // if that's not /update-password itself, route there now so
              // the user can actually set a new password.
              if (window.location.pathname !== '/update-password') {
                window.location.assign('/update-password');
              }
              return;
            }
            if (event === 'SIGNED_OUT') {
              set({ me: null });
            } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
              await applySessionUser(session.user.id, session.user.email ?? '', session.user.is_anonymous === true);
              void get().fetchSessions();
              void get().fetchClimbCalls();
            }
          });
        }
      },

      completeOnboarding: (patch) => {
        const cur = get().me;
        if (!cur) return;
        set({ me: { ...cur, ...patch, onboarded: true } });
        void persistProfilePatch(cur.id, { ...patch, onboarded: true });
      },

      updateProfile: (patch) => {
        const cur = get().me;
        if (!cur) return;
        set({ me: { ...cur, ...patch } });
        void persistProfilePatch(cur.id, patch);
      },

      ensureInviteCode: () => {
        const cur = get().me;
        if (!cur) return null;
        const existing = cur.invite_code ? normalizeInviteCode(cur.invite_code) : '';
        if (existing && isValidInviteCode(existing)) {
          // Reconcile with the server in the background: if the server
          // holds a different valid code (first writer), it wins and
          // this device adopts it — a stale local code must never be
          // what gets shared.
          void fetchMyProfile(cur.id)
            .then((row) => {
              const serverCode = row?.invite_code ? normalizeInviteCode(row.invite_code) : '';
              const meNow = get().me;
              if (
                serverCode &&
                isValidInviteCode(serverCode) &&
                serverCode !== existing &&
                meNow?.id === cur.id
              ) {
                set({ me: { ...meNow, invite_code: serverCode } });
              }
            })
            .catch(() => {});
          return existing;
        }
        const code = randomInviteCode(cur.display_name);
        get().updateProfile({ invite_code: code });
        return code;
      },

      signOut: async () => {
        await supabase.auth.signOut().catch(() => {});
        set({ me: null });
      },

      /**
       * Guest join via Supabase anonymous sign-in (front door, 2026-10-14).
       * Name only, no email, no password, no OTP round-trip. The anonymous
       * user gets a real auth.users row (is_anonymous=true) and the
       * `authenticated` role; the profile name is written through so the
       * host's phone can resolve it in the roster. When the project
       * toggle is off, returns code 'anonymous_disabled' — the caller
       * falls back to email-code sign-in. (Probe 2026-10-14: the toggle
       * is OFF on njthgcbvmlavhwvcwqqx — Lucy's ~2 min dashboard action.)
       */
      signInAsGuest: async (displayName) => {
        const name = displayName.trim() || 'Guest climber';
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error || !data.user) {
          const msg = (error?.message ?? '').toLowerCase();
          if (msg.includes('anonymous') && msg.includes('disabled')) {
            return {
              ok: false as const,
              code: 'anonymous_disabled' as const,
              error: 'Guest sign-in is not enabled yet — please sign in with email instead.',
            };
          }
          return {
            ok: false as const,
            error: 'Could not start a guest session — please sign in with email instead.',
          };
        }
        const user = data.user;
        await ensureProfileRow(user.id, null);
        const guestMe: Profile = {
          id: user.id,
          display_name: name,
          avatar: avatarFromSeed(name),
          home_gym_id: 'gym_vertical_world',
          top_grade: '5.10c',
          preferred_styles: ['top_rope', 'lead'],
          about: '',
          onboarded: false,
          isGuest: true,
        };
        set({ me: guestMe });
        // Write the name through so OTHER devices (e.g. the host's, or
        // the inbox of someone this guest sends a cruxmate request to)
        // resolve this guest by name. Awaited: fire-and-forget raced the
        // request flow and could leave the recipient staring at a
        // nameless request. A failed write must not block guest entry.
        await persistProfilePatch(user.id, { display_name: name }).catch(() => {});
        get().ensureCruxyThread();
        return { ok: true as const };
      },

      /**
       * Convert an anonymous guest account into a permanent one by email
       * (same UID — session joins and history carry over). Supabase sends
       * a confirmation to the address; the account converts on click.
       */
      claimGuestAccount: async (email) => {
        const me = get().me;
        if (!me?.isGuest) {
          return { ok: false as const, error: 'Only guest accounts need claiming.' };
        }
        const normalized = email.trim().toLowerCase();
        if (!normalized.includes('@')) {
          return { ok: false as const, error: "That email doesn't look right — check it and try again." };
        }
        const { error } = await supabase.auth.updateUser({ email: normalized });
        if (error) {
          return {
            ok: false as const,
            error: 'Could not send the claim email — check the address and try again.',
          };
        }
        return { ok: true as const };
      },

      resetAll: () => {
        set({
          me: null,
          sessions: [],
          events: [],
          groups: [],
          users: [],
          directory: {},
          directoryVerifications: {},
          myConfirmCounts: {},
          myGroupMemberships: [],
          ticketPurchases: [],
          ticketRedemptions: {},
          mysteryMemberUntil: null,
          cruxmates: [],
          chats: {},
          verifications: initialVerifications,
          gearChecklists: {},
          badges: [],
          recaps: {},
          sessionLifecycle: {},
          cruxySessions: [],
          cruxyCalls: [],
          gymSuggestions: [],
          leftSessions: [],
          invites: [],
          mateRequests: [],
      messageRequests: [],
          dismissedFollowers: [],
          checkin: null,
          gymPresence: {},
          xp: 0,
          sends: [],
          lastCheckinDay: null,
          filters: initialFilters,
          seededAt: null,
        });
      },

      rsvp: async (sessionId, opts) => {
        const me = get().me;
        if (!me) return;
        // Started sessions are closed to new joins from public surfaces
        // (Find, browsing) — but a SHARE is an invitation: anyone holding
        // the chat card, the link, or a personal invite can still get in
        // while it's live. Callers on share surfaces pass viaShare.
        const target = get().sessions.find((s) => s.id === sessionId);
        if (
          target &&
          !opts?.viaShare &&
          !target.participant_ids.includes(me.id) &&
          hasStarted(target, get().sessionLifecycle[sessionId])
        ) {
          return;
        }
        const already = get().sessions.find((s) => s.id === sessionId)?.participant_ids.includes(me.id);
        set({
          // Rejoining clears any "left" record for this session.
          leftSessions: get().leftSessions.filter((id) => id !== sessionId),
          sessions: get().sessions.map((s) =>
            s.id === sessionId && !s.participant_ids.includes(me.id)
              ? { ...s, participant_ids: [...s.participant_ids, me.id] }
              : s
          ),
        });
        if (!already) get().addXp(XP.rsvp);
        // Auto-create session chat for logistics
        const s = get().sessions.find((x) => x.id === sessionId);
        if (s) {
          const gym = get().gyms.find((g) => g.id === s.gym_id);
          get().ensureSessionChat(
            s.id,
            'session',
            s.title,
            gym?.short_name ?? s.area,
            s.participant_ids,
          );
        }
        get().checkBadges();
        try {
          await setSessionRsvp(sessionId, me.id, true);
        } catch (e) {
          console.error('[sessions] rsvp write failed', e);
        }
      },

      unrsvp: async (sessionId) => {
        const me = get().me;
        if (!me) return;
        set({
          // Remember the leave locally so the session lands in Past
          // history even though the server drops my RSVP entirely.
          leftSessions: get().leftSessions.includes(sessionId)
            ? get().leftSessions
            : [...get().leftSessions, sessionId],
          sessions: get().sessions.map((s) =>
            s.id === sessionId
              ? { ...s, participant_ids: s.participant_ids.filter((id) => id !== me.id) }
              : s
          ),
        });
        try {
          await setSessionRsvp(sessionId, me.id, false);
        } catch (e) {
          console.error('[sessions] unrsvp write failed', e);
        }
      },

      rsvpEvent: (eventId, waitlist) => {
        const me = get().me;
        if (!me) return;
        set({
          events: get().events.map((e) => {
            if (e.id !== eventId) return e;
            if (waitlist) {
              return { ...e, waitlist_ids: [...new Set([...e.waitlist_ids, me.id])] };
            }
            return { ...e, attendee_ids: [...new Set([...e.attendee_ids, me.id])] };
          }),
        });
        if (!waitlist) {
          const ev = get().events.find((e) => e.id === eventId);
          if (ev) {
            get().ensureSessionChat(ev.id, 'event', ev.title, ev.venue, ev.attendee_ids);
          }
        }
      },

      unrsvpEvent: (eventId) => {
        const me = get().me;
        if (!me) return;
        set({
          events: get().events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  attendee_ids: e.attendee_ids.filter((id) => id !== me.id),
                  waitlist_ids: e.waitlist_ids.filter((id) => id !== me.id),
                }
              : e
          ),
        });
      },

      buyTicket: (eventId) => {
        const me = get().me;
        if (!me) return;
        // Mock checkout: record the purchase and add the buyer to the event's
        // attendee list so the pass shows up on their calendar.
        set({
          ticketPurchases: [...new Set([...get().ticketPurchases, eventId])],
          events: get().events.map((e) =>
            e.id === eventId
              ? { ...e, attendee_ids: [...new Set([...e.attendee_ids, me.id])] }
              : e
          ),
        });
      },

      stampPass: (eventId, gymId) => {
        // User-initiated redemption at the gym front desk: stamps this gym on
        // the passport once. Idempotent — re-stamping keeps the first date.
        const forEvent = get().ticketRedemptions[eventId] ?? {};
        if (forEvent[gymId]) return;
        set({
          ticketRedemptions: {
            ...get().ticketRedemptions,
            [eventId]: { ...forEvent, [gymId]: new Date().toISOString() },
          },
        });
      },

      subscribeMysteryPass: () => {
        // Mock subscription: $15/mo "never climb alone" Mystery Crew pass.
        // Extends 30 days from now (or from the current expiry if still active).
        const cur = get().mysteryMemberUntil;
        const base = cur && new Date(cur).getTime() > Date.now() ? new Date(cur) : new Date();
        base.setDate(base.getDate() + 30);
        set({ mysteryMemberUntil: base.toISOString() });
      },

      postSession: async (session) => {
        const me = get().me!;
        // Errors throw to the caller (the sheet shows a toast).
        const created = await dbCreateSession({ ...session, host_id: me.id });        set({ sessions: [created, ...get().sessions] });
        void get().ensureDirectoryProfiles([created.host_id]);
        return created;
      },

      startCallSession: async (callId, presentUserIds) => {
        const me = get().me;
        const call = get().climbCalls.find((c) => c.id === callId);
        if (!me || !call) return null;
        const present = presentUserIds.filter((id) => call.participant_ids.includes(id));
        if (!present.includes(me.id)) present.push(me.id);
        // The host may start solo (just themselves) — the session stays
        // joinable afterwards. Anyone present collects cards mutually.
        if (present.length < 1) return null;

        const now = new Date();
        const endsAt = new Date(now.getTime() + 3 * 3600_000);
        const session = await get().postSession({
          category: call.category,
          title: `${call.category === 'top_rope' ? 'Top-rope' : 'Lead'} session`,
          subtitle: call.grade,
          starts_at: now.toISOString(),
          ends_at: endsAt.toISOString(),
          gym_id: call.gym_id,
          area: call.area,
          // Solo start keeps the call's capacity so others can still join
          // the live session; a group start seats exactly who's here.
          capacity: present.length >= 2 ? present.length : call.capacity,
          vibe: 'chill',
          location_type: call.location_type,
          is_verified_only: false,
          requires_attestation: false,
          note: call.note,
        });
        // Add all present users as participants. The session is born live:
        // starting a call session IS the crew tapping Start together.
        set({
          sessions: get().sessions.map((s) =>
            s.id === session.id
              ? { ...s, participant_ids: present, started_at: s.started_at ?? now.toISOString() }
              : s
          ),
          climbCalls: get().climbCalls.map((c) =>
            c.id === callId ? { ...c, status: 'matched' as const } : c
          ),
          sessionLifecycle: {
            ...get().sessionLifecycle,
            [session.id]: { started_at: now.toISOString() },
          },
          // Cruxy's session membership is a local overlay — carry it over
          // so she stays in the session after the next fetch.
          cruxySessions: present.includes('cruxy') && !get().cruxySessions.includes(session.id)
            ? [...get().cruxySessions, session.id]
            : get().cruxySessions,
        });
        // Persist the call's retirement on the server too — otherwise the
        // next fetch resurrects it as 'live' in everyone else's Find.
        void updateClimbCallRemote(callId, { status: 'matched' });
        void dbSetSessionLifecycle(session.id, { started_at: now.toISOString() });
        // Mutual card collection: everyone present collects everyone else.
        const others = present.filter((id) => id !== me.id);
        for (const otherId of others) {
          get().collectCard(otherId, 'session');
        }
        // The finish sweep must not count this climb twice: collection
        // for a call-born session already happened here, at the start.
        if (!get().sessionCardsCollected.includes(session.id)) {
          set({
            sessionCardsCollected: [...get().sessionCardsCollected, session.id],
          });
        }
        return session.id;
      },

      updateSession: async (id, patch) => {
        const me = get().me!;
        const existing = get().sessions.find((s) => s.id === id);
        if (!existing || existing.host_id !== me.id) {
          throw new Error('Only the host can edit this session.');
        }
        // Editing locks 2 hours before the session starts.
        if (new Date(existing.starts_at).getTime() - Date.now() < 2 * 3600_000) {
          throw new Error('Editing is locked within 2 hours of the session.');
        }
        await dbUpdateSession(id, patch);
        set({
          sessions: get().sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        });
      },

      postEvent: (event) => {
        const me = get().me!;
        const newEvent: EventItem = {
          ...event,
          id: uid('evt'),
          attendee_ids: [me.id],
          waitlist_ids: [],
        };
        set({ events: [newEvent, ...get().events] });
        return newEvent;
      },

      postClimbCall: async (call) => {
        const me = get().me!;
        // Errors throw to the caller (the sheet shows a toast).
        const created = await dbCreateClimbCall({ ...call, user_id: me.id });
        set({ climbCalls: [created, ...get().climbCalls] });
        void get().ensureDirectoryProfiles([created.user_id]);
        return created;
      },

      updateClimbCall: async (id, patch) => {
        // Optimistic local apply (nulls mean "clear the field").
        set({
          climbCalls: get().climbCalls.map((c) => {
            if (c.id !== id) return c;
            const next = { ...c };
            if (patch.title !== undefined) next.title = patch.title ?? undefined;
            if (patch.looking_for !== undefined) next.looking_for = patch.looking_for;
            if (patch.category !== undefined) next.category = patch.category;
            if (patch.grade !== undefined) next.grade = patch.grade;
            if (patch.gym_id !== undefined) next.gym_id = patch.gym_id ?? undefined;
            if (patch.area !== undefined) next.area = patch.area ?? undefined;
            if (patch.starts_at !== undefined) next.starts_at = patch.starts_at;
            if (patch.ends_at !== undefined) next.ends_at = patch.ends_at;
            if (patch.note !== undefined) next.note = patch.note ?? undefined;
            if (patch.capacity !== undefined) next.capacity = patch.capacity;
            return next;
          }),
        });
        // Remote persist for real calls; seed calls live locally only.
        await updateClimbCallRemote(id, patch);
      },

      cancelClimbCall: async (id) => {
        set({
          climbCalls: get().climbCalls.map((c) =>
            c.id === id ? { ...c, status: 'expired' as const } : c,
          ),
        });
        await updateClimbCallRemote(id, { status: 'expired' });
      },

      checkIn: (gymId) => {
        const cur = get().checkin;
        const presence = { ...get().gymPresence };
        // leave the previous gym first
        if (cur && cur.gym_id !== gymId) {
          presence[cur.gym_id] = Math.max(0, (presence[cur.gym_id] ?? 1) - 1);
        }
        if (!cur || cur.gym_id !== gymId) {
          presence[gymId] = (presence[gymId] ?? 0) + 1;
        }
        set({ checkin: { gym_id: gymId, at: new Date().toISOString() }, gymPresence: presence });

        // Reward the first check-in of each day; always celebrate the moment.
        const today = new Date().toISOString().slice(0, 10);
        celebrate({
          emoji: '📍',
          title: "You're on the wall",
          subtitle: `${presence[gymId] ?? 1} climbers here now can see you`,
          colors: CHECKIN_COLORS,
        });
        if (get().lastCheckinDay !== today) {
          set({ lastCheckinDay: today });
          get().addXp(XP.checkIn);
        }
      },

      checkOut: () => {
        const cur = get().checkin;
        if (!cur) return;
        const presence = { ...get().gymPresence };
        presence[cur.gym_id] = Math.max(0, (presence[cur.gym_id] ?? 1) - 1);
        set({ checkin: null, gymPresence: presence });
      },

      addXp: (amount) => {
        if (!amount) return;
        const before = levelFromXp(get().xp);
        const xp = get().xp + amount;
        set({ xp });
        const after = levelFromXp(xp);
        if (after.level > before.level) {
          celebrate({
            emoji: after.emoji,
            title: `Tier ${after.level}!`,
            subtitle: `You're now a ${after.title}`,
            colors: LEVELUP_COLORS,
          });
        }
      },

      logSend: ({ grade, discipline, style, note }) => {
        const send: SendLog = { id: uid('send'), grade, discipline, style, note, at: new Date().toISOString() };
        set({ sends: [send, ...get().sends] });
        const styleLabel = style === 'send' ? '' : `${style} · `;
        celebrate({
          emoji: '🔥',
          title: 'SENT IT!',
          subtitle: `${styleLabel}${grade} logged · +${totalSendXp(grade, style)} XP`,
          colors: SEND_COLORS,
        });
        get().addXp(totalSendXp(grade, style));
        get().checkBadges();
      },

      requestPair: async (callId) => {
        const me = get().me;
        if (!me) return;
        if (get().pairRequests.includes(callId)) return;
        set({
          pairRequests: [...get().pairRequests, callId],
          climbCalls: get().climbCalls.map((c) => {
            if (c.id !== callId) return c;
            if (c.participant_ids.includes(me.id)) return c;
            if (c.participant_ids.length >= c.capacity) return c;
            return { ...c, participant_ids: [...c.participant_ids, me.id] };
          }),
        });
        // Auto-create session chat for logistics
        const call = get().climbCalls.find((c) => c.id === callId);
        if (call) {
          const gym = get().gyms.find((g) => g.id === call.gym_id);
          const host = resolveUser(call.user_id, get().me, get().users, get().directory)?.display_name;
          get().ensureSessionChat(
            call.id,
            'call',
            `${host}'s ${call.category === 'top_rope' ? 'top-rope' : 'lead'} call`,
            gym?.short_name,
            call.participant_ids,
          );
        }
        try {
          await setCallPairing(callId, me.id, true);
        } catch (e) {
          console.error('[calls] pair write failed', e);
        }
      },

      cancelPairRequest: async (callId) => {
        const me = get().me;
        if (!me) return;
        set({
          pairRequests: get().pairRequests.filter((id) => id !== callId),
          climbCalls: get().climbCalls.map((c) =>
            c.id === callId ? { ...c, participant_ids: c.participant_ids.filter((id) => id !== me.id) } : c,
          ),
        });
        try {
          await setCallPairing(callId, me.id, false);
        } catch (e) {
          console.error('[calls] unpair write failed', e);
        }
      },

      joinGroup: (groupId) => {
        const me = get().me;
        if (!me || get().myGroupMemberships.includes(groupId)) return;
        set({
          myGroupMemberships: [...get().myGroupMemberships, groupId],
          groups: get().groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  member_count: g.member_count + 1,
                  member_ids: [...(g.member_ids ?? []), me.id],
                }
              : g
          ),
        });
        get().checkBadges();
      },

      leaveGroup: (groupId) => {
        const myId = get().me?.id;
        set({
          myGroupMemberships: get().myGroupMemberships.filter((id) => id !== groupId),
          groups: get().groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  member_count: Math.max(0, g.member_count - 1),
                  member_ids: (g.member_ids ?? []).filter((id) => id !== myId && id !== 'me'),
                }
              : g
          ),
        });
      },

      createGroup: (input) => {
        const me = get().me;
        if (!me) return null;
        const group: Group = {
          id: uid('grp'),
          name: input.name.trim(),
          tagline: input.tagline.trim(),
          category: input.category,
          member_count: 1,
          cover_url: '',
          description: input.description.trim(),
          admin_ids: [me.id],
          recent_activity: 'Just created 🎉',
          owner_id: me.id,
          member_ids: [me.id],
          join_policy: input.join_policy,
          survey_questions:
            input.join_policy === 'request'
              ? input.survey_questions?.length
                ? input.survey_questions
                : [
                    'How long have you been climbing, and what grades do you usually climb?',
                    'What are you looking for in this crew?',
                  ]
              : undefined,
        };
        set({
          groups: [group, ...get().groups],
          myGroupMemberships: [...get().myGroupMemberships, group.id],
        });
        get().checkBadges();
        return group.id;
      },

      requestToJoinGroup: (groupId, answers) => {
        const g = get().groups.find((x) => x.id === groupId);
        if (!g) return;
        // Open groups join instantly; request-only groups queue for admin review.
        if ((g.join_policy ?? 'open') === 'open') {
          get().joinGroup(groupId);
          return;
        }
        if (g.pending?.some((r) => r.user_id === 'me')) return;
        set({
          groups: get().groups.map((x) =>
            x.id === groupId
              ? {
                  ...x,
                  pending: [
                    ...(x.pending ?? []),
                    { user_id: 'me', answers, requested_at: new Date().toISOString() },
                  ],
                }
              : x
          ),
        });
      },

      approveJoinRequest: (groupId, userId) => {
        set({
          groups: get().groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  pending: (g.pending ?? []).filter((r) => r.user_id !== userId),
                  member_ids: [...(g.member_ids ?? []), userId],
                  member_count: g.member_count + 1,
                }
              : g
          ),
          myGroupMemberships:
            userId === 'me' && !get().myGroupMemberships.includes(groupId)
              ? [...get().myGroupMemberships, groupId]
              : get().myGroupMemberships,
        });
      },

      declineJoinRequest: (groupId, userId) => {
        set({
          groups: get().groups.map((g) =>
            g.id === groupId
              ? { ...g, pending: (g.pending ?? []).filter((r) => r.user_id !== userId) }
              : g
          ),
        });
      },

      addGroupAdmin: (groupId, userId) => {
        set({
          groups: get().groups.map((g) =>
            g.id === groupId && !g.admin_ids.includes(userId)
              ? { ...g, admin_ids: [...g.admin_ids, userId] }
              : g
          ),
        });
      },

      removeGroupAdmin: (groupId, userId) => {
        const group = get().groups.find((g) => g.id === groupId);
        // Cruxy is the default house-hangout admin — she keeps the role.
        if (group?.kind === 'house_hangout' && userId === 'cruxy') return;
        set({
          groups: get().groups.map((g) =>
            g.id === groupId && g.owner_id !== userId
              ? { ...g, admin_ids: g.admin_ids.filter((id) => id !== userId) }
              : g
          ),
        });
      },

      removeGroupMember: (groupId, userId) => {
        set({
          groups: get().groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  member_ids: (g.member_ids ?? []).filter((id) => id !== userId),
                  admin_ids: g.admin_ids.filter((id) => id !== userId),
                  member_count: Math.max(0, g.member_count - 1),
                }
              : g
          ),
        });
      },

      updateGroup: (groupId, patch) => {
        set({
          groups: get().groups.map((g) => (g.id === groupId ? { ...g, ...patch } : g)),
        });
      },

      openGroupChat: (groupId) => {
        const g = get().groups.find((x) => x.id === groupId);
        if (!g) return;
        const members = Array.from(new Set([...(g.member_ids ?? []), ...g.admin_ids]));
        get().ensureSessionChat(groupId, 'group', g.name, `${g.member_count.toLocaleString()} members`, members);
      },

      ensureHouseHangout: (houseId) => {
        const me = get().me;
        if (!me) return null;
        const house = getHouse(houseId);
        if (!house) return null;
        // One hangout per house (city-scoped later when multi-city launches; for now
        // the launch city is implicit in the crew name).
        const existing = get().groups.find(
          (g) => g.kind === 'house_hangout' && g.house_id === houseId
        );
        let hangoutId: string;
        if (existing) {
          hangoutId = existing.id;
          // Backfills for hangouts created before these fields existed:
          // Cruxy as default admin, and the house picture as the profile
          // pic (Lucy 2026-10-15: the hangout had no proper profile pic).
          const patch: Partial<Group> = {};
          if (!existing.admin_ids.includes('cruxy')) {
            patch.admin_ids = ['cruxy', ...existing.admin_ids];
          }
          if (!existing.cover_url) patch.cover_url = `/covers/house-${houseId}.jpg`;
          if (!existing.avatar_url) patch.avatar_url = `/covers/house-${houseId}.jpg`;
          if (Object.keys(patch).length > 0) {
            set({
              groups: get().groups.map((g) => (g.id === existing.id ? { ...g, ...patch } : g)),
            });
          }
        } else {
          const cityLabel = cityShortLabel(me.location ?? 'greater-seattle');
          const hangout: Group = {
            id: uid('grp'),
            name: `${house.emoji} ${house.name} Hangout`,
            tagline: `${cityLabel} · auto-grouped by Climber DNA`,
            category: 'general',
            // joinGroup below adds the creator — start empty so she isn't
            // counted twice (member_count 1 + join increment = "2 members").
            member_count: 0,
            cover_url: `/covers/house-${houseId}.jpg`,
            // The house picture doubles as the hangout's profile pic.
            avatar_url: `/covers/house-${houseId}.jpg`,
            description:
              `Your house, your city. Everyone here got sorted into ${house.name} ` +
              `by the Crux8 quiz. Say hi, find partners who match your vibe, and plan your first hangout.`,
            // Cruxy is the default admin of every house hangout.
            admin_ids: ['cruxy'],
            recent_activity: 'Hangout created 🏠',
            owner_id: undefined,
            member_ids: [],
            join_policy: 'open',
            kind: 'house_hangout',
            house_id: houseId,
          };
          set({ groups: [hangout, ...get().groups] });
          hangoutId = hangout.id;
        }
        if (!get().myGroupMemberships.includes(hangoutId)) {
          get().joinGroup(hangoutId);
        }
        return hangoutId;
      },

      addCruxMate: (userId) => {
        if (get().cruxmates.includes(userId)) return;
        set({ cruxmates: [...get().cruxmates, userId] });
        get().checkBadges();
        // Collect their DNA card — the moment of connection.
        get().collectCard(userId, 'cruxmate');
      },

      collectCard: (userId, source, opts) => {
        const me = get().me;
        const silent = opts?.silent === true;
        // Resolve DNA: real profile first, then NPC, then deterministic fallback.
        let archetypeId: string | undefined;
        let houseId: string | undefined;
        if (me && userId === me.id) {
          archetypeId = me.quiz_result_type;
          houseId = me.quiz_house_id;
        }
        const dirProfile = get().directory[userId];
        if (!archetypeId && dirProfile) {
          archetypeId = (dirProfile as any).quiz_result_type;
          houseId = (dirProfile as any).quiz_house_id;
        }
        const npc = get().users.find((u) => u.id === userId);
        if (!archetypeId && npc) {
          archetypeId = (npc as any).quiz_result_type;
          houseId = (npc as any).quiz_house_id;
        }
        // Deterministic fallback so everyone has a collectible card.
        if (!archetypeId) {
          let h = 0;
          for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) >>> 0;
          const arch = QUIZ_ARCHETYPES[h % QUIZ_ARCHETYPES.length];
          archetypeId = arch.id;
          houseId = getHouseForArchetype(arch.id).id;
        }
        const existing = get().collectedCards.find((c) => c.user_id === userId);
        const now = new Date().toISOString();
        if (existing) {
          const updated: CollectedCard = {
            ...existing,
            sessions_together: existing.sessions_together + (source === 'session' ? 1 : 0),
          };
          set({
            collectedCards: get().collectedCards.map((c) => (c.user_id === userId ? updated : c)),
            ...(silent ? {} : { lastCollectedCard: updated }),
          });
          return updated;
        }
        const card: CollectedCard = {
          user_id: userId,
          archetype_id: archetypeId,
          house_id: houseId!,
          collected_at: now,
          sessions_together: 1,
          source,
        };
        set({
          collectedCards: [card, ...get().collectedCards],
          ...(silent ? {} : { lastCollectedCard: card }),
        });
        return card;
      },

      clearLastCollectedCard: () => set({ lastCollectedCard: null }),

      removeCruxMate: (userId) => {
        set({ cruxmates: get().cruxmates.filter((id) => id !== userId) });
      },

      sendMessage: (userId, text) => {
        const now = new Date().toISOString();
        const msg: ChatMessage = { id: uid('msg'), from: 'me', text, sent_at: now };
        const existing = get().chats[userId] ?? [];
        set({
          chats: { ...get().chats, [userId]: [...existing, msg] },
          chatReads: { ...get().chatReads, [dmKey(userId)]: msg.sent_at },
        });
        // Cruxy bot auto-replies (rule-based, no backend needed).
        if (userId === 'cruxy') {
          const reply = cruxyReply(text);
          setTimeout(() => {
            const botMsg: ChatMessage = { id: uid('msg'), from: 'cruxy', text: reply, sent_at: new Date().toISOString() };
            const thread = get().chats['cruxy'] ?? [];
            set({ chats: { ...get().chats, cruxy: [...thread, botMsg] } });
          }, 900);
        }
      },

      sendSessionMessage: (sessionChatId: string, text: string) => {
        const now = new Date().toISOString();
        // Stamp the REAL sender id, not the 'me' literal (Lucy
        // 2026-10-16: group chat didn't show who sent a message — a
        // literal 'me' carries no identity, so names can't render and
        // another account on the same device inherits the bubbles).
        const msg: ChatMessage = { id: uid('msg'), from: get().me?.id ?? 'me', text, sent_at: now };
        const existing = get().sessionChats[sessionChatId];
        if (!existing) return;
        set({
          sessionChats: {
            ...get().sessionChats,
            [sessionChatId]: { ...existing, messages: [...existing.messages, msg] },
          },
          chatReads: { ...get().chatReads, [scKey(sessionChatId)]: now },
        });
      },

      shareClimbCallToGroup: (callId, groupId) => {
        const call = get().climbCalls.find((c) => c.id === callId);
        const group = get().groups.find((g) => g.id === groupId);
        if (!call || !group) return;
        // Make sure the group chat thread exists before posting.
        get().openGroupChat(groupId);
        const when = new Date(call.starts_at).toLocaleString(undefined, {
          weekday: 'short', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit',
        });
        const where = call.location_type === 'indoor'
          ? (get().gyms.find((g) => g.id === call.gym_id)?.short_name ?? 'the gym')
          : (call.area ?? 'outdoors');
        const text =
          `🧗 ${get().me?.display_name ?? 'Someone'} shared a climb call\n` +
          `${call.category === 'top_rope' ? 'Top-rope' : 'Lead'} · ${call.grade} · ${where}\n` +
          `${when}` +
          (call.note ? `\n"${call.note}"` : '') +
          `\nhttps://crux8.app/call/${call.id}`;
        get().sendSessionMessage(groupId, text);
      },

      inviteCruxmatesToCall: (callId, userIds) => {
        const call = get().climbCalls.find((c) => c.id === callId);
        if (!call) return;
        const when = new Date(call.starts_at).toLocaleString(undefined, {
          weekday: 'short', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit',
        });
        const where = call.location_type === 'indoor'
          ? (get().gyms.find((g) => g.id === call.gym_id)?.short_name ?? 'the gym')
          : (call.area ?? 'outdoors');
        const text =
          `🧗 ${get().me?.display_name ?? 'Someone'} invited you to climb\n` +
          `${call.category === 'top_rope' ? 'Top-rope' : 'Lead'} · ${call.grade} · ${where}\n` +
          `${when}` +
          (call.note ? `\n"${call.note}"` : '') +
          `\nTap to view and request to pair: https://crux8.app/call/${call.id}`;
        for (const uid of userIds) {
          get().sendMessage(uid, text);
          // Server-backed invite row for real accounts — this is what
          // lands in their Invites inbox with Accept / Deny. Best-effort:
          // pre-migration the table may not exist yet.
          if (isUuid(uid) && get().me?.id) {
            void createInviteRemote('call', callId, get().me!.id, uid).catch(() => {});
          }
        }
      },

      shareSessionToGroup: (sessionId, groupId) => {
        const session = get().sessions.find((s) => s.id === sessionId);
        const group = get().groups.find((g) => g.id === groupId);
        if (!session || !group) return;
        get().openGroupChat(groupId);
        const when = new Date(session.starts_at).toLocaleString(undefined, {
          weekday: 'short', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit',
        });
        const where = session.location_type === 'indoor'
          ? (get().gyms.find((g) => g.id === session.gym_id)?.short_name ?? 'the gym')
          : (session.area ?? 'outdoors');
        const text =
          `🧗 ${get().me?.display_name ?? 'Someone'} shared a session\n` +
          `${session.title} · ${where}\n` +
          `${when}` +
          (session.subtitle ? `\n${session.subtitle}` : '') +
          `\nhttps://crux8.app/session/${session.id}`;
        get().sendSessionMessage(groupId, text);
      },

      inviteCruxmatesToSession: (sessionId, userIds) => {
        const session = get().sessions.find((s) => s.id === sessionId);
        if (!session) return;
        const when = new Date(session.starts_at).toLocaleString(undefined, {
          weekday: 'short', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit',
        });
        const where = session.location_type === 'indoor'
          ? (get().gyms.find((g) => g.id === session.gym_id)?.short_name ?? 'the gym')
          : (session.area ?? 'outdoors');
        const spots = session.capacity - session.participant_ids.length;
        const text =
          `🧗 ${get().me?.display_name ?? 'Someone'} invited you to a session\n` +
          `${session.title} · ${where}\n` +
          `${when}` +
          (session.subtitle ? `\n${session.subtitle}` : '') +
          (spots > 0 ? `\n${spots} spot${spots === 1 ? '' : 's'} open` : '') +
          `\nTap to view and RSVP: https://crux8.app/session/${session.id}`;
        for (const uid of userIds) {
          get().sendMessage(uid, text);
          // Server-backed invite row for real accounts (see call invites).
          if (isUuid(uid) && get().me?.id) {
            void createInviteRemote('session', sessionId, get().me!.id, uid).catch(() => {});
          }
        }
      },

      fetchInvites: async () => {
        const me = get().me;
        if (!me || !isUuid(me.id)) return;
        try {
          const rows = await fetchMyInvites(me.id);
          set({ invites: rows });
        } catch {
          // Table may not exist until the invites migration runs — the
          // inbox just stays empty; never break boot over it.
        }
      },

      acceptInvite: (invite) => {
        // Join semantics match the share cards: a session invite accepts
        // via RSVP, a call invite via request-to-pair (host confirms by
        // the pairing going confirmed). The invite flips to accepted.
        if (invite.kind === 'session') get().rsvp(invite.target_id, { viaShare: true });
        else get().requestPair(invite.target_id);
        set({
          invites: get().invites.map((i) =>
            i.id === invite.id ? { ...i, status: 'accepted' as const } : i,
          ),
        });
        void setInviteStatusRemote(invite.id, 'accepted').catch(() => {});
      },

      denyInvite: (invite) => {
        set({
          invites: get().invites.map((i) =>
            i.id === invite.id ? { ...i, status: 'denied' as const } : i,
          ),
        });
        void setInviteStatusRemote(invite.id, 'denied').catch(() => {});
      },

      // ── Follows (Instagram model, Lucy 2026-10-15): rows are follows;
      // mutual follows ⟺ cruxmates. Following back IS the approval. ──
      fetchMateRequests: async () => {
        const me = get().me;
        if (!me || !isUuid(me.id)) return;
        try {
          // 'denied' rows are leftovers from the brief request/accept
          // model — not follows. Everything else is a live follow.
          const rows = (await fetchMyMateRequests(me.id)).filter(
            (r) => r.status !== 'denied',
          );
          const remoteIds = new Set(rows.map((r) => r.id));
          // Keep local-only optimistic rows the remote fetch can't know yet
          // (created while the migration was still missing on the server).
          const localOnly = get().mateRequests.filter(
            (r) => r.from_id === me.id && r.status === 'pending' && !remoteIds.has(r.id),
          );
          const all = [...rows, ...localOnly];
          set({ mateRequests: all });
          // Reconcile cruxmates with the follow graph: for every real
          // user a follow row ties to me, cruxmate status == mutual.
          // Users with NO rows (legacy same-device adds, NPCs) are
          // untouched — their state stays as it was.
          const following = new Set(
            all.filter((r) => r.from_id === me.id).map((r) => r.to_id),
          );
          const followers = new Set(
            all.filter((r) => r.to_id === me.id).map((r) => r.from_id),
          );
          const involved = new Set([...following, ...followers]);
          let mates = get().cruxmates;
          let changed = false;
          for (const id of involved) {
            const mutual = following.has(id) && followers.has(id);
            if (mutual && !mates.includes(id)) {
              mates = [...mates, id];
              changed = true;
              // The follow-backer got the reveal at tap time; this side
              // (whose follow landed first) collects quietly on sync.
              get().collectCard(id, 'cruxmate', { silent: true });
            } else if (!mutual && mates.includes(id)) {
              mates = mates.filter((m) => m !== id);
              changed = true;
            }
          }
          if (changed) set({ cruxmates: mates });
          // Names/photos for everyone the follow graph touches. Without
          // this, a cruxmate gained by sync has an id but no directory
          // entry, so every resolveUser surface (invite pickers, DM
          // list, Profile strip) silently drops them — Lucy 2026-10-16:
          // the climb-call invite list showed only Cruxy.
          void get().ensureDirectoryProfiles([...involved, ...mates]);
        } catch {
          // Table may not exist until the cruxmate-requests migration runs —
          // local rows still work same-device; never break boot over it.
        }
      },

      fetchMessageRequests: async () => {
        const me = get().me;
        if (!me || !isUuid(me.id)) return;
        try {
          const rows = await fetchMyMessageRequests(me.id);
          const remotePairs = new Set(rows.map((r) => `${r.from_id}->${r.to_id}`));
          // Keep optimistic local rows the server can't know yet.
          const localOnly = get().messageRequests.filter(
            (r) => r.from_id === me.id && r.status === 'pending' && !remotePairs.has(`${r.from_id}->${r.to_id}`),
          );
          set({ messageRequests: [...rows, ...localOnly] });
          void get().ensureDirectoryProfiles(
            rows.flatMap((r) => [r.from_id, r.to_id]),
          );
        } catch {
          // Table may not exist until the migration runs — local rows
          // still carry the same-device experience; never break boot.
        }
      },

      sendMessageRequest: (toId) => {
        const me = get().me;
        if (!me || !isUuid(me.id) || !isUuid(toId)) return;
        const existing = get().messageRequests.find(
          (r) => r.from_id === me.id && r.to_id === toId,
        );
        if (existing?.status === 'pending' || existing?.status === 'accepted') return;
        const row: MessageRequest = existing
          ? { ...existing, status: 'pending', created_at: new Date().toISOString() }
          : {
              id: crypto.randomUUID(),
              from_id: me.id,
              to_id: toId,
              status: 'pending',
              created_at: new Date().toISOString(),
            };
        set({
          messageRequests: existing
            ? get().messageRequests.map((r) => (r.id === existing.id ? row : r))
            : [...get().messageRequests, row],
        });
        void createMessageRequestRemote(row).catch(() => {});
      },

      respondToMessageRequest: (id, accept) => {
        const row = get().messageRequests.find((r) => r.id === id);
        if (!row) return;
        const status = accept ? 'accepted' : 'declined';
        set({
          messageRequests: get().messageRequests.map((r) =>
            r.id === id ? { ...r, status } : r,
          ),
        });
        void setMessageRequestStatusRemote(id, status).catch(() => {});
      },

      dmAccessFor: (userId) => {
        const me = get().me;
        if (!me) return 'follow_first';
        // Seed/NPC people (incl. Cruxy) have no follow graph — open.
        if (!isUuid(userId)) return 'open';
        if (get().cruxmates.includes(userId)) return 'open';
        const rows = get().messageRequests;
        const out = rows.find((r) => r.from_id === me.id && r.to_id === userId);
        const inc = rows.find((r) => r.from_id === userId && r.to_id === me.id);
        if (out?.status === 'accepted' || inc?.status === 'accepted') return 'open';
        if (inc?.status === 'pending') return 'pending_in';
        if (out?.status === 'pending') return 'pending_out';
        if (out?.status === 'declined' || inc?.status === 'declined') return 'declined';
        return get().mateRequestFor(userId) === 'outgoing' ? 'request' : 'follow_first';
      },

      mateRequestFor: (userId) => {
        const me = get().me;
        if (!me) return null;
        const rows = get().mateRequests.filter((r) => r.status !== 'denied');
        const out = rows.some((r) => r.from_id === me.id && r.to_id === userId);
        const inc = rows.some((r) => r.to_id === me.id && r.from_id === userId);
        if (out && inc) return null; // mutual — the cruxmate state speaks
        if (out) return 'outgoing';
        if (inc) return 'incoming';
        return null;
      },

      requestCruxmate: (userId) => {
        const me = get().me;
        if (!me || userId === me.id) return 'already';
        // Seed NPCs (Cruxy included) have no follow graph: following one
        // resolves instantly, exactly like the old addCruxMate. The gate
        // is the id SHAPE, never `users` membership: real directory users
        // are resolved into `users` too, so a membership check made every
        // real add instant (Lucy's 2026-10-15 report). Seed/demo ids are
        // slugs ('cruxy'); real accounts — guests included — are UUIDs.
        if (!isUuid(userId)) {
          get().addCruxMate(userId);
          return 'instant';
        }
        if (get().cruxmates.includes(userId)) return 'already';
        const rows = get().mateRequests.filter((r) => r.status !== 'denied');
        if (rows.some((r) => r.from_id === me.id && r.to_id === userId)) return 'requested';
        const followsMe = rows.some((r) => r.to_id === me.id && r.from_id === userId);
        const row: MateRequest = {
          id: crypto.randomUUID(),
          from_id: me.id,
          to_id: userId,
          status: 'pending',
          created_at: new Date().toISOString(),
        };
        set({ mateRequests: [...get().mateRequests, row] });
        if (isUuid(me.id)) {
          void createMateRequestRemote(row).catch(() => {});
        }
        if (followsMe) {
          // Follow-back: the mutual state forms on THIS tap. This side
          // gets the card-reveal moment (same seat the old accept had).
          set({ cruxmates: [...get().cruxmates, userId] });
          get().collectCard(userId, 'cruxmate');
          return 'accepted';
        }
        return 'sent';
      },

      cancelMateRequest: (userId) => {
        // Unfollow: my follow row goes away. If we were mutual, the
        // friendship ends on my side now and on theirs at their next
        // sync (their fetch re-derives mutuality). Cards stay collected.
        const me = get().me;
        if (!me) return;
        const row = get().mateRequests.find(
          (r) => r.from_id === me.id && r.to_id === userId,
        );
        if (row) {
          set({ mateRequests: get().mateRequests.filter((r) => r.id !== row.id) });
          void deleteMateRequestRemote(row.id).catch(() => {});
        }
        if (get().cruxmates.includes(userId)) {
          set({ cruxmates: get().cruxmates.filter((id) => id !== userId) });
        }
      },

      acceptMateRequest: (id) => {
        // Follow back from the inbox: the same act as tapping Follow on
        // someone who already follows me. Their row stays (it's their
        // follow); requestCruxmate creates mine and forms the mutual.
        const req = get().mateRequests.find((r) => r.id === id);
        if (!req) return;
        get().requestCruxmate(req.from_id);
      },

      dismissFollower: (userId) => {
        if (get().dismissedFollowers.includes(userId)) return;
        set({ dismissedFollowers: [...get().dismissedFollowers, userId] });
      },

      markThreadRead: (key: string) => {
        set({ chatReads: { ...get().chatReads, [key]: new Date().toISOString() } });
      },

      toggleReactionDm: (userId: string, msgId: string, key: ReactionKey) => {
        const me = get().me;
        if (!me) return;
        set({
          chats: {
            ...get().chats,
            [userId]: (get().chats[userId] ?? []).map((m) => {
              if (m.id !== msgId) return m;
              const reactions = m.reactions ?? [];
              const has = reactions.find((r) => r.by === me.id && r.key === key);
              const next = has
                ? reactions.filter((r) => !(r.by === me.id && r.key === key))
                : [...reactions, { key, by: me.id }];
              return { ...m, reactions: next };
            }),
          },
        });
      },

      toggleReactionSession: (sessionChatId: string, msgId: string, key: ReactionKey) => {
        const me = get().me;
        if (!me) return;
        const existing = get().sessionChats[sessionChatId];
        if (!existing) return;
        set({
          sessionChats: {
            ...get().sessionChats,
            [sessionChatId]: {
              ...existing,
              messages: existing.messages.map((m) => {
                if (m.id !== msgId) return m;
                const reactions = m.reactions ?? [];
                const has = reactions.find((r) => r.by === me.id && r.key === key);
                const next = has
                  ? reactions.filter((r) => !(r.by === me.id && r.key === key))
                  : [...reactions, { key, by: me.id }];
                return { ...m, reactions: next };
              }),
            },
          },
        });
      },

      ensureSessionChat: (
        id: string,
        source: 'session' | 'event' | 'call' | 'group',
        title: string,
        subtitle: string | undefined,
        participantIds: string[],
      ) => {
        const existing = get().sessionChats[id];
        const me = get().me;
        if (existing) {
          // Sync participants (someone else joined since we last checked)
          const merged = Array.from(new Set([...existing.participant_ids, ...participantIds]));
          if (merged.length !== existing.participant_ids.length) {
            set({
              sessionChats: {
                ...get().sessionChats,
                [id]: { ...existing, participant_ids: merged },
              },
            });
          }
          return;
        }
        // Fresh chat: seed with a system welcome message
        const now = new Date().toISOString();
        const welcome: ChatMessage = {
          id: uid('msg'),
          from: 'system',
          text: `Chat opened for ${title}. Say hi + confirm logistics.`,
          sent_at: now,
        };
        set({
          sessionChats: {
            ...get().sessionChats,
            [id]: {
              id,
              source,
              title,
              subtitle,
              participant_ids: Array.from(new Set([...participantIds, ...(me ? [me.id] : [])])),
              messages: [welcome],
            },
          },
        });
      },

      // Self-attestation: the climber declares the skill. Real trust comes from
      // partners confirming it after sessions (see setBelayConfirm), not a photo.
      submitVerification: (category) => {
        // Never downgrade a peer-confirmed skill back to self-reported.
        if (get().verifications[category]?.status === 'verified') return;
        set({
          verifications: {
            ...get().verifications,
            [category]: { status: 'self_attested', attested_at: new Date().toISOString() },
          },
        });
        get().checkBadges();
        // Publish the status to my profile row so other climbers can see it
        // (and peer confirms can later upgrade it server-side).
        const meId = get().me?.id;
        if (meId) {
          const json: Record<string, string> = {};
          for (const [cat, v] of Object.entries(get().verifications)) {
            if (v.status === 'self_attested' || v.status === 'verified') {
              json[cat] = v.status;
            }
          }
          void dbSetMyVerifications(meId, json);
        }
      },

      removeVerification: (category) => {
        // Only a self-report can be withdrawn; peer-confirmed is a
        // record of partners' confirmations, not a self-claim.
        if (get().verifications[category]?.status !== 'self_attested') return;
        set({
          verifications: {
            ...get().verifications,
            [category]: { status: 'unverified' },
          },
        });
        const meId = get().me?.id;
        if (meId) {
          const json: Record<string, string> = {};
          for (const [cat, v] of Object.entries(get().verifications)) {
            if (v.status === 'self_attested' || v.status === 'verified') {
              json[cat] = v.status;
            }
          }
          void dbSetMyVerifications(meId, json);
        }
      },

      setBelayConfirm: (sessionId, partnerId, value) => {
        const cur = get().recaps[sessionId];
        const base: SessionRecap = cur ?? {
          session_id: sessionId, logged_at: new Date().toISOString(),
          props: {}, partner_checks: {}, partner_flags: {}, belay_confirms: {},
        };
        set({
          recaps: {
            ...get().recaps,
            [sessionId]: { ...base, belay_confirms: { ...base.belay_confirms, [partnerId]: value } },
          },
        });
        // Sync to the private confirms table; the server derives the skill
        // from the session type and may flip the partner to peer-confirmed.
        void submitBelayConfirmRemote(sessionId, partnerId, value);
      },

      setRecapSummary: (sessionId, patch) => {
        const cur = get().recaps[sessionId];
        const base: SessionRecap = cur ?? {
          session_id: sessionId, logged_at: new Date().toISOString(),
          props: {}, partner_checks: {}, partner_flags: {}, belay_confirms: {},
        };
        set({
          recaps: {
            ...get().recaps,
            [sessionId]: { ...base, ...patch },
          },
        });
      },

      updateGearChecklist: (sessionId, item, checked) => {
        const cur = get().gearChecklists[sessionId] ?? {};
        set({
          gearChecklists: {
            ...get().gearChecklists,
            [sessionId]: { ...cur, [item]: checked },
          },
        });
      },

      logSessionRecap: (sessionId) => {
        const existing = get().recaps[sessionId];
        if (existing) return;
        const recap: SessionRecap = {
          session_id: sessionId,
          logged_at: new Date().toISOString(),
          props: {},
          partner_checks: {},
          partner_flags: {},
          belay_confirms: {},
        };
        set({ recaps: { ...get().recaps, [sessionId]: recap } });
        celebrate({
          emoji: '📓',
          title: 'Session logged!',
          subtitle: `Recap saved · +${XP.recap} XP`,
          colors: BRAND_COLORS,
        });
        get().addXp(XP.recap);
        get().checkBadges();
      },

      inviteCruxy: (sessionId) => {
        const session = get().sessions.find((s) => s.id === sessionId);
        if (!session || session.participant_ids.includes('cruxy')) return;
        set({
          cruxySessions: get().cruxySessions.includes(sessionId)
            ? get().cruxySessions
            : [...get().cruxySessions, sessionId],
          sessions: get().sessions.map((s) =>
            s.id === sessionId
              ? { ...s, participant_ids: [...s.participant_ids, 'cruxy'] }
              : s,
          ),
        });
      },

      inviteCruxyToCall: (callId) => {
        const call = get().climbCalls.find((c) => c.id === callId);
        if (!call || call.participant_ids.includes('cruxy')) return;
        set({
          cruxyCalls: get().cruxyCalls.includes(callId)
            ? get().cruxyCalls
            : [...get().cruxyCalls, callId],
          climbCalls: get().climbCalls.map((c) =>
            c.id === callId
              ? { ...c, participant_ids: [...c.participant_ids, 'cruxy'] }
              : c,
          ),
        });
      },

      suggestGym: async (name, city, note) => {
        set({
          gymSuggestions: [
            ...get().gymSuggestions,
            {
              name,
              city: city || undefined,
              note: note || undefined,
              at: new Date().toISOString(),
            },
          ],
        });
        // Remote insert is best-effort (table may not exist pre-migration);
        // the local copy above means the suggestion is never lost.
        await submitGymSuggestion(name, city, note);
      },

      // A suggested gym the user wants to use right now: appended to the
      // local gym list (persisted; syncSeedGyms preserves gym_local_* ids)
      // so it can be selected in the form immediately. Coords are unknown —
      // nothing reads lat/lng for rendering today.
      addLocalGym: (name, city, disciplines) => {
        const gym: Gym = {
          id: `gym_local_${Date.now().toString(36)}`,
          name,
          short_name: name,
          address: '',
          city: city || 'Seattle, WA',
          neighborhood: 'Suggested by you',
          lat: 0,
          lng: 0,
          disciplines,
          here_now: 0,
        };
        set({
          gyms: [...get().gyms, gym],
          gymPresence: { ...get().gymPresence, [gym.id]: 0 },
        });
        return gym;
      },

      startSession: (sessionId) => {
        const session = get().sessions.find((s) => s.id === sessionId);
        const cur = get().sessionLifecycle[sessionId];
        if (session?.started_at || cur?.started_at) return;
        const stamp = new Date().toISOString();
        set({
          sessionLifecycle: {
            ...get().sessionLifecycle,
            [sessionId]: { ...cur, started_at: stamp },
          },
          sessions: get().sessions.map((s) =>
            s.id === sessionId ? { ...s, started_at: s.started_at ?? stamp } : s,
          ),
        });
        // Sync to Supabase so every participant sees it live; the local
        // stamp above is the fallback until the lifecycle SQL has run.
        void dbSetSessionLifecycle(sessionId, { started_at: stamp });
      },

      finishSession: (sessionId) => {
        const session = get().sessions.find((s) => s.id === sessionId);
        const cur = get().sessionLifecycle[sessionId];
        const startedAt = session?.started_at ?? cur?.started_at;
        if (!startedAt || session?.finished_at || cur?.finished_at) return;
        const stamp = new Date().toISOString();
        set({
          sessionLifecycle: {
            ...get().sessionLifecycle,
            [sessionId]: { ...cur, finished_at: stamp },
          },
          sessions: get().sessions.map((s) =>
            s.id === sessionId ? { ...s, finished_at: s.finished_at ?? stamp } : s,
          ),
        });
        void dbSetSessionLifecycle(sessionId, { finished_at: stamp });
        // Finishing a session collects the crew's cards (direct sessions
        // included — the call-start path was previously the only one).
        get().collectSessionCards(sessionId);
      },

      collectSessionCards: (sessionId) => {
        const me = get().me;
        if (!me) return;
        if (get().sessionCardsCollected.includes(sessionId)) return;
        const s = get().sessions.find((x) => x.id === sessionId);
        if (!s || !s.participant_ids.includes(me.id)) return;
        const lifecycle = get().sessionLifecycle[sessionId];
        const started = s.started_at ?? lifecycle?.started_at;
        const finished = s.finished_at ?? lifecycle?.finished_at;
        if (!started || !finished) return;
        // Mark first: the sweep in fetchSessions re-runs often, and a
        // session must only ever add ONE "sessions together" tick.
        set({
          sessionCardsCollected: [...get().sessionCardsCollected, sessionId],
        });
        for (const otherId of s.participant_ids) {
          if (otherId !== me.id) {
            get().collectCard(otherId, 'session', { silent: true });
          }
        }
      },

      togglePartnerProp: (sessionId, partnerId, key) => {
        const cur = get().recaps[sessionId];
        const base: SessionRecap = cur ?? {
          session_id: sessionId, logged_at: new Date().toISOString(),
          props: {}, partner_checks: {}, partner_flags: {}, belay_confirms: {},
        };
        const given = base.props[partnerId] ?? [];
        const next = given.includes(key)
          ? given.filter((k) => k !== key)
          : [...given, key];
        set({
          recaps: {
            ...get().recaps,
            [sessionId]: { ...base, props: { ...base.props, [partnerId]: next } },
          },
        });
        get().checkBadges();
      },

      setPartnerCheck: (sessionId, partnerId, check, flag) => {
        const cur = get().recaps[sessionId];
        const base: SessionRecap = cur ?? {
          session_id: sessionId, logged_at: new Date().toISOString(),
          props: {}, partner_checks: {}, partner_flags: {}, belay_confirms: {},
        };
        const flags = { ...base.partner_flags };
        if (check === 'flagged' && flag) flags[partnerId] = flag;
        else delete flags[partnerId];
        set({
          recaps: {
            ...get().recaps,
            [sessionId]: {
              ...base,
              partner_checks: { ...base.partner_checks, [partnerId]: check },
              partner_flags: flags,
            },
          },
        });
        get().checkBadges();
      },

      setFilter: (patch) => set({ filters: { ...get().filters, ...patch } }),
      setL1: (l1) =>
        set({
          filters: {
            ...get().filters,
            l1,
            // reset context-specific selections on L1 switch
            climb_styles: [],
            hike_types: [],
            event_types: [],
            looking_for: undefined,
            weight_safe_only: false,
            gym_id: undefined,
            area: undefined,
            grade_band: undefined,
            date: undefined,
            date_specific: undefined,
            time: undefined,
            free_only: false,
          },
        }),
      clearFilters: () =>
        set({
          filters: {
            ...get().filters,
            climb_styles: [],
            hike_types: [],
            event_types: [],
            looking_for: undefined,
            weight_safe_only: false,
            gym_id: undefined,
            area: undefined,
            grade_band: undefined,
            date: undefined,
            date_specific: undefined,
            time: undefined,
            free_only: false,
          },
        }),

      checkBadges: () => {
        const s = get();
        const me = s.me;
        if (!me) return;
        const newBadges = new Set(s.badges);

        // first_session
        if (s.sessions.some((sess) => sess.participant_ids.includes(me.id))) {
          newBadges.add('first_session');
        }
        // first_recap — logged a past session (props or check)
        if (Object.keys(s.recaps).length > 0) {
          newBadges.add('first_recap');
        }
        // verified_belayer
        if (Object.values(s.verifications).some((v) => v.status === 'verified')) {
          newBadges.add('verified_belayer');
        }
        // adventurer
        if (s.sessions.some((sess) => sess.participant_ids.includes(me.id) && sess.location_type === 'outdoor')) {
          newBadges.add('adventurer');
        }
        // community
        if (s.myGroupMemberships.length > 0) {
          newBadges.add('community');
        }
        // cruxmate_x5
        if (s.cruxmates.length >= 5) {
          newBadges.add('cruxmate_x5');
        }
        // trust_champion
        if (
          s.verifications.top_rope.status === 'verified' &&
          s.verifications.lead.status === 'verified' &&
          s.verifications.trad.status === 'verified'
        ) {
          newBadges.add('trust_champion');
        }

        const arr = Array.from(newBadges) as BadgeId[];
        if (arr.length !== s.badges.length) {
          set({ badges: arr });
        }
      },
    }),
    {
      name: 'cruxmate-v1',
      version: 23,
      /**
       * v16 → v17: sessions + climb calls move to real Supabase tables.
       *   Drop persisted mock sessions/calls (and their chats/pairings/
       *   recaps); fetchSessions/fetchClimbCalls repopulate from the backend.
       * v15 → v16: real Supabase auth replaces the mock demo identity.
       * v1 → v2: ClimbCall.role → looking_for.
       * v2 → v4: Seattle gym roster refreshed (Bouldering Project rebrand,
       *   new boutique gyms Castle / Half Moon, Momentum SODO, SBP U District).
       *   Refresh persisted `gyms` + backfill presence, and repoint any
       *   persisted belay call that's sitting at a bouldering-only gym onto a
       *   rope gym (Bouldering Project has no ropes). All gym_ids preserved.
       * v4 → v5: Real per-thread read tracking. Seed `chatReads` as "already
       *   read up to now" so pre-existing seeded chats don't all light up the
       *   badge on upgrade — only genuinely new incoming messages will.
       */
      migrate: (persisted: unknown, version: number) => {
        const s = persisted as Record<string, unknown> | null;
        if (!s) return s as never;
        if (version < 23) {
          // v22 → v23: finished-session card collection guard set.
          if (!Array.isArray(s.sessionCardsCollected)) s.sessionCardsCollected = [];
          if (!Array.isArray(s.dismissedFollowers)) s.dismissedFollowers = [];
        }
        if (version < 22) {
          // v21 → v22: manual session lifecycle (start/finish stamps).
          if (!s.sessionLifecycle || typeof s.sessionLifecycle !== 'object') {
            s.sessionLifecycle = {};
          }
        }
        if (version < 21) {
          // v20 → v21: gym short names rebranded BP -> SBP in the seed
          // (2b53b03) without a migration, so persisted gyms still said
          // "BP Poplar". Rewrite the prefix in persisted gym names.
          if (Array.isArray(s.gyms)) {
            s.gyms = (s.gyms as Array<Record<string, unknown>>).map((g) => ({
              ...g,
              name: typeof g.name === 'string' ? g.name.replace(/^BP /, 'SBP ') : g.name,
              short_name:
                typeof g.short_name === 'string'
                  ? g.short_name.replace(/^BP /, 'SBP ')
                  : g.short_name,
            }));
          }
        }
        if (version < 20) {
          // v19 → v20: card collection system. Initialize empty; existing
          // cruxmates don't retro-collect (their moment passed).
          if (!Array.isArray(s.collectedCards)) s.collectedCards = [];
          s.lastCollectedCard = null;
        }
        if (version < 19) {
          // v18 → v19: drop the old mock DM threads (Lilly/Marcus/Priya),
          // replaced by the Cruxy onboarding bot in 3a3082f. Removes them
          // from the cruxmate list, their chat threads, and read tracking.
          const MOCK_DM_IDS = ['usr_lilly', 'usr_marcus', 'usr_priya'];
          if (Array.isArray(s.cruxmates)) {
            s.cruxmates = (s.cruxmates as string[]).filter((id) => !MOCK_DM_IDS.includes(id));
          }
          if (s.chats && typeof s.chats === 'object') {
            for (const id of MOCK_DM_IDS) delete (s.chats as Record<string, unknown>)[id];
          }
          if (s.chatReads && typeof s.chatReads === 'object') {
            for (const id of MOCK_DM_IDS) delete (s.chatReads as Record<string, unknown>)[id];
          }
        }
        if (version < 18) {
          // v17 → v18: drop the last mocked events + crews (placeholders
          // removed from seed in f45aa8f). Only the exact old mock IDs are
          // removed — user-created items are untouched.
          const MOCK_EVENT_IDS = new Set([
            'evt_around_the_world_crawl', 'evt_backcountry_snow', 'evt_belay_match_night',
            'evt_bipoc_meetup', 'evt_blochaus_comp', 'evt_climb_refreshments',
            'evt_coffee_climbers', 'evt_crux8_launch_party', 'evt_intro_multi_pitch',
            'evt_mystery_crew_beginner', 'evt_mystery_crew_climb', 'evt_mystery_crew_send',
            'evt_queer_climb_night', 'evt_singles_climbing_night', 'evt_trad_anchors',
            'evt_womens_send',
          ]);
          const MOCK_GROUP_IDS = new Set([
            'grp_backcountry_coalition', 'grp_beginners_belay_buddies', 'grp_bipoc_climbers_pnw',
            'grp_cascade_alpine_club', 'grp_everett_boulderers', 'grp_movement_community',
            'grp_pnw_climbers', 'grp_rainier_mountaineers', 'grp_seattle_queer_climbers',
            'grp_send_train', 'grp_trad_dads_seattle', 'grp_women_plus_who_send',
          ]);
          if (Array.isArray(s.events)) {
            s.events = (s.events as Array<{ id: string }>).filter((e) => !MOCK_EVENT_IDS.has(e.id));
          }
          if (Array.isArray(s.groups)) {
            s.groups = (s.groups as Array<{ id: string }>).filter((g) => !MOCK_GROUP_IDS.has(g.id));
          }
          if (Array.isArray(s.myGroupMemberships)) {
            s.myGroupMemberships = (s.myGroupMemberships as string[]).filter(
              (id) => !MOCK_GROUP_IDS.has(id),
            );
          }
        }
        if (version < 16) {
          // Real Supabase auth replaces the mock demo identity (id 'me').
          // Drop the persisted mock `me` so the OTP login sheet takes over on
          // next launch (initAuth also reconciles this at boot), and strip the
          // stale 'me' marker from group member lists. Group/RSVP selections
          // in myGroupMemberships are preserved; the user re-joins under
          // their real id if needed.
          s.me = null;
          if (Array.isArray(s.groups)) {
            for (const g of s.groups as Array<Record<string, unknown>>) {
              const ids = g.member_ids as string[] | undefined;
              if (Array.isArray(ids) && ids.includes('me')) {
                g.member_ids = ids.filter((id) => id !== 'me');
                if (typeof g.member_count === 'number' && g.member_count > 0) {
                  g.member_count -= 1;
                }
              }
            }
          }
        }
        if (version < 17) {
          // v16 → v17: sessions and climb calls are now real Supabase data.
          // Drop the persisted mock collections so fetchSessions /
          // fetchClimbCalls repopulate from the backend; drop the mock
          // session/call group chats (mock ids carry ses_/call_ prefixes)
          // and any mock-derived pairing/recap state.
          s.sessions = [];
          s.climbCalls = [];
          s.pairRequests = [];
          s.recaps = {};
          const scs = s.sessionChats as Record<string, { id: string }> | undefined;
          if (scs) {
            for (const key of Object.keys(scs)) {
              if (key.startsWith('ses_') || key.startsWith('call_')) delete scs[key];
            }
          }
        }
        if (version < 15 && s.seededAt) {
          // Refresh all seeded events from seed (new flags like `mystery`,
          // capacity / copy / price changes) preserving the user's RSVPs, and
          // append any newly seeded events (e.g. the extra Mystery Crew nights).
          // User-created events (not in seed) are left untouched.
          const seedById = Object.fromEntries(SEED_EVENTS.map((e) => [e.id, e]));
          const existing = Array.isArray(s.events) ? (s.events as EventItem[]) : [];
          const haveIds = new Set(existing.map((e) => e.id));
          const refreshed = existing.map((e) =>
            seedById[e.id]
              ? { ...seedById[e.id], attendee_ids: e.attendee_ids, waitlist_ids: e.waitlist_ids }
              : e,
          );
          const missing = SEED_EVENTS.filter((e) => !haveIds.has(e.id));
          s.events = [...refreshed, ...missing];
        }
        if (version < 13 && s.seededAt) {
          // Refresh ticketed passes from seed (e.g. price change) while
          // preserving the user's attendee list.
          const seedTickets = Object.fromEntries(
            SEED_EVENTS.filter((e) => e.ticket).map((e) => [e.id, e]),
          );
          s.events = (Array.isArray(s.events) ? (s.events as EventItem[]) : []).map((e) =>
            seedTickets[e.id] ? { ...seedTickets[e.id], attendee_ids: e.attendee_ids } : e,
          );
        }
        if (version < 12) {
          // Ticketed passes: ensure the new field exists, and append any
          // newly-seeded events (e.g. the "Around the World" gym crawl).
          if (!Array.isArray(s.ticketPurchases)) s.ticketPurchases = [];
          if (s.seededAt) {
            const existing = Array.isArray(s.events) ? (s.events as EventItem[]) : [];
            const haveIds = new Set(existing.map((e) => e.id));
            const missing = SEED_EVENTS.filter((e) => !haveIds.has(e.id));
            s.events = [...existing, ...missing];
          }
        }
        if (version < 10 && s.seededAt) {
          // Promoted events: append any newly-seeded events (e.g. the featured
          // Crux8 spotlight events) that the persisted store doesn't have yet.
          // Match by id so user RSVPs on existing events are preserved.
          const existing = Array.isArray(s.events) ? (s.events as EventItem[]) : [];
          const haveIds = new Set(existing.map((e) => e.id));
          const missing = SEED_EVENTS.filter((e) => !haveIds.has(e.id));
          s.events = [...existing, ...missing];
        }
        if (version < 9 && s.seededAt) {
          // Group management: refresh seeded groups so new fields (avatar,
          // banner, member roster, join policy, survey, pending requests) appear.
          // Preserve the user's own memberships by re-adding 'me' to member_ids
          // for any group they'd already joined.
          const joined = new Set(Array.isArray(s.myGroupMemberships) ? (s.myGroupMemberships as string[]) : []);
          s.groups = SEED_GROUPS.map((g) =>
            joined.has(g.id) && !(g.member_ids ?? []).includes('me')
              ? { ...g, member_ids: [...(g.member_ids ?? []), 'me'], member_count: g.member_count + 1 }
              : g
          );
        }
        if (version < 8) {
          // Belay verification moved from cert-upload → self-attest + peer check.
          // Backfill recap.belay_confirms and clear any stale "pending" reviews.
          const recaps = (s.recaps as Record<string, Record<string, unknown>>) ?? {};
          for (const r of Object.values(recaps)) {
            if (!r.belay_confirms) r.belay_confirms = {};
          }
          const vers = (s.verifications as Record<string, { status?: string }>) ?? {};
          for (const v of Object.values(vers)) {
            if (v.status === 'pending') v.status = 'self_attested';
          }
        }
        if (version < 7) {
          // Backfill me.avatar for profiles that predate the avatar config
          // (old schema only had `avatar_url`), so the customizer never sees undefined.
          const me = s.me as Record<string, unknown> | null;
          if (me && !me.avatar) {
            me.avatar = avatarFromSeed(typeof me.display_name === 'string' ? me.display_name : 'anon');
          }
        }
        if (version < 6) {
          if (typeof s.xp !== 'number') s.xp = 0;
          if (!Array.isArray(s.sends)) s.sends = [];
          if (s.lastCheckinDay === undefined) s.lastCheckinDay = null;
        }
        if (version < 5) {
          const now = new Date().toISOString();
          const reads = (s.chatReads as Record<string, string>) ?? {};
          for (const userId of Array.isArray(s.cruxmates) ? s.cruxmates : []) {
            reads[dmKey(userId as string)] = now;
          }
          const scs = (s.sessionChats as Record<string, { id: string }>) ?? {};
          for (const id of Object.keys(scs)) reads[scKey(id)] = now;
          s.chatReads = reads;
        }
        if (version < 4 && s.seededAt) {
          s.gyms = SEED_GYMS;
          const presence = (s.gymPresence as Record<string, number>) ?? {};
          for (const g of SEED_GYMS) {
            if (presence[g.id] === undefined) presence[g.id] = g.here_now;
          }
          s.gymPresence = presence;

          // Repoint rope calls stranded at bouldering-only gyms.
          const ropeGymIds = SEED_GYMS.filter((g) => g.disciplines.some((d) => d === 'top_rope' || d === 'lead'));
          const gymById = Object.fromEntries(SEED_GYMS.map((g) => [g.id, g]));
          const fallbackRopeGym = ropeGymIds[0]?.id ?? 'gym_vertical_world';
          const calls = Array.isArray(s.climbCalls) ? s.climbCalls : [];
          s.climbCalls = calls.map((c) => {
            const call = c as Record<string, unknown>;
            if (call.location_type !== 'indoor' || !call.gym_id) return call;
            const gym = gymById[call.gym_id as string];
            const roped = gym?.disciplines.some((d) => d === 'top_rope' || d === 'lead');
            return roped ? call : { ...call, gym_id: fallbackRopeGym };
          });
        }
        if (version < 2) {
          const flip: Record<string, 'belayer' | 'climber' | 'take_turns'> = {
            climber: 'belayer',   // they climb → they need a belayer
            belayer: 'climber',   // they belay → they need a climber
            both: 'take_turns',
          };
          const calls = Array.isArray(s.climbCalls) ? s.climbCalls : [];
          s.climbCalls = calls.map((c) => {
            const call = c as Record<string, unknown>;
            if (call.looking_for) return call;
            const legacy = typeof call.role === 'string' ? call.role : 'both';
            const { role: _drop, ...rest } = call;
            return { ...rest, looking_for: flip[legacy] ?? 'take_turns' };
          });
          // Filter state also renamed role → looking_for
          const filters = s.filters as Record<string, Record<string, unknown>> | undefined;
          if (filters?.indoor && 'role' in filters.indoor) {
            const { role: _r, ...restIndoor } = filters.indoor;
            filters.indoor = { ...restIndoor, looking_for: undefined };
          }
        }
        return s as never;
      },
      /**
       * Cruxy invariant (regression 2026-10-15): every rehydration repairs
       * the cruxy cruxmate + user-record pair. The create-session/call forms
       * hide their entire "Invite cruxmates" section when 'cruxy' no longer
       * resolves through resolveUser (users record missing) — a desync that
       * can land in persisted state after auth/guest/account-switch flows,
       * where seedIfEmpty early-returns on seededAt and never repairs it.
       * ensureCruxyThread is idempotent and a no-op when the pair is intact,
       * so this is free on every load. Cruxy is a global seed NPC, not
       * per-account data, so this never breaks the account-switch isolation
       * in prepareForUser.
       */
      onRehydrateStorage: () => () => {
        useAppStore.getState().ensureCruxyThread();
      },
    }
  )
);
