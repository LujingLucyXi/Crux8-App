import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { RouteError } from '@/components/ErrorScreen';
import { AppShell } from '@/components/layout/AppShell';
import { Landing } from '@/routes/Landing';
import { Onboarding } from '@/routes/Onboarding';
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
import { Lab } from '@/routes/Lab';

function RequireAuth() {
  const me = useAppStore((s) => s.me);
  if (!me) return <Navigate to="/" replace />;
  return <Outlet />;
}

function LandingOrHome() {
  const me = useAppStore((s) => s.me);
  if (me) return <Navigate to="/home" replace />;
  return <Landing />;
}

export const router = createBrowserRouter([
  { path: '/', element: <LandingOrHome />, errorElement: <RouteError /> },
  { path: '/onboarding', element: <Onboarding />, errorElement: <RouteError /> },
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
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
