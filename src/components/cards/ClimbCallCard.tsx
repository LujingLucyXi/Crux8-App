import { Calendar, MapPin, SquareWave, TriangleFlag, ShieldCheck } from 'iconoir-react';
import { format } from 'date-fns';
import type { ClimbCall, NpcUser, Profile } from '@/seed/types';
import { formatSessionWhen } from '@/lib/date';
import { AvatarStack } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { isWeightSafe } from '@/lib/weight';

/* Full-color gradient surfaces — each category gets its own energy so a list
   of belay calls reads as a vivid, varied stack, not a wall of white cards. */
const categoryStyle: Record<ClimbCall['category'], { gradient: string; Icon: React.ComponentType<{ width: number; height: number; color: string }> }> = {
  top_rope: { gradient: 'linear-gradient(140deg, #7C3AED 0%, #EC4899 100%)', Icon: SquareWave },
  lead: { gradient: 'linear-gradient(140deg, #F4478A 0%, #F4B942 100%)', Icon: TriangleFlag },
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
      if (id === me?.id) return { id: me.id, display_name: 'You', avatar: me.avatar, photo_url: me.photo_url };
      const u = users.find((x) => x.id === id);
      return u ? { id: u.id, display_name: u.display_name, avatar: u.avatar } : null;
    })
    .filter(Boolean) as Array<{ id: string; display_name: string; avatar: Profile['avatar']; photo_url?: string }>;

  const start = new Date(call.starts_at);
  const end = new Date(call.ends_at);
  const timeRange = `${format(start, 'h:mm')}–${format(end, 'h:mm a')}`;

  return (
    <article
      className="enamel overflow-hidden rounded-3xl p-4 text-white"
      style={{ backgroundImage: style.gradient }}
    >
      <div className="flex gap-3 items-start">
        {/* Category icon — glass tile on the colored surface */}
        <div className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center bg-white/20 ring-1 ring-white/40 backdrop-blur">
          <Icon width={26} height={26} color="white" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title + level */}
          <h3 className="font-extrabold text-white text-lg leading-tight">
            {call.title ?? CATEGORY_LABEL[call.category]}
          </h3>
          <p className="text-[13px] text-white/85 mt-0.5 truncate font-medium">
            {call.grade} · hosted by {isMyCall ? 'you' : caller.display_name.split(' ')[0]}
          </p>

          {/* Date + time */}
          <div className="mt-2 flex items-center gap-1 text-[12px] text-white/85 font-medium">
            <Calendar width={13} height={13} />
            <span>
              {formatSessionWhen(call.starts_at).split(' · ')[0]} · {timeRange}
            </span>
          </div>

          {/* Location */}
          <div className="mt-1 flex items-center gap-1 text-[12px] text-white/85 font-medium">
            <MapPin width={13} height={13} />
            <span className="truncate">{gymName}</span>
          </div>

          {/* Chips */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center rounded-full bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 ring-1 ring-white/25">
              {LOOKING_FOR_LABEL[call.looking_for]}
            </span>
            {weightSafe && (
              <span className="inline-flex items-center gap-1 rounded-full bg-lime-400 text-ink-900 text-[10px] font-black px-2 py-0.5">
                <ShieldCheck width={11} height={11} />
                Weight-safe
              </span>
            )}
            {isFriend && (
              <span className="inline-flex items-center rounded-full bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 ring-1 ring-white/25">
                CruxMate
              </span>
            )}
          </div>
        </div>

        {/* Right rail — avatars + count */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <AvatarStack users={participants} max={3} size={22} />
          <span className="text-[11px] font-bold text-white">
            {call.participant_ids.length} / {call.capacity} people
          </span>
        </div>
      </div>

      {/* Note */}
      {call.note && (
        <p className="mt-3 text-sm text-white/90 italic border-l-2 border-white/40 pl-3">
          "{call.note}"
        </p>
      )}

      {/* CTAs */}
      <div className="mt-3.5 flex gap-2">
        {isMyCall ? (
          <span className="inline-flex items-center rounded-xl bg-white/15 ring-1 ring-white/25 text-white text-xs font-semibold px-3 py-2">
            Your call — live
          </span>
        ) : (
          <>
            {isRequested ? (
              <button
                onClick={() => cancelPairRequest(call.id)}
                className="rounded-2xl bg-white/15 ring-1 ring-white/40 text-white text-xs font-bold px-4 py-2.5 active:scale-[0.97] transition"
              >
                Requested ✓
              </button>
            ) : (
              <Button variant="punch" size="sm" disabled={isFull} onClick={onRequest}>
                {isFull ? 'Full' : 'Request to pair →'}
              </Button>
            )}
            <button
              onClick={onViewCard}
              className="rounded-2xl bg-white/15 ring-1 ring-white/30 text-white text-xs font-bold px-4 py-2.5 hover:bg-white/25 active:scale-[0.97] transition"
            >
              View card
            </button>
          </>
        )}
      </div>
    </article>
  );
}
