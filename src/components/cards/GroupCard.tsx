import type { Group } from '@/seed/types';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { getHouse } from '@/lib/quizMeta';

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  const nav = useNavigate();
  const memberships = useAppStore((s) => s.myGroupMemberships);
  const joinGroup = useAppStore((s) => s.joinGroup);
  const leaveGroup = useAppStore((s) => s.leaveGroup);
  const joined = memberships.includes(group.id);
  const requestPolicy = (group.join_policy ?? 'open') === 'request';
  const requested = (group.pending ?? []).some((r) => r.user_id === 'me');
  const house = group.house_id ? getHouse(group.house_id) : undefined;
  // House hangouts track their real roster in member_ids; prefer the deduped
  // roster size (repairs counts inflated by the old double-join bug).
  const displayCount =
    group.kind === 'house_hangout' && group.member_ids?.length
      ? new Set(group.member_ids).size
      : group.member_count;

  return (
    <div
      onClick={() => nav(`/community/${group.id}`)}
      className="rounded-2xl bg-paper-100 border border-ink-100 overflow-hidden cursor-pointer hover:border-ink-300 transition-colors"
    >
      <div className="h-24 w-full overflow-hidden" aria-hidden>
        {group.cover_url ? (
          <img
            src={group.cover_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          // Coverless crews (house hangouts, user-created) get a gold-house
          // gradient banner instead of a broken <img>.
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background: house
                ? `linear-gradient(120deg, ${house.color}55, #16161A 75%)`
                : 'linear-gradient(120deg, #8A6D2F, #16161A 75%)',
            }}
          >
            <span className="text-4xl opacity-80">{house?.emoji ?? '🧗'}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-ink-900 text-base leading-tight truncate">{group.name}</h3>
            <p className="text-[13px] text-ink-500 mt-0.5 line-clamp-2">{group.tagline}</p>
            <div className="mt-2 flex items-center gap-2 text-[12px] text-ink-500">
              <span>{displayCount.toLocaleString()} members</span>
              <span>·</span>
              <span className="capitalize">{group.category}</span>
              {group.kind === 'house_hangout' && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 text-brand-700 text-[10px] font-semibold px-2 py-0.5">
                    🏠 Auto-matched
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-teal-600 mt-1.5 font-medium">{group.recent_activity}</p>
          </div>
          <Button
            variant={joined || requested ? 'outline' : 'primary'}
            size="sm"
            disabled={requested}
            onClick={(e) => {
              e.stopPropagation();
              if (joined) return leaveGroup(group.id);
              // Request-only crews go through the detail page's request flow.
              if (requestPolicy) return nav(`/community/${group.id}`);
              joinGroup(group.id);
            }}
          >
            {joined ? 'Joined' : requested ? 'Requested' : requestPolicy ? 'Request' : 'Join'}
          </Button>
        </div>
      </div>
    </div>
  );
}
