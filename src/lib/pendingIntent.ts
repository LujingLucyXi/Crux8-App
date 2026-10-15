/**
 * Pending deep-link intent.
 *
 * When a logged-out user lands on a shared session/call link and has to
 * sign in (or detour through onboarding), the join target used to be lost:
 * onboarding yanked them to /home and there was nowhere to go back to.
 * The deep-link routes now stash the intent here before the auth detour,
 * and consume it when the user returns — so a scanned QR survives the
 * sign-in flow and lands back on the session with a join button.
 */
export interface PendingIntent {
  type: 'session' | 'call' | 'add';
  /** session id | call id | invite code — whatever the target route needs. */
  id: string;
}

const KEY = 'crux8-pending-intent';

export function savePendingIntent(intent: PendingIntent): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(intent));
  } catch {
    /* storage unavailable — intent just won't survive */
  }
}

export function getPendingIntent(): PendingIntent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<PendingIntent>;
    if (
      (p.type === 'session' || p.type === 'call' || p.type === 'add') &&
      typeof p.id === 'string' &&
      p.id
    ) {
      return { type: p.type, id: p.id };
    }
  } catch {
    /* malformed — treat as none */
  }
  return null;
}

export function clearPendingIntent(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ok */
  }
}

/**
 * Consumes the pending intent only if it matches the given target.
 * Returns true when it matched (and was cleared).
 */
export function consumePendingIntentFor(type: PendingIntent['type'], id: string): boolean {
  const p = getPendingIntent();
  if (p && p.type === type && p.id === id) {
    clearPendingIntent();
    return true;
  }
  return false;
}

/** Where a consumed intent should take the user. */
export function pendingIntentPath(intent: PendingIntent): string {
  if (intent.type === 'session') return `/session/${intent.id}`;
  if (intent.type === 'call') return `/call/${intent.id}`;
  return `/add/${intent.id}`;
}
