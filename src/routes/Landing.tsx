import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TriangleFlag, ShieldCheck, Community, Rhombus } from 'iconoir-react';
import { AuthSheet } from '@/components/AuthSheet';
import { supabase } from '@/lib/supabase';

const PILLARS = [
  { Icon: TriangleFlag, name: 'Adventure', desc: 'New lines. New places. New stories.' },
  { Icon: ShieldCheck, name: 'Trust', desc: 'Verified climbers. Real people. Climb with confidence.' },
  { Icon: Community, name: 'Together', desc: 'We climb better when we climb together.' },
  { Icon: Rhombus, name: 'Safety', desc: 'Look out for each other. Climb smart.' },
];

const FOUNDING_CAP = 500;

/**
 * Public front door (dark exclusivity edition, Lucy 2026-10-16 —
 * inspired by farflung's landing): the founding cohort is REAL —
 * the first 500 accounts carry Founding Member status forever (see
 * the founding_members view + the profile badge), the counter below
 * is the live account count, and the doors stay open: exclusivity
 * as status, not as a wall (the 2026-10-14 friction lesson stands).
 */
export function Landing() {
  const nav = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetEntry, setSheetEntry] = useState<{ tab: 'code' | 'password'; pwMode: 'signin' | 'signup' }>({
    tab: 'password',
    pwMode: 'signin',
  });
  const [claimed, setClaimed] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { count } = await supabase
          .from('directory_profiles')
          .select('id', { count: 'exact', head: true });
        if (live && typeof count === 'number') setClaimed(Math.min(count, FOUNDING_CAP));
      } catch {
        /* counter just stays hidden — never fake the number */
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const openSheet = (tab: 'code' | 'password', pwMode: 'signin' | 'signup') => {
    setSheetEntry({ tab, pwMode });
    setSheetOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0E] text-[#F7F3EA]">
      <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col px-6 py-10">
        {/* wordmark */}
        <p className="text-[22px] font-extrabold lowercase tracking-tight">
          crux<span className="bg-[linear-gradient(120deg,#F9E29A,#DFAF37)] bg-clip-text text-transparent">8</span>
        </p>

        {/* sticker chips */}
        <div className="mt-14 flex items-center gap-3">
          <span className="-rotate-2 rounded-full bg-[#E9E4F5] px-3.5 py-1.5 text-[13px] font-extrabold tracking-wide text-[#16161A]">
            FREE
          </span>
          <span className="rotate-2 rounded-full bg-[linear-gradient(120deg,#F9E29A,#DFAF37)] px-3.5 py-1.5 text-[13px] font-extrabold tracking-wide text-[#161310] shadow-[0_0_24px_rgba(223,175,55,0.35)]">
            FOUNDING COHORT
          </span>
        </div>

        {/* headline */}
        <h1 className="mt-6 text-[56px] font-extrabold leading-[1.02] tracking-tight">
          A climbing
          <br />
          crew that
          <br />
          <span className="bg-[linear-gradient(100deg,#B9A7E8,#F9E29A_55%,#DFAF37)] bg-clip-text text-transparent">
            actually
            <br />
            shows up.
          </span>
        </h1>

        <p className="mt-6 max-w-md text-[17px] leading-relaxed text-white/60">
          Finding a belay partner is broken — flaky plans, dead group chats. Crux8 matches
          you with climbers at your gym, your grade, your hours, and turns every session
          into a crew worth keeping. Claim your spot below.
        </p>

        {/* founding cohort meter */}
        <div className="mt-10">
          <p className="bg-[linear-gradient(90deg,#B9A7E8,#DFAF37)] bg-clip-text text-center text-[13px] font-bold tracking-[0.18em] text-transparent">
            FIRST 500 GET FOUNDING MEMBER STATUS
          </p>
          <div className="mt-4 flex items-baseline justify-between text-[13px] font-bold tracking-[0.14em]">
            <span className="text-white/85">FOUNDING COHORT</span>
            <span className="bg-[linear-gradient(90deg,#F9E29A,#DFAF37)] bg-clip-text text-transparent">
              {claimed !== null ? `${claimed} / ${FOUNDING_CAP} CLAIMED` : 'OPEN'}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#B9A7E8,#F9E29A,#DFAF37)] transition-all duration-700"
              style={{ width: claimed !== null ? `${Math.max(2, (claimed / FOUNDING_CAP) * 100)}%` : '2%' }}
            />
          </div>
          <p className="mt-3 text-center text-[13px] text-white/45">
            Founding members keep the ⭐ badge on their profile — forever.
          </p>
        </div>

        {/* doors */}
        <div className="mt-8 flex w-full flex-col gap-3">
          <button
            onClick={() => openSheet('password', 'signup')}
            className="w-full rounded-full bg-[linear-gradient(120deg,#F9E29A,#EFC95E,#DFAF37)] py-4 text-[16px] font-extrabold text-[#161310] shadow-[0_10px_36px_rgba(223,175,55,0.35)] transition active:translate-y-[2px]"
          >
            Claim your founding spot
          </button>
          <button
            onClick={() => openSheet('password', 'signin')}
            className="w-full rounded-full border border-white/15 bg-white/[0.06] py-4 text-[16px] font-bold text-white/90 transition hover:bg-white/10"
          >
            I have an account — Sign in
          </button>
          <a
            href="https://play.crux8.app"
            className="mt-1 text-center text-sm font-medium text-white/55 underline decoration-white/25 underline-offset-4 hover:text-white/80"
          >
            New here? Take the 2-minute DNA quiz →
          </a>
        </div>

        {/* pillars */}
        <div className="mt-14 grid grid-cols-2 gap-3">
          {PILLARS.map(({ Icon, name, desc }) => (
            <div key={name} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left">
              <Icon width={22} height={22} className="text-[#EFC95E]" />
              <h3 className="mt-2 text-sm font-semibold uppercase tracking-wider text-white/90">{name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-white/50">{desc}</p>
            </div>
          ))}
        </div>

        <footer className="mt-auto flex items-center justify-between pt-12 text-xs text-white/35">
          <span>© 2026 Glomere Inc.</span>
          <span className="flex gap-4">
            <Link to="/privacy" className="hover:text-white/70">Privacy</Link>
            <Link to="/terms" className="hover:text-white/70">Terms</Link>
          </span>
        </footer>
      </div>

      <AuthSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={() => nav('/')}
        initialTab={sheetEntry.tab}
        initialPwMode={sheetEntry.pwMode}
      />
    </div>
  );
}
