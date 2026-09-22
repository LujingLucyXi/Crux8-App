import { NavArrowRight, HelpCircle } from 'iconoir-react';

interface Props {
  /** Number of upcoming mystery nights, for the CTA sub-line. */
  count?: number;
  onClick: () => void;
}

/**
 * Branded promo card for the Crux8 Mystery Crew program — a signature feature
 * that matches you into a surprise crew at your level, revealed 24h before.
 * Distinct dark "?" aesthetic so it reads as its own thing, not an event.
 */
export function MysteryCrewCard({ count, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="relative w-full overflow-hidden rounded-2xl text-left p-4 bg-[linear-gradient(135deg,#1E1B4B,#4C1D95)] text-white active:scale-[0.99] transition-transform"
    >
      {/* faint oversized ? watermark */}
      <span className="pointer-events-none absolute -right-3 -top-6 text-[120px] leading-none font-black text-white/10 select-none">?</span>
      <div className="relative flex items-center gap-3">
        <div className="shrink-0 w-11 h-11 rounded-full bg-white/15 ring-1 ring-white/30 flex items-center justify-center text-2xl">
          🎭
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Crux8 Mystery Crew</p>
          <h3 className="font-extrabold text-base leading-tight">Get matched into a surprise crew.</h3>
          <p className="text-[12px] text-white/75 mt-0.5">
            A crew at your level · gym + partners revealed 24h before.
          </p>
        </div>
      </div>
      <div className="relative mt-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/80">
          <HelpCircle width={13} height={13} />
          $5/night · or $15/mo unlimited
        </span>
        <span className="inline-flex items-center gap-0.5 text-[12px] font-bold text-lime-300">
          {count && count > 0 ? `${count} nights` : 'Join'} <NavArrowRight width={13} height={13} />
        </span>
      </div>
    </button>
  );
}
