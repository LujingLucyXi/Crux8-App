import { Calendar, MapPin, ShieldCheck, SquareWave, TriangleFlag, Cube, Trekking, Walking, Sparks } from 'iconoir-react';
import type { Session, NpcUser } from '@/seed/types';
import { formatSessionWhen } from '@/lib/date';
import { AvatarStack } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

// Each category paints the whole card: a saturated icon tile on a matching
// pastel surface, so the Find list reads as colorful blocks, not white rows.
const categoryColor: Record<Session['category'], { bg: string; surface: string; text: string }> = {
  top_rope: { bg: 'bg-brand-600', surface: 'bg-brand-100', text: 'text-brand-600' },
  lead: { bg: 'bg-coral-500', surface: 'bg-coral-100', text: 'text-coral-500' },
  boulder: { bg: 'bg-teal-600', surface: 'bg-teal-100', text: 'text-teal-600' },
  outdoor_sport: { bg: 'bg-gold-500', surface: 'bg-gold-100', text: 'text-gold-500' },
  trad: { bg: 'bg-ink-900', surface: 'bg-ink-100', text: 'text-ink-900' },
  multi_pitch: { bg: 'bg-ink-900', surface: 'bg-ink-100', text: 'text-ink-900' },
  outdoor_boulder: { bg: 'bg-gold-500', surface: 'bg-gold-100', text: 'text-gold-500' },
  hiking: { bg: 'bg-teal-600', surface: 'bg-teal-100', text: 'text-teal-600' },
  event: { bg: 'bg-pink-500', surface: 'bg-pink-100', text: 'text-pink-500' },
};

const categoryIcon: Record<Session['category'], React.ComponentType<{ width: number; height: number; color: string }>> = {
  top_rope: SquareWave,
  lead: TriangleFlag,
  boulder: Cube,
  outdoor_sport: Trekking,
  trad: Trekking,
  multi_pitch: Trekking,
  outdoor_boulder: Cube,
  hiking: Walking,
  event: Sparks,
};

interface SessionCardProps {
  session: Session;
  users: NpcUser[];
  gymName?: string;
  onClick?: () => void;
  matchScore?: number;
  groupName?: string;
}

export function SessionCard({ session, users, gymName, onClick, matchScore, groupName }: SessionCardProps) {
  const meAvatar = useAppStore((s) => s.me?.avatar);
  const mePhoto = useAppStore((s) => s.me?.photo_url);
  const color = categoryColor[session.category];
  const Icon = categoryIcon[session.category];
  const participants = session.participant_ids
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is NpcUser => !!u);

  const meIncluded = session.participant_ids.includes('me');
  // If me is in participants but not resolved from users list, add pseudo-entry
  const displayUsers = meIncluded
    ? [{ id: 'me', display_name: 'You', avatar: meAvatar, photo_url: mePhoto }, ...participants]
    : participants;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-2xl p-4 flex gap-3 items-start border border-transparent hover:brightness-[0.98] active:scale-[0.99] transition',
        color.surface,
      )}
    >
      <div className={cn('w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center', color.bg)}>
        <Icon width={26} height={26} color="white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-ink-900 text-base leading-tight">{session.title}</h3>
            <p className="text-[13px] text-ink-500 mt-0.5 truncate">{session.subtitle}</p>
          </div>
          {typeof matchScore === 'number' && (
            <span className="shrink-0 rounded-full border border-teal-600 text-teal-600 text-[10px] font-semibold px-2 py-0.5">
              Match {matchScore}%
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-1 text-[12px] text-ink-500">
          <Calendar width={13} height={13} />
          <span>{formatSessionWhen(session.starts_at)}</span>
        </div>
        <div className="mt-1 flex items-center gap-1 text-[12px] text-ink-500">
          <MapPin width={13} height={13} />
          <span className="truncate">{gymName ?? session.area ?? 'Location TBD'}</span>
        </div>
        {(session.is_verified_only || session.requires_attestation || groupName) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {session.is_verified_only && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 text-teal-600 text-[10px] font-semibold px-2 py-0.5">
                <ShieldCheck width={11} height={11} />
                Verified only
              </span>
            )}
            {session.requires_attestation && (
              <span className="inline-flex items-center rounded-full bg-coral-100 text-coral-500 text-[10px] font-semibold px-2 py-0.5">
                TRAD · attestation
              </span>
            )}
            {groupName && (
              <span className="inline-flex items-center rounded-full bg-paper-50 border border-ink-100 text-ink-500 text-[10px] font-semibold px-2 py-0.5">
                Posted by {groupName}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <AvatarStack users={displayUsers} max={3} size={22} />
        <span className={cn('text-[11px] font-medium', color.text)}>
          {session.participant_ids.length} / {session.capacity} people
        </span>
      </div>
    </button>
  );
}
