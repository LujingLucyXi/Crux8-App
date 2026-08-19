import { useCelebration } from '@/store/useCelebration';
import { Celebration } from './Celebration';

/** App-wide singleton that renders whatever the celebration bus is showing. */
export function CelebrationHost() {
  const current = useCelebration((s) => s.current);
  const next = useCelebration((s) => s.next);
  return <Celebration show={current} onDone={next} />;
}
