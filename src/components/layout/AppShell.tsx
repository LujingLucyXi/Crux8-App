import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { NewSessionSheet } from '@/components/sheets/NewSessionSheet';
import { CelebrationHost } from '@/components/fx/CelebrationHost';

export function AppShell() {
  const [newSheetOpen, setNewSheetOpen] = useState(false);
  return (
    <div className="min-h-screen bg-paper-50">
      <Header />
      <main className="mx-auto max-w-[560px] px-4 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <BottomNav onFabClick={() => setNewSheetOpen(true)} />
      <NewSessionSheet open={newSheetOpen} onOpenChange={setNewSheetOpen} />
      <CelebrationHost />
    </div>
  );
}
