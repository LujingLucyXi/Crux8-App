import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { NewSessionSheet } from '@/components/sheets/NewSessionSheet';
import { CardRevealSheet } from '@/components/sheets/CardRevealSheet';
import { CelebrationHost } from '@/components/fx/CelebrationHost';
import { useAppStore } from '@/store/useAppStore';

export function AppShell() {
  const newSheetOpen = useAppStore((s) => s.newSessionOpen);
  const setNewSheetOpen = useAppStore((s) => s.setNewSessionOpen);
  return (
    <div className="min-h-screen bg-paper-50">
      <Header />
      <main className="mx-auto max-w-[560px] px-4 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <BottomNav onFabClick={() => setNewSheetOpen(true)} />
      <NewSessionSheet open={newSheetOpen} onOpenChange={setNewSheetOpen} />
      <CardRevealSheet />
      <CelebrationHost />
    </div>
  );
}
