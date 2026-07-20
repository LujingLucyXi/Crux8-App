import type { Group } from '@/seed/types';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { useNavigate } from 'react-router-dom';

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  const nav = useNavigate();
  const memberships = useAppStore((s) => s.myGroupMemberships);
  const joinGroup = useAppStore((s) => s.joinGroup);
  const leaveGroup = useAppStore((s) => s.leaveGroup);
  const joined = memberships.includes(group.id);

  return (
    <div
      onClick={() => nav(`/community/${group.id}`)}
      className="rounded-2xl bg-white border border-ink-100 overflow-hidden cursor-pointer hover:border-ink-300 transition-colors"
    >
      <img
        src={group.cover_url}
        alt={group.name}
        className="w-full h-24 object-cover"
        loading="lazy"
      />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-ink-900 text-base leading-tight truncate">{group.name}</h3>
            <p className="text-[13px] text-ink-500 mt-0.5 line-clamp-2">{group.tagline}</p>
            <div className="mt-2 flex items-center gap-2 text-[12px] text-ink-500">
              <span>{group.member_count.toLocaleString()} members</span>
              <span>·</span>
              <span className="capitalize">{group.category}</span>
            </div>
            <p className="text-[11px] text-teal-600 mt-1.5 font-medium">{group.recent_activity}</p>
          </div>
          <Button
            variant={joined ? 'outline' : 'primary'}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              joined ? leaveGroup(group.id) : joinGroup(group.id);
            }}
          >
            {joined ? 'Joined' : 'Join'}
          </Button>
        </div>
      </div>
    </div>
  );
}
