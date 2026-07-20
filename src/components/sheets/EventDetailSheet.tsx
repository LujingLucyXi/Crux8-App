import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, OpenInWindow } from 'iconoir-react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { formatSessionWhen } from '@/lib/date';
import type { EventItem } from '@/seed/types';

interface Props {
  event: EventItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailSheet({ event, open, onOpenChange }: Props) {
  const nav = useNavigate();
  const groups = useAppStore((s) => s.groups);
  const rsvpEvent = useAppStore((s) => s.rsvpEvent);
  const unrsvpEvent = useAppStore((s) => s.unrsvpEvent);
  const me = useAppStore((s) => s.me);

  if (!event || !me) return null;
  const host = event.host_group_id ? groups.find((g) => g.id === event.host_group_id) : undefined;
  const isAttending = event.attendee_ids.includes(me.id);
  const isFull = event.capacity !== null && event.attendee_ids.length >= event.capacity;
  const isFree = event.cost_cents === 0;

  const handleRsvp = () => {
    if (isAttending) {
      unrsvpEvent(event.id);
      toast('Removed from event');
    } else if (isFull) {
      rsvpEvent(event.id, true);
      toast('Added to waitlist');
    } else {
      rsvpEvent(event.id);
      toast(`You're going to ${event.title}`);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={event.title}>
        <p className="text-sm text-ink-500 -mt-2 mb-4">{event.tagline}</p>

        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2 text-sm text-ink-700">
            <Calendar width={16} height={16} className="text-ink-500" />
            <span>{formatSessionWhen(event.starts_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-700">
            <MapPin width={16} height={16} className="text-ink-500" />
            <span>{event.venue}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-700">
            <span
              className={
                isFree
                  ? 'inline-flex items-center rounded-full bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5'
                  : 'inline-flex items-center rounded-full bg-gold-100 text-gold-500 text-xs font-semibold px-2 py-0.5'
              }
            >
              {isFree ? 'Free' : `$${event.cost_cents / 100}`}
            </span>
            {event.age_restricted && (
              <span className="inline-flex items-center rounded-full bg-coral-100 text-coral-500 text-xs font-semibold px-2 py-0.5">
                18+
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-ink-700 leading-relaxed mb-5">{event.description}</p>

        {event.gear_note && (
          <div className="mb-5 rounded-xl bg-paper-50 border border-ink-100 p-3">
            <p className="text-xs uppercase tracking-wider text-ink-500 mb-1 font-semibold">Gear</p>
            <p className="text-sm text-ink-700">{event.gear_note}</p>
          </div>
        )}

        <div className="mb-5 text-sm text-ink-500">
          {event.attendee_ids.length} going
          {event.capacity !== null && ` · ${event.capacity - event.attendee_ids.length} spots left`}
          {event.waitlist_ids.length > 0 && ` · ${event.waitlist_ids.length} on waitlist`}
        </div>

        <div className="flex flex-col gap-2">
          <Button variant={isAttending ? 'outline' : 'primary'} onClick={handleRsvp}>
            {isAttending ? 'Cancel RSVP' : isFull ? 'Join waitlist' : 'RSVP'}
          </Button>
          {host && (
            <button
              onClick={() => {
                onOpenChange(false);
                nav(`/community/${host.id}`);
              }}
              className="text-sm text-teal-600 font-medium inline-flex items-center justify-center gap-1 py-2"
            >
              View {host.name} <OpenInWindow width={13} height={13} />
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
