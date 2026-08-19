import type { ReactNode } from 'react';
import { PinAvatar } from '@/components/ui/PinAvatar';
import { avatarFromSeed } from '@/lib/avatar';

/**
 * THROWAWAY enamel-pin UI exploration for /lab. Translates the pin aesthetic
 * (gold metal rim, glossy enamel fill, bold cloisonné outline, shine, star
 * flair) onto real UI components. Nothing here is wired into the app.
 */

const GOLD = 'linear-gradient(150deg,#FCE79A 0%,#E7B646 46%,#A9791F 100%)';
const gloss = (
  <div
    className="pointer-events-none absolute inset-0"
    style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 42%, rgba(255,255,255,0) 60%)' }}
  />
);

/** Gold-framed enamel surface. */
function Enamel({ fill, radius = 22, className = '', children }: { fill: string; radius?: number; className?: string; children: ReactNode }) {
  return (
    <div className="p-[2.5px] shrink-0" style={{ background: GOLD, borderRadius: radius, boxShadow: '0 6px 16px -6px rgba(120,80,10,0.5)' }}>
      <div
        className={`relative overflow-hidden ring-1 ring-black/15 ${className}`}
        style={{ background: fill, borderRadius: radius - 3 }}
      >
        {gloss}
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

function EnamelButton({ fill, text, children }: { fill: string; text: string; children: ReactNode }) {
  return (
    <button className="p-[2.5px] active:translate-y-[1px] transition" style={{ background: GOLD, borderRadius: 16, boxShadow: '0 5px 12px -5px rgba(120,80,10,0.55)' }}>
      <span
        className="relative flex items-center justify-center overflow-hidden px-5 py-2.5 font-extrabold text-sm ring-1 ring-black/15"
        style={{ background: fill, color: text, borderRadius: 13 }}
      >
        {gloss}
        <span className="relative">{children}</span>
      </span>
    </button>
  );
}

function EnamelChip({ fill, text, children }: { fill: string; text: string; children: ReactNode }) {
  return (
    <span className="inline-block p-[2px]" style={{ background: GOLD, borderRadius: 999 }}>
      <span
        className="relative inline-flex items-center overflow-hidden px-3 py-1 text-xs font-bold ring-1 ring-black/10"
        style={{ background: fill, color: text, borderRadius: 999 }}
      >
        {gloss}
        <span className="relative">{children}</span>
      </span>
    </span>
  );
}

const Star = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} width="16" height="16">
    <path d="M12 2 L14.1 8.3 L20.8 8.5 L15.5 12.6 L17.3 19 L12 15.1 L6.7 19 L8.5 12.6 L3.2 8.5 L9.9 8.3 Z" fill="#FCE79A" stroke="#8A6416" strokeWidth="1" strokeLinejoin="round" />
  </svg>
);

export function EnamelUIShowcase() {
  const violet = 'linear-gradient(160deg,#8B5CF6,#6D28D9)';
  const lime = 'linear-gradient(160deg,#C6F135,#8FB81E)';
  const cream = 'linear-gradient(160deg,#FFF7E6,#F5E6C0)';
  const teal = 'linear-gradient(160deg,#2FB6A8,#1B8378)';
  const coral = 'linear-gradient(160deg,#FF7A8A,#E8465C)';

  return (
    <div className="rounded-2xl bg-[#F3ECDD] border border-ink-100 p-4 space-y-5">
      {/* Buttons */}
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">Buttons</p>
        <div className="flex flex-wrap items-center gap-3">
          <EnamelButton fill={violet} text="#FFFFFF">Request to pair</EnamelButton>
          <EnamelButton fill={lime} text="#1B1533">🔥 Log a send</EnamelButton>
          <EnamelButton fill={cream} text="#6E5019">View card</EnamelButton>
        </div>
      </div>

      {/* Chips */}
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">Filter chips</p>
        <div className="flex flex-wrap items-center gap-2">
          <EnamelChip fill={violet} text="#FFFFFF">All</EnamelChip>
          <EnamelChip fill={cream} text="#6E5019">Top Rope</EnamelChip>
          <EnamelChip fill={cream} text="#6E5019">Lead</EnamelChip>
          <EnamelChip fill={coral} text="#FFFFFF">Boulder</EnamelChip>
        </div>
      </div>

      {/* Card */}
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">Climb-call card as a pin plaque</p>
        <Enamel fill={violet} radius={26} className="text-white">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-[2px] rounded-full shrink-0" style={{ background: GOLD }}>
                <PinAvatar config={avatarFromSeed('Marcus Rivera')} size={44} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-lg leading-tight">Top Rope</h3>
                  <EnamelChip fill={lime} text="#1B1533">96% match</EnamelChip>
                </div>
                <p className="text-[13px] text-white/85 font-medium">5.10a–5.11a · hosted by Marcus</p>
                <p className="text-[12px] text-white/80 mt-1">Today · 6:00–8:00 PM · Vertical World</p>
              </div>
              <Star className="shrink-0" />
            </div>
            <p className="mt-3 text-sm text-white/90 italic border-l-2 border-white/40 pl-3">
              "Projecting the red set — soft catches please"
            </p>
            <div className="mt-3.5 flex gap-2">
              <EnamelButton fill={lime} text="#1B1533">Request to pair →</EnamelButton>
              <EnamelButton fill="linear-gradient(160deg,#ffffff33,#ffffff22)" text="#FFFFFF">View</EnamelButton>
            </div>
          </div>
        </Enamel>
      </div>

      {/* Nav sample */}
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">Active nav / level pill</p>
        <div className="flex items-center gap-3">
          <EnamelChip fill={teal} text="#FFFFFF">📍 Checked in</EnamelChip>
          <EnamelChip fill={violet} text="#FFFFFF">🧗 Lv 3 · Crimp Lord</EnamelChip>
        </div>
      </div>
    </div>
  );
}
