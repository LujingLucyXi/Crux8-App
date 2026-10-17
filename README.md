# Crux8

Find climbing partners, post sessions, and build your crew.

**Live:** [crux8.app](https://crux8.app) · **Personality quiz:** [play.crux8.app](https://play.crux8.app) (separate repo)

Crux8 is a climbing community app built around real sessions with real people: post a climb, invite your cruxmates, collect cards from the people you climb with, and grow a crew. Web-first, no install required.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/).

```bash
npm run build     # typecheck (tsc -b) + production build
npm run lint      # oxlint
npm run sync:ios  # build + Capacitor iOS sync
```

## Tech stack

- **Vite + React 19 + TypeScript**
- **React Router v7**
- **Tailwind CSS v3** — brand tokens in `tailwind.config.js` (`ink` / `teal` / `gold` / `coral` / `sky` / `paper`)
- **Supabase** — Auth + Postgres with Row Level Security (`@supabase/supabase-js`)
- **Zustand** with `persist` middleware for on-device state
- **Capacitor 8** for the iOS shell
- **Radix UI** primitives, **Iconoir** + **Lucide** icons, **Sonner** toasts, **Framer Motion**, **date-fns**

## What the app does

- **Sessions & climb calls** — post a session (indoor / outdoor, boulder / top rope / lead / hike) or a 1:1 climb call; RSVP, capacity, host controls. Sessions can be free-join or approval-required.
- **Cruxmates** — Instagram-style follow graph; mutual follows are cruxmates. Inviting someone to a session, call, or crew makes you cruxmates automatically, and joining through a personal `/add/:code` invite link auto-befriends you with the inviter.
- **Invites & notifications** — session and call invitations land in a dedicated Notifications page as cards with Accept / Decline.
- **Crews** — community groups with admins, join policies (open or request-to-join with a survey), member management, and group chat.
- **Chat** — 1:1 DMs (with message requests for non-cruxmates) and per-session group chats.
- **The Vault** — a collectible card for every cruxmate and every session you complete, at `/collection`.
- **Avatars** — a drawn-avatar customizer with optional photo upload; belay verification (self-attested, then peer-confirmed).

## Data model notes

Two storage worlds, deliberately:

- **Server (Supabase)** — profiles, the directory, sessions, RSVPs, climb calls, the follow graph (`cruxmate_requests`), invites, message requests. The follow graph syncs across devices: log in anywhere and your cruxmates are re-derived from the server rows.
- **On-device (localStorage)** — chat message bodies and the card Vault. These do not follow you to a second device yet.

Auth is password-first, with Google sign-in and email codes (custom SMTP via Resend).

## Database changes

Schema changes ship as idempotent SQL migrations in [`supabase/migrations/`](supabase/migrations/), applied manually in the Supabase SQL Editor. Every migration is guarded (`if not exists`, `create or replace`, policy-existence checks), so re-running one is safe. Client code degrades gracefully when a migration hasn't run yet; it never hard-depends on a table existing.

## Project structure

```
src/
├── App.tsx / router.tsx   # providers, routes, auth guard
├── routes/                 # Home, Find, Sessions, Community, GroupDetail,
│                           # GroupManage, Chat, Notifications, Profile,
│                           # Collection, Onboarding, deep links
├── components/             # layout, ui, cards, sheets, chat, crews, lab
├── store/                  # useAppStore.ts — Zustand store + sync layer
├── lib/                    # supabase client, db.ts (server calls),
│                           # avatar, resolveUser, dates, utils
└── seed/                   # demo gyms, users, groups (first-run content)
supabase/migrations/        # SQL migrations, applied by hand
```
