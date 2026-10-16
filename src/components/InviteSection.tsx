import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { inviteLink } from '@/lib/inviteCode';

interface Props {
  code: string;
  displayName: string;
}

/**
 * Two SEPARATE things, presented separately (Lucy 2026-10-16):
 * 1. "My Crux ID" — my identity card. Members scan or type it to FIND
 *    me; following each other is what makes cruxmates. [Copy code]
 * 2. The join invite — its own line below the card. For people NOT on
 *    Crux8 yet: the link brings them INTO the app. [Invite a friend…]
 * The QR and the link still point at /add/:code under the hood (the
 * landing sorts newcomers from members), but the two jobs are never
 * blended in one label or one button again.
 */
export function InviteSection({ code, displayName }: Props) {
  const link = inviteLink(code);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Crux ID copied');
    } catch {
      toast.error('Could not copy — long-press the code to select it');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Invite link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Crux8',
          // The link rides INSIDE the text on purpose: passing it as
          // the separate `url` field makes iOS hand WeChat a 113-byte
          // mystery "file" instead of a tappable link (Lucy's WeChat
          // test, 2026-10-16 — chat showed the text bubble with no URL
          // plus an unopenable hex-named file). Text links work there.
          text: `🧗 Join me on Crux8 — find climbing partners, join sessions, and collect climber DNA cards. Use my invite link to join: ${link}`,
        });
      } catch {
        /* user dismissed */
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div>
      {/* ── My Crux ID: find me, follow me ── */}
      <div className="rounded-2xl bg-paper-100 border border-ink-100 p-4">
        <div className="flex gap-4 items-center">
          <div className="shrink-0 rounded-xl bg-[#F7F3EA] p-2 border border-ink-100">
            <QRCode value={link} size={84} bgColor="#F7F3EA" fgColor="#161616" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              My Crux ID
            </p>
            <p className="mt-0.5 font-mono text-xl font-bold tracking-widest text-ink-900">
              {code}
            </p>
            <p className="mt-0.5 text-xs text-ink-500 leading-snug">
              Scan to find me — follow each other to become cruxmates.
            </p>
          </div>
        </div>
        <Button variant="outline" className="mt-3 w-full" onClick={handleCopyCode}>
          Copy code
        </Button>
      </div>

      {/* ── The join invite: a separate line for people not on Crux8 ── */}
      <Button className="mt-3 w-full" onClick={handleNativeShare}>
        Invite a friend to join Crux8
      </Button>
      <p className="mt-1.5 text-center text-[11px] text-ink-400">
        New people join Crux8 through your invite link.{' '}
        <button onClick={handleCopyLink} className="font-semibold text-teal-600 underline">
          Copy link
        </button>
      </p>
    </div>
  );
}
