import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { AppShell } from '@/components/layout/AppShell';
import { Landing } from '@/routes/Landing';
import { Onboarding } from '@/routes/Onboarding';
import { Find } from '@/routes/Find';
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
  if (me) return <Navigate to="/find" replace />;
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
          { path: '/find', element: <Find /> },
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
