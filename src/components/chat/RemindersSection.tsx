import { useEffect, useMemo, useState } from 'react';
import { Bell, Xmark } from 'iconoir-react';
import { format } from 'date-fns';
import { useAppStore, upcomingReminders } from '@/store/useAppStore';
import { disablePush, enablePush, getPushState, type PushState } from '@/lib/push';
import { SessionDetailSheet } from '@/components/sheets/SessionDetailSheet';
import { ClimbCallDetailSheet } from '@/components/sheets/ClimbCallDetailSheet';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * Session reminders (Lucy 2026-10-18): upcoming climbs I'm in get a
 * reminder card here (24h window), the bell counts the ≤2h ones, and
 * Web Push — enabled from this very card — pops the same reminder
 * when the app is closed. The card doubles as the off switch: users
 * who find it noisy turn push off right where they turned it on.
 */
export function RemindersSection() {
  const me = useAppStore((s) => s.me);
  const dismissReminder = useAppStore((s) => s.dismissReminder);
  const sessions = useAppStore((s) => s.sessions);
  const climbCalls = useAppStore((s) => s.climbCalls);
  const sessionLifecycle = useAppStore((s) => s.sessionLifecycle);
  const dismissedReminders = useAppStore((s) => s.dismissedReminders);
  const gyms = useAppStore((s) => s.gyms);

  const [pushState, setPushState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [setupPending, setSetupPending] = useState(false);
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null);
  const [detailCallId, setDetailCallId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  // Derived list — computed in useMemo, NOT in the zustand selector: a
  // selector-built array is a new reference on every call, which makes
  // React's snapshot check loop forever (React error #185 — the crash
  // Lucy hit opening Notifications, 2026-10-21). `tick` is a dep so the
  // "starts in …" tiers still refresh while the page sits open.
  const reminders = useMemo(
    () =>
      upcomingReminders({
        me,
        sessions,
        climbCalls,
        sessionLifecycle,
        dismissedReminders,
        gyms,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [me, sessions, climbCalls, sessionLifecycle, dismissedReminders, gyms, tick],
  );

  useEffect(() => {
    let alive = true;
    void getPushState().then((st) => alive && setPushState(st));
    // Recompute "starts in …" tiers while the page sits open.
    const t = setInterval(() => setTick((x) => x + 1), 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (!me) return null;

  const onEnable = async () => {
    setBusy(true);
    const res = await enablePush(me.id);
    setBusy(false);
    if (res.ok) {
      setPushState('on');
      setSetupPending(false);
      toast.success('Reminders on — we’ll pop up before your climbs');
    } else {
      setPushState(res.state);
      if (res.state === 'off') setSetupPending(true);
    }
  };

  const onDisable = async () => {
    setBusy(true);
    await disablePush(me.id);
    setBusy(false);
    setPushState('off');
    toast('Push reminders off for this device');
  };

  const detailSession = detailSessionId ? sessions.find((x) => x.id === detailSessionId) : undefined;
  const detailCall = detailCallId ? climbCalls.find((x) => x.id === detailCallId) : undefined;

  return (
    <section className="mb-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
        Reminders
      </h2>

      {/* Push control — this row is both the on and the off switch. */}
      <div className="rounded-2xl border border-ink-100 bg-paper-100 p-3.5 mb-2">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-brand-600">
            <Bell width={18} height={18} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink-900">Pop-up reminders</p>
            <p className="text-xs text-ink-500 mt-0.5">
              {pushState === 'on' &&
                'On for this device — we’ll pop up a day before and ~2 hours before each climb. Too much? Turn it off here anytime, or in your browser settings.'}
              {pushState === 'off' &&
                (setupPending
                  ? 'Almost there — the server side of push is still being set up. In-app reminders below already work.'
                  : 'Get a pop-up before your climbs, even when the app is closed. You can turn it off here anytime.')}
              {pushState === 'denied' &&
                'Notifications are blocked for this site in your browser settings. Allow notifications for crux8.app there, then come back and turn this on.'}
              {pushState === 'ios-needs-install' &&
                'On iPhone, pop-ups need the app on your Home Screen: tap Share → “Add to Home Screen”, open Crux8 from that icon, then enable reminders here.'}
              {pushState === 'unsupported' &&
                'This browser can’t do pop-up notifications — the in-app reminders below still work.'}
              {pushState === null && 'Checking this device…'}
            </p>
          </div>
          {(pushState === 'off' || pushState === null) && (
            <button
              onClick={onEnable}
              disabled={busy || pushState === null}
              className="shrink-0 rounded-full bg-brand-600 px-3.5 py-2 text-xs font-bold text-[#161310] disabled:opacity-60"
            >
              {busy ? '…' : 'Turn on'}
            </button>
          )}
          {pushState === 'on' && (
            <button
              onClick={onDisable}
              disabled={busy}
              className="shrink-0 rounded-full border border-ink-200 px-3.5 py-2 text-xs font-semibold text-ink-700 disabled:opacity-60"
            >
              {busy ? '…' : 'Turn off'}
            </button>
          )}
        </div>
      </div>

      {reminders.length === 0 ? (
        <p className="text-xs text-ink-400 px-1">
          No climbs in the next 24 hours — reminders for sessions and calls you join will land here.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {reminders.map((r) => (
            <li
              key={`${r.kind}:${r.id}`}
              className={cn(
                'rounded-2xl border p-3.5 flex items-start gap-3',
                r.tier === 'soon'
                  ? 'border-brand-600/60 bg-brand-100/50'
                  : 'border-ink-100 bg-paper-100',
              )}
            >
              <span className="text-lg leading-none mt-0.5">{r.tier === 'soon' ? '⏰' : '🧗'}</span>
              <button
                className="flex-1 min-w-0 text-left"
                onClick={() =>
                  r.kind === 'session' ? setDetailSessionId(r.id) : setDetailCallId(r.id)
                }
              >
                <p className="text-sm font-semibold text-ink-900 truncate">{r.title}</p>
                <p className="text-xs text-ink-500 mt-0.5">
                  {r.place} · {format(new Date(r.starts_at), 'EEE, MMM d · h:mm a')}
                </p>
                <p
                  className={cn(
                    'text-xs font-semibold mt-1',
                    r.tier === 'soon' ? 'text-brand-600' : 'text-ink-500',
                  )}
                >
                  {r.tier === 'soon' ? 'Starting soon — see you there' : 'Coming up in the next 24 hours'}
                </p>
              </button>
              <button
                aria-label="Dismiss reminder"
                onClick={() => dismissReminder(`${r.kind}:${r.id}`)}
                className="shrink-0 rounded-full p-1 text-ink-400 hover:text-ink-700"
              >
                <Xmark width={14} height={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <SessionDetailSheet
        session={detailSession ?? null}
        open={!!detailSession}
        onOpenChange={(o) => !o && setDetailSessionId(null)}
      />
      <ClimbCallDetailSheet
        call={detailCall ?? null}
        open={!!detailCall}
        onOpenChange={(o) => !o && setDetailCallId(null)}
      />
    </section>
  );
}
