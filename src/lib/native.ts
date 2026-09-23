import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/** True when running inside the native iOS/Android shell (vs. the web build). */
export const isNative = Capacitor.isNativePlatform();

/**
 * Open an external URL in the system browser (SFSafariViewController on iOS),
 * so the user never gets stuck on an outside page inside the app.
 * Falls back to window.open on the web build.
 */
export async function openExternal(url: string): Promise<void> {
  if (isNative) {
    await Browser.open({ url });
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/** Light tactile tick for primary actions. No-op on the web build. */
export async function tapTick(): Promise<void> {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* haptics unavailable — never blocks */
  }
}
