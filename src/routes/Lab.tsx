import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NavArrowLeft, SoundHigh, SoundOff } from 'iconoir-react';
import { Celebration, type CelebrationConfig } from '@/components/lab/Celebration';
import { LOGO_CONCEPTS } from '@/components/lab/LogoConcepts';
import { CyberAvatar } from '@/components/lab/CyberAvatar';
import { AnimeAvatar } from '@/components/lab/AnimeAvatar';
import { SketchAvatar } from '@/components/lab/SketchAvatar';
import { MORE_STYLES, PinAvatar } from '@/components/lab/MoreStyles';
import { EnamelUIShowcase } from '@/components/lab/EnamelUI';
import { PunkAvatar } from '@/components/ui/PunkAvatar';
import { Logo } from '@/components/layout/Logo';
import { BoulderMascot } from '@/components/lab/BoulderMascot';
import { GOCRUX_CONCEPTS } from '@/components/lab/GoCruxConcepts';
import { REFINED_LOGOS } from '@/components/lab/LogoRefined';
import { ChevronMark, CHEVRON_BGS } from '@/components/lab/ChevronMark';
import { UNIQUE_LOGOS } from '@/components/lab/LogoUnique';
import { CU_LOGOS } from '@/components/lab/LogoCU';
import { ROPE_LOGOS } from '@/components/lab/LogoRope';
import { CartoonAvatar } from '@/components/lab/CartoonAvatar';
import { avatarFromSeed } from '@/lib/avatar';
import { cn } from '@/lib/utils';

/** Two candidate names, each shown as header lockup + big wordmark + reversed. */
const NAME_CANDIDATES: { key: string; wordmark: string; tag: string; note: string }[] = [
  {
    key: 'cruxup',
    wordmark: 'CRUX-UP!',
    tag: 'FIND YOUR PEOPLE. CLIMB STRONGER.',
    note: 'Energetic, progression-forward — pairs with XP/levels ("level up, send up"). The "!" adds punch.',
  },
  {
    key: 'gocrux',
    wordmark: 'GO-CRUX',
    tag: 'FIND YOUR PEOPLE. CLIMB STRONGER.',
    note: 'Action/CTA feel ("go climb, go crux"). Verb-first, invites you out the door — but "Go-" is a common startup prefix.',
  },
];

const AVATAR_SEEDS = ['Sue A.', 'Marcus Rivera', 'Lilly Chen', 'Priya Patel', 'Kai', 'Ash', 'Nova', 'Rex', 'Juno', 'Dex'];

/**
 * Throwaway design lab (route: /lab). Two explorations for a "dopamine" UX:
 *   A. Hero-moment celebrations (Framer Motion + haptic + optional sound).
 *   B. A bolder token theme, shown side-by-side against the current calm one.
 * Nothing here is wired into the live app — accept or delete wholesale.
 */

const MOMENTS: { key: string; label: string; cfg: CelebrationConfig }[] = [
  {
    key: 'send',
    label: '🧗 Log a send',
    cfg: { emoji: '🔥', title: 'SENT IT!', subtitle: '5.11a · Vertical World · +40 XP', colors: ['#FF5A5F', '#FFB020', '#C6F135'] },
  },
  {
    key: 'match',
    label: '🤝 Match locked',
    cfg: { emoji: '🪢', title: "You're roped up!", subtitle: 'Marcus accepted your belay call', colors: ['#7C3AED', '#EC4899', '#38BDF8'] },
  },
  {
    key: 'streak',
    label: '📅 Streak +1',
    cfg: { emoji: '⚡', title: '6-day streak!', subtitle: 'One more session beats your record', colors: ['#FFB020', '#FF5A5F', '#7C3AED'] },
  },
  {
    key: 'checkin',
    label: '📍 Check in',
    cfg: { emoji: '🎉', title: "You're on the wall", subtitle: '27 climbers here now can see you', colors: ['#22D3A5', '#38BDF8', '#C6F135'] },
  },
];

export function Lab() {
  const nav = useNavigate();
  const [celebration, setCelebration] = useState<CelebrationConfig | null>(null);
  const [sound, setSound] = useState(true);

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="mx-auto max-w-[560px] px-4 py-6 pb-24">
        {/* header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => nav(-1)} className="flex items-center gap-1 text-sm text-ink-500 font-medium">
            <NavArrowLeft width={18} height={18} /> Back
          </button>
          <button
            onClick={() => setSound((s) => !s)}
            className="flex items-center gap-1.5 text-xs font-semibold text-ink-700 rounded-full border border-ink-100 bg-white px-3 py-1.5"
          >
            {sound ? <SoundHigh width={14} height={14} /> : <SoundOff width={14} height={14} />}
            Sound {sound ? 'on' : 'off'}
          </button>
        </div>

        <h1 className="text-2xl font-extrabold text-ink-900 tracking-tight">Design lab</h1>
        <p className="mt-1 text-sm text-ink-500">Tap around, then tell me which direction to ship.</p>

        {/* ─────────── Name showdown: Crux-Up! vs Go-Crux ─────────── */}
        <SectionLabel>Name · Crux-Up! vs Go-Crux</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          {NAME_CANDIDATES.map((c) => (
            <div key={c.key} className="rounded-2xl border border-ink-100 bg-white overflow-hidden">
              {/* header-size lockup */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-ink-100">
                <Logo size={26} />
                <span className="font-bold tracking-[0.1em] text-ink-900 text-sm">{c.wordmark}</span>
              </div>
              {/* big wordmark */}
              <div className="px-3 py-6 flex flex-col items-center gap-3">
                <Logo size={56} />
                <span className="font-extrabold text-xl tracking-tight text-ink-900 text-center leading-none">
                  {c.wordmark}
                </span>
              </div>
              {/* reversed on dark */}
              <div className="px-3 py-4 bg-ink-900 flex items-center justify-center gap-2">
                <Logo size={22} />
                <span className="font-bold tracking-[0.1em] text-white text-sm">{c.wordmark}</span>
              </div>
              <p className="px-3 py-2.5 text-[11px] leading-snug text-ink-500">{c.note}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-ink-400 mt-2 mb-1">
          Slogan on both: <span className="font-medium text-ink-600">Find your people. Climb stronger.</span>
        </p>

        {/* ─────────── Go-Crux mascot: yelling boulder ─────────── */}
        <SectionLabel>Go-Crux logo · yelling boulder</SectionLabel>
        <p className="text-xs text-ink-500 mb-3 -mt-1">
          A little boulder with a smiley face shouting “Go!”. Shown big, at header size, reversed, and as a lockup.
        </p>
        <div className="rounded-2xl border border-ink-100 bg-white overflow-hidden">
          {/* hero */}
          <div className="flex items-center justify-center py-6 bg-paper-50">
            <BoulderMascot size={132} />
          </div>
          {/* size ramp — the real legibility test */}
          <div className="flex items-end justify-center gap-5 py-4 border-t border-ink-100">
            <BoulderMascot size={56} />
            <BoulderMascot size={40} />
            {/* at tiny sizes drop the shout so the face survives */}
            <BoulderMascot size={26} shout={false} />
            <BoulderMascot size={20} shout={false} />
          </div>
          {/* header lockup (mascot as the app logo) */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-ink-100">
            <BoulderMascot size={30} shout={false} />
            <span className="font-bold tracking-[0.1em] text-ink-900 text-sm">GO-CRUX</span>
          </div>
          {/* reversed */}
          <div className="flex items-center justify-center gap-2 px-3 py-4 bg-ink-900">
            <BoulderMascot size={30} shout={false} outline="#0B0A12" rock="#A6ADBE" rockDark="#7C8395" />
            <span className="font-bold tracking-[0.1em] text-white text-sm">GO-CRUX</span>
          </div>
          <p className="px-3 py-2.5 text-[11px] leading-snug text-ink-500">
            The “Go!” burst is the personality — but it clutters below ~28px, so the header/favicon uses the
            boulder face alone (shout dropped). Full mascot shines on the landing, splash, celebrations, and empty states.
          </p>
        </div>

        {/* ─────────── Rope loop → arrow (user's mark) ─────────── */}
        <SectionLabel>Logo v6 · rope loop → up-arrow ★</SectionLabel>
        <p className="text-xs text-ink-500 mb-3 -mt-1">
          Your mark, rebuilt as clean SVG: a climbing rope coils (partnership) then rises into an up-arrow (progression). Bold plum outline, brand palette.
        </p>
        <div className="flex flex-col gap-3">
          {ROPE_LOGOS.map(({ key, name, note, Mark }) => (
            <div key={key} className="rounded-2xl border border-ink-100 bg-white overflow-hidden">
              <div className="flex items-center gap-4 p-3">
                <div className="rounded-xl bg-paper-50 p-2"><Mark size={72} /></div>
                <div className="flex items-center gap-3"><Mark size={30} /><Mark size={20} /></div>
                <div className="ml-auto rounded-xl bg-ink-900 p-2"><Mark size={30} /></div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 border-t border-ink-100">
                <Mark size={26} />
                <span className="font-bold tracking-[0.12em] text-ink-900 text-sm">CRUXUP</span>
                <span className="ml-auto text-[11px] font-semibold text-ink-500">{name}</span>
              </div>
              <p className="px-3 pb-2.5 text-[11px] leading-snug text-ink-500">{note}</p>
            </div>
          ))}
        </div>

        {/* ─────────── CU monogram ─────────── */}
        <SectionLabel>Logo v5 · CU monogram (Crux-Up ↑)</SectionLabel>
        <p className="text-xs text-ink-500 mb-3 -mt-1">
          “CU” for CruxUp, with an up-arrow at the top of the U. A few letter styles + backgrounds.
        </p>
        <div className="flex flex-col gap-3">
          {CU_LOGOS.map(({ key, name, note, Mark }) => (
            <div key={key} className="rounded-2xl border border-ink-100 bg-white overflow-hidden">
              <div className="flex items-center gap-4 p-3">
                <div className="rounded-xl bg-paper-50 p-2"><Mark size={72} /></div>
                <div className="flex items-center gap-3"><Mark size={30} /><Mark size={20} /></div>
                <div className="ml-auto rounded-xl bg-ink-900 p-2"><Mark size={30} /></div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 border-t border-ink-100">
                <Mark size={26} />
                <span className="font-bold tracking-[0.12em] text-ink-900 text-sm">CRUXUP</span>
                <span className="ml-auto text-[11px] font-semibold text-ink-500">{name}</span>
              </div>
              <p className="px-3 pb-2.5 text-[11px] leading-snug text-ink-500">{note}</p>
            </div>
          ))}
        </div>

        {/* ─────────── Distinctive marks ─────────── */}
        <SectionLabel>Logo v4 · distinctive / ownable</SectionLabel>
        <p className="text-xs text-ink-500 mb-3 -mt-1">
          Each has a climbing twist or dual-meaning — aiming for memorable, not generic. Large, header size, reversed, lockup.
        </p>
        <div className="flex flex-col gap-3">
          {UNIQUE_LOGOS.map(({ key, name, note, Mark }) => (
            <div key={key} className="rounded-2xl border border-ink-100 bg-white overflow-hidden">
              <div className="flex items-center gap-4 p-3">
                <div className="rounded-xl bg-paper-50 p-2"><Mark size={72} /></div>
                <div className="flex items-center gap-3"><Mark size={30} /><Mark size={20} /></div>
                <div className="ml-auto rounded-xl bg-ink-900 p-2"><Mark size={30} /></div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 border-t border-ink-100">
                <Mark size={26} />
                <span className="font-bold tracking-[0.12em] text-ink-900 text-sm">CRUXUP</span>
                <span className="ml-auto text-[11px] font-semibold text-ink-500">{name}</span>
              </div>
              <p className="px-3 pb-2.5 text-[11px] leading-snug text-ink-500">{note}</p>
            </div>
          ))}
        </div>

        {/* ─────────── 3-up chevron mark: boulder rock on polished tiles ─────────── */}
        <SectionLabel>Logo v3 · 3-up (rock on polished tile)</SectionLabel>
        <p className="text-xs text-ink-500 mb-3 -mt-1">
          Three ascending “up” chevrons in real boulder-rock grey, on a polished colorful tile that contrasts the dark mark. Pick the background.
        </p>
        <div className="flex flex-col gap-3">
          {CHEVRON_BGS.map((b) => (
            <div key={b.key} className="rounded-2xl border border-ink-100 bg-white overflow-hidden">
              <div className="flex items-center gap-4 p-3">
                <ChevronMark bg={b.key} size={72} />
                <div className="flex items-center gap-3">
                  <ChevronMark bg={b.key} size={30} />
                  <ChevronMark bg={b.key} size={20} />
                </div>
                <div className="ml-auto rounded-xl bg-ink-900 p-2"><ChevronMark bg={b.key} size={30} /></div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 border-t border-ink-100">
                <ChevronMark bg={b.key} size={26} />
                <span className="font-bold tracking-[0.12em] text-ink-900 text-sm">CRUXUP</span>
                <span className="ml-auto text-[11px] font-semibold text-ink-500">{b.name}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ─────────── Refined logos: match the app aesthetic ─────────── */}
        <SectionLabel>Logo v2 · boulder marks (refined)</SectionLabel>
        <p className="text-xs text-ink-500 mb-3 -mt-1">
          Boulder-themed, but tuned to the app’s electric gradient + gold accent — no goofy cartoon face.
        </p>
        <div className="flex flex-col gap-3">
          {REFINED_LOGOS.filter((l) => l.family === 'boulder').map(({ key, name, note, Mark }) => (
            <div key={key} className="rounded-2xl border border-ink-100 bg-white overflow-hidden">
              <div className="flex items-center gap-4 p-3">
                <div className="rounded-xl bg-paper-50 p-2"><Mark size={72} /></div>
                <div className="flex items-center gap-3"><Mark size={30} /><Mark size={20} /></div>
                <div className="ml-auto rounded-xl bg-ink-900 p-2"><Mark size={30} /></div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 border-t border-ink-100">
                <Mark size={26} />
                <span className="font-bold tracking-[0.1em] text-ink-900 text-sm">CRUXUP</span>
                <span className="ml-auto text-[11px] font-semibold text-ink-500">{name}</span>
              </div>
              <p className="px-3 pb-2.5 text-[11px] leading-snug text-ink-500">{note}</p>
            </div>
          ))}
        </div>

        <SectionLabel>Logo v2 · abstract marks (non-cartoon)</SectionLabel>
        <p className="text-xs text-ink-500 mb-3 -mt-1">
          Geometric / letterform directions — the calmer, more scalable route.
        </p>
        <div className="flex flex-col gap-3">
          {REFINED_LOGOS.filter((l) => l.family === 'abstract').map(({ key, name, note, Mark }) => (
            <div key={key} className="rounded-2xl border border-ink-100 bg-white overflow-hidden">
              <div className="flex items-center gap-4 p-3">
                <div className="rounded-xl bg-paper-50 p-2"><Mark size={72} /></div>
                <div className="flex items-center gap-3"><Mark size={30} /><Mark size={20} /></div>
                <div className="ml-auto rounded-xl bg-ink-900 p-2"><Mark size={30} /></div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 border-t border-ink-100">
                <Mark size={26} />
                <span className="font-bold tracking-[0.1em] text-ink-900 text-sm">CRUXUP</span>
                <span className="ml-auto text-[11px] font-semibold text-ink-500">{name}</span>
              </div>
              <p className="px-3 pb-2.5 text-[11px] leading-snug text-ink-500">{note}</p>
            </div>
          ))}
        </div>

        {/* ─────────── Go-Crux logo directions ─────────── */}
        <SectionLabel>Go-Crux logo · more directions</SectionLabel>
        <p className="text-xs text-ink-500 mb-3 -mt-1">
          Five more marks. Each shown large, at header size, and reversed — small size is the real test.
        </p>
        <div className="flex flex-col gap-3">
          {GOCRUX_CONCEPTS.map(({ key, name, note, Mark }) => (
            <div key={key} className="rounded-2xl border border-ink-100 bg-white overflow-hidden">
              <div className="flex items-center gap-4 p-3">
                <div className="rounded-xl bg-paper-50 p-2"><Mark size={72} /></div>
                <div className="flex items-center gap-3">
                  <Mark size={30} />
                  <Mark size={20} />
                </div>
                <div className="ml-auto rounded-xl bg-ink-900 p-2"><Mark size={30} /></div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 border-t border-ink-100">
                <Mark size={26} />
                <span className="font-bold tracking-[0.1em] text-ink-900 text-sm">GO-CRUX</span>
                <span className="ml-auto text-[11px] font-semibold text-ink-500">{name}</span>
              </div>
              <p className="px-3 pb-2.5 text-[11px] leading-snug text-ink-500">{note}</p>
            </div>
          ))}
        </div>

        {/* ─────────── Logo directions ─────────── */}
        <SectionLabel>Logo directions</SectionLabel>
        <p className="text-xs text-ink-500 mb-3 -mt-1">
          Five marks. Each shown at header size, large, reversed on dark, and as a wordmark lockup. Small size = the real test.
        </p>
        <div className="flex flex-col gap-3">
          {LOGO_CONCEPTS.map(({ key, name, note, Mark }) => (
            <div key={key} className="rounded-2xl bg-white border border-ink-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-ink-900">{name}</p>
                <p className="text-[11px] text-ink-500">{note}</p>
              </div>
              <div className="flex items-center gap-5">
                {/* header size */}
                <div className="flex flex-col items-center gap-1">
                  <Mark size={26} />
                  <span className="text-[9px] text-ink-300">26px</span>
                </div>
                {/* large gradient */}
                <div className="flex flex-col items-center gap-1">
                  <Mark size={52} gradient />
                  <span className="text-[9px] text-ink-300">gradient</span>
                </div>
                {/* reversed on dark */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-[60px] h-[60px] rounded-xl bg-ink-900 flex items-center justify-center">
                    <Mark size={34} color="#FFFFFF" />
                  </div>
                  <span className="text-[9px] text-ink-300">reversed</span>
                </div>
                {/* wordmark lockup */}
                <div className="flex-1 flex items-center gap-2 justify-end">
                  <Mark size={24} />
                  <span className="font-bold tracking-[0.15em] text-ink-900 text-sm">CRUXMATE</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ─────────── Avatars ─────────── */}
        <SectionLabel>Avatars · style explorations</SectionLabel>
        <p className="text-xs text-ink-500 mb-3 -mt-1">
          One config, four renderers — swapping the style is a drop-in renderer swap. Punk (current), cyberpunk,
          anime, and hand-drawn sketch. Bucketed options; a real build would curate.
        </p>
        <div className="rounded-2xl bg-white border border-ink-100 p-4 space-y-4">
          {[
            { label: 'Now · punk', cls: 'text-ink-300', Render: PunkAvatar },
            { label: 'Cyberpunk', cls: 'text-brand-600', Render: CyberAvatar },
            { label: 'Anime', cls: 'text-pink-500', Render: AnimeAvatar },
            { label: 'Sketch', cls: 'text-ink-700', Render: SketchAvatar },
          ].map(({ label, cls, Render }) => (
            <div key={label}>
              <p className={cn('mb-2 text-[10px] font-bold uppercase tracking-wider', cls)}>{label}</p>
              <div className="flex flex-wrap gap-3">
                {AVATAR_SEEDS.map((seed) => (
                  <Render key={seed} config={avatarFromSeed(seed)} size={60} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ─────────── More style samples ─────────── */}
        <SectionLabel>Avatars · more styles (one each)</SectionLabel>
        <p className="text-xs text-ink-500 mb-3 -mt-1">
          Low/med-cost directions, one sample each — same config as above. Pixel, enamel-pin, low-poly, riso, vaporwave.
        </p>
        <div className="rounded-2xl bg-white border border-ink-100 p-4 flex flex-wrap gap-5">
          {MORE_STYLES.map(({ key, name, note, Render }) => (
            <div key={key} className="flex flex-col items-center gap-1.5 w-[92px] text-center">
              <Render config={avatarFromSeed('Nova')} size={72} />
              <p className="text-[11px] font-bold text-ink-900 leading-tight">{name}</p>
              <p className="text-[9px] text-ink-500 leading-tight">{note}</p>
            </div>
          ))}
        </div>

        {/* ─────────── Enamel UI exploration ─────────── */}
        <SectionLabel>Enamel UI · match the pins</SectionLabel>
        <p className="text-xs text-ink-500 mb-3 -mt-1">
          The pin aesthetic on real components — gold rims, glossy enamel fills, bold outlines, shine, star flair.
        </p>
        <EnamelUIShowcase />

        {/* ─────────── Enamel pin full set ─────────── */}
        <SectionLabel>Enamel pin · full set</SectionLabel>
        <p className="text-xs text-ink-500 mb-3 -mt-1">
          The enamel-pin style across all seeds — varied hair, expressions, skin, and enamel backdrops, gold rim +
          metal line-work + gloss + a climbing-flair star. Shown large and at real avatar size.
        </p>
        <div className="rounded-2xl bg-white border border-ink-100 p-4 space-y-4">
          <div className="flex flex-wrap gap-3">
            {AVATAR_SEEDS.map((seed) => (
              <PinAvatar key={seed} config={avatarFromSeed(seed)} size={72} />
            ))}
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-300">At real sizes</p>
            <div className="flex items-end gap-3">
              {AVATAR_SEEDS.slice(0, 6).map((seed) => (
                <PinAvatar key={seed} config={avatarFromSeed(seed)} size={40} />
              ))}
              {AVATAR_SEEDS.slice(0, 4).map((seed) => (
                <PinAvatar key={`s${seed}`} config={avatarFromSeed(seed)} size={26} />
              ))}
            </div>
          </div>
        </div>

        {/* ─────────── Cartoon avatars (Go-Crux mascot style) ─────────── */}
        <SectionLabel>Avatar · cartoon (Go-Crux style)</SectionLabel>
        <p className="text-xs text-ink-500 mb-3 -mt-1">
          Same flat, bold-outline cartoon language as the boulder mascot — read from the same AvatarConfig.
          Top row = current enamel pin; bottom = cartoon. Same seeds, so it's a true swap comparison.
        </p>
        <div className="rounded-2xl bg-white border border-ink-100 p-4 space-y-4">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-300">Now · enamel pin</p>
            <div className="flex flex-wrap gap-3">
              {AVATAR_SEEDS.map((seed) => (
                <PinAvatar key={seed} config={avatarFromSeed(seed)} size={64} />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-300">Cartoon</p>
            <div className="flex flex-wrap gap-3">
              {AVATAR_SEEDS.map((seed) => (
                <CartoonAvatar key={seed} config={avatarFromSeed(seed)} size={64} />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-300">
              Cartoon + gold ring (bridges the pin/badge look)
            </p>
            <div className="flex items-end gap-3">
              {AVATAR_SEEDS.slice(0, 6).map((seed) => (
                <CartoonAvatar key={seed} config={avatarFromSeed(seed)} size={44} ring />
              ))}
              {AVATAR_SEEDS.slice(0, 5).map((seed) => (
                <CartoonAvatar key={`s${seed}`} config={avatarFromSeed(seed)} size={26} />
              ))}
            </div>
          </div>
        </div>

        {/* ─────────── A. Hero moments ─────────── */}
        <SectionLabel>A · Hero moments</SectionLabel>
        <p className="text-xs text-ink-500 mb-3 -mt-1">
          Spring animation + confetti + haptic (Android) + optional sound. These fire on earned events, not everywhere.
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {MOMENTS.map((m) => (
            <button
              key={m.key}
              onClick={() => setCelebration(m.cfg)}
              className="rounded-2xl border border-ink-100 bg-white px-4 py-4 text-sm font-semibold text-ink-900 text-left active:scale-[0.97] transition hover:border-ink-300"
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* ─────────── B. Bold theme ─────────── */}
        <SectionLabel>B · Bolder theme</SectionLabel>
        <p className="text-xs text-ink-500 mb-3 -mt-1">
          Same climb-call card, two skins. Left is today; right cranks color, weight, radius, and depth.
        </p>

        <div className="grid grid-cols-2 gap-3 items-start">
          {/* CALM (current) */}
          <div>
            <Tag>Now · calm</Tag>
            <div className="rounded-2xl bg-white border border-ink-100 p-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-sm">🧗</div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900 leading-tight">Marcus R.</p>
                  <p className="text-[11px] text-ink-500">Needs a belayer</p>
                </div>
              </div>
              <p className="mt-3 text-lg font-bold text-ink-900">5.10c Lead</p>
              <p className="text-xs text-ink-500">Stone Gardens · in 30 min</p>
              <button className="mt-3 w-full rounded-xl bg-ink-900 text-white text-sm font-medium py-2.5 active:scale-[0.97] transition">
                Request to pair
              </button>
            </div>
          </div>

          {/* BOLD (dopamine) */}
          <div>
            <Tag>Dopamine</Tag>
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="rounded-[1.4rem] p-4 text-white shadow-lg"
              style={{
                background: 'linear-gradient(145deg, #7C3AED 0%, #EC4899 100%)',
                boxShadow: '0 12px 30px -8px rgba(124,58,237,0.55)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-sm ring-1 ring-white/40">🧗</div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold leading-tight">Marcus R.</p>
                  <p className="text-[11px] text-white/80 font-medium">Needs a belayer</p>
                </div>
                <span className="ml-auto rounded-full bg-[#C6F135] text-[#17123A] text-[10px] font-black px-2 py-0.5">
                  ⚡ 96% match
                </span>
              </div>
              <p className="mt-3 text-2xl font-black tracking-tight">5.10c Lead</p>
              <p className="text-xs text-white/80 font-medium">Stone Gardens · in 30 min</p>
              <button
                className="mt-3 w-full rounded-2xl text-[#17123A] text-sm font-black py-3 active:scale-[0.96] transition"
                style={{ background: '#C6F135', boxShadow: '0 6px 0 0 #9fcc17' }}
              >
                REQUEST TO PAIR →
              </button>
            </motion.div>
          </div>
        </div>

        {/* buttons + chips comparison */}
        <div className="grid grid-cols-2 gap-3 mt-4 items-start">
          <div>
            <Tag>Now · calm</Tag>
            <div className="flex flex-wrap gap-2">
              {['All', 'Top Rope', 'Lead', 'Boulder'].map((c, i) => (
                <span
                  key={c}
                  className={
                    i === 0
                      ? 'rounded-full bg-ink-900 text-white text-xs font-semibold px-3 py-1.5'
                      : 'rounded-full bg-white border border-ink-100 text-ink-700 text-xs font-medium px-3 py-1.5'
                  }
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div>
            <Tag>Dopamine</Tag>
            <div className="flex flex-wrap gap-2">
              {['All', 'Top Rope', 'Lead', 'Boulder'].map((c, i) => (
                <span
                  key={c}
                  className="rounded-full text-xs font-black px-3.5 py-1.5"
                  style={
                    i === 0
                      ? { background: 'linear-gradient(135deg,#7C3AED,#EC4899)', color: 'white', boxShadow: '0 4px 14px -4px rgba(236,72,153,0.6)' }
                      : { background: 'white', color: '#17123A', border: '2px solid #E7DBFF' }
                  }
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-white border border-ink-100 p-4 text-xs text-ink-500 leading-relaxed">
          <span className="font-semibold text-ink-700">Notes:</span> The bold skin keeps your existing token
          structure — it's a palette + weight + radius swap on the same primitives, so adopting it is a config change,
          not a rewrite. Recommendation: pair the calm base for trust-critical flows (verification, safety) with the
          bold treatment reserved for discovery + the hero moments above.
        </div>
      </div>

      <Celebration show={celebration} onDone={() => setCelebration(null)} sound={sound} />
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="mt-8 mb-2 text-xs font-bold uppercase tracking-widest text-ink-300">{children}</h2>;
}

function Tag({ children }: { children: ReactNode }) {
  return <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-300">{children}</p>;
}
