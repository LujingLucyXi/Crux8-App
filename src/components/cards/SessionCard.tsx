import { Calendar, MapPin, ShieldCheck, SquareWave, TriangleFlag, Cube, Trekking, Walking, Sparks } from 'iconoir-react';
import type { Session, NpcUser } from '@/seed/types';
import { formatCapacity } from '@/seed/types';
import { formatSessionWhen, formatTripRange, isMultiDaySpan } from '@/lib/date';
import { AvatarStack } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { resolveUser, type ResolvedUser } from '@/lib/resolveUser';

// Each category paints the whole card: a saturated icon tile on a matching
// pastel surface, so the Find list reads as colorful blocks, not white rows.
const categoryColor: Record<Session['category'], { bg: string; surface: string; text: string }> = {
  top_rope: { bg: 'bg-brand-600', surface: 'bg-brand-100', text: 'text-brand-600' },
  lead: { bg: 'bg-coral-500', surface: 'bg-coral-100', text: 'text-coral-500' },
  boulder: { bg: 'bg-teal-600', surface: 'bg-teal-100', text: 'text-teal-600' },
  outdoor_sport: { bg: 'bg-gold-500', surface: 'bg-gold-100', text: 'text-gold-500' },
  trad: { bg: 'bg-brand-600', surface: 'bg-ink-100', text: 'text-ink-900' },
  multi_pitch: { bg: 'bg-brand-600', surface: 'bg-ink-100', text: 'text-ink-900' },
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
  const me = useAppStore((s) => s.me);
  const directory = useAppStore((s) => s.directory);
  const color = categoryColor[session.category];
  const Icon = categoryIcon[session.category];
  // DB-backed ids resolve via me -> NPC seeds -> Supabase directory.
  const participants = session.participant_ids
    .map((id) => resolveUser(id, me, users, directory))
    .filter((u): u is ResolvedUser => !!u);

  // Label the signed-in user "You"; photo (when set) wins over the avatar.
  const displayUsers = participants.map((p) => ({
    id: p.id,
    display_name: p.id === me?.id ? 'You' : p.display_name,
    avatar: p.avatar,
    photo_url: p.photo_url ?? undefined,
  }));

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
          <span>
            {isMultiDaySpan(session.starts_at, session.ends_at)
              ? formatTripRange(session.starts_at, session.ends_at)
              : formatSessionWhen(session.starts_at)}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1 text-[12px] text-ink-500">
          <MapPin width={13} height={13} />
          <span className="truncate">{gymName ?? session.area ?? 'Location TBD'}</span>
        </div>
        {(session.is_verified_only || session.requires_attestation || groupName || session.hike_type === 'expedition') && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {session.hike_type === 'expedition' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 text-ink-900 text-[10px] font-semibold px-2 py-0.5">
                <Trekking width={11} height={11} />
                Multi-day trip
              </span>
            )}
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
          {session.participant_ids.length} / {formatCapacity(session.capacity)} people
        </span>
      </div>
    </button>
  );
}
