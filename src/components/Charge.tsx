import { useAppStore } from '@/store/useAppStore';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { BoltMark } from '@/components/OGBadge';
import {
  CHARGE_DECAY_PER_DAY,
  CHARGE_FULL,
  CHARGE_GRACE_DAYS,
  CHARGE_POINTS,
  STREAK_TABLE,
  localDay,
  streakMultiplier,
  type ChargeKind,
} from '@/lib/charge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

/**
 * The Charge meter (Lucy 2026-10-16): a bolt that fills with activity
 * and fades when you go quiet. XP/tiers are forever — charge is how
 * alive your climbing life is *right now*.
 */
export function ChargeChip({ onTap }: { onTap: () => void }) {
  const charge = useAppStore((s) => s.charge);
  const chargeLastLoss = useAppStore((s) => s.chargeLastLoss);
  const chargeStreak = useAppStore((s) => s.chargeStreak);
  const mult = streakMultiplier(chargeStreak);
  const hot = charge >= 60;
  const warm = charge >= 20 && !hot;
  const lostToday = chargeLastLoss && chargeLastLoss.day === localDay() ? chargeLastLoss.amount : 0;
  return (
    <button
      onClick={onTap}
      className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-[#101010] px-4 py-3 text-left shadow-[0_10px_24px_-12px_rgba(12,15,10,0.65)]"
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          hot ? 'bg-[#B4FF3A]' : warm ? 'bg-[#C9A24B]' : 'bg-white/15',
        )}
      >
        <span className={cn('inline-block', hot && 'bolt-jitter')}>
          <BoltMark size={18} color={hot || warm ? '#0C0F0A' : '#B4FF3A'} />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="text-[10px] font-extrabold tracking-[0.24em] text-white/50">CHARGE</span>
          <span className={cn('text-base font-black leading-none', hot ? 'text-[#B4FF3A]' : 'text-white')}>
            {charge}
          </span>
        </span>
        {chargeStreak >= 2 && (
          <span className="mt-1 block text-[10px] font-extrabold tracking-wide text-[#FFB35C]">
            🔥 {chargeStreak}-day streak · earning ×{mult}
          </span>
        )}
        <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/12">
          <span
            className={cn(
              'block h-full rounded-full transition-all duration-700',
              hot
                ? 'bg-[linear-gradient(90deg,#C9A24B,#B4FF3A)]'
                : 'bg-[linear-gradient(90deg,#8A6D2F,#C9A24B)]',
            )}
            style={{ width: `${Math.min(100, (charge / CHARGE_FULL) * 100)}%` }}
          />
        </span>
      </span>
      <span className={cn('shrink-0 text-[11px] font-semibold', lostToday ? 'text-[#FF9D7A]' : 'text-white/40')}>
        {lostToday ? `−${lostToday} while away` : 'How it works →'}
      </span>
    </button>
  );
}

export function ChargeSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const charge = useAppStore((s) => s.charge);
  const history = useAppStore((s) => s.chargeHistory);
  const chargeStreak = useAppStore((s) => s.chargeStreak);
  const chargeBestStreak = useAppStore((s) => s.chargeBestStreak);
  const mult = streakMultiplier(chargeStreak);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="Your charge">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#101010]">
            <span className="bolt-jitter inline-block">
              <BoltMark size={24} />
            </span>
          </span>
          <div>
            <p className="text-2xl font-black leading-none text-ink-900">{charge}</p>
            <p className="mt-1 text-xs text-ink-500">
              Charge is your current spark — it fills with climbing life and fades when you go quiet.
              Your XP and tiers never drop.
            </p>
          </div>
        </div>

        <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-ink-500">
          Login streak
        </h3>
        <div className="mt-2 rounded-2xl border border-ink-100 bg-paper-100 px-4 py-3">
          <p className="text-sm text-ink-700">
            <span className="font-extrabold text-ink-900">🔥 {chargeStreak}-day streak</span>
            {chargeBestStreak > chargeStreak && (
              <span className="text-ink-500"> · best {chargeBestStreak}</span>
            )}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-700">
            Showing up on consecutive days charges the bolt exponentially faster — right now
            everything you earn is multiplied <span className="font-extrabold text-ink-900">×{mult}</span>.
            Miss one day and the streak freezes; miss two and it restarts.
          </p>
          <ul className="mt-2.5 grid grid-cols-3 gap-1.5">
            {STREAK_TABLE.map((r) => (
              <li
                key={r.day}
                className={
                  'rounded-lg px-2 py-1.5 text-center text-[11px] font-bold ' +
                  (mult === r.mult && chargeStreak >= 1 && (r.mult !== 1 || chargeStreak === 1)
                    ? 'bg-[#101010] text-[#B4FF3A]'
                    : 'bg-paper-50 text-ink-500')
                }
              >
                {r.day} · ×{r.mult}
              </li>
            ))}
          </ul>
        </div>

        <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-ink-500">
          Earn charge
        </h3>
        <p className="mt-1.5 text-xs text-ink-500">Base points — your streak multiplies everything below.</p>
        <ul className="mt-2 divide-y divide-ink-100/70 rounded-2xl border border-ink-100 bg-paper-100">
          {(Object.keys(CHARGE_POINTS) as ChargeKind[]).map((kind) => (
            <li key={kind} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-ink-700">{CHARGE_POINTS[kind].label}</span>
              <span className="text-sm font-extrabold text-ink-900">
                +{CHARGE_POINTS[kind].points}
              </span>
            </li>
          ))}
        </ul>

        <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-ink-500">
          Going quiet
        </h3>
        <p className="mt-2 rounded-2xl border border-ink-100 bg-paper-100 px-4 py-3 text-sm leading-relaxed text-ink-700">
          Life happens — the first {CHARGE_GRACE_DAYS} days away are free. After that, charge fades
          by {CHARGE_DECAY_PER_DAY} a day while you're gone. Showing up again pays the daily bonus
          and stops the fade.
        </p>

        {history.length > 0 && (
          <>
            <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-ink-500">
              Recent
            </h3>
            <ul className="mt-2 flex flex-col gap-1">
              {history.slice(0, 8).map((h, i) => (
                <li
                  key={`${h.at}-${i}`}
                  className="flex items-center justify-between rounded-xl bg-paper-100 px-3.5 py-2 text-sm"
                >
                  <span className="text-ink-700">{CHARGE_POINTS[h.kind].label}</span>
                  <span className="flex items-baseline gap-2">
                    {h.mult ? (
                      <span className="rounded-full bg-[#101010] px-1.5 py-0.5 text-[10px] font-extrabold text-[#FFB35C]">
                        ×{h.mult}
                      </span>
                    ) : null}
                    <span className="font-extrabold text-ink-900">+{h.points}</span>
                    <span className="text-[11px] text-ink-300">
                      {format(new Date(h.at), 'MMM d')}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
