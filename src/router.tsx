import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { AppShell } from '@/components/layout/AppShell';
import { Landing } from '@/routes/Landing';
import { Onboarding } from '@/routes/Onboarding';
import { Home } from '@/routes/Home';
import { Find } from '@/routes/Find';
import { Sessions } from '@/routes/Sessions';
import { Community } from '@/routes/Community';
import { GroupDetail } from '@/routes/GroupDetail';
import { Chat } from '@/routes/Chat';
import { ChatDetail } from '@/routes/ChatDetail';
import { SessionChatDetail } from '@/routes/SessionChatDetail';
import { Profile } from '@/routes/Profile';

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
  { path: '/', element: <LandingOrHome /> },
  { path: '/onboarding', element: <Onboarding /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/home', element: <Home /> },
          { path: '/find', element: <Find /> },
          { path: '/sessions', element: <Sessions /> },
          { path: '/community', element: <Community /> },
          { path: '/community/:groupId', element: <GroupDetail /> },
          { path: '/chat', element: <Chat /> },
          { path: '/chat/session/:sessionChatId', element: <SessionChatDetail /> },
          { path: '/chat/:userId', element: <ChatDetail /> },
          { path: '/profile', element: <Profile /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
