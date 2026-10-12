import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Profile,
  Session,
  EventItem,
  Group,
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
  setSessionRsvp,
  fetchClimbCalls as dbFetchClimbCalls,
  createClimbCall as dbCreateClimbCall,
  setCallPairing,
  fetchDirectoryProfiles,
  type DirectoryProfile,
} from '@/lib/db';
import { resolveUser } from '@/lib/resolveUser';

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
  date?: 'today' | 'tomorrow' | 'this_week';
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
  chats: Record<string, ChatMessage[]>;                 // 1:1 DMs, keyed by userId
  sessionChats: Record<string, SessionChat>;            // group chats, keyed by session/event/call id
  chatReads: Record<string, string>;                    // thread key -> ISO of last time I read it
  verifications: Record<VerificationCategory, Verification>;
  gearChecklists: Record<string, Record<string, boolean>>;
  badges: BadgeId[];
  recaps: Record<string, SessionRecap>;       // sessionId -> recap
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
  /** Load sessions / climb calls from Supabase (real backend). */
  fetchSessions: () => Promise<void>;
  fetchClimbCalls: () => Promise<void>;
  /** Fetch unknown user ids into `directory` for display resolution. */
  ensureDirectoryProfiles: (ids: string[]) => Promise<void>;
  // Real auth (Supabase email OTP). Replaces the old mock `signUp`.
  sendOtp: (email: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  verifyOtp: (email: string, code: string) => Promise<{ ok: true } | { ok: false; error: string }>;
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
  /** Reconcile persisted state with the Supabase session on app boot. */
  initAuth: () => Promise<void>;
  completeOnboarding: (patch: Partial<Profile>) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  signOut: () => Promise<void>;
  resetAll: () => void;

  rsvp: (sessionId: string) => Promise<void>;
  unrsvp: (sessionId: string) => Promise<void>;
  rsvpEvent: (eventId: string, waitlist?: boolean) => void;
  unrsvpEvent: (eventId: string) => void;
  buyTicket: (eventId: string) => void;
  stampPass: (eventId: string, gymId: string) => void;
  subscribeMysteryPass: () => void;

  postSession: (session: Omit<Session, 'id' | 'host_id' | 'participant_ids'>) => Promise<Session>;
  postEvent: (event: Omit<EventItem, 'id' | 'attendee_ids' | 'waitlist_ids'>) => EventItem;
  postClimbCall: (call: Omit<ClimbCall, 'id' | 'user_id' | 'status' | 'participant_ids'>) => Promise<ClimbCall>;
  requestPair: (callId: string) => Promise<void>;
  cancelPairRequest: (callId: string) => Promise<void>;

  checkIn: (gymId: string) => void;
  checkOut: () => void;

  addXp: (amount: number) => void;
  logSend: (input: { grade: string; discipline: SendLog['discipline']; style: SendLog['style']; note?: string }) => void;

  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
  requestToJoinGroup: (groupId: string, answers: string[]) => void;
  approveJoinRequest: (groupId: string, userId: string) => void;
  declineJoinRequest: (groupId: string, userId: string) => void;
  addGroupAdmin: (groupId: string, userId: string) => void;
  removeGroupAdmin: (groupId: string, userId: string) => void;
  removeGroupMember: (groupId: string, userId: string) => void;
  updateGroup: (groupId: string, patch: Partial<Group>) => void;
  openGroupChat: (groupId: string) => void;

  addCruxMate: (userId: string) => void;
  removeCruxMate: (userId: string) => void;

  sendMessage: (userId: string, text: string) => void;
  sendSessionMessage: (sessionChatId: string, text: string) => void;
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

  updateGearChecklist: (sessionId: string, item: string, checked: boolean) => void;

  logSessionRecap: (sessionId: string) => void;
  togglePartnerProp: (sessionId: string, partnerId: string, key: ReactionKey) => void;
  setPartnerCheck: (sessionId: string, partnerId: string, check: PartnerCheck, flag?: PartnerFlag) => void;
  setBelayConfirm: (sessionId: string, partnerId: string, value: BelayConfirm) => void;

  setFilter: (patch: Partial<Filters>) => void;
  setL1: (l1: Filters['l1']) => void;
  clearFilters: () => void;

  checkBadges: () => void;
}

// Thread-key helpers: namespace DM and session-chat reads in one map.
export const dmKey = (userId: string) => `dm:${userId}`;
export const scKey = (sessionChatId: string) => `sc:${sessionChatId}`;

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
      myGroupMemberships: [],
      ticketPurchases: [],
      ticketRedemptions: {},
      mysteryMemberUntil: null,
      cruxmates: [],
      chats: {},
      sessionChats: {},
      chatReads: {},
      verifications: initialVerifications,
      gearChecklists: {},
      badges: [],
      recaps: {},
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
          chats: {
            usr_lilly: [
              { id: uid('msg'), from: 'usr_lilly', text: 'Down for the top rope sesh tonight?', sent_at: new Date(Date.now() - 3600_000).toISOString() },
              { id: uid('msg'), from: 'me', text: 'Yes! Meet at 5?', sent_at: new Date(Date.now() - 3500_000).toISOString() },
              { id: uid('msg'), from: 'usr_lilly', text: 'Perfect — see you there.', sent_at: new Date(Date.now() - 3400_000).toISOString() },
            ],
            usr_marcus: [
              { id: uid('msg'), from: 'usr_marcus', text: 'Index next Sunday?', sent_at: new Date(Date.now() - 86400_000).toISOString() },
            ],
            usr_priya: [
              { id: uid('msg'), from: 'me', text: 'Sending party at BlocHaus tomorrow?', sent_at: new Date(Date.now() - 7200_000).toISOString() },
              { id: uid('msg'), from: 'usr_priya', text: 'Already RSVPd 🎯', sent_at: new Date(Date.now() - 7100_000).toISOString() },
            ],
          },
          seededAt: Date.now(),
        });
        // Sessions and climb calls now come from Supabase (real backend).
        void get().fetchSessions();
        void get().fetchClimbCalls();
      },

      fetchSessions: async () => {
        set({ sessionsLoading: true });
        try {
          const sessions = await dbFetchSessions();
          set({ sessions });
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
          const climbCalls = await dbFetchClimbCalls();
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
        set({ me: profileRowToProfile(user.id, user.email ?? normalizedEmail, row) });
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
        set({ me: profileRowToProfile(user.id, user.email ?? normalizedEmail, row) });
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
        set({ me: profileRowToProfile(user.id, user.email ?? normalizedEmail, row) });
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
        const applySessionUser = async (userId: string, email: string) => {
          const row = await fetchMyProfile(userId).catch(() => null);
          set({ me: profileRowToProfile(userId, email, row) });
        };
        const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
        const sessionUser = data.session?.user ?? null;
        if (!sessionUser) {
          if (get().me) set({ me: null });
        } else {
          await applySessionUser(sessionUser.id, sessionUser.email ?? '');
        }
        if (!initAuthSubscribed) {
          initAuthSubscribed = true;
          supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
              set({ me: null });
            } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
              await applySessionUser(session.user.id, session.user.email ?? '');
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

      signOut: async () => {
        await supabase.auth.signOut().catch(() => {});
        set({ me: null });
      },

      resetAll: () => {
        set({
          me: null,
          sessions: [],
          events: [],
          groups: [],
          users: [],
          directory: {},
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
          checkin: null,
          gymPresence: {},
          xp: 0,
          sends: [],
          lastCheckinDay: null,
          filters: initialFilters,
          seededAt: null,
        });
      },

      rsvp: async (sessionId) => {
        const me = get().me;
        if (!me) return;
        const already = get().sessions.find((s) => s.id === sessionId)?.participant_ids.includes(me.id);
        set({
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
        const created = await dbCreateSession({ ...session, host_id: me.id });
        set({ sessions: [created, ...get().sessions] });
        void get().ensureDirectoryProfiles([created.host_id]);
        return created;
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

      addCruxMate: (userId) => {
        if (get().cruxmates.includes(userId)) return;
        set({ cruxmates: [...get().cruxmates, userId] });
        get().checkBadges();
      },

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
      },

      sendSessionMessage: (sessionChatId: string, text: string) => {
        const now = new Date().toISOString();
        const msg: ChatMessage = { id: uid('msg'), from: 'me', text, sent_at: now };
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
        set({
          verifications: {
            ...get().verifications,
            [category]: { status: 'self_attested', attested_at: new Date().toISOString() },
          },
        });
        get().checkBadges();
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
      version: 17,
      /**
       * v16 → v17: sessions + climb calls move to real Supabase tables.
       *   Drop persisted mock sessions/calls (and their chats/pairings/
       *   recaps); fetchSessions/fetchClimbCalls repopulate from the backend.
       * v15 → v16: real Supabase auth replaces the mock demo identity.
       * v1 → v2: ClimbCall.role → looking_for.
       * v2 → v4: Seattle gym roster refreshed (Bouldering Project rebrand,
       *   new boutique gyms Castle / Half Moon, Momentum SODO, BP U District).
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
    }
  )
);
