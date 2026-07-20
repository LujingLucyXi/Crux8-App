import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavArrowLeft, Plus } from 'iconoir-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { SessionCard } from '@/components/cards/SessionCard';
import { EventCard } from '@/components/cards/EventCard';
import { SessionDetailSheet } from '@/components/sheets/SessionDetailSheet';
import { EventDetailSheet } from '@/components/sheets/EventDetailSheet';
import { NewSessionSheet } from '@/components/sheets/NewSessionSheet';
import { useAppStore } from '@/store/useAppStore';
import type { Session, EventItem } from '@/seed/types';

export function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const nav = useNavigate();
  const groups = useAppStore((s) => s.groups);
  const users = useAppStore((s) => s.users);
  const gyms = useAppStore((s) => s.gyms);
  const sessions = useAppStore((s) => s.sessions);
  const events = useAppStore((s) => s.events);
  const memberships = useAppStore((s) => s.myGroupMemberships);
  const joinGroup = useAppStore((s) => s.joinGroup);
  const leaveGroup = useAppStore((s) => s.leaveGroup);
  const me = useAppStore((s) => s.me);

  const [detailSession, setDetailSession] = useState<Session | null>(null);
  const [detailEvent, setDetailEvent] = useState<EventItem | null>(null);
  const [postOpen, setPostOpen] = useState(false);

  const group = groups.find((g) => g.id === groupId);
  if (!group) {
    return (
      <div className="pt-10 text-center">
        <p className="text-sm text-ink-500">Group not found.</p>
        <button onClick={() => nav('/community')} className="mt-3 text-teal-600 text-sm font-medium">
          Back to Community
        </button>
      </div>
    );
  }

  const joined = memberships.includes(group.id);
  const admins = group.admin_ids
    .map((id) => (id === 'me' ? { id: 'me', display_name: me?.display_name ?? 'You', avatar_url: me?.avatar_url } : users.find((u) => u.id === id)))
    .filter(Boolean) as Array<{ id: string; display_name: string; avatar_url?: string }>;
  const isAdmin = group.admin_ids.includes(me?.id ?? 'me');

  const groupSessions = sessions.filter((s) => s.posted_by_group_id === group.id);
  const groupEvents = events.filter((e) => e.host_group_id === group.id);

  return (
    <div className="pb-4 -mx-4">
      <button
        onClick={() => nav('/community')}
        className="absolute top-16 left-3 z-10 rounded-full bg-white/90 backdrop-blur border border-ink-100 p-2"
        aria-label="Back"
      >
        <NavArrowLeft width={18} height={18} className="text-ink-900" />
      </button>

      <img src={group.cover_url} alt={group.name} className="w-full h-40 object-cover" />

      <div className="px-4 -mt-6 relative">
        <div className="rounded-2xl bg-white border border-ink-100 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-ink-900">{group.name}</h1>
              <p className="text-sm text-ink-500 mt-1">{group.tagline}</p>
              <p className="text-xs text-ink-500 mt-2">
                {group.member_count.toLocaleString()} members · <span className="capitalize">{group.category}</span>
              </p>
            </div>
            <Button
              variant={joined ? 'outline' : 'primary'}
              size="sm"
              onClick={() => (joined ? leaveGroup(group.id) : joinGroup(group.id))}
            >
              {joined ? 'Joined' : 'Join'}
            </Button>
          </div>

          <p className="mt-4 text-sm text-ink-700 leading-relaxed">{group.description}</p>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Admins</p>
            <div className="flex flex-wrap gap-2">
              {admins.map((a) => (
                <div key={a.id} className="flex items-center gap-2 rounded-full bg-paper-50 border border-ink-100 pl-1 pr-3 py-1">
                  <Avatar src={a.avatar_url} alt={a.display_name} size={22} fallback={a.display_name} />
                  <span className="text-xs font-medium text-ink-700">{a.display_name}</span>
                  <span className="text-[9px] font-semibold text-teal-600 uppercase tracking-wider">Admin</span>
                </div>
              ))}
            </div>
          </div>

          {isAdmin && (
            <Button variant="outline" className="w-full mt-4" onClick={() => setPostOpen(true)}>
              <Plus width={16} height={16} /> Post to group
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 mt-6">
        <h2 className="text-base font-semibold text-ink-900 mb-3">Upcoming events</h2>
        <div className="flex flex-col gap-3">
          {groupEvents.length > 0 ? (
            groupEvents.map((e) => (
              <EventCard key={e.id} event={e} onClick={() => setDetailEvent(e)} />
            ))
          ) : (
            <p className="text-sm text-ink-500 text-center py-4">No events posted yet.</p>
          )}
        </div>

        {groupSessions.length > 0 && (
          <>
            <h2 className="text-base font-semibold text-ink-900 mb-3 mt-6">Group sessions</h2>
            <div className="flex flex-col gap-3">
              {groupSessions.map((s) => {
                const gym = s.gym_id ? gyms.find((g) => g.id === s.gym_id) : undefined;
                return (
                  <SessionCard
                    key={s.id}
                    session={s}
                    users={users}
                    gymName={gym?.short_name}
                    onClick={() => setDetailSession(s)}
                    groupName={group.name}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>

      <SessionDetailSheet
        session={detailSession}
        open={!!detailSession}
        onOpenChange={(o) => !o && setDetailSession(null)}
      />
      <EventDetailSheet
        event={detailEvent}
        open={!!detailEvent}
        onOpenChange={(o) => !o && setDetailEvent(null)}
      />
      <NewSessionSheet open={postOpen} onOpenChange={setPostOpen} defaultGroupId={group.id} />
    </div>
  );
}
