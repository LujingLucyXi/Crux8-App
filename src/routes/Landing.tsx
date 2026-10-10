import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TriangleFlag, ShieldCheck, Community, Rhombus } from 'iconoir-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/layout/Logo';
import { AuthSheet } from '@/components/AuthSheet';

const PILLARS = [
  { Icon: TriangleFlag, name: 'Adventure', desc: 'New lines. New places. New stories.' },
  { Icon: ShieldCheck, name: 'Trust', desc: 'Verified climbers. Real people. Climb with confidence.' },
  { Icon: Community, name: 'Together', desc: 'We climb better when we climb together.' },
  { Icon: Rhombus, name: 'Safety', desc: 'Look out for each other. Climb smart.' },
];

export function Landing() {
  const nav = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="mx-auto max-w-[560px] px-6 py-12 flex flex-col items-center text-center">
        <Logo size={80} />
        <h1 className="mt-8 text-4xl font-bold text-ink-900 tracking-tight">CRUX8</h1>
        <p className="mt-3 text-xs font-semibold tracking-[0.24em] text-ink-500">
          TIE IN. SEND TOGETHER.
        </p>
        <p className="mt-4 text-lg font-medium text-ink-700 max-w-sm">
          Find your people. Climb stronger.
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
          <Button size="lg" onClick={() => setSheetOpen(true)}>
            Sign up
          </Button>
          <Button size="lg" variant="outline" onClick={() => setSheetOpen(true)}>
            Sign in
          </Button>
        </div>
      </div>

      <AuthSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={() => nav('/')}
      />
    </div>
  );
}
