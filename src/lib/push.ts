import { supabase } from './supabase';

// Web Push for session reminders (Lucy 2026-10-18: in-app reminders
// + web push together). The public half of the VAPID pair lives here;
// the private half is a Supabase Edge Function secret used only by
// the send-reminders function. Subscriptions are stored per user in
// push_subscriptions (owner-locked RLS — see the 2026-10-18 migration).
const VAPID_PUBLIC_KEY =
  'BLaoLB6TRzU7goBXpEcVuoerzLre4e5PLmBoQPhxh7VQE-zvx7lZqKxvS5oLzcrbKGpG0sDuq1RNSd5XbDTnjyM';

export type PushState =
  | 'unsupported' // no Push API in this browser/context
  | 'ios-needs-install' // iPhone Safari tab: iOS requires Add to Home Screen first
  | 'denied' // permission refused at the browser level
  | 'off' // supported, not subscribed
  | 'on'; // subscribed on this device

function isIosBrowserTab(): boolean {
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/.test(ua);
  if (!isIos) return false;
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  return !standalone;
}

export function pushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    window.isSecureContext
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration('/sw.js');
  if (existing) return existing;
  return navigator.serviceWorker.register('/sw.js');
}

export async function getPushState(): Promise<PushState> {
  if (isIosBrowserTab()) return 'ios-needs-install';
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    const sub = await reg?.pushManager.getSubscription();
    return sub ? 'on' : 'off';
  } catch {
    return 'off';
  }
}

export async function enablePush(userId: string): Promise<{ ok: boolean; state: PushState }> {
  if (isIosBrowserTab()) return { ok: false, state: 'ios-needs-install' };
  if (!pushSupported()) return { ok: false, state: 'unsupported' };
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, state: permission === 'denied' ? 'denied' : 'off' };
  }
  const reg = await registration();
  await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    }));
  const json = sub.toJSON();
  const keys = json.keys ?? {};
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: keys.p256dh ?? '',
      auth: keys.auth ?? '',
      user_agent: navigator.userAgent.slice(0, 200),
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' },
  );
  if (error) {
    // Most likely the migration hasn't run yet — report as off so the
    // UI can say setup is pending instead of pretending it worked.
    return { ok: false, state: 'off' };
  }
  return { ok: true, state: 'on' };
}

export async function disablePush(userId: string): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', sub.endpoint);
      await sub.unsubscribe();
    }
  } catch {
    /* turning off must never throw in the UI */
  }
}
