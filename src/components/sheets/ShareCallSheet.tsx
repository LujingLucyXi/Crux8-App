import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAppStore } from '@/store/useAppStore';
import { resolveUser } from '@/lib/resolveUser';
import { toast } from 'sonner';
import type { ClimbCall } from '@/seed/types';

interface Props {
  call: ClimbCall | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Share a climb call: post it into a crew's group chat, or copy/send the deep link. */
export function ShareCallSheet({ call, open, onOpenChange }: Props) {
  const groups = useAppStore((s) => s.groups);
  const myGroupMemberships = useAppStore((s) => s.myGroupMemberships);
  const shareClimbCallToGroup = useAppStore((s) => s.shareClimbCallToGroup);
  const cruxmates = useAppStore((s) => s.cruxmates);
  const me = useAppStore((s) => s.me);
  const users = useAppStore((s) => s.users);
  const directory = useAppStore((s) => s.directory);
  const inviteCruxmatesToCall = useAppStore((s) => s.inviteCruxmatesToCall);
  const [sharedTo, setSharedTo] = useState<string | null>(null);
  const [invited, setInvited] = useState<string[]>([]);

  if (!call) return null;
  const link = `https://crux8.app/call/${call.id}`;
  const myGroups = groups.filter((g) => myGroupMemberships.includes(g.id));
  // Cruxmates who could still join: not me, not Cruxy (she has her own
  // auto-accept button), and not already in the call.
  const invitable = me
    ? cruxmates
        .filter((id) => id !== 'cruxy' && id !== me.id && !call.participant_ids.includes(id))
        .map((id) => resolveUser(id, me, users, directory))
        .filter((u): u is NonNullable<typeof u> => !!u)
    : [];

  const handleInvite = (userId: string, name: string) => {
    inviteCruxmatesToCall(call.id, [userId]);
    setInvited((prev) => [...prev, userId]);
    toast.success(`Invite sent to ${name}`);
  };

  const handleShareToGroup = (groupId: string, groupName: string) => {
    shareClimbCallToGroup(call.id, groupId);
    setSharedTo(groupId);
    toast.success(`Shared to ${groupName}`);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy — long-press the link below');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Climb call on Crux8', text: 'Want to climb together?', url: link });
      } catch {
        /* user dismissed */
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setSharedTo(null); setInvited([]); } }}>
      <SheetContent>
        <h2 className="text-lg font-bold text-ink-900">Share this climb call</h2>
        <p className="text-sm text-ink-500 mt-1">
          Invite a cruxmate directly, post it to a crew chat, or send the link — anyone with it can view the call and request to pair.
        </p>

        {invitable.length > 0 && (
          <>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mt-5 mb-2">
              Invite a cruxmate
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {invitable.map((u) => (
                <div
                  key={u.id}
                  className="w-full flex items-center gap-3 rounded-xl border border-ink-100 bg-paper-100 px-4 py-2.5"
                >
                  <Avatar photoUrl={u.photo_url ?? undefined} config={u.avatar} alt={u.display_name} size={32} fallback={u.display_name} />
                  <span className="font-medium text-ink-900 text-sm truncate flex-1">{u.display_name}</span>
                  <button
                    onClick={() => handleInvite(u.id, u.display_name)}
                    disabled={invited.includes(u.id)}
                    className="text-xs font-semibold text-teal-600 shrink-0 disabled:text-ink-400"
                  >
                    {invited.includes(u.id) ? '✓ Invited' : 'Invite'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {myGroups.length > 0 && (
          <>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mt-5 mb-2">
              Post to a crew chat
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {myGroups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleShareToGroup(g.id, g.name)}
                  className="w-full flex items-center justify-between rounded-xl border border-ink-100 bg-paper-100 px-4 py-3 hover:border-ink-300 text-left"
                >
                  <span className="font-medium text-ink-900 text-sm truncate">{g.name}</span>
                  <span className="text-xs font-semibold text-teal-600 shrink-0 ml-3">
                    {sharedTo === g.id ? '✓ Shared' : 'Share'}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mt-5 mb-2">
          Share outside Crux8
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleCopy}>
            Copy link
          </Button>
          <Button className="flex-1" onClick={handleNativeShare}>
            Send…
          </Button>
        </div>
        <p className="mt-3 text-[11px] text-ink-400 break-all">{link}</p>
      </SheetContent>
    </Sheet>
  );
}
