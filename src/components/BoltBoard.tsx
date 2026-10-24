import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { fetchBoltBoard, type BoltBoardRow } from '@/lib/db';
import { CHARGE_FULL, decayLoss, localDay } from '@/lib/charge';
import { Avatar } from '@/components/ui/Avatar';
import { UserProfileSheet } from '@/components/sheets/UserProfileSheet';
import { cn } from '@/lib/utils';

const MEDALS = ['🥇', '🥈', '🥉'];

/**
 * Daily bolt leaderboard (Lucy 2026-10-20: top 3 to start). Bolt
 * charge is earned/decayed on-device and SYNCED to the profile on
 * every earn; readers apply the same decay (2 grace days, -8/day)
 * to the synced value via its last-active day, so a stale score
 * fades on the board exactly like in its owner's app. My own row
 * always reflects my local (freshest) charge, and my standing
 * shows even when I'm outside the top 3.
 */
export function BoltBoard() {
  const me = useAppStore((s) => s.me);
  const ensureDirectoryProfiles = useAppStore((s) => s.ensureDirectoryProfiles);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const myCharge = useAppStore((s) => s.charge);
  const myDay = useAppStore((s) => s.chargeLastActiveDay);
  const [rows, setRows] = useState<BoltBoardRow[] | null>(null);

  useEffect(() => {
    let live = true;
    void fetchBoltBoard().then((r) => {
      if (live) setRows(r);
    });
    return () => {
      live = false;
    };
  }, []);

  const today = localDay();
  const effective = (r: BoltBoardRow) =>
    Math.max(0, (r.bolt_charge ?? 0) - decayLoss(r.bolt_day ?? null, today));

  const board = [...(rows ?? [])];
  if (me) {
    const mine: BoltBoardRow = {
      id: me.id,
      display_name: me.display_name,
      photo_url: me.photo_url,
      avatar: me.avatar,
      bolt_charge: myCharge,
      bolt_day: myDay,
    };
    const idx = board.findIndex((r) => r.id === me.id);
    if (idx >= 0) board[idx] = mine;
    else board.push(mine);
  }
  const sorted = board
    .map((r) => ({ row: r, value: r.id === me?.id ? myCharge : effective(r) }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);
  const top3 = sorted.slice(0, 3);
  const myRank = me ? sorted.findIndex((x) => x.row.id === me.id) : -1;
  const showMyRow = me && myRank >= 3;

  // Board rows open the climber's profile (Lucy 2026-10-24: the board
  // was the ONLY place a brand-new climber surfaced — tapping it now
  // reaches their sheet, where Follow lives).
  const openProfile = (id: string) => {
    void ensureDirectoryProfiles([id]).then(() => setProfileUserId(id));
  };

  const Row = ({
    entry,
    rank,
    highlight,
  }: {
    entry: { row: BoltBoardRow; value: number };
    rank: number;
    highlight?: boolean;
  }) => (
    <button
      type="button"
      onClick={() => openProfile(entry.row.id)}
      className={cn(
        'w-full text-left flex items-center gap-3 rounded-2xl px-3 py-2.5 active:scale-[0.99] transition',
        highlight ? 'bg-brand-100 border border-brand-600/50' : '',
      )}
    >
      <span className="w-7 shrink-0 text-center text-base">
        {MEDALS[rank] ?? <span className="text-sm font-bold text-ink-500">#{rank + 1}</span>}
      </span>
      <Avatar
        photoUrl={entry.row.photo_url ?? undefined}
        config={entry.row.avatar ?? undefined}
        seed={entry.row.id}
        alt={entry.row.display_name}
        size={32}
        fallback={entry.row.display_name.slice(0, 1).toUpperCase()}
        className="shrink-0"
      />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900">
        {entry.row.display_name}
        {entry.row.id === me?.id && <span className="text-ink-500 font-medium"> · you</span>}
      </span>
      <span className="flex items-center gap-2 shrink-0">
        <span className="h-1.5 w-14 rounded-full bg-ink-100 overflow-hidden">
          <span
            className="block h-full rounded-full bg-brand-gradient"
            style={{ width: `${Math.min(100, (entry.value / CHARGE_FULL) * 100)}%` }}
          />
        </span>
        <span className="text-sm font-extrabold text-ink-900">⚡{entry.value}</span>
      </span>
    </button>
  );

  return (
    <section className="mt-6">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
          Bolt leaderboard ⚡
        </h2>
        <span className="text-[11px] text-ink-400 font-medium">today · top 3</span>
      </div>
      <div className="rounded-[26px] bg-paper-100 border border-ink-100 p-3">
        {rows === null ? (
          <p className="px-2 py-3 text-sm text-ink-500">Charging the board…</p>
        ) : top3.length === 0 ? (
          <p className="px-2 py-3 text-sm text-ink-500">
            No bolts lit yet — log a send, check in, or finish a session to charge yours.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {top3.map((entry, i) => (
              <Row key={entry.row.id} entry={entry} rank={i} highlight={entry.row.id === me?.id} />
            ))}
            {showMyRow && (
              <>
                <div className="mx-3 my-1 border-t border-dashed border-ink-100" />
                <Row entry={sorted[myRank]} rank={myRank} highlight />
              </>
            )}
          </div>
        )}
      </div>
      <UserProfileSheet
        userId={profileUserId}
        open={profileUserId !== null}
        onOpenChange={(open) => {
          if (!open) setProfileUserId(null);
        }}
      />
    </section>
  );
}
