// send-reminders — Web Push sender for upcoming-climb reminders.
//
// Invoked every 15 minutes by pg_cron (see the 2026-10-18 push
// migration) with an x-cron-secret header. For every session / climb
// call starting within 24h, each committed participant gets at most
// two pushes ever: one when the climb first comes within 24h, one
// when it comes within 2h. push_reminder_log is the dedupe ledger.
//
// Secrets required (Edge Functions → Secrets):
//   CRON_SECRET       — must match the value in the pg_cron job
//   VAPID_PUBLIC_KEY  — pairs with the public key in src/lib/push.ts
//   VAPID_PRIVATE_KEY — server-only half of the pair
//   VAPID_SUBJECT     — e.g. mailto:hello@glomere.tech
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are injected automatically.

// @ts-nocheck — Deno + npm specifiers; not part of the Vite build.
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const H24 = 24 * 3600 * 1000;
const H2 = 2 * 3600 * 1000;
const TZ = 'America/Los_Angeles';

function whenLabel(startsAt: string, now: number): string {
  const start = new Date(startsAt);
  const day = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric' }).format(start);
  const today = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric' }).format(new Date(now));
  const tomorrow = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric' }).format(new Date(now + 24 * 3600 * 1000));
  const time = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).format(start);
  if (day === today) return `Today · ${time}`;
  if (day === tomorrow) return `Tomorrow · ${time}`;
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(start);
  return `${weekday} · ${time}`;
}

Deno.serve(async (req) => {
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || req.headers.get('x-cron-secret') !== secret) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@glomere.tech',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  );

  const now = Date.now();
  const in24h = new Date(now + H24).toISOString();
  const nowIso = new Date(now).toISOString();

  // Gather commitments: target -> { label, starts_at, users:Set }
  const targets = new Map<string, { kind: string; label: string; starts_at: string; users: Set<string> }>();
  const addUser = (kind: string, id: string, label: string, starts_at: string, userId: string) => {
    const key = `${kind}:${id}`;
    if (!targets.has(key)) targets.set(key, { kind, label, starts_at, users: new Set() });
    targets.get(key)!.users.add(userId);
  };

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, title, subtitle, starts_at, ends_at')
    .gt('starts_at', nowIso)
    .lte('starts_at', in24h)
    .gt('ends_at', nowIso)
    .is('finished_at', null);
  if (sessions?.length) {
    const { data: rsvps } = await supabase
      .from('session_rsvps')
      .select('session_id, user_id')
      .in('session_id', sessions.map((s: any) => s.id))
      .eq('status', 'going');
    const byId = new Map(sessions.map((s: any) => [s.id, s]));
    for (const r of rsvps ?? []) {
      const s = byId.get(r.session_id);
      if (s) addUser('session', s.id, s.title || s.subtitle || 'Climbing session', s.starts_at, r.user_id);
    }
  }

  const { data: calls } = await supabase
    .from('climb_calls')
    .select('id, category, grade, starts_at, ends_at, user_id')
    .in('status', ['live', 'matched'])
    .gt('starts_at', nowIso)
    .lte('starts_at', in24h)
    .gt('ends_at', nowIso);
  if (calls?.length) {
    const { data: pairings } = await supabase
      .from('call_pairings')
      .select('call_id, user_id')
      .in('call_id', calls.map((c: any) => c.id))
      .in('status', ['requested', 'confirmed']);
    const byId = new Map(calls.map((c: any) => [c.id, c]));
    for (const c of calls) {
      addUser('call', c.id, `${c.category === 'top_rope' ? 'Top rope' : 'Lead'} · ${c.grade}`, c.starts_at, c.user_id);
    }
    for (const p of pairings ?? []) {
      const c = byId.get(p.call_id);
      if (c) addUser('call', c.id, `${c.category === 'top_rope' ? 'Top rope' : 'Lead'} · ${c.grade}`, c.starts_at, p.user_id);
    }
  }

  let sent = 0;
  let cleaned = 0;
  for (const [key, t] of targets) {
    const id = key.split(':')[1];
    const msLeft = new Date(t.starts_at).getTime() - now;
    const horizon = msLeft <= H2 ? '2h' : '24h';
    for (const userId of t.users) {
      const { data: logged } = await supabase
        .from('push_reminder_log')
        .select('user_id')
        .eq('user_id', userId)
        .eq('target_kind', t.kind)
        .eq('target_id', id)
        .eq('horizon', horizon)
        .maybeSingle();
      if (logged) continue;
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', userId);
      if (!subs?.length) continue;
      const payload = JSON.stringify({
        title: horizon === '2h' ? '⏰ Climb starting soon' : '🧗 Climb coming up',
        body: `${t.label} — ${whenLabel(t.starts_at, now)}`,
        url: '/sessions',
      });
      let delivered = false;
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          );
          delivered = true;
          sent++;
        } catch (e: any) {
          if (e?.statusCode === 404 || e?.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
            cleaned++;
          }
        }
      }
      if (delivered) {
        await supabase.from('push_reminder_log').insert({
          user_id: userId,
          target_kind: t.kind,
          target_id: id,
          horizon,
        });
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, targets: targets.size, sent, cleaned }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
