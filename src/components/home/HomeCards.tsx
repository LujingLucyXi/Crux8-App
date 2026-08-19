import { Calendar, MapPin, Clock } from 'iconoir-react';
import { formatSessionWhen } from '@/lib/date';
import type { Challenge } from '@/lib/challenges';
import type { BadgeProgress } from '@/lib/badges';
import { cn } from '@/lib/utils';

/* ───────────────── Up-next hero ───────────────── */

interface UpNextProps {
  kind: 'session' | 'call' | 'event';
  title: string;
  subtitle: string;
  when: string;
  where: string;
  countLabel?: string;
  onClick: () => void;
}

export function UpNextCard({ kind, title, subtitle, when, where, countLabel, onClick }: UpNextProps) {
  const tag = kind === 'call' ? 'CLIMB CALL' : kind === 'event' ? 'EVENT' : 'SESSION';
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-3xl bg-brand-gradient text-white p-5 relative overflow-hidden shadow-brand"
    >
      {/* subtle topo texture */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.07]" viewBox="0 0 200 100" preserveAspectRatio="none">
        <path d="M0 70 Q50 40 100 62 T200 48" stroke="white" strokeWidth="1.5" fill="none" />
        <path d="M0 82 Q50 54 100 74 T200 62" stroke="white" strokeWidth="1.5" fill="none" />
        <path d="M0 58 Q50 28 100 50 T200 34" stroke="white" strokeWidth="1.5" fill="none" />
      </svg>
      <div className="relative">
        <span className="inline-block rounded-full bg-white/15 text-white/90 text-[10px] font-semibold tracking-wider px-2 py-0.5">
          {tag}
        </span>
        <h3 className="mt-2.5 text-xl font-semibold leading-tight">{title}</h3>
        <p className="text-sm text-white/70 mt-0.5">{subtitle}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-white/85">
          <span className="inline-flex items-center gap-1.5">
            <Clock width={14} height={14} /> {when}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin width={14} height={14} /> {where}
          </span>
        </div>
        {countLabel && <p className="mt-3 text-xs text-white/60">{countLabel}</p>}
      </div>
    </button>
  );
}

/* ───────────────── Mini schedule card ───────────────── */

interface MiniProps {
  accent: string;      // tailwind bg class
  emoji?: string;
  title: string;
  subtitle: string;
  startsAt: string;
  where: string;
  onClick: () => void;
}

export function MiniScheduleCard({ accent, emoji, title, subtitle, startsAt, where, onClick }: MiniProps) {
  return (
    <button
      onClick={onClick}
      className="w-[184px] shrink-0 text-left rounded-2xl bg-white border border-ink-100 p-3.5 hover:border-ink-300 transition-colors"
    >
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-base', accent)}>
        {emoji}
      </div>
      <h3 className="mt-2.5 font-semibold text-ink-900 text-sm leading-tight line-clamp-1">{title}</h3>
      <p className="text-[12px] text-ink-500 line-clamp-1">{subtitle}</p>
      <div className="mt-2 flex items-center gap-1 text-[11px] text-ink-500">
        <Calendar width={11} height={11} />
        <span className="truncate">{formatSessionWhen(startsAt)}</span>
      </div>
      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-500">
        <MapPin width={11} height={11} />
        <span className="truncate">{where}</span>
      </div>
    </button>
  );
}

/* ───────────────── Challenge card ───────────────── */

export function ChallengeCard({ c }: { c: Challenge }) {
  const pct = Math.min(100, Math.round((c.current / c.target) * 100));
  const done = c.current >= c.target;
  return (
    <div
      className={cn(
        'w-[168px] shrink-0 rounded-2xl border p-3.5',
        done ? 'bg-teal-100 border-teal-600' : 'bg-white border-ink-100',
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-xl leading-none">{c.emoji}</span>
        {done && <span className="text-[10px] font-bold text-teal-600 tracking-wider">DONE</span>}
      </div>
      <h3 className="mt-2 font-semibold text-ink-900 text-sm leading-tight">{c.title}</h3>
      <p className="text-[11px] text-ink-500 leading-snug mt-0.5 line-clamp-2">{c.blurb}</p>
      <div className="mt-2.5">
        <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', done ? 'bg-teal-600' : 'bg-ink-900')}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] font-medium text-ink-500">
          {Math.min(c.current, c.target)} / {c.target} {c.unit}
        </p>
      </div>
    </div>
  );
}

/* ───────────────── Badge progress card ───────────────── */

export function BadgeProgressCard({ b, onClick }: { b: BadgeProgress; onClick: () => void }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  return (
    <button
      onClick={onClick}
      className="w-[132px] shrink-0 rounded-2xl bg-white border border-ink-100 p-3.5 flex flex-col items-center text-center hover:border-ink-300 transition-colors"
    >
      <div className="relative w-[56px] h-[56px]">
        <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
          <circle cx="28" cy="28" r={r} fill="none" stroke="#D9E1E6" strokeWidth="4" />
          <circle
            cx="28" cy="28" r={r} fill="none"
            stroke={b.earned ? '#2C7A7B' : '#F4B942'}
            strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ - (circ * b.pct) / 100}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl">{b.emoji}</span>
      </div>
      <h3 className="mt-2 font-semibold text-ink-900 text-[12px] leading-tight">{b.label}</h3>
      <p className="text-[10px] text-ink-500 leading-snug mt-0.5 line-clamp-2">{b.hint}</p>
      <p className="mt-1 text-[10px] font-semibold text-gold-500">
        {b.current} / {b.target}
      </p>
    </button>
  );
}

/* ───────────────── Empty state ───────────────── */

export function EmptyNudge({ emoji, text, cta, onClick }: {
  emoji: string; text: string; cta: string; onClick: () => void;
}) {
  return (
    <div className="rounded-2xl bg-white border border-dashed border-ink-100 p-6 text-center">
      <span className="text-2xl">{emoji}</span>
      <p className="mt-2 text-sm text-ink-500">{text}</p>
      <button onClick={onClick} className="mt-3 text-xs font-semibold text-teal-600">
        {cta}
      </button>
    </div>
  );
}
