import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck } from 'iconoir-react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAppStore } from '@/store/useAppStore';
import { resolveUser } from '@/lib/resolveUser';

interface Props {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileSheet({ userId, open, onOpenChange }: Props) {
  const nav = useNavigate();
  const users = useAppStore((s) => s.users);
  const me = useAppStore((s) => s.me);
  const directory = useAppStore((s) => s.directory);
  const gyms = useAppStore((s) => s.gyms);
  const cruxmates = useAppStore((s) => s.cruxmates);
  const directoryVerifications = useAppStore((s) => s.directoryVerifications);
  const requestCruxmate = useAppStore((s) => s.requestCruxmate);
  const cancelMateRequest = useAppStore((s) => s.cancelMateRequest);
  const mateRequestFor = useAppStore((s) => s.mateRequestFor);
  const mateRequests = useAppStore((s) => s.mateRequests);

  const user = userId ? resolveUser(userId, me, users, directory) : undefined;
  if (!user) return null;
  // NPC seed users carry verifications inline; real users' come from their
  // public profile status (directoryVerifications).
  const npcUser = users.find((u) => u.id === user.id);
  const userVerifications =
    npcUser?.verifications ?? directoryVerifications[user.id];
  const homeGymId = npcUser?.home_gym_id ?? (user.id === me?.id ? me?.home_gym_id : undefined);
  const gym = gyms.find((g) => g.id === homeGymId);
  const isCruxmate = cruxmates.includes(user.id);
  const reqDir = isCruxmate ? null : mateRequestFor(user.id);

  const handleAddButton = () => {
    if (reqDir === 'incoming') {
      if (requestCruxmate(user.id) === 'accepted') {
        toast.success(`You're cruxmates with ${user.display_name.split(' ')[0]} 🤝`);
      }
      return;
    }
    if (reqDir === 'outgoing') {
      cancelMateRequest(user.id);
      toast('Unfollowed');
      return;
    }
    const res = requestCruxmate(user.id);
    if (res === 'sent') toast.success(`Following ${user.display_name.split(' ')[0]}`);
    else if (res === 'accepted') toast.success(`You're cruxmates with ${user.display_name.split(' ')[0]} 🤝`);
    else if (res === 'instant') toast(`${user.display_name} added as a CruxMate`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title=" ">
        <div className="flex flex-col items-center -mt-4 mb-5">
          <Avatar photoUrl={user.photo_url ?? undefined} config={user.avatar} alt={user.display_name} size={96} fallback={user.display_name} />
          <h2 className="mt-3 text-xl font-semibold text-ink-900">{user.display_name}</h2>
          {npcUser?.pronouns && <p className="text-sm text-ink-500">{npcUser.pronouns}</p>}

          <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
            <span className="rounded-full border border-teal-600 text-teal-600 text-[11px] font-medium px-2.5 py-0.5">
              {gym?.short_name ?? 'no home gym'}
            </span>
            {user.top_grade && (
              <span className="rounded-full border border-gold-500 text-gold-500 text-[11px] font-medium px-2.5 py-0.5">
                Top: {user.top_grade}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1 justify-center">
            {(['top_rope', 'lead', 'trad'] as const).map((cat) => {
              const s = userVerifications?.[cat];
              const isVerified = s === 'verified';
              const isSelf = s === 'self_attested';
              return (
                <span
                  key={cat}
                  className={
                    isVerified
                      ? 'inline-flex items-center gap-1 rounded-full bg-teal-600 text-white text-[10px] font-semibold px-2 py-0.5'
                      : isSelf
                        ? 'inline-flex items-center gap-1 rounded-full border border-brand-600 text-brand-600 text-[10px] font-semibold px-2 py-0.5'
                        : 'inline-flex items-center gap-1 rounded-full border border-ink-100 text-ink-300 text-[10px] font-semibold px-2 py-0.5'
                  }
                >
                  {isVerified ? (
                    <ShieldCheck width={11} height={11} />
                  ) : isSelf ? (
                    <span aria-hidden>•</span>
                  ) : null}
                  {cat.replace('_', ' ')}
                  {isVerified ? ' · peer-confirmed' : isSelf ? ' · self-reported' : ''}
                </span>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant={isCruxmate ? 'outline' : 'primary'}
            onClick={() => {
              if (isCruxmate) {
                // Unfollow: drops my follow row too, so the mutual
                // state ends on their side at their next sync.
                cancelMateRequest(user.id);
                toast('Unfollowed');
              } else {
                handleAddButton();
              }
            }}
          >
            {isCruxmate
              ? 'Unfollow'
              : reqDir === 'incoming'
                ? 'Follow back'
                : reqDir === 'outgoing'
                  ? 'Following — tap to unfollow'
                  : 'Follow'}
          </Button>
          {isCruxmate && (
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                nav(`/chat/${user.id}`);
              }}
            >
              Message
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
