import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './router';
import { useAppStore } from '@/store/useAppStore';

export default function App() {
  const seedIfEmpty = useAppStore((s) => s.seedIfEmpty);

  useEffect(() => {
    seedIfEmpty();
  }, [seedIfEmpty]);

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
