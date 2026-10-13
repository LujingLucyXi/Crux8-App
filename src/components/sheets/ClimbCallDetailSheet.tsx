import { toast } from 'sonner';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, ShieldCheck, Xmark, ShareIos } from 'iconoir-react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ShareCallSheet } from '@/components/sheets/ShareCallSheet';
import { useAppStore } from '@/store/useAppStore';
import { isWeightSafe } from '@/lib/weight';
import { LOOKING_FOR_LABEL } from '@/components/cards/ClimbCallCard';
import { resolveUser } from '@/lib/resolveUser';
import type { ClimbCall } from '@/seed/types';

interface Props {
  call: ClimbCall | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClimbCallDetailSheet({ call, open, onOpenChange }: Props) {
  const nav = useNavigate();
  const me = useAppStore((s) => s.me);
  const users = useAppStore((s) => s.users);
  const directory = useAppStore((s) => s.directory);
  const gyms = useAppStore((s) => s.gyms);
  const cruxmates = useAppStore((s) => s.cruxmates);
  const pairRequests = useAppStore((s) => s.pairRequests);
  const requestPair = useAppStore((s) => s.requestPair);
  const cancelPairRequest = useAppStore((s) => s.cancelPairRequest);
  const addCruxMate = useAppStore((s) => s.addCruxMate);
  const sendMessage = useAppStore((s) => s.sendMessage);

  if (!call || !me) return null;
  const caller = resolveUser(call.user_id, me, users, directory);
  const gym = call.gym_id ? gyms.find((g) => g.id === call.gym_id) : undefined;
  const locationLabel = gym?.name ?? call.area ?? 'Location TBD';
  if (!caller) return null;
  // NPC-only fields (verifications, pronouns) aren't on resolved directory users.
  const callerNpc = users.find((u) => u.id === call.user_id);

  const isRequested = pairRequests.includes(call.id);  const isFriend = cruxmates.includes(caller.id);
  const [shareOpen, setShareOpen] = useState(false);
  const weightSafe = isWeightSafe(me.weight_kg, call.weight_kg);
  const isMyCall = caller.id === me.id;

  const handleRequest = async () => {
    if (isRequested) {
      await cancelPairRequest(call.id);
      toast('Pair request canceled');
      return;
    }
    await requestPair(call.id);
    // Auto-add as CruxMate + start chat
    if (!isFriend) addCruxMate(caller.id);
    sendMessage(caller.id, `Hi! Requesting to pair on your ${call.category === 'top_rope' ? 'top-rope' : 'lead'} call at ${gym?.short_name ?? call.area}.`);
    toast(`Paired with ${caller.display_name}`, {
      description: 'Chat opened — say hi and confirm details.',
    });
    setTimeout(() => {
      onOpenChange(false);
      nav(`/chat/${caller.id}`);
    }, 500);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title=" ">
        <div className="flex flex-col items-center -mt-4 mb-5">
          <Avatar photoUrl={caller.photo_url ?? undefined} config={caller.avatar} alt={caller.display_name} size={96} fallback={caller.display_name} />
          <h2 className="mt-3 text-xl font-semibold text-ink-900">{caller.display_name}</h2>
          {callerNpc?.pronouns && <p className="text-sm text-ink-500">{callerNpc.pronouns}</p>}

          <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
            <span className="rounded-full bg-paper-50 border border-ink-100 text-ink-700 text-[11px] font-semibold px-2.5 py-0.5 tracking-wider">
              {LOOKING_FOR_LABEL[call.looking_for].toUpperCase()}
            </span>
            {weightSafe && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 text-teal-600 text-[11px] font-semibold px-2 py-0.5">
                ⚖ weight-safe with you
              </span>
            )}
            {isFriend && (
              <span className="rounded-full bg-paper-50 border border-ink-100 text-ink-700 text-[11px] font-semibold px-2.5 py-0.5">
                CruxMate
              </span>
            )}
          </div>

          {/* Verified belay chips */}
          <div className="mt-3 flex flex-wrap gap-1 justify-center">
            {(['top_rope', 'lead', 'trad'] as const).map((cat) => {
              const isV = callerNpc?.verifications[cat] === 'verified';
              return (
                <span
                  key={cat}
                  className={
                    isV
                      ? 'inline-flex items-center gap-1 rounded-full bg-teal-600 text-white text-[10px] font-semibold px-2 py-0.5'
                      : 'inline-flex items-center gap-1 rounded-full border border-ink-100 text-ink-300 text-[10px] font-semibold px-2 py-0.5'
                  }
                >
                  {isV ? <ShieldCheck width={11} height={11} /> : <Xmark width={11} height={11} />}
                  {cat.replace('_', ' ')}
                </span>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-ink-700">
            <MapPin width={16} height={16} className="text-ink-500" />
            <span>{locationLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-700">
            <Clock width={16} height={16} className="text-ink-500" />
            <span>
              {new Date(call.starts_at).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
              {' → '}
              {new Date(call.ends_at).toLocaleString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-700">
            <span className="capitalize">
              {call.category === 'top_rope' ? 'Top-rope' : 'Lead'} · {call.grade}
            </span>
          </div>
        </div>

        {call.note && (
          <div className="mb-5 rounded-xl bg-paper-50 border border-ink-100 p-3">
            <p className="text-sm text-ink-900 italic">"{call.note}"</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {isMyCall ? (
            <p className="text-sm text-ink-500 text-center">This is your call — it's visible to others.</p>
          ) : (
            <Button
              variant={isRequested ? 'outline' : 'primary'}
              className={isRequested ? '' : 'bg-teal-600 hover:bg-teal-500 border-teal-600'}
              onClick={handleRequest}
            >
              {isRequested ? 'Cancel pair request' : 'Request to pair'}
            </Button>
          )}
          <Button variant="outline" onClick={() => setShareOpen(true)}>
            <ShareIos width={16} height={16} /> Share
          </Button>
        </div>
      </SheetContent>
      <ShareCallSheet call={call} open={shareOpen} onOpenChange={setShareOpen} />
    </Sheet>
  );
}
