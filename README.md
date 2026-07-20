# CruxMate

Session-based climber partner matching. **v0.5** — local prototype with Zustand + localStorage. Real auth + Supabase land in v0.6.

Design docs live in the sibling Obsidian vault at `CruxMate/App Building Docs/`.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/).

## Tech stack

- **Vite + React 19 + TypeScript**
- **Tailwind CSS v3** — brand tokens locked in `tailwind.config.js` (`ink` / `teal` / `gold` / `coral` / `sky` / `paper`)
- **Poppins** via Google Fonts
- **React Router v6** — 5 routes + auth guard
- **Zustand** with `persist` middleware (localStorage key `cruxmate-v1`)
- **Radix UI primitives** — Sheet, Dialog, Checkbox, RadioGroup, Slot
- **Iconoir** — line-style icons (`Trekking`, `Cube`, `SquareWave`, `TriangleFlag`, `ShieldCheck`, `Sparks`, etc.)
- **Sonner** — top-slide toasts
- **date-fns** — session timestamp formatting

## Feature map

| Screen | Route | What works |
|---|---|---|
| Landing | `/` | Hero, 4 pillars, sign up (mock) |
| Onboarding | `/onboarding` | 4-step wizard, avatar picker, cert verification prompt |
| Find | `/find` | Segmented INDOOR/OUTDOOR/EVENTS, contextual filters, AI Auto Match banner |
| Community | `/community` | 12 seeded groups, search, category filters |
| Group Detail | `/community/:groupId` | Cover, admins, upcoming sessions/events, `+ Post` for admins |
| Chat | `/chat` | DMs with CruxMates, unread indicators |
| Chat Detail | `/chat/:userId` | Bubble UI, message composer, verified chips |
| Profile | `/profile` | Verified chips, badges, upcoming/past sessions, CruxMates, About/Story |

### Cross-cutting

- **Cert verification** (per category): opens from onboarding, profile, or RSVP gate. Auto-approves 5s after submit.
- **RSVP gate**: rope sessions block without matching verification.
- **Attestation dialog**: trad sessions require attestation before RSVP.
- **Gear checklist**: auto-opens after every RSVP with category-appropriate defaults.
- **AI Auto Match**: deterministic scorer (grade overlap × 40 + style × 25 + proximity × 15 + timing × 10 + vibe × 5 − already-joined × 20).
- **Badges**: auto-unlock on state change; 7 total.
- **Mountain Project links**: 40 curated Cascades routes with `search?q=` fallback URLs.

## Structure

```
src/
├── App.tsx              # Root: RouterProvider + Toaster + seedIfEmpty
├── main.tsx             # createRoot
├── router.tsx           # Routes + auth guard
├── index.css            # Poppins + Tailwind base
├── components/
│   ├── layout/          # Header, BottomNav, AppShell, Logo
│   ├── ui/              # Button, Card, Sheet, Dialog, Input, Avatar, Checkbox
│   ├── cards/           # SessionCard, EventCard, GroupCard
│   ├── filters/         # FilterRow (contextual per-tab)
│   └── sheets/          # SessionDetail, EventDetail, NewSession, GearChecklist,
│                        # CertVerification, UserProfile, AiMatch
├── routes/              # Landing, Onboarding, Find, Community, GroupDetail,
│                        # Chat, ChatDetail, Profile
├── lib/                 # utils (cn, uid), date, match (scorer), gear (checklists)
├── store/               # useAppStore.ts — Zustand with persist
└── seed/                # gyms, routes, users, sessions, events, groups (source of truth)
```

## Reset the demo

Open DevTools console and run:
```js
localStorage.removeItem('cruxmate-v1'); location.reload();
```
Or use the hamburger menu → `Reset all data (dev)`.

## Roadmap

- **v0.6** — Supabase Auth (email magic link + Google) + `profiles` + `verifications` tables + Storage for avatars/cert photos
- **v0.7** — Move sessions/events/groups/chat into Supabase Postgres (RLS: public read, owner write)
- **v0.8** — Real-time chat via Supabase Realtime
- **v0.9** — Real admin cert verification queue
- **v1.0** — OpenBeta route data + Mapbox on Explore + real LLM matching
