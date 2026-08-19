import { create } from 'zustand';
import type { CelebrationConfig } from '@/lib/rewards';

/**
 * Ephemeral celebration bus (NOT persisted) — any store action or component
 * can fire a hero moment; a single <CelebrationHost/> renders it app-wide.
 * A tiny queue means back-to-back triggers (send → level up) play in order.
 */
interface CelebrationState {
  queue: CelebrationConfig[];
  current: CelebrationConfig | null;
  celebrate: (c: CelebrationConfig) => void;
  next: () => void;
}

export const useCelebration = create<CelebrationState>((set, get) => ({
  queue: [],
  current: null,
  celebrate: (c) => {
    if (get().current) {
      set({ queue: [...get().queue, c] });
    } else {
      set({ current: c });
    }
  },
  next: () => {
    const [head, ...rest] = get().queue;
    set({ current: head ?? null, queue: rest });
  },
}));

/** Callable from non-hook contexts (e.g. store actions). */
export const celebrate = (c: CelebrationConfig) => useCelebration.getState().celebrate(c);
