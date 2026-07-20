import { Calendar, MapPin, Sparks, Community, GraduationCap, Trekking, Snow, Trophy, CoffeeCup } from 'iconoir-react';
import type { EventItem } from '@/seed/types';
import { formatSessionWhen } from '@/lib/date';
import { cn } from '@/lib/utils';

const typeColor: Record<EventItem['type'], { bg: string; text: string }> = {
  community_night: { bg: 'bg-teal-600', text: 'text-teal-600' },
  identity: { bg: 'bg-coral-500', text: 'text-coral-500' },
  education: { bg: 'bg-gold-500', text: 'text-gold-500' },
  mountaineering: { bg: 'bg-ink-900', text: 'text-ink-900' },
  backcountry: { bg: 'bg-teal-600', text: 'text-teal-600' },
  comp: { bg: 'bg-coral-500', text: 'text-coral-500' },
  social: { bg: 'bg-teal-600', text: 'text-teal-600' },
};

const typeIcon: Record<EventItem['type'], React.ComponentType<{ width: number; height: number; color: string }>> = {
  community_night: Community,
  identity: Sparks,
  education: GraduationCap,
  mountaineering: Trekking,
  backcountry: Snow,
  comp: Trophy,
  social: CoffeeCup,
};

interface EventCardProps {
  event: EventItem;
  hostGroupName?: string;
  onClick?: () => void;
}

export function EventCard({ event, hostGroupName, onClick }: EventCardProps) {
  const color = typeColor[event.type];
  const Icon = typeIcon[event.type];
  const isFree = event.cost_cents === 0;
  const attending = event.attendee_ids.length;
  const waitlist = event.waitlist_ids.length;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl bg-white border border-ink-100 p-4 flex gap-3 items-start hover:border-ink-300 transition-colors"
    >
      <div className={cn('w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center', color.bg)}>
        <Icon width={26} height={26} color="white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-ink-900 text-base leading-tight truncate">{event.title}</h3>
            <p className="text-[13px] text-ink-500 mt-0.5 truncate">{event.tagline}</p>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full text-[10px] font-semibold px-2 py-0.5',
              isFree ? 'bg-teal-100 text-teal-600' : 'bg-gold-100 text-gold-500',
            )}
          >
            {isFree ? 'Free' : `$${event.cost_cents / 100}`}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1 text-[12px] text-ink-500">
          <Calendar width={13} height={13} />
          <span>{formatSessionWhen(event.starts_at)}</span>
        </div>
        <div className="mt-1 flex items-center gap-1 text-[12px] text-ink-500">
          <MapPin width={13} height={13} />
          <span className="truncate">{event.venue}</span>
        </div>
        {hostGroupName && (
          <div className="mt-2">
            <span className="inline-flex items-center rounded-full border border-teal-600 text-teal-600 text-[10px] font-semibold px-2 py-0.5">
              {hostGroupName}
            </span>
          </div>
        )}
        <p className="mt-2 text-[11px] text-ink-500">
          {attending} going{waitlist > 0 && ` · ${waitlist} waitlist`}
        </p>
      </div>
    </button>
  );
}
