import { useState } from 'react';
import { toast } from 'sonner';
import { QrCode, Position, Check } from 'iconoir-react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Rung-1 check-in: CruxMate's OWN presence, no dependency on the gym's
 * check-in software. Three ways in:
 *   1. Scan the gym's CruxMate QR (simulated here — real QR decodes to a
 *      gym id and hits checkIn()).
 *   2. "You're near <gym>" geofence nudge (simulated with the home gym).
 *   3. Manual pick from the gym list.
 */
export function CheckInSheet({ open, onOpenChange }: Props) {
  const gyms = useAppStore((s) => s.gyms);
  const me = useAppStore((s) => s.me);
  const checkin = useAppStore((s) => s.checkin);
  const gymPresence = useAppStore((s) => s.gymPresence);
  const checkIn = useAppStore((s) => s.checkIn);
  const checkOut = useAppStore((s) => s.checkOut);

  const [scanning, setScanning] = useState(false);
  const nearGym = gyms.find((g) => g.id === me?.home_gym_id) ?? gyms[0];

  const doCheckIn = (gymId: string, name: string) => {
    checkIn(gymId);
    toast(`Checked in at ${name}`, { description: "You're on the wall — partners can see you're here." });
    onOpenChange(false);
  };

  const simulateScan = () => {
    setScanning(true);
    // A real scan decodes a gym-specific QR; we resolve to the nearby gym.
    setTimeout(() => {
      setScanning(false);
      if (nearGym) doCheckIn(nearGym.id, nearGym.short_name);
    }, 1200);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={checkin ? 'You’re checked in' : 'Check in'}>
        {checkin ? (
          <div className="flex flex-col gap-4">
            {(() => {
              const g = gyms.find((x) => x.id === checkin.gym_id);
              return (
                <div className="rounded-2xl bg-teal-100 border border-teal-600 p-5 text-center">
                  <Check width={28} height={28} className="text-teal-600 mx-auto" />
                  <p className="mt-2 font-semibold text-ink-900">{g?.name}</p>
                  <p className="text-sm text-ink-600 mt-0.5">
                    {gymPresence[checkin.gym_id] ?? 1} climbers here now
                  </p>
                </div>
              );
            })()}
            <Button variant="outline" onClick={() => { checkOut(); onOpenChange(false); toast('Checked out'); }}>
              Check out
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* QR */}
            <button
              onClick={simulateScan}
              disabled={scanning}
              className="rounded-2xl border-2 border-dashed border-ink-100 p-6 flex flex-col items-center gap-2 hover:border-ink-300 transition-colors disabled:opacity-60"
            >
              <QrCode width={40} height={40} className={cn('text-ink-900', scanning && 'animate-pulse')} />
              <p className="text-sm font-semibold text-ink-900">
                {scanning ? 'Scanning…' : 'Scan the gym QR'}
              </p>
              <p className="text-xs text-ink-500">Front desk & boulders have a CruxMate code</p>
            </button>

            {/* Geofence nudge */}
            {nearGym && (
              <button
                onClick={() => doCheckIn(nearGym.id, nearGym.short_name)}
                className="rounded-2xl bg-sky-200 border border-ink-100 p-4 flex items-center gap-3 text-left hover:brightness-95"
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
                  <Position width={20} height={20} className="text-teal-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900">Looks like you're at {nearGym.short_name}</p>
                  <p className="text-xs text-ink-600">Tap to check in · {gymPresence[nearGym.id] ?? nearGym.here_now} here now</p>
                </div>
              </button>
            )}

            {/* Manual list */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Or pick a gym</p>
              <div className="flex flex-col gap-1">
                {gyms.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => doCheckIn(g.id, g.short_name)}
                    className="flex items-center justify-between gap-3 px-3 py-3 rounded-xl hover:bg-paper-50 text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-ink-900 truncate">{g.name}</span>
                        {g.boutique && (
                          <span className="shrink-0 rounded-full bg-coral-100 text-coral-500 text-[9px] font-semibold px-1.5 py-0.5">
                            BOUTIQUE
                          </span>
                        )}
                      </div>
                      {g.neighborhood && <span className="text-[11px] text-ink-500">{g.neighborhood}</span>}
                    </div>
                    <span className="text-xs text-ink-500 shrink-0">{gymPresence[g.id] ?? g.here_now} here</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
