import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { AuthSheet } from '@/components/AuthSheet';
import { Logo } from '@/components/layout/Logo';
import { useAppStore } from '@/store/useAppStore';
import { DNA_AXES, getArchetype, getHouse, getHouseForArchetype } from '@/lib/quizMeta';
import type { Profile, QuizDna } from '@/seed/types'; // both used in type positions below

/**
 * Claim your Climber DNA — the quiz-to-app bridge (no waitlist involved).
 *
 * The quiz links here with a self-contained URL:
 *   /claim?r={archetype_id}&d={v,v,v,v,v,v}&n={nickname}&h={house_id}&l={en|zh}
 * `d` carries the 6 DNA values (0-100) in DNA_AXES order.
 *
 * - Logged out → teaser + sign-in sheet (email code or password), then the claim card appears.
 * - Logged in, DNA not yet claimed → claim card → one tap saves to profile.
 * - Already claimed → points at the profile instead of double-saving.
 */

interface ClaimPayload {
  archetypeId: string;
  dna: QuizDna;
  houseId: string;
  nickname: string;
  lang: 'en' | 'zh';
}

function parseClaim(searchParams: URLSearchParams): ClaimPayload | null {
  const arch = getArchetype(searchParams.get('r'));
  if (!arch) return null;
  const parts = (searchParams.get('d') ?? '').split(',');
  if (parts.length !== DNA_AXES.length) return null;
  const values = parts.map(Number);
  if (values.some((v) => !Number.isFinite(v))) return null;
  const lang = searchParams.get('l') === 'zh' ? 'zh' : 'en';
  const dna: QuizDna = DNA_AXES.map((axis, i) => ({
    key: axis.key,
    label: lang === 'zh' ? axis.label_zh : axis.label_en,
    emoji: axis.emoji,
    value: Math.max(0, Math.min(100, Math.round(values[i]))),
  }));
  const house = getHouse(searchParams.get('h')) ?? getHouseForArchetype(arch.id);
  return {
    archetypeId: arch.id,
    dna,
    houseId: house.id,
    nickname: (searchParams.get('n') ?? '').slice(0, 30),
    lang,
  };
}

function DnaBars({ dna }: { dna: QuizDna }) {
  return (
    <div className="space-y-2.5">
      {dna.map((axis) => (
        <div key={axis.key}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-ink-700">
              {axis.emoji} {axis.label}
            </span>
            <span className="text-ink-400 font-medium">{axis.value}</span>
          </div>
          <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-gradient"
              style={{ width: `${axis.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Claim() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const me = useAppStore((s) => s.me);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const addCharge = useAppStore((s) => s.addCharge);
  const ensureHouseHangout = useAppStore((s) => s.ensureHouseHangout);

  const claim = useMemo(() => parseClaim(searchParams), [searchParams]);

  const [name, setName] = useState(claim?.nickname ?? '');
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleClaim = () => {
    if (!claim || !me) return;
    const patch: Partial<Profile> = {
      quiz_result_type: claim.archetypeId,
      quiz_dna: claim.dna,
      quiz_house_id: claim.houseId,
    };
    const trimmed = name.trim();
    if (trimmed) patch.display_name = trimmed;
    updateProfile(patch);
    addCharge('quiz_claim');
    // First crew, zero effort: drop them into their house hangout.
    ensureHouseHangout(claim.houseId);
    nav(me.onboarded === false ? '/onboarding?summary=1' : '/home');
  };

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="mx-auto max-w-[560px] px-6 py-10">
        <div className="flex flex-col items-center text-center">
          <Logo size={56} />
        </div>

        {!claim ? (
          <div className="mt-8 rounded-2xl bg-paper-100 border border-ink-100 p-6 text-center">
            <p className="text-3xl">🧭</p>
            <h2 className="mt-3 text-xl font-semibold text-ink-900">This claim link looks broken</h2>
            <p className="mt-2 text-sm text-ink-500">
              The link is missing your quiz result. Try opening your quiz card again and tapping
              “Continue to the Crux8 app”.
            </p>
            <Button className="mt-6 w-full" onClick={() => nav('/')}>
              Back to Crux8
            </Button>
          </div>
        ) : me?.quiz_result_type ? (
          <div className="mt-8 rounded-2xl bg-paper-100 border border-ink-100 p-6 text-center">
            <p className="text-3xl">✅</p>
            <h2 className="mt-3 text-xl font-semibold text-ink-900">DNA already claimed</h2>
            <p className="mt-2 text-sm text-ink-500">
              Your Climber DNA is already on your profile. Time to find your people.
            </p>
            <Button className="mt-6 w-full" onClick={() => nav('/home')}>
              Find climbing friends
            </Button>
          </div>
        ) : (
          <>
            <h2 className="mt-6 text-2xl font-semibold text-ink-900 text-center">
              Your Climber DNA is here.
            </h2>
            <p className="mt-2 text-sm text-ink-500 text-center">
              Claim it to your profile and meet climbing & hiking friends who match your vibe.
            </p>

            <div className="mt-6 rounded-2xl bg-paper-100 border border-ink-100 p-6">
              <div className="text-center">
                <p className="text-5xl">{getArchetype(claim.archetypeId)?.emoji}</p>
                <h3 className="mt-3 text-lg font-bold text-ink-900">
                  {claim.lang === 'zh'
                    ? getArchetype(claim.archetypeId)?.name_zh
                    : getArchetype(claim.archetypeId)?.name_en}
                </h3>
                <p className="mt-1 text-sm text-ink-500 italic">
                  “{claim.lang === 'zh'
                    ? getArchetype(claim.archetypeId)?.tagline_zh
                    : getArchetype(claim.archetypeId)?.tagline_en}”
                </p>
                {(() => {
                  const house = getHouse(claim.houseId);
                  return house ? (
                    <span
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white"
                      style={{ background: house.color }}
                    >
                      {house.emoji} {house.name}
                    </span>
                  ) : null;
                })()}
              </div>
              <div className="mt-6">
                <DnaBars dna={claim.dna} />
              </div>
            </div>

            {me ? (
              <div className="mt-6 rounded-2xl bg-paper-100 border border-ink-100 p-6">
                <Label>Display name</Label>
                <Input
                  value={name}
                  maxLength={30}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={me.display_name || 'What should partners call you?'}
                />
                <Button className="mt-4 w-full" size="lg" onClick={handleClaim}>
                  Claim my DNA 🧬
                </Button>
                <p className="mt-3 text-center text-[11px] text-ink-400">
                  This saves your archetype, house, and DNA bars to your profile.
                </p>
              </div>
            ) : (
              <div className="mt-6">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setSheetOpen(true)}
                >
                  Sign in to claim
                </Button>
                <p className="mt-3 text-center text-[11px] text-ink-400">
                  Sign in with an email code or a password — your call.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <AuthSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Sign in"
        initialTab="code"
      />
    </div>
  );
}
