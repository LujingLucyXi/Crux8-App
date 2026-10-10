import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { App as CapacitorApp } from '@capacitor/app';
import { router } from './router';
import { useAppStore } from '@/store/useAppStore';

export default function App() {
  const seedIfEmpty = useAppStore((s) => s.seedIfEmpty);
  const initAuth = useAppStore((s) => s.initAuth);

  useEffect(() => {
    seedIfEmpty();
    void initAuth();
    // Universal links (e.g. play.crux8.app/claim?...): when iOS hands the
    // URL to the native shell, route it into the React router. No-op on web.
    let listener: Promise<{ remove: () => Promise<void> }> | null = null;
    try {
      listener = CapacitorApp.addListener('appUrlOpen', ({ url }) => {
        try {
          const u = new URL(url);
          if (u.pathname === '/claim') {
            void router.navigate(`/claim${u.search}`);
          }
        } catch {
          /* ignore malformed deep links */
        }
      });
    } catch {
      /* Capacitor App plugin unavailable (plain web) — ignore */
    }
    return () => {
      if (listener) void listener.then((s) => s.remove().catch(() => {}));
    };
  }, [seedIfEmpty, initAuth]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: '12px',
            border: '1px solid #D9E1E6',
            padding: '12px 16px',
            fontFamily: 'Poppins, sans-serif',
            fontSize: '13px',
          },
        }}
      />
    </>
  );
}
