import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { AuthSheet } from '@/components/AuthSheet';
import { Logo } from '@/components/layout/Logo';
import { GuestJoinForm } from '@/components/GuestJoinForm';
import { Avatar } from '@/components/ui/Avatar';
import { InviteSection } from '@/components/InviteSection';
import { savePendingIntent, consumePendingIntentFor } from '@/lib/pendingIntent';
import { normalizeInviteCode, isValidInviteCode, seedInviteCode } from '@/lib/inviteCode';
import { fetchProfileByInviteCode } from '@/lib/db';
import { getArchetype } from '@/lib/quizMeta';
import { ArchetypeEmblem } from '@/components/ArchetypeEmblem';
import { useAppStore } from '@/store/useAppStore';
import type { AvatarConfig } from '@/lib/avatar';

interface AddTarget {
  id: string;
  display_name: string;
  photo_url?: string | null;
  avatar?: AvatarConfig;
  archetypeId?: string;
  /** Where the code resolved from — remote is the real profile, local is a seed user. */
  via: 'me' | 'remote' | 'local';
}

/**
 * Personal add-friend deep link: /add/:code (e.g. /add/CLIMB-8K42)
 * - Logged in → the person's card with one primary action.
 * - Logged out → guest name form or email sign-in first, then this page.
 * - Unknown code → friendly dead-end.
 * - The add intent is stashed before any auth detour and consumed on
 *   return, exactly like the session/call deep links.
 */
export function AddDeepLink() {
  const { code: rawCode } = useParams();
  const code = normalizeInviteCode(rawCode ?? '');
  const valid = isValidInviteCode(code);
  const nav = useNavigate();
  const me = useAppStore((s) => s.me);
  const users = useAppStore((s) => s.users);
  const cruxmates = useAppStore((s) => s.cruxmates);
  const addCruxMate = useAppStore((s) => s.addCruxMate);
  const ensureInviteCode = useAppStore((s) => s.ensureInviteCode);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [target, setTarget] = useState<AddTarget | null>(null);
  const [resolving, setResolving] = useState(true);
  const [added, setAdded] = useState(false);

  // Resolve the code: my own → public directory → local seed users.
  useEffect(() => {
    if (!valid) {
      setResolving(false);
      setTarget(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setResolving(true);
      try {
        if (me) {
          const myCode = ensureInviteCode();
          if (cancelled) return;
          if (myCode === code) {
            setTarget({
              id: me.id,
              display_name: me.display_name,
              photo_url: me.photo_url ?? null,
              avatar: me.avatar,
              archetypeId: me.quiz_result_type,
              via: 'me',
            });
            return;
          }
        }
        // Public directory lookup (full coverage needs the 2026-10-15
        // invite-code migration; errors degrade to the local fallback).
        const remote = await fetchProfileByInviteCode(code).catch(() => null);
        if (cancelled) return;
        if (remote) {
          const npc = users.find((u) => u.id === remote.id);
          setTarget({
            id: remote.id,
            display_name: remote.display_name,
            photo_url: remote.photo_url ?? null,
            avatar: npc?.avatar,
            archetypeId: (npc as { quiz_result_type?: string } | undefined)?.quiz_result_type,
            via: 'remote',
          });
          return;
        }
        // Local seed users carry deterministic codes — works offline and
        // before any DB migration.
        const npc = users.find((u) => seedInviteCode(u.id, u.display_name) === code);
        if (cancelled) return;
        if (npc) {
          setTarget({
            id: npc.id,
            display_name: npc.display_name,
            avatar: npc.avatar,
            archetypeId: (npc as { quiz_result_type?: string } | undefined)?.quiz_result_type,
            via: 'local',
          });
          return;
        }
        setTarget(null);
      } finally {
        if (!cancelled) setResolving(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, valid, me?.id]);

  // Stash the add target before any auth detour so the link survives
  // sign-in + onboarding and lands back here.
  useEffect(() => {
    if (!me && valid) savePendingIntent({ type: 'add', id: code });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id, code, valid]);

  // Back from the detour.
  useEffect(() => {
    if (me && valid) consumePendingIntentFor('add', code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id, code, valid]);

  const handleAdd = () => {
    if (!target || target.via === 'me') return;
    addCruxMate(target.id);
    setAdded(true);
    toast.success(`${target.display_name} added as a CruxMate`);
  };

  const shell = (body: React.ReactNode) => (
    <div className="min-h-screen bg-paper-50">
      <div className="mx-auto max-w-[560px] px-6 py-10">
        <div className="flex flex-col items-center text-center">
          <Logo size={56} />
        </div>
        {body}
      </div>
    </div>
  );

  const personCard = (t: AddTarget) => {
    const arch = t.archetypeId ? getArchetype(t.archetypeId) : null;
    return (
      <div className="mt-8 rounded-2xl bg-paper-100 border border-ink-100 p-6 text-center">
        <div className="flex flex-col items-center">
          <Avatar
            photoUrl={t.photo_url ?? undefined}
            config={t.avatar}
            seed={t.display_name}
            alt={t.display_name}
            size={88}
            fallback={t.display_name}
          />
          <h2 className="mt-3 text-xl font-semibold text-ink-900">{t.display_name}</h2>
          {arch && (
            <span className="mt-2 rounded-full border border-gold-500 text-gold-500 text-[11px] font-medium px-2.5 py-0.5">
              <ArchetypeEmblem
                archetypeId={t.archetypeId}
                className="mr-1 inline-block h-4 w-4 align-[-2px]"
                fallbackClassName="text-xs"
              />
              {arch.name_en}
            </span>
          )}
        </div>
      </div>
    );
  };

  // ── Logged out: invite first, identity second ──
  if (!me) {
    return shell(
      <>
        <div className="mt-8 rounded-2xl bg-paper-100 border border-ink-100 p-6 text-center">
          <p className="text-3xl">🤝</p>
          <h2 className="mt-3 text-xl font-semibold text-ink-900">
            {target ? `${target.display_name} invited you` : "You've been invited to Crux8"}
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            Add them as a cruxmate — just your name, no sign-up.
          </p>
          <div className="mt-5 text-left">
            <GuestJoinForm buttonLabel="Continue as a guest" />
          </div>
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-ink-100" />
            <span className="text-xs text-ink-400">or</span>
            <div className="h-px flex-1 bg-ink-100" />
          </div>
          <Button variant="outline" className="w-full" onClick={() => setSheetOpen(true)}>
            Sign in with email
          </Button>
          <p className="mt-2 text-[11px] text-ink-400">
            Guests add instantly; sign in anytime to keep your history on this device.
          </p>
        </div>
        <AuthSheet open={sheetOpen} onOpenChange={setSheetOpen} title="Sign in" initialTab="code" />
      </>
    );
  }

  // ── Logged in ──
  if (resolving) {
    return shell(
      <div className="mt-8 rounded-2xl bg-paper-100 border border-ink-100 p-10 text-center">
        <p className="text-sm text-ink-500">Looking up that code…</p>
      </div>
    );
  }

  if (!valid || !target) {
    return shell(
      <div className="mt-8 rounded-2xl bg-paper-100 border border-ink-100 p-6 text-center">
        <p className="text-3xl">🧭</p>
        <h2 className="mt-3 text-xl font-semibold text-ink-900">That code didn't lead anywhere</h2>
        <p className="mt-2 text-sm text-ink-500">
          Invite codes look like <span className="font-mono font-semibold">CLIMB-8K42</span> —
          check it with the person who shared it, or find people in Community.
        </p>
        <Button className="mt-6 w-full" onClick={() => nav('/community')}>
          Browse Community
        </Button>
      </div>
    );
  }

  // My own code: the share surface, not an add button.
  if (target.via === 'me') {
    return shell(
      <>
        <div className="mt-8 rounded-2xl bg-paper-100 border border-ink-100 p-6 text-center">
          <p className="text-3xl">🪪</p>
          <h2 className="mt-3 text-xl font-semibold text-ink-900">This is your invite code</h2>
          <p className="mt-2 text-sm text-ink-500">
            Share it — anyone with it can add you as a cruxmate.
          </p>
        </div>
        <div className="mt-4">
          <InviteSection code={code} displayName={target.display_name} />
        </div>
      </>
    );
  }

  const isCruxmate = cruxmates.includes(target.id);

  return shell(
    <>
      {personCard(target)}
      <div className="mt-4 flex flex-col gap-2">
        {added || isCruxmate ? (
          <>
            <div className="rounded-2xl border border-teal-600 bg-teal-50 p-4 text-center">
              <p className="text-sm font-bold text-teal-700">
                ✓ {added ? "You're cruxmates now" : "You're already cruxmates"}
              </p>
            </div>
            <Button className="w-full" onClick={() => nav(`/chat/${target.id}`)}>
              Message {target.display_name.split(' ')[0]}
            </Button>
          </>
        ) : (
          <Button variant="punch" className="w-full" onClick={handleAdd}>
            Add as Cruxmate
          </Button>
        )}
        <Button variant="ghost" className="w-full" onClick={() => nav('/community')}>
          ← Back to Community
        </Button>
      </div>
    </>
  );
}
