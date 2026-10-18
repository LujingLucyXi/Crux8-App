import { toast } from 'sonner';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Avatar } from '@/components/ui/Avatar';
import { useAppStore } from '@/store/useAppStore';
import type { AvatarConfig } from '@/lib/avatar';
import type { Group } from '@/seed/types';

interface Props {
  group: Group | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PersonLite = { id: string; display_name: string; avatar?: AvatarConfig; photo_url?: string };

/**
 * Invite friends into a crew, opened from the crew chat (Lucy
 * 2026-10-17). Same membership rule as the Manage page: cruxmates can
 * be ADDED directly; everyone else I'm connected to (a follow in either
 * direction) is INVITED and joins only by accepting in Notifications —
 * nobody gets randomly added to a crew.
 */
export function CrewInviteSheet({ group, open, onOpenChange }: Props) {
  const users = useAppStore((s) => s.users);
  const directory = useAppStore((s) => s.directory);
  const me = useAppStore((s) => s.me);
  const cruxmates = useAppStore((s) => s.cruxmates);
  const mateRequests = useAppStore((s) => s.mateRequests);
  const addMember = useAppStore((s) => s.addGroupMember);
  const inviteToGroup = useAppStore((s) => s.inviteToGroup);
  const sentGroupInvites = useAppStore((s) => s.sentGroupInvites);

  if (!group || !me) return null;

  // Same resolution chain as GroupManage — a raw id never renders as a name.
  const person = (id: string): PersonLite => {
    if (id === 'me' || id === me.id) {
      return { id: me.id, display_name: me.display_name ?? 'You', avatar: me.avatar, photo_url: me.photo_url };
    }
    const npc = users.find((u) => u.id === id);
    if (npc) return { id, display_name: npc.display_name, avatar: npc.avatar ?? undefined };
    const dir = directory[id];
    if (dir) return { id, display_name: dir.display_name?.trim() ? dir.display_name : 'Climber', avatar: dir.avatar ?? undefined, photo_url: dir.photo_url ?? undefined };
    return { id, display_name: 'Climber' };
  };

  const inGroup = new Set([
    ...group.admin_ids,
    ...(group.member_ids ?? []),
    ...(group.pending ?? []).map((r) => r.user_id),
    me.id,
    'me',
  ]);
  const addCandidates = cruxmates.filter((id) => !inGroup.has(id));
  const connected = new Set<string>();
  for (const r of mateRequests) {
    if (r.status === 'denied') continue;
    if (r.from_id === me.id) connected.add(r.to_id);
    if (r.to_id === me.id) connected.add(r.from_id);
  }
  const inviteCandidates = [...connected].filter(
    (id) => !inGroup.has(id) && !cruxmates.includes(id),
  );
  const sent = sentGroupInvites[group.id] ?? [];
  const nobody = addCandidates.length === 0 && inviteCandidates.length === 0;

  const row = (id: string, action: React.ReactNode) => {
    const p = person(id);
    return (
      <div key={id} className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar photoUrl={p.photo_url} config={p.avatar} seed={p.id} alt={p.display_name} size={30} fallback={p.display_name} />
          <span className="text-sm text-ink-900 truncate">{p.display_name}</span>
        </div>
        {action}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={`Invite to ${group.name}`}>
        <div className="px-5 pb-6 pt-1 overflow-y-auto">
          {nobody && (
            <p className="text-sm text-ink-500">
              No one to invite yet. When you have cruxmates or people you follow (or who follow
              you), they'll show up here.
            </p>
          )}
          {addCandidates.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
                Add members
              </p>
              <div className="flex flex-col gap-2">
                {addCandidates.map((id) =>
                  row(
                    id,
                    <button
                      onClick={() => {
                        addMember(group.id, id);
                        toast.success(`${person(id).display_name} added to the crew`);
                      }}
                      className="rounded-full bg-brand-600 px-3.5 py-1.5 text-xs font-bold text-[#161310]"
                    >
                      Add
                    </button>,
                  ),
                )}
              </div>
            </div>
          )}
          {inviteCandidates.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
                Invite to join
              </p>
              <p className="text-xs text-ink-500 mb-2">
                Not cruxmates yet — they join only if they accept the invitation.
              </p>
              <div className="flex flex-col gap-2">
                {inviteCandidates.map((id) =>
                  row(
                    id,
                    sent.includes(id) ? (
                      <span className="rounded-full border border-ink-100 px-3.5 py-1.5 text-xs font-semibold text-ink-500">
                        Invited
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          inviteToGroup(group.id, id);
                          toast.success(`Invitation sent to ${person(id).display_name}`);
                        }}
                        className="rounded-full border border-brand-600 px-3.5 py-1.5 text-xs font-bold text-ink-900"
                      >
                        Invite
                      </button>
                    ),
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
