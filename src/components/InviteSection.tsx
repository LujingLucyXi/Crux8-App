import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { inviteLink } from '@/lib/inviteCode';

interface Props {
  code: string;
  displayName: string;
}

/**
 * "My invite" — the personal add-friend surface: QR code encoding the
 * personal add link, the invite code in mono, copy + native share.
 * Share/copy patterns mirror ShareSessionSheet's session sharing.
 */
export function InviteSection({ code, displayName }: Props) {
  const link = inviteLink(code);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Invite link copied');
    } catch {
      toast.error('Could not copy — long-press the code to select it');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Crux8',
          text: `🧗 Join me on Crux8 — find climbing partners, join sessions, and collect climber DNA cards. Use my invite link to join:`,
          url: link,
        });
      } catch {
        /* user dismissed */
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="rounded-2xl bg-paper-100 border border-ink-100 p-4">
      <div className="flex gap-4 items-center">
        <div className="shrink-0 rounded-xl bg-[#F7F3EA] p-2 border border-ink-100">
          <QRCode value={link} size={84} bgColor="#F7F3EA" fgColor="#161616" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            My invite code
          </p>
          <p className="mt-0.5 font-mono text-xl font-bold tracking-widest text-ink-900">
            {code}
          </p>
          <p className="mt-0.5 text-xs text-ink-500 leading-snug">
            Scan to join Crux8 — this invite is yours.
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={handleCopy}>
          Copy link
        </Button>
        <Button className="flex-1" onClick={handleNativeShare}>
          Invite a friend to join
        </Button>
      </div>
    </div>
  );
}
