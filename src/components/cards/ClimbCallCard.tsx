import { Heart, Flash, StarSolid, MapPin, Clock, User } from 'iconoir-react';
import { format } from 'date-fns';
import type { ClimbCall, NpcUser, Profile } from '@/seed/types';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { isWeightSafe } from '@/lib/weight';
import { cn } from '@/lib/utils';

interface ClimbCallCardProps {
  call: ClimbCall;
  caller: NpcUser | Profile;
  gymName: string;
  isFriend?: boolean;
  onRequest: () => void;
  onViewCard: () => void;
}

const roleIcon: Record<ClimbCall['role'], React.ComponentType<{ width: number; height: number; color: string }>> = {
  both: Heart,
  belayer: Flash,
  climber: StarSolid,
};

const roleLabel: Record<ClimbCall['role'], string> = {
  both: 'BOTH',
  belayer: 'BELAYER',
  climber: 'CLIMBER',
};

/**
 * User-centered climb-call card modeled on the ClimbMate live mock.
 *
 * - Left blue-accent border
 * - Circular role icon (heart = both, flash = belayer, star = climber)
 * - User name + role tag + optional weight-safe + friend chips
 * - Location · Time · Style · Grade meta line
 * - Quoted personal note
 * - Two CTAs: Request to pair (primary green) + View card (outline)
 */
export function ClimbCallCard({
  call,
  caller,
  gymName,
  isFriend,
  onRequest,
  onViewCard,
}: ClimbCallCardProps) {
  const me = useAppStore((s) => s.me);
  const pairRequests = useAppStore((s) => s.pairRequests);
  const cancelPairRequest = useAppStore((s) => s.cancelPairRequest);

  const RoleIcon = roleIcon[call.role];
  const isRequested = pairRequests.includes(call.id);
  const weightSafe = isWeightSafe(me?.weight_kg, call.weight_kg);
  const isMyCall = call.user_id === me?.id;

  // Compact time display: "Now → +2h" | "Tonight 6–8pm" | "Tomorrow 7–9am"
  const start = new Date(call.starts_at);
  const end = new Date(call.ends_at);
  const now = new Date();
  const startsAtToday = start.toDateString() === now.toDateString();
  const startsAtTomorrow =
    start.toDateString() === new Date(now.getTime() + 86400_000).toDateString();
  const startingSoon = start.getTime() - now.getTime() < 30 * 60_000 && start.getTime() >= now.getTime() - 60_000;
  const isEvening = start.getHours() >= 17;

  let timeStr: string;
  if (startingSoon) {
    timeStr = `Now → +${Math.round((end.getTime() - now.getTime()) / 3.6e6)}h`;
  } else if (startsAtToday && isEvening) {
    timeStr = `Tonight ${format(start, 'h')}–${format(end, 'ha').toLowerCase()}`;
  } else if (startsAtToday) {
    timeStr = `Today ${format(start, 'h')}–${format(end, 'ha').toLowerCase()}`;
  } else if (startsAtTomorrow) {
    timeStr = `Tomorrow ${format(start, 'h')}–${format(end, 'ha').toLowerCase()}`;
  } else {
    timeStr = `${format(start, 'EEE')} ${format(start, 'h')}–${format(end, 'ha').toLowerCase()}`;
  }

  return (
    <article className="relative rounded-2xl bg-white border border-ink-100 overflow-hidden">
      {/* Left blue accent bar */}
      <div className="absolute inset-y-0 left-0 w-1 bg-sky-200" />

      <div className="pl-5 pr-4 py-4 flex gap-3">
        <div className="w-11 h-11 shrink-0 rounded-full bg-sky-200 flex items-center justify-center">
          <RoleIcon width={22} height={22} color="#0F2D3A" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + role + tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-ink-900 text-base leading-tight">
              {isMyCall ? 'You' : caller.display_name.split(' ')[0]}
            </h3>
            <span className="inline-flex items-center rounded-full bg-paper-50 border border-ink-100 text-ink-500 text-[10px] font-semibold px-2 py-0.5 tracking-wider">
              {roleLabel[call.role]}
            </span>
            {weightSafe && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 text-teal-600 text-[10px] font-semibold px-2 py-0.5">
                ⚖ weight-safe
              </span>
            )}
            {isFriend && (
              <span className="inline-flex items-center rounded-full bg-paper-50 border border-ink-100 text-ink-700 text-[10px] font-semibold px-2 py-0.5">
                friend
              </span>
            )}
          </div>

          {/* Meta row */}
          <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-500 flex-wrap">
            <MapPin width={12} height={12} className="shrink-0" />
            <span>{gymName}</span>
            <span className="text-ink-300">·</span>
            <Clock width={12} height={12} className="shrink-0" />
            <span>{timeStr}</span>
            <span className="text-ink-300">·</span>
            <span className="capitalize">{call.category === 'top_rope' ? 'Top-rope' : 'Lead'}</span>
            <span className="text-ink-300">·</span>
            <span>{call.grade}</span>
            <span className="text-ink-300">·</span>
            <User width={12} height={12} className="shrink-0" />
            <span className="text-teal-600 font-medium">
              {call.participant_ids.length} / {call.capacity}
            </span>
          </div>

          {/* Note */}
          {call.note && (
            <p className="mt-2 text-sm text-ink-900 italic">"{call.note}"</p>
          )}

          {/* CTAs */}
          <div className="mt-3 flex gap-2">
            {isMyCall ? (
              <span className="inline-flex items-center rounded-xl bg-paper-50 border border-ink-100 text-ink-500 text-xs font-medium px-3 py-2">
                Your call — live
              </span>
            ) : (
              <>
                <Button
                  variant={isRequested ? 'outline' : 'primary'}
                  size="sm"
                  className={cn(!isRequested && 'bg-teal-600 hover:bg-teal-500 border-teal-600')}
                  onClick={() => (isRequested ? cancelPairRequest(call.id) : onRequest())}
                >
                  {isRequested ? 'Requested ✓' : 'Request to pair'}
                </Button>
                <Button variant="outline" size="sm" onClick={onViewCard}>
                  View card
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
