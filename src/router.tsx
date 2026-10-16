import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { RouteError } from '@/components/ErrorScreen';
import { AppShell } from '@/components/layout/AppShell';
import { Landing } from '@/routes/Landing';
import { Onboarding } from '@/routes/Onboarding';
import { Claim } from '@/routes/Claim'; // quiz → app DNA bridge (public; handles its own auth)
import { CallDeepLink } from '@/routes/CallDeepLink'; // shared climb call deep link (public; handles its own auth)
import { SessionDeepLink } from '@/routes/SessionDeepLink'; // shared session deep link (public; handles its own auth)
import { AddDeepLink } from '@/routes/AddDeepLink'; // personal add-friend link: /add/:code (public; handles its own auth)
import { UpdatePassword } from '@/routes/UpdatePassword'; // password-reset landing (public)
import { Home } from '@/routes/Home';
import { Find } from '@/routes/Find';
import { Sessions } from '@/routes/Sessions';
import { Community } from '@/routes/Community';
import { GroupDetail } from '@/routes/GroupDetail';
import { GroupManage } from '@/routes/GroupManage';
import { Chat } from '@/routes/Chat';
import { ChatDetail } from '@/routes/ChatDetail';
import { SessionChatDetail } from '@/routes/SessionChatDetail';
import { Profile } from '@/routes/Profile';
import { Collection } from '@/routes/Collection'; // the Vault: card collection's own home
import { Lab } from '@/routes/Lab';

function RequireAuth() {
  const me = useAppStore((s) => s.me);
  if (!me) return <Navigate to="/" replace />;
  // Orientation is no longer an entry gate (2026-10-14 front-door build,
  // Lucy's rule: orientation is a post-value conversion step, never a
  // gate). New accounts land in the app immediately; the hard redirect
  // used to eat deep-link joins — scanners were yanked to /onboarding
  // and lost the session they came for. They are now nudged to finish
  // their profile after they have something worth keeping (e.g. the
  // session-complete card).
  return <Outlet />;
}

function LandingOrHome() {
  const me = useAppStore((s) => s.me);
  // Brand-new signups (onboarded === false) go straight to Home like
  // everyone else; the onboarding nudge lives in-app, not in the router.
  if (me) return <Navigate to="/home" replace />;
  return <Landing />;
}

export const router = createBrowserRouter([
  { path: '/', element: <LandingOrHome />, errorElement: <RouteError /> },
  { path: '/onboarding', element: <Onboarding />, errorElement: <RouteError /> },
  { path: '/claim', element: <Claim />, errorElement: <RouteError /> },
  { path: '/call/:callId', element: <CallDeepLink />, errorElement: <RouteError /> },
  { path: '/session/:sessionId', element: <SessionDeepLink />, errorElement: <RouteError /> },
  { path: '/add/:code', element: <AddDeepLink />, errorElement: <RouteError /> },
  { path: '/update-password', element: <UpdatePassword />, errorElement: <RouteError /> },
  { path: '/lab', element: <Lab />, errorElement: <RouteError /> },
  {
    // Outer boundary: catches crashes in RequireAuth / AppShell itself → full-screen.
    element: <RequireAuth />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            // Inner boundary: a page crash renders here, inside AppShell's <Outlet>,
            // so the header + bottom nav stay put and only the content area recovers.
            errorElement: <RouteError />,
            children: [
              { path: '/home', element: <Home /> },
              { path: '/find', element: <Find /> },
              { path: '/sessions', element: <Sessions /> },
              { path: '/community', element: <Community /> },
              { path: '/community/:groupId', element: <GroupDetail /> },
              { path: '/community/:groupId/manage', element: <GroupManage /> },
              { path: '/chat', element: <Chat /> },
              { path: '/chat/session/:sessionChatId', element: <SessionChatDetail /> },
              { path: '/chat/:userId', element: <ChatDetail /> },
              { path: '/profile', element: <Profile /> },
              { path: '/collection', element: <Collection /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
