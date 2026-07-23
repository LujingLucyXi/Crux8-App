import { Calendar, MapPin, SquareWave, TriangleFlag, ShieldCheck } from 'iconoir-react';
import { format } from 'date-fns';
import type { ClimbCall, NpcUser, Profile } from '@/seed/types';
import { formatSessionWhen } from '@/lib/date';
import { AvatarStack } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { isWeightSafe } from '@/lib/weight';
import { cn } from '@/lib/utils';

/* Same icon + color language as SessionCard, so Belay and Boulder read
   as siblings rather than two unrelated designs. */
const categoryStyle: Record<ClimbCall['category'], { bg: string; text: string; Icon: React.ComponentType<{ width: number; height: number; color: string }> }> = {
  top_rope: { bg: 'bg-ink-900', text: 'text-ink-900', Icon: SquareWave },
  lead: { bg: 'bg-coral-500', text: 'text-coral-500', Icon: TriangleFlag },
};

const CATEGORY_LABEL: Record<ClimbCall['category'], string> = {
  top_rope: 'Top Rope',
  lead: 'Lead',
};

export const LOOKING_FOR_LABEL: Record<ClimbCall['looking_for'], string> = {
  belayer: 'Needs belayer',
  climber: 'Needs climber',
  take_turns: 'Take turns',
};

const LOOKING_FOR_STYLE: Record<ClimbCall['looking_for'], string> = {
  belayer: 'bg-coral-100 text-coral-500',
  climber: 'bg-sky-200 text-ink-700',
  take_turns: 'bg-teal-100 text-teal-600',
};

interface ClimbCallCardProps {
  call: ClimbCall;
  caller: NpcUser | Profile;
  gymName: string;
  users: NpcUser[];
  isFriend?: boolean;
  onRequest: () => void;
  onViewCard: () => void;
}

export function ClimbCallCard({
  call, caller, gymName, users, isFriend, onRequest, onViewCard,
}: ClimbCallCardProps) {
  const me = useAppStore((s) => s.me);
  const pairRequests = useAppStore((s) => s.pairRequests);
  const cancelPairRequest = useAppStore((s) => s.cancelPairRequest);

  const style = categoryStyle[call.category];
  const { Icon } = style;
  const isRequested = pairRequests.includes(call.id);
  const weightSafe = isWeightSafe(me?.weight_kg, call.weight_kg);
  const isMyCall = call.user_id === me?.id;
  const isFull = call.participant_ids.length >= call.capacity;

  const participants = call.participant_ids
    .map((id) => {
      if (id === me?.id) return { id: me.id, display_name: 'You', avatar: me.avatar };
      const u = users.find((x) => x.id === id);
      return u ? { id: u.id, display_name: u.display_name, avatar: u.avatar } : null;
    })
    .filter(Boolean) as Array<{ id: string; display_name: string; avatar: Profile['avatar'] }>;

  const start = new Date(call.starts_at);
  const end = new Date(call.ends_at);
  const timeRange = `${format(start, 'h:mm')}–${format(end, 'h:mm a')}`;

  return (
    <article className="rounded-2xl bg-white border border-ink-100 p-4">
      <div className="flex gap-3 items-start">
        {/* Category icon — same 56px treatment as SessionCard */}
        <div className={cn('w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center', style.bg)}>
          <Icon width={26} height={26} color="white" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title + level */}
          <h3 className="font-semibold text-ink-900 text-base leading-tight">
            {call.title ?? CATEGORY_LABEL[call.category]}
          </h3>
          <p className="text-[13px] text-ink-500 mt-0.5 truncate">
            {call.grade} · hosted by {isMyCall ? 'you' : caller.display_name.split(' ')[0]}
          </p>

          {/* Date + time */}
          <div className="mt-2 flex items-center gap-1 text-[12px] text-ink-500">
            <Calendar width={13} height={13} />
            <span>
              {formatSessionWhen(call.starts_at).split(' · ')[0]} · {timeRange}
            </span>
          </div>

          {/* Location */}
          <div className="mt-1 flex items-center gap-1 text-[12px] text-ink-500">
            <MapPin width={13} height={13} />
            <span className="truncate">{gymName}</span>
          </div>

          {/* Chips */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span
              className={cn(
                'inline-flex items-center rounded-full text-[10px] font-semibold px-2 py-0.5',
                LOOKING_FOR_STYLE[call.looking_for],
              )}
            >
              {LOOKING_FOR_LABEL[call.looking_for]}
            </span>
            {weightSafe && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 text-teal-600 text-[10px] font-semibold px-2 py-0.5">
                <ShieldCheck width={11} height={11} />
                Weight-safe
              </span>
            )}
            {isFriend && (
              <span className="inline-flex items-center rounded-full bg-paper-50 border border-ink-100 text-ink-500 text-[10px] font-semibold px-2 py-0.5">
                CruxMate
              </span>
            )}
          </div>
        </div>

        {/* Right rail — avatars + count, mirrors SessionCard */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <AvatarStack users={participants} max={3} size={22} />
          <span className={cn('text-[11px] font-medium', style.text)}>
            {call.participant_ids.length} / {call.capacity} people
          </span>
        </div>
      </div>

      {/* Note */}
      {call.note && (
        <p className="mt-3 text-sm text-ink-700 italic border-l-2 border-ink-100 pl-3">
          "{call.note}"
        </p>
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
              disabled={!isRequested && isFull}
              className={cn(!isRequested && !isFull && 'bg-teal-600 hover:bg-teal-500 border-teal-600')}
              onClick={() => (isRequested ? cancelPairRequest(call.id) : onRequest())}
            >
              {isRequested ? 'Requested ✓' : isFull ? 'Full' : 'Request to pair'}
            </Button>
            <Button variant="outline" size="sm" onClick={onViewCard}>
              View card
            </Button>
          </>
        )}
      </div>
    </article>
  );
}
