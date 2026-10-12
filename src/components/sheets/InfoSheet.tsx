import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Logo } from '@/components/layout/Logo';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: 'about' | 'trust';
}

const ABOUT = [
  {
    h: 'Find your climbing people',
    p: 'Crux8 connects climbers for sessions, belay partnerships, and crews. Post a session or join someone else\u2019s \u2014 the wall is better together.',
  },
  {
    h: 'Built for the community',
    p: 'From gym rats to trad dads, Crux8 is the home base for climbers to meet, plan, and send. Your profile, your crews, your sessions \u2014 all in one place.',
  },
  {
    h: 'Peer-confirmed skills',
    p: 'Self-report your belay skills, and partners confirm them after real sessions. Trust is earned on the wall, not uploaded as a certificate.',
  },
];

const TRUST = [
  {
    h: 'Climb safe, always',
    p: 'Always do an in-person buddy check before climbing with a new partner. Verify knots, belay devices, and communication signals every time.',
  },
  {
    h: 'Meet smart',
    p: 'For first sessions, meet at the gym during busy hours. Tell a friend where you\u2019re going. Trust your gut \u2014 it\u2019s okay to bail.',
  },
  {
    h: 'Respect the community',
    p: 'No harassment, no spam, no sketchy behavior. Reports are reviewed and accounts that threaten community safety are removed.',
  },
  {
    h: 'Your data stays yours',
    p: 'Your profile is yours. Weight, height, and other sensitive details are never shown to other members \u2014 only what you choose to share.',
  },
];

export function InfoSheet({ open, onOpenChange, kind }: Props) {
  const sections = kind === 'about' ? ABOUT : TRUST;
  const title = kind === 'about' ? 'About Crux8' : 'Trust & safety';
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={title}>
        <div className="flex flex-col gap-5 mt-2">
          {kind === 'about' && (
            <div className="flex items-center gap-3">
              <Logo size={40} />
              <p className="font-bold tracking-[0.18em] text-ink-900">CRUX8</p>
            </div>
          )}
          {sections.map((s) => (
            <div key={s.h}>
              <h3 className="font-semibold text-ink-900 text-[15px]">{s.h}</h3>
              <p className="text-sm text-ink-600 mt-1 leading-relaxed">{s.p}</p>
            </div>
          ))}
          <p className="text-xs text-ink-400 mt-2">Crux8 · climb together</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
