import { CrewsBrowser } from '@/components/crews/CrewsBrowser';

/**
 * Standalone /community route. Kept reachable so deep links + Home's
 * "Your crews" block still resolve; the browsing UI itself lives in
 * CrewsBrowser and is also embedded in the Find "Crews" segment.
 */
export function Community() {
  return (
    <div className="pb-4">
      <h1 className="text-2xl font-semibold text-ink-900 mb-4">Crews</h1>
      <CrewsBrowser />
    </div>
  );
}
