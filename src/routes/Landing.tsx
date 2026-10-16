import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TriangleFlag, ShieldCheck, Community, Rhombus } from 'iconoir-react';
import { AuthSheet } from '@/components/AuthSheet';
import { Logo } from '@/components/layout/Logo';
import { OGBadge } from '@/components/OGBadge';
import { supabase } from '@/lib/supabase';

const PILLARS = [
  { Icon: TriangleFlag, name: 'Adventure', desc: 'New lines. New places. New stories.' },
  { Icon: ShieldCheck, name: 'Peer verification', desc: 'Climb with confidence.' },
  { Icon: Community, name: 'Together', desc: 'We climb better when we climb together.' },
  { Icon: Rhombus, name: 'Safety', desc: 'Look out for each other. Climb smart.' },
];

const FOUNDING_CAP = 500;
/** Optional-donation Payment Link (Stripe, Glomere Inc. — created
 *  2026-10-16). Crux8 is completely free; this is purely a tip jar. */
const DONATE_URL = 'https://donate.stripe.com/9B67sL2wI9M90rH9RE67S08';

/**
 * Public front door (original Crux8 edition, Lucy 2026-10-16): our
 * own sign — the gold figure-8 mark coin-spinning in its ring — over
 * the Founding Register: the first 500 accounts are engraved as
 * Founding Members with the OG badge (founding_members view). The
 * doors stay open (exclusivity as status, not a wall — the
 * 2026-10-14 friction lesson), the counter is the live account
 * count, and a quiet Stripe donation link sits under the doors:
 * the app is completely free; donations are optional.
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
        /* counter just stays generic — never fake the number */
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
    <div className="min-h-screen bg-paper-50 text-ink-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col items-center px-6 py-12 text-center">
        {/* ── The sign ── */}
        <div className="relative" style={{ perspective: 700 }}>
          <div
            aria-hidden
            className="absolute inset-0 -z-0 scale-125 rounded-full bg-[radial-gradient(circle,rgba(201,162,75,0.30),transparent_65%)]"
          />
          <div className="crux-sign-spin relative flex h-[148px] w-[148px] items-center justify-center rounded-full border-[3px] border-[#C9A24B] bg-paper-100 shadow-[0_18px_36px_-14px_rgba(138,109,47,0.55),inset_0_0_0_5px_#F7F3EA,inset_0_0_0_7px_rgba(201,162,75,0.5)]">
            <Logo size={96} />
          </div>
        </div>
        <h1 className="mt-7 text-4xl font-extrabold tracking-tight">CRUX8</h1>
        <p className="mt-2 text-xs font-semibold tracking-[0.28em] text-[#8A6D2F]">
          CHALK UP. SEND TOGETHER.
        </p>

        <p className="mt-7 text-[26px] font-bold leading-snug">
          Find your people. Climb stronger.
        </p>
        <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-ink-500">
          Crux8 finds you partners for the gym, the crag, and the trail — a crew
          that actually shows up.
        </p>

        {/* ── The Founding Register ── */}
        <div className="mt-10 w-full rounded-[26px] bg-[#161310] px-6 py-6 text-[#F7F3EA] shadow-[0_24px_48px_-20px_rgba(22,19,16,0.6)]">
          <div className="flex items-center gap-4 text-left">
            <OGBadge size={78} variant="neon" />
            <div className="min-w-0">
              <p className="text-[12px] font-extrabold tracking-[0.3em] text-[#B4FF3A]">
                THE FOUNDING REGISTER
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-white/65">
                The first {FOUNDING_CAP} climbers through the door are Founding
                Members — the OG badge lives on your profile forever.
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-baseline justify-between text-[12px] font-bold tracking-[0.14em]">
            <span className="text-white/75">IN THE REGISTER</span>
            <span className="text-[#B4FF3A]">
              {claimed !== null
                ? `${String(claimed).padStart(3, '0')} / ${FOUNDING_CAP}`
                : `0 / ${FOUNDING_CAP}`}
            </span>
          </div>
          <div className="relative mt-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#C9A24B,#B4FF3A)] transition-all duration-700"
                style={{
                  width: claimed !== null ? `${Math.max(2, (claimed / FOUNDING_CAP) * 100)}%` : '2%',
                }}
              />
            </div>
            <span
              aria-hidden
              className="absolute -top-[13px] z-10"
              style={{
                left: claimed !== null ? `${Math.max(2, (claimed / FOUNDING_CAP) * 100)}%` : '2%',
                transform: 'translateX(-40%)',
              }}
            >
              <span className="flame-flicker inline-block text-[17px] leading-none">🔥</span>
            </span>
          </div>
        </div>

        {/* ── Doors ── */}
        <div className="mt-8 flex w-full max-w-sm flex-col gap-2.5">
          <button
            onClick={() => openSheet('password', 'signup')}
            className="w-full rounded-full bg-[linear-gradient(120deg,#F9E29A,#EFC95E,#DFAF37)] py-3.5 text-[15px] font-extrabold text-[#161310] shadow-[0_10px_28px_rgba(201,162,75,0.45)] transition active:translate-y-[2px]"
          >
            Claim your spot. Join FREE NOW!
          </button>
          <button
            onClick={() => openSheet('password', 'signin')}
            className="w-full rounded-full border border-ink-200 bg-paper-100 py-3.5 text-[15px] font-bold text-ink-900 transition hover:bg-paper-50"
          >
            Sign in
          </button>
          <a
            href="https://play.crux8.app"
            className="mt-1 text-sm font-medium text-ink-500 underline decoration-ink-200 underline-offset-4 hover:text-ink-900"
          >
            Or take the 2-minute DNA quiz first →
          </a>
          {/* Demoted from the hero slot (Lucy 2026-10-16): the buddy-hunt
              line works as an accent under the quiz invite, not as the
              headline. */}
          <p className="mt-4 text-[17px] font-extrabold leading-snug tracking-tight">
            Buddy hunt, gamified.{' '}
            <span className="bg-[linear-gradient(90deg,#8A6D2F,#C9A24B_45%,#7FB800)] bg-clip-text text-transparent">
              Electrify your climb.
            </span>
          </p>
        </div>

        {/* ── Optional tip jar: just the button (Lucy 2026-10-16:
            the explaining lines were too wordy) ── */}
        <a
          href={DONATE_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-[#C9A24B] bg-[#C9A24B]/10 px-6 py-3 text-[15px] font-extrabold text-ink-900 shadow-[0_8px_22px_rgba(201,162,75,0.30)] transition hover:bg-[#C9A24B]/20 active:translate-y-[1px]"
        >
          <span aria-hidden className="text-[16px]">❤️</span>
          Support Crux8
        </a>

        {/* ── Pillars ── */}
        <div className="mt-12 grid w-full grid-cols-2 gap-3 text-left">
          {PILLARS.map(({ Icon, name, desc }) => (
            <div key={name} className="rounded-2xl border border-ink-100 bg-paper-100 p-4">
              <Icon width={22} height={22} className="text-[#8A6D2F]" />
              <h3 className="mt-2 text-sm font-semibold uppercase tracking-wider text-ink-900">{name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">{desc}</p>
            </div>
          ))}
        </div>

        <footer className="mt-auto flex w-full items-center justify-between pt-12 text-xs text-ink-400">
          <span>© 2026 Glomere Inc.</span>
          <span className="flex gap-4">
            <Link to="/privacy" className="hover:text-ink-900">Privacy</Link>
            <Link to="/terms" className="hover:text-ink-900">Terms</Link>
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
