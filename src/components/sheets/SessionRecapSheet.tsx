import { useState } from 'react';
import { toast } from 'sonner';
import { ShieldCheck, WarningTriangle, Calendar, MapPin, Check } from 'iconoir-react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useAppStore } from '@/store/useAppStore';
import { REACTIONS } from '@/lib/reactions';
import { formatSessionWhen } from '@/lib/date';
import type { Session, PartnerFlag } from '@/seed/types';
import { cn } from '@/lib/utils';

interface Props {
  session: Session | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FLAG_REASONS: { value: PartnerFlag['reason']; label: string }[] = [
  { value: 'unsafe_belay', label: 'Unsafe belaying' },
  { value: 'no_show', label: "Didn't show up" },
  { value: 'uncomfortable', label: 'Made me uncomfortable' },
  { value: 'other', label: 'Something else' },
];

/**
 * Post-session recap. NOT a 1–5 rating.
 *  - Props: positive-only climbing-emoji kudos (public).
 *  - Partner check: one-tap "All good" default; "Something felt off" opens a
 *    PRIVATE flag never shown to the flagged person. Only patterns matter.
 */
export function SessionRecapSheet({ session, open, onOpenChange }: Props) {
  const me = useAppStore((s) => s.me);
  const users = useAppStore((s) => s.users);
  const gyms = useAppStore((s) => s.gyms);
  const recaps = useAppStore((s) => s.recaps);
  const logSessionRecap = useAppStore((s) => s.logSessionRecap);
  const togglePartnerProp = useAppStore((s) => s.togglePartnerProp);
  const setPartnerCheck = useAppStore((s) => s.setPartnerCheck);

  const [flagFor, setFlagFor] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState<PartnerFlag['reason']>('unsafe_belay');
  const [flagNote, setFlagNote] = useState('');

  if (!session || !me) return null;

  const gym = session.gym_id ? gyms.find((g) => g.id === session.gym_id) : undefined;
  const recap = recaps[session.id];
  const partners = session.participant_ids
    .filter((id) => id !== me.id)
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean) as typeof users;

  const close = () => {
    // Logging on close guarantees the recap exists (feeds badges/history)
    logSessionRecap(session.id);
    setFlagFor(null);
    setFlagNote('');
    onOpenChange(false);
  };

  const submitFlag = () => {
    if (!flagFor) return;
    setPartnerCheck(session.id, flagFor, 'flagged', { reason: flagReason, note: flagNote.trim() || undefined });
    toast('Thanks — this stays private', {
      description: 'Only our trust team sees it, and only if a pattern emerges.',
    });
    setFlagFor(null);
    setFlagNote('');
  };

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <SheetContent title="Session recap">
        {/* Session summary header */}
        <div className="rounded-2xl bg-paper-50 border border-ink-100 p-4 mb-5">
          <h3 className="font-semibold text-ink-900">{session.title}</h3>
          <p className="text-sm text-ink-500">{session.subtitle}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-500">
            <span className="inline-flex items-center gap-1">
              <Calendar width={12} height={12} /> {formatSessionWhen(session.starts_at)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin width={12} height={12} /> {gym?.short_name ?? session.area ?? 'TBD'}
            </span>
          </div>
        </div>

        {partners.length === 0 ? (
          <p className="text-sm text-ink-500 text-center py-4">
            Solo session logged. Nice work getting out there. 🧗
          </p>
        ) : (
          <>
            <p className="text-sm text-ink-600 mb-4">
              Give props to who you climbed with. All optional — no scores, no averages.
            </p>
            <div className="flex flex-col gap-4">
              {partners.map((p) => {
                const givenProps = recap?.props[p.id] ?? [];
                const check = recap?.partner_checks[p.id];
                return (
                  <div key={p.id} className="rounded-2xl border border-ink-100 p-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar config={p.avatar} alt={p.display_name} size={40} fallback={p.display_name} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-ink-900">{p.display_name}</p>
                        <p className="text-[11px] text-ink-500">Climbed together</p>
                      </div>
                      {check === 'all_good' && (
                        <span className="inline-flex items-center gap-1 text-teal-600 text-xs font-semibold">
                          <Check width={14} height={14} /> All good
                        </span>
                      )}
                    </div>

                    {/* Props — positive-only emoji kudos */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {REACTIONS.map((r) => {
                        const active = givenProps.includes(r.key);
                        return (
                          <button
                            key={r.key}
                            onClick={() => togglePartnerProp(session.id, p.id, r.key)}
                            title={r.label}
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition-colors',
                              active
                                ? 'bg-teal-100 border-teal-600 text-teal-600'
                                : 'bg-white border-ink-100 text-ink-500 hover:border-ink-300',
                            )}
                          >
                            <span className="text-sm">{r.emoji}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Safety check — all-good default + private flag */}
                    {flagFor === p.id ? (
                      <div className="mt-3 rounded-xl bg-paper-50 border border-ink-100 p-3">
                        <p className="text-xs font-semibold text-ink-700 mb-2">
                          What felt off? This stays private.
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {FLAG_REASONS.map((fr) => (
                            <button
                              key={fr.value}
                              onClick={() => setFlagReason(fr.value)}
                              className={cn(
                                'text-left rounded-lg px-3 py-2 text-sm border',
                                flagReason === fr.value
                                  ? 'bg-ink-900 text-white border-ink-900'
                                  : 'bg-white text-ink-700 border-ink-100',
                              )}
                            >
                              {fr.label}
                            </button>
                          ))}
                        </div>
                        <Textarea
                          value={flagNote}
                          onChange={(e) => setFlagNote(e.target.value.slice(0, 240))}
                          rows={2}
                          placeholder="Optional detail (only trust & safety sees this)"
                          className="mt-2"
                        />
                        <div className="mt-2 flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => setFlagFor(null)}>
                            Cancel
                          </Button>
                          <Button size="sm" className="flex-1" onClick={submitFlag}>
                            Submit privately
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant={check === 'all_good' ? 'outline' : 'primary'}
                          size="sm"
                          className={cn('flex-1', check !== 'all_good' && 'bg-teal-600 hover:bg-teal-500 border-teal-600')}
                          onClick={() => {
                            setPartnerCheck(session.id, p.id, 'all_good');
                            toast(`Thanks for climbing with ${p.display_name.split(' ')[0]}`);
                          }}
                        >
                          <ShieldCheck width={15} height={15} />
                          {check === 'all_good' ? 'Marked all good' : 'All good'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFlagFor(p.id);
                            setFlagReason('unsafe_belay');
                          }}
                        >
                          <WarningTriangle width={15} height={15} className="text-ink-500" />
                          Something felt off
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <Button className="w-full mt-6" onClick={close}>
          Done
        </Button>
      </SheetContent>
    </Sheet>
  );
}
