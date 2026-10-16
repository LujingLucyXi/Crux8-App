import { useEffect, useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { resolveUser } from '@/lib/resolveUser';
import { CruxmatePicker } from '@/components/sheets/CruxmatePicker';
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
  const ensureDirectoryProfiles = useAppStore((s) => s.ensureDirectoryProfiles);
  const inviteCruxmatesToCall = useAppStore((s) => s.inviteCruxmatesToCall);
  const inviteCruxyToCall = useAppStore((s) => s.inviteCruxyToCall);
  const [sharedTo, setSharedTo] = useState<string | null>(null);
  const [invited, setInvited] = useState<string[]>([]);

  // Picker names resolve through the directory — fetch any cruxmate
  // profiles this device hasn't loaded yet, or real mates vanish.
  useEffect(() => {
    if (open) void ensureDirectoryProfiles(cruxmates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  if (!call) return null;
  const link = `https://crux8.app/call/${call.id}`;
  const myGroups = groups.filter((g) => myGroupMemberships.includes(g.id));
  // Cruxmates who could still join: not me, and not already in the call.
  // Cruxy is invitable like everyone else — inviting her is what makes
  // her join (she auto-accepts on invite, never without one).
  const invitable = me
    ? cruxmates
        .filter((id) => id !== me.id && !call.participant_ids.includes(id))
        .map((id) => resolveUser(id, me, users, directory))
        .filter((u): u is NonNullable<typeof u> => !!u)
    : [];

  const handleInvite = (userId: string, name: string) => {
    if (userId === 'cruxy') {
      inviteCruxyToCall(call.id);
      setInvited((prev) => [...prev, userId]);
      toast.success('Cruxy joined your call 🦊');
      return;
    }
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
        // Link inside the text — a separate `url` field becomes an
        // unopenable file in WeChat (see InviteSection, 2026-10-16).
        await navigator.share({ title: 'Climb call on Crux8', text: `Want to climb together? ${link}` });
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
        <h2 className="text-lg font-bold text-ink-900">Invite &amp; share</h2>
        <p className="text-sm text-ink-500 mt-1">
          Invite a cruxmate directly, post it to a crew chat, or send the link — anyone with it can view the call and request to pair.
        </p>
        <Button className="mt-4 w-full" onClick={() => onOpenChange(false)}>
          ← Done — back to the call
        </Button>

        {invitable.length > 0 && (
          <>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mt-5 mb-2">
              Invite a cruxmate
            </h3>
            <CruxmatePicker invitable={invitable} invited={invited} onInvite={handleInvite} />
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
          <Button variant="outline" className="flex-1" onClick={handleNativeShare}>
            Send…
          </Button>
        </div>
        <p className="mt-3 text-[11px] text-ink-400 break-all">{link}</p>
      </SheetContent>
    </Sheet>
  );
}
