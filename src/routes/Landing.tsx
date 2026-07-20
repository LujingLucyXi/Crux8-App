import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trekking, ShieldCheck, Community, Rhombus } from 'iconoir-react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Logo } from '@/components/layout/Logo';
import { useAppStore } from '@/store/useAppStore';

const PILLARS = [
  { Icon: Trekking, name: 'Adventure', desc: 'New lines. New places. New stories.' },
  { Icon: ShieldCheck, name: 'Trust', desc: 'Verified climbers. Real people. Climb with confidence.' },
  { Icon: Community, name: 'Together', desc: 'We climb better when we climb together.' },
  { Icon: Rhombus, name: 'Safety', desc: 'Look out for each other. Climb smart.' },
];

export function Landing() {
  const nav = useNavigate();
  const signUp = useAppStore((s) => s.signUp);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [name, setName] = useState('');
  const [pronouns, setPronouns] = useState('');

  const handleSignUp = () => {
    signUp({ display_name: name.trim() || 'Climber', pronouns: pronouns.trim() || undefined });
    setSignUpOpen(false);
    nav('/onboarding');
  };

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="mx-auto max-w-[560px] px-6 py-12 flex flex-col items-center text-center">
        <Logo size={80} />
        <h1 className="mt-8 text-4xl font-bold text-ink-900 tracking-tight">CRUXMATE</h1>
        <p className="mt-3 text-xs font-semibold tracking-[0.3em] text-ink-500">
          CLIMB TOGETHER. GO FURTHER.
        </p>
        <p className="mt-4 text-base text-ink-600 max-w-sm">
          Find your next climb. Together.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-3 w-full max-w-md">
          {PILLARS.map(({ Icon, name, desc }) => (
            <div
              key={name}
              className="rounded-2xl bg-white border border-ink-100 p-4 text-left"
            >
              <Icon width={22} height={22} className="text-ink-900" />
              <h3 className="mt-2 text-sm font-semibold uppercase tracking-wider text-ink-900">
                {name}
              </h3>
              <p className="mt-1 text-xs text-ink-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 w-full max-w-sm flex flex-col gap-2">
          <Button size="lg" onClick={() => setSignUpOpen(true)}>
            Sign up
          </Button>
          <Button size="lg" variant="outline" onClick={() => setSignUpOpen(true)}>
            Sign in
          </Button>
        </div>
      </div>

      <Sheet open={signUpOpen} onOpenChange={setSignUpOpen}>
        <SheetContent title="Get started">
          <p className="text-sm text-ink-500 -mt-2 mb-4">
            Mock signup for the demo. Real auth (email magic link + Google) ships in v0.6.
          </p>
          <div className="flex flex-col gap-4">
            <div>
              <Label>Display name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sue A."
                autoFocus
              />
            </div>
            <div>
              <Label>Pronouns (optional)</Label>
              <Input
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                placeholder="she/her, he/him, they/them…"
              />
            </div>
            <Button onClick={handleSignUp} disabled={!name.trim()}>
              Continue to onboarding
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
