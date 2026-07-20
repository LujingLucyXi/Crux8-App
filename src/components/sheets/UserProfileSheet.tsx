import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck } from 'iconoir-react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAppStore } from '@/store/useAppStore';

interface Props {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileSheet({ userId, open, onOpenChange }: Props) {
  const nav = useNavigate();
  const users = useAppStore((s) => s.users);
  const gyms = useAppStore((s) => s.gyms);
  const cruxmates = useAppStore((s) => s.cruxmates);
  const addCruxMate = useAppStore((s) => s.addCruxMate);
  const removeCruxMate = useAppStore((s) => s.removeCruxMate);

  const user = users.find((u) => u.id === userId);
  if (!user) return null;
  const gym = gyms.find((g) => g.id === user.home_gym_id);
  const isCruxmate = cruxmates.includes(user.id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title=" ">
        <div className="flex flex-col items-center -mt-4 mb-5">
          <Avatar src={user.avatar_url} alt={user.display_name} size={96} fallback={user.display_name} />
          <h2 className="mt-3 text-xl font-semibold text-ink-900">{user.display_name}</h2>
          {user.pronouns && <p className="text-sm text-ink-500">{user.pronouns}</p>}

          <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
            <span className="rounded-full border border-teal-600 text-teal-600 text-[11px] font-medium px-2.5 py-0.5">
              {gym?.short_name ?? 'no home gym'}
            </span>
            <span className="rounded-full border border-gold-500 text-gold-500 text-[11px] font-medium px-2.5 py-0.5">
              Top: {user.top_grade}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1 justify-center">
            {(['top_rope', 'lead', 'trad'] as const).map((cat) => {
              const s = user.verifications[cat];
              const isVerified = s === 'verified';
              return (
                <span
                  key={cat}
                  className={
                    isVerified
                      ? 'inline-flex items-center gap-1 rounded-full bg-teal-600 text-white text-[10px] font-semibold px-2 py-0.5'
                      : 'inline-flex items-center gap-1 rounded-full border border-ink-100 text-ink-300 text-[10px] font-semibold px-2 py-0.5'
                  }
                >
                  {isVerified && <ShieldCheck width={11} height={11} />}
                  {cat.replace('_', ' ')}
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
                removeCruxMate(user.id);
                toast('Removed CruxMate');
              } else {
                addCruxMate(user.id);
                toast(`${user.display_name} added as a CruxMate`);
              }
            }}
          >
            {isCruxmate ? 'Remove CruxMate' : 'Add as CruxMate'}
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
