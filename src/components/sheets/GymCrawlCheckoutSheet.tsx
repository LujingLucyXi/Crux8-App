import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, Globe, Lock, MapPin } from 'iconoir-react';
import { format } from 'date-fns';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import type { EventItem } from '@/seed/types';

interface Props {
  event: EventItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const money = (cents: number) => `$${(cents / 100).toFixed(0)}`;

// Each gym gets a distinct rubber-stamp identity (color + emoji + tilt) so the
// passport reads as a collection of unique marks — like real border stamps.
const STAMP_STYLES = [
  { color: '#2C7A7B', emoji: '🧗', rotate: '-8deg' },
  { color: '#C2410C', emoji: '⛰️', rotate: '6deg' },
  { color: '#6D28D9', emoji: '🪨', rotate: '-4deg' },
  { color: '#B91C1C', emoji: '🏔️', rotate: '9deg' },
];

/**
 * Mock checkout + passport for a ticketed multi-gym pass (the "Around the
 * World" crawl). After purchase the pass becomes a passport: the climber taps
 * a gym at the front desk to stamp it, and shows the stamp to staff as proof.
 */
export function GymCrawlCheckoutSheet({ event, open, onOpenChange }: Props) {
  const gyms = useAppStore((s) => s.gyms);
  const buyTicket = useAppStore((s) => s.buyTicket);
  const stampPass = useAppStore((s) => s.stampPass);
  const purchased = useAppStore((s) => (event ? s.ticketPurchases.includes(event.id) : false));
  // Select the stable map, then derive per-event below — returning `?? {}`
  // straight from the selector makes a new object each render (infinite loop).
  const allRedemptions = useAppStore((s) => s.ticketRedemptions);

  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const [confirmGymId, setConfirmGymId] = useState<string | null>(null);

  if (!event || !event.ticket) return null;
  const t = event.ticket;
  const redemptions = allRedemptions[event.id] ?? {};
  const partnerGyms = t.gym_ids
    .map((id) => gyms.find((g) => g.id === id))
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  const initials = event.title
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 4);
  const passCode = `C8-${initials}-${t.price_cents / 100}`;

  const stampedCount = Object.keys(redemptions).length;
  const showPassport = done || purchased;

  const pay = () => {
    setPaying(true);
    setTimeout(() => {
      buyTicket(event.id);
      setPaying(false);
      setDone(true);
      toast('Payment successful 🎉', { description: `Your ${event.title} passport is ready.` });
    }, 1200);
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(t.sales_url).catch(() => {});
    toast('Sales link copied', { description: t.sales_url });
  };

  const doStamp = (gymId: string, gymName: string) => {
    stampPass(event.id, gymId);
    setConfirmGymId(null);
    toast(`${gymName} stamped ✓`, { description: 'Show the stamp to the front desk.' });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setDone(false); setConfirmGymId(null); } }}>
      <SheetContent title={showPassport ? 'Your Crux8 passport' : 'Get your pass'}>
        {showPassport ? (
          <div className="pt-1">
            {/* Passport header */}
            <div className="rounded-2xl bg-[linear-gradient(135deg,#0F2D3A,#1F4451)] text-white p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Crux8 Passport</p>
                  <p className="font-extrabold text-lg leading-tight mt-0.5">{event.title}</p>
                </div>
                <span className="text-2xl">🌍</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-mono text-sm tracking-wider text-white/90">{passCode}</span>
                <span className="text-[11px] text-white/70">{stampedCount}/{partnerGyms.length} stamped · 30 days</span>
              </div>
            </div>

            <p className="text-xs text-ink-500 mb-3">
              At each gym's front desk, tap the stamp and show staff. Each gym can be stamped once.
            </p>

            {/* Stamp grid */}
            <div className="grid grid-cols-3 gap-2">
              {partnerGyms.map((g, i) => {
                const style = STAMP_STYLES[i % STAMP_STYLES.length];
                const stampedAt = redemptions[g.id];
                return (
                  <div key={g.id} className="flex flex-col items-center gap-1.5">
                    {stampedAt ? (
                      <div className="animate-stamp-in">
                        <div
                          className="relative w-[92px] h-[92px] rounded-full flex flex-col items-center justify-center text-center"
                          style={{ transform: `rotate(${style.rotate})`, color: style.color, borderColor: style.color, borderWidth: 3, opacity: 0.92 }}
                        >
                          <span className="absolute inset-1.5 rounded-full border" style={{ borderColor: style.color }} />
                          <span className="text-[8px] font-bold uppercase tracking-widest">Crux8</span>
                          <span className="text-lg leading-none my-0.5">{style.emoji}</span>
                          <span className="text-[9px] font-extrabold leading-tight px-1">{g.short_name}</span>
                          <span className="text-[7px] font-semibold mt-0.5">{format(new Date(stampedAt), 'MMM d')}</span>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmGymId(g.id)}
                        className="w-[92px] h-[92px] rounded-full border-2 border-dashed border-ink-300 flex flex-col items-center justify-center text-ink-400 hover:border-brand-400 hover:text-brand-600 transition-colors"
                      >
                        <MapPin width={18} height={18} />
                        <span className="text-[9px] font-semibold mt-1 px-1 leading-tight">Tap to stamp</span>
                      </button>
                    )}
                    <span className="text-[10px] font-medium text-ink-600 text-center leading-tight">{g.short_name}</span>
                  </div>
                );
              })}
            </div>

            {/* Confirm-at-desk step (avoids accidental burns) */}
            {confirmGymId && (() => {
              const g = partnerGyms.find((x) => x.id === confirmGymId)!;
              return (
                <div className="mt-4 rounded-2xl border border-brand-400 bg-brand-100/40 p-4">
                  <p className="text-sm font-semibold text-ink-900">You're at {g.short_name}?</p>
                  <p className="text-xs text-ink-600 mt-0.5">
                    Only tap this at the front desk — it uses 1 of your {partnerGyms.length} visits and can't be undone.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button className="flex-1" onClick={() => doStamp(g.id, g.short_name)}>Stamp it</Button>
                    <Button variant="outline" className="flex-1" onClick={() => setConfirmGymId(null)}>Cancel</Button>
                  </div>
                </div>
              );
            })()}

            {stampedCount === partnerGyms.length && !confirmGymId && (
              <div className="mt-4 rounded-2xl bg-gold-100 border border-gold-500 p-3 text-center">
                <p className="text-sm font-bold text-ink-900">🏆 Crawl complete — all 3 gyms stamped!</p>
              </div>
            )}

            <Button variant="outline" className="mt-5 w-full" onClick={() => onOpenChange(false)}>Close passport</Button>
          </div>
        ) : (
          <div className="pt-1">
            <p className="text-sm text-ink-500 -mt-1 mb-4">{event.tagline}</p>

            <p className="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-2">3 gyms included</p>
            <div className="space-y-2 mb-5">
              {partnerGyms.map((g) => (
                <div key={g.id} className="flex items-center gap-2 rounded-xl border border-ink-100 p-3">
                  <MapPin width={16} height={16} className="text-teal-600 shrink-0" />
                  <span className="text-sm font-medium text-ink-900">{g.short_name}</span>
                  <span className="ml-auto text-xs font-semibold text-ink-500">1 visit</span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-paper-50 border border-ink-100 p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink-900">Total</span>
                <span className="text-xl font-extrabold text-ink-900">{money(t.price_cents)}</span>
              </div>
              <p className="mt-1 text-[11px] text-ink-500">One pass · 3 gyms · valid 30 days</p>
            </div>

            <button
              onClick={copyLink}
              className="w-full flex items-center gap-2 rounded-xl border border-ink-100 p-3 mb-4 text-left hover:border-brand-400 transition-colors"
            >
              <Globe width={16} height={16} className="text-brand-600 shrink-0" />
              <span className="text-sm text-ink-700 truncate">{t.sales_url}</span>
              <Copy width={15} height={15} className="ml-auto text-ink-500 shrink-0" />
            </button>

            <Button className="w-full" onClick={pay} disabled={paying}>
              {paying ? 'Processing…' : `Pay ${money(t.price_cents)}`}
            </Button>
            <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-ink-500">
              <Lock width={11} height={11} /> Mock checkout — no real charge in this demo.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
