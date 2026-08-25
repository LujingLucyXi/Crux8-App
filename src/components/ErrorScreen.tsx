import { useRouteError } from 'react-router-dom';
import { Logo } from '@/components/layout/Logo';

/**
 * Shared recovery screen shown when the app crashes. Used two ways:
 *  - by <ErrorBoundary> for errors outside the router / in the provider itself
 *  - by the router's `errorElement` (via <RouteError>) for route-render errors,
 *    which react-router intercepts before a React boundary can see them.
 *
 * Uses plain elements + only the Logo so the fallback can't itself depend on the
 * UI primitives that might be implicated in the crash.
 */
const STORE_KEY = 'cruxmate-v1';

function reload() {
  window.location.reload();
}
function reset() {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    /* ignore — the reload still helps */
  }
  window.location.href = '/';
}

export function ErrorScreen({ error }: { error?: unknown }) {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : undefined;
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-6 py-10 text-center">
      <Logo size={64} />
      <h1 className="mt-6 text-xl font-semibold text-ink-900">Something went sideways.</h1>
      <p className="mt-2 text-sm text-ink-500 max-w-xs">
        Crux8 hit an unexpected snag. Try reloading — if that doesn't help, resetting your local data
        clears the problem (it only affects this device).
      </p>

      <div className="mt-8 w-full max-w-xs flex flex-col gap-2">
        <button
          onClick={reload}
          className="w-full rounded-xl bg-ink-900 text-white text-sm font-semibold py-3 active:scale-[0.98] transition-transform"
        >
          Reload app
        </button>
        <button
          onClick={reset}
          className="w-full rounded-xl bg-white border border-ink-100 text-ink-700 text-sm font-semibold py-3 active:scale-[0.98] transition-transform"
        >
          Reset local data
        </button>
      </div>

      {import.meta.env.DEV && message && (
        <pre className="mt-8 max-w-full overflow-auto text-left text-[11px] text-coral-500 bg-white border border-ink-100 rounded-xl p-3">
          {message}
        </pre>
      )}
    </div>
  );
}

/** Router `errorElement`: pulls the thrown error from react-router and renders the screen. */
export function RouteError() {
  const error = useRouteError();
  // Route errors don't hit componentDidCatch, so log here for parity.
  console.error('[Crux8] Route error:', error);
  return <ErrorScreen error={error} />;
}
