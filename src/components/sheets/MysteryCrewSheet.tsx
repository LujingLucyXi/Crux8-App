import { useMemo } from 'react';
import { toast } from 'sonner';
import { Calendar, Check, Group, HelpCircle } from 'iconoir-react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { formatSessionWhen } from '@/lib/date';
import { format } from 'date-fns';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Crux8 Mystery Crew hub — the signature "never climb alone" feature. Buy a
 * single night ($5) or subscribe to the $15/mo pass for unlimited nights, then
 * opt into upcoming mystery nights (crew of 6–8, revealed 24h before).
 */
export function MysteryCrewSheet({ open, onOpenChange }: Props) {
  const events = useAppStore((s) => s.events);
  const me = useAppStore((s) => s.me);
  const rsvpEvent = useAppStore((s) => s.rsvpEvent);
  const subscribeMysteryPass = useAppStore((s) => s.subscribeMysteryPass);
  const memberUntil = useAppStore((s) => s.mysteryMemberUntil);

  const isMember = !!memberUntil && new Date(memberUntil).getTime() > Date.now();

  const nights = useMemo(
    () => events
      .filter((e) => e.mystery && new Date(e.ends_at).getTime() > Date.now())
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
    [events],
  );

  if (!me) return null;

  const join = (id: string, title: string) => {
    rsvpEvent(id);
    toast(`You're in — ${title.replace(' 🎭', '')}`, {
      description: isMember ? 'Included with your pass.' : 'Crew + gym revealed 24h before.',
    });
  };

  const subscribe = () => {
    subscribeMysteryPass();
    toast('You\'re a Mystery Crew member 🎭', { description: 'Never climb alone — unlimited mystery nights.' });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="Crux8 Mystery Crew">
        {/* Value prop */}
        <div className="-mt-1 mb-4">
          <p className="text-sm text-ink-600">
            Opt in and we match you into a surprise crew of <b>6–8</b> at your level. Gym + partners
            revealed <b>24 hours before</b>. Never climb alone.
          </p>
        </div>

        {/* Membership status / pricing */}
        {isMember ? (
          <div className="rounded-2xl border border-teal-600 bg-teal-100 p-4 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center shrink-0">
              <Check width={18} height={18} color="white" />
            </div>
            <div>
              <p className="text-sm font-bold text-ink-900">Mystery Crew member</p>
              <p className="text-xs text-ink-600">
                Unlimited nights · renews {format(new Date(memberUntil!), 'MMM d')}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* Drop-in */}
            <div className="rounded-2xl border border-ink-100 p-4 flex flex-col">
              <p className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">Drop-in</p>
              <p className="text-2xl font-extrabold text-ink-900 mt-1">$5<span className="text-sm font-semibold text-ink-500"> /night</span></p>
              <p className="text-[11px] text-ink-500 mt-1">Pay per mystery night below.</p>
            </div>
            {/* Monthly pass */}
            <div className="relative rounded-2xl border-2 border-brand-500 bg-brand-100/40 p-4 flex flex-col">
              <span className="absolute -top-2 right-3 rounded-full bg-brand-600 text-[#161310] text-[9px] font-bold uppercase tracking-wide px-2 py-0.5">Best value</span>
              <p className="text-[11px] uppercase tracking-wider text-brand-600 font-semibold">Monthly pass</p>
              <p className="text-2xl font-extrabold text-ink-900 mt-1">$15<span className="text-sm font-semibold text-ink-500"> /mo</span></p>
              <p className="text-[11px] text-ink-600 mt-1">Unlimited nights — never climb alone.</p>
              <Button size="sm" className="mt-3" onClick={subscribe}>Get the pass</Button>
            </div>
          </div>
        )}

        {/* Upcoming nights */}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
          <Group width={13} height={13} className="inline -mt-0.5 mr-1" />
          Upcoming mystery nights
        </h3>
        <div className="flex flex-col gap-2">
          {nights.map((e) => {
            const joined = e.attendee_ids.includes(me.id);
            const full = e.capacity !== null && e.attendee_ids.length >= e.capacity;
            return (
              <div key={e.id} className="rounded-2xl border border-ink-100 p-3">
                <div className="flex items-start gap-2">
                  <span className="text-lg">🎭</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900 leading-tight">{e.title.replace(' 🎭', '')}</p>
                    <p className="text-[12px] text-ink-500 mt-0.5">{e.tagline}</p>
                    <p className="text-[11px] text-ink-500 mt-1 flex items-center gap-1">
                      <Calendar width={11} height={11} />
                      {formatSessionWhen(e.starts_at)} · {e.attendee_ids.length}/{e.capacity} in
                    </p>
                  </div>
                  {joined ? (
                    <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 mt-1">
                      <Check width={12} height={12} /> In
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant={full ? 'outline' : 'primary'}
                      className="shrink-0"
                      onClick={() => join(e.id, e.title)}
                      disabled={full}
                    >
                      {full ? 'Full' : isMember ? 'Join · Included' : 'Join · $5'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {nights.length === 0 && (
            <p className="text-center text-sm text-ink-500 py-6 flex flex-col items-center gap-2">
              <HelpCircle width={20} height={20} className="text-ink-300" />
              No mystery nights scheduled right now — check back soon.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
