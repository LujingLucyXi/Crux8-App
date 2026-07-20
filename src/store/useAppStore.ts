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
  Rating,
  VerificationCategory,
  VerificationStatus,
  Style,
} from '@/seed/types';
import {
  SEED_GYMS,
  SEED_ROUTES,
  SEED_SESSIONS,
  SEED_EVENTS,
  SEED_GROUPS,
  SEED_USERS,
  SEED_CRUXMATES,
} from '@/seed';
import { uid } from '@/lib/utils';

export type Verification = { status: VerificationStatus; photo_url?: string; verified_at?: string };

export interface FiltersIndoor {
  gym_id?: string;
  date?: 'today' | 'tomorrow' | 'this_week';
  time?: 'morning' | 'afternoon' | 'evening';
  styles: string[];
  grade_band?: string;
}

export interface FiltersOutdoor {
  area?: string;
  date?: 'today' | 'tomorrow' | 'this_week';
  time?: 'morning' | 'afternoon' | 'evening';
  styles: string[];
  grade_band?: string;
  route_id?: string;
}

export interface FiltersEvents {
  types: string[];
  date?: 'today' | 'tomorrow' | 'this_week';
  time?: 'morning' | 'afternoon' | 'evening';
  host?: string;
  freeOnly: boolean;
}

export type BadgeId =
  | 'first_session'
  | 'first_send'
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

  // relations
  myGroupMemberships: string[];
  cruxmates: string[];
  chats: Record<string, ChatMessage[]>;
  verifications: Record<VerificationCategory, Verification>;
  gearChecklists: Record<string, Record<string, boolean>>;
  badges: BadgeId[];
  ratings: Record<string, Rating>;

  // UI state
  filters: {
    tab: 'indoor' | 'outdoor' | 'events';
    indoor: FiltersIndoor;
    outdoor: FiltersOutdoor;
    events: FiltersEvents;
  };
  seededAt: number | null;

  // ---------- actions ----------
  seedIfEmpty: () => void;
  signUp: (input: { display_name: string; pronouns?: string; dob?: string }) => void;
  completeOnboarding: (patch: Partial<Profile>) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  signOut: () => void;
  resetAll: () => void;

  rsvp: (sessionId: string) => void;
  unrsvp: (sessionId: string) => void;
  rsvpEvent: (eventId: string, waitlist?: boolean) => void;
  unrsvpEvent: (eventId: string) => void;

  postSession: (session: Omit<Session, 'id' | 'host_id' | 'participant_ids'>) => Session;
  postEvent: (event: Omit<EventItem, 'id' | 'attendee_ids' | 'waitlist_ids'>) => EventItem;

  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;

  addCruxMate: (userId: string) => void;
  removeCruxMate: (userId: string) => void;

  sendMessage: (userId: string, text: string) => void;

  submitVerification: (category: VerificationCategory, photo_url?: string) => void;

  updateGearChecklist: (sessionId: string, item: string, checked: boolean) => void;

  submitRating: (sessionId: string, rating: Rating) => void;

  setFilterTab: (tab: 'indoor' | 'outdoor' | 'events') => void;
  setIndoorFilter: (patch: Partial<FiltersIndoor>) => void;
  setOutdoorFilter: (patch: Partial<FiltersOutdoor>) => void;
  setEventsFilter: (patch: Partial<FiltersEvents>) => void;
  clearFilters: () => void;

  checkBadges: () => void;
}

const initialVerifications: Record<VerificationCategory, Verification> = {
  top_rope: { status: 'unverified' },
  lead: { status: 'unverified' },
  trad: { status: 'unverified' },
};

const initialFilters: Store['filters'] = {
  tab: 'indoor',
  indoor: { styles: [] },
  outdoor: { styles: [] },
  events: { types: [], freeOnly: false },
};

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
      myGroupMemberships: [],
      cruxmates: [],
      chats: {},
      verifications: initialVerifications,
      gearChecklists: {},
      badges: [],
      ratings: {},
      filters: initialFilters,
      seededAt: null,

      seedIfEmpty: () => {
        if (get().seededAt) return;
        set({
          gyms: SEED_GYMS,
          routes: SEED_ROUTES,
          sessions: SEED_SESSIONS,
          events: SEED_EVENTS,
          groups: SEED_GROUPS,
          users: SEED_USERS,
          cruxmates: SEED_CRUXMATES,
          myGroupMemberships: ['grp_seattle_queer_climbers'],
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
      },

      signUp: ({ display_name, pronouns, dob }) => {
        const me: Profile = {
          id: 'me',
          display_name,
          pronouns,
          dob,
          avatar_url: `https://i.pravatar.cc/128?img=4`,
          home_gym_id: 'gym_vertical_world',
          top_grade: '5.10c',
          preferred_styles: ['top_rope', 'lead', 'outdoor_sport'],
          about: '',
        };
        set({ me });
      },

      completeOnboarding: (patch) => {
        const cur = get().me;
        if (!cur) return;
        set({ me: { ...cur, ...patch } });
      },

      updateProfile: (patch) => {
        const cur = get().me;
        if (!cur) return;
        set({ me: { ...cur, ...patch } });
      },

      signOut: () => {
        set({ me: null });
      },

      resetAll: () => {
        set({
          me: null,
          sessions: [],
          events: [],
          groups: [],
          users: [],
          myGroupMemberships: [],
          cruxmates: [],
          chats: {},
          verifications: initialVerifications,
          gearChecklists: {},
          badges: [],
          ratings: {},
          filters: initialFilters,
          seededAt: null,
        });
      },

      rsvp: (sessionId) => {
        const me = get().me;
        if (!me) return;
        set({
          sessions: get().sessions.map((s) =>
            s.id === sessionId && !s.participant_ids.includes(me.id)
              ? { ...s, participant_ids: [...s.participant_ids, me.id] }
              : s
          ),
        });
        get().checkBadges();
      },

      unrsvp: (sessionId) => {
        const me = get().me;
        if (!me) return;
        set({
          sessions: get().sessions.map((s) =>
            s.id === sessionId
              ? { ...s, participant_ids: s.participant_ids.filter((id) => id !== me.id) }
              : s
          ),
        });
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

      postSession: (session) => {
        const me = get().me!;
        const newSession: Session = {
          ...session,
          id: uid('ses'),
          host_id: me.id,
          participant_ids: [me.id],
        };
        set({ sessions: [newSession, ...get().sessions] });
        return newSession;
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

      joinGroup: (groupId) => {
        if (get().myGroupMemberships.includes(groupId)) return;
        set({
          myGroupMemberships: [...get().myGroupMemberships, groupId],
          groups: get().groups.map((g) =>
            g.id === groupId ? { ...g, member_count: g.member_count + 1 } : g
          ),
        });
        get().checkBadges();
      },

      leaveGroup: (groupId) => {
        set({
          myGroupMemberships: get().myGroupMemberships.filter((id) => id !== groupId),
          groups: get().groups.map((g) =>
            g.id === groupId ? { ...g, member_count: Math.max(0, g.member_count - 1) } : g
          ),
        });
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
        });
      },

      submitVerification: (category, photo_url) => {
        set({
          verifications: {
            ...get().verifications,
            [category]: { status: 'pending', photo_url },
          },
        });
        // Auto-approve after 5s (v0.5). TODO(trust): replace with admin flow in v1.
        setTimeout(() => {
          const cur = get().verifications[category];
          if (cur.status === 'pending') {
            set({
              verifications: {
                ...get().verifications,
                [category]: { status: 'verified', photo_url, verified_at: new Date().toISOString() },
              },
            });
            get().checkBadges();
          }
        }, 5000);
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

      submitRating: (sessionId, rating) => {
        set({
          ratings: { ...get().ratings, [sessionId]: rating },
        });
      },

      setFilterTab: (tab) => set({ filters: { ...get().filters, tab } }),
      setIndoorFilter: (patch) =>
        set({ filters: { ...get().filters, indoor: { ...get().filters.indoor, ...patch } } }),
      setOutdoorFilter: (patch) =>
        set({ filters: { ...get().filters, outdoor: { ...get().filters.outdoor, ...patch } } }),
      setEventsFilter: (patch) =>
        set({ filters: { ...get().filters, events: { ...get().filters.events, ...patch } } }),
      clearFilters: () => set({ filters: { ...get().filters, indoor: { styles: [] }, outdoor: { styles: [] }, events: { types: [], freeOnly: false } } }),

      checkBadges: () => {
        const s = get();
        const me = s.me;
        if (!me) return;
        const newBadges = new Set(s.badges);

        // first_session
        if (s.sessions.some((sess) => sess.participant_ids.includes(me.id))) {
          newBadges.add('first_session');
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
      version: 1,
    }
  )
);
