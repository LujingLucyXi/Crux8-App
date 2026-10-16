import { useState } from 'react';
import QRCode from 'react-qr-code';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { resolveUser } from '@/lib/resolveUser';
import { CruxmatePicker } from '@/components/sheets/CruxmatePicker';
import { toast } from 'sonner';
import { hasStarted } from '@/lib/sessionPhase';
import type { Session } from '@/seed/types';

interface Props {
  session: Session | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Share a session: invite cruxmates by DM, post it into a crew's group
 *  chat, or copy/send the deep link. */
export function ShareSessionSheet({ session, open, onOpenChange }: Props) {
  const groups = useAppStore((s) => s.groups);
  const myGroupMemberships = useAppStore((s) => s.myGroupMemberships);
  const shareSessionToGroup = useAppStore((s) => s.shareSessionToGroup);
  const cruxmates = useAppStore((s) => s.cruxmates);
  const me = useAppStore((s) => s.me);
  const users = useAppStore((s) => s.users);
  const directory = useAppStore((s) => s.directory);
  const inviteCruxmatesToSession = useAppStore((s) => s.inviteCruxmatesToSession);
  const inviteCruxy = useAppStore((s) => s.inviteCruxy);
  const sessionLifecycle = useAppStore((s) => s.sessionLifecycle);
  const [sharedTo, setSharedTo] = useState<string | null>(null);
  const [invited, setInvited] = useState<string[]>([]);

  if (!session) return null;
  // An ONGOING session can be shared (crew chat + outside link) so people
  // can follow along — but joining closed when it started, so the invite
  // picker steps aside and the copy says so.
  const live = hasStarted(session, sessionLifecycle[session.id]) && !session.finished_at;
  const link = `https://crux8.app/session/${session.id}`;
  const myGroups = groups.filter((g) => myGroupMemberships.includes(g.id));
  // Cruxmates who could still join: not me, and not already in the session.
  // Cruxy is invitable like everyone else — inviting her is what makes
  // her join (she auto-accepts on invite, never without one).
  const invitable = me
    ? cruxmates
        .filter((id) => id !== me.id && !session.participant_ids.includes(id))
        .map((id) => resolveUser(id, me, users, directory))
        .filter((u): u is NonNullable<typeof u> => !!u)
    : [];

  const handleInvite = (userId: string, name: string) => {
    if (userId === 'cruxy') {
      inviteCruxy(session.id);
      setInvited((prev) => [...prev, userId]);
      toast.success('Cruxy joined your session 🦊');
      return;
    }
    inviteCruxmatesToSession(session.id, [userId]);
    setInvited((prev) => [...prev, userId]);
    toast.success(`Invite sent to ${name}`);
  };

  const handleShareToGroup = (groupId: string, groupName: string) => {
    shareSessionToGroup(session.id, groupId);
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
        await navigator.share({ title: 'Climb session on Crux8', text: `${live ? "We're climbing now 🧗" : 'Come climb with us?'} ${link}` });
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
        <h2 className="text-lg font-bold text-ink-900">{live ? 'Share live session' : 'Invite & share'}</h2>
        <p className="text-sm text-ink-500 mt-1">
          {live
            ? 'This session is live now. Anyone with the share — crew chat, link, QR code, or a direct invite — can view it and still join in.'
            : 'Invite a cruxmate directly, post it to a crew chat, or send the link — anyone with it can view the session and RSVP.'}
        </p>
        <Button className="mt-4 w-full" onClick={() => onOpenChange(false)}>
          ← Done — back to the session
        </Button>

        {invitable.length > 0 ? (
          <>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mt-5 mb-2">
              Invite a cruxmate
            </h3>
            <CruxmatePicker invitable={invitable} invited={invited} onInvite={handleInvite} />
          </>
        ) : (
          // No cruxmates yet: the link + QR below ARE the invite path.
          // Anyone who scans lands on the session roster, where the host
          // can add them as a cruxmate (front door, 2026-10-14).
          <div className="rounded-2xl border border-dashed border-ink-100 bg-paper-100 p-4 mt-5">
            <p className="text-sm font-semibold text-ink-900">No cruxmates yet — your first crew starts at the gym</p>
            <p className="mt-1 text-xs text-ink-500">
              Show the QR code below. Anyone who scans it lands on this session's roster,
              where you can add them as a cruxmate.
            </p>
          </div>
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
          Scan to join
        </h3>
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-2xl bg-[#F7F3EA] p-4">
            <QRCode value={link} size={168} bgColor="#F7F3EA" fgColor="#161616" />
          </div>
          <p className="text-xs text-ink-500 text-center">
            Show this at the gym — anyone who scans it lands on the session and can join.
          </p>
        </div>

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
