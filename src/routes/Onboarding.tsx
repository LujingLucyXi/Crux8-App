import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { CertVerificationSheet } from '@/components/sheets/CertVerificationSheet';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import type { Style } from '@/seed/types';

const GRADE_BANDS = [
  { value: 'V0-5.7', label: 'V0 / 5.7' },
  { value: '5.8-5.9', label: 'V1-2 / 5.8-9' },
  { value: '5.10a-5.10c', label: 'V3-4 / 5.10a-c' },
  { value: '5.10d-5.11b', label: 'V5-6 / 5.10d-5.11b' },
  { value: '5.11c-5.12b', label: 'V7-8 / 5.11c-5.12b' },
  { value: '5.12c+', label: 'V9+ / 5.12c+' },
];

const STYLES: { value: Style; label: string }[] = [
  { value: 'top_rope', label: 'Top Rope' },
  { value: 'lead', label: 'Lead' },
  { value: 'boulder', label: 'Boulder' },
  { value: 'outdoor_sport', label: 'Outdoor Sport' },
  { value: 'trad', label: 'Trad' },
  { value: 'events', label: 'Events' },
];

export function Onboarding() {
  const nav = useNavigate();
  const me = useAppStore((s) => s.me);
  const gyms = useAppStore((s) => s.gyms);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [dob, setDob] = useState('');
  const [avatarSeed, setAvatarSeed] = useState<number>(4);
  const [homeGymId, setHomeGymId] = useState<string>(gyms[0]?.id ?? '');
  const [topGrade, setTopGrade] = useState<string>('5.10a-5.10c');
  const [preferredStyles, setPreferredStyles] = useState<Style[]>(['top_rope', 'lead']);
  const [certOpen, setCertOpen] = useState(false);

  if (!me) {
    // no profile → redirect
    nav('/');
    return null;
  }

  const finish = () => {
    completeOnboarding({
      dob: dob || undefined,
      avatar_url: `https://i.pravatar.cc/128?img=${avatarSeed}`,
      home_gym_id: homeGymId,
      top_grade: topGrade,
      preferred_styles: preferredStyles,
    });
    toast('Welcome to CruxMate!');
    nav('/find');
  };

  const toggleStyle = (s: Style) => {
    setPreferredStyles((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="mx-auto max-w-[560px] px-6 py-10">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                n <= step ? 'bg-ink-900' : 'bg-ink-100',
              )}
            />
          ))}
        </div>

        {step === 1 && (
          <>
            <h2 className="text-2xl font-semibold text-ink-900">Nice to meet you.</h2>
            <p className="mt-2 text-sm text-ink-500">A couple basics to get started.</p>
            <div className="mt-6 space-y-4">
              <div>
                <Label>Display name</Label>
                <Input value={me.display_name} disabled />
              </div>
              <div>
                <Label>Date of birth (optional)</Label>
                <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                <p className="mt-1 text-[11px] text-ink-500">Used for age-gated events (e.g. 18+ trips).</p>
              </div>
            </div>
            <Button className="w-full mt-8" onClick={() => setStep(2)}>
              Next
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-2xl font-semibold text-ink-900">Pick a profile photo.</h2>
            <p className="mt-2 text-sm text-ink-500">
              You can upload a real photo later. For now, choose an avatar.
            </p>
            <div className="mt-6 grid grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((seed) => (
                <button
                  key={seed}
                  onClick={() => setAvatarSeed(seed)}
                  className={cn(
                    'aspect-square rounded-full ring-4 transition-all',
                    avatarSeed === seed ? 'ring-ink-900' : 'ring-transparent',
                  )}
                >
                  <Avatar src={`https://i.pravatar.cc/128?img=${seed}`} size={80} alt={`Avatar ${seed}`} className="w-full h-full" />
                </button>
              ))}
            </div>
            <div className="mt-8 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="flex-1" onClick={() => setStep(3)}>
                Next
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-2xl font-semibold text-ink-900">Your climbing shape.</h2>
            <p className="mt-2 text-sm text-ink-500">We'll use this to match you with the right sessions.</p>
            <div className="mt-6 space-y-5">
              <div>
                <Label>Home gym</Label>
                <select
                  value={homeGymId}
                  onChange={(e) => setHomeGymId(e.target.value)}
                  className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900"
                >
                  {gyms.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Top grade band</Label>
                <div className="grid grid-cols-2 gap-2">
                  {GRADE_BANDS.map((band) => (
                    <button
                      key={band.value}
                      onClick={() => setTopGrade(band.value)}
                      className={cn(
                        'rounded-xl border py-2.5 text-sm text-center',
                        topGrade === band.value
                          ? 'bg-ink-900 text-white border-ink-900'
                          : 'bg-white text-ink-700 border-ink-100',
                      )}
                    >
                      {band.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Preferred styles</Label>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => toggleStyle(s.value)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium',
                        preferredStyles.includes(s.value)
                          ? 'bg-ink-900 text-white border-ink-900'
                          : 'bg-white text-ink-700 border-ink-100',
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-8 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button className="flex-1" onClick={() => setStep(4)}>
                Next
              </Button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-2xl font-semibold text-ink-900">Belay verification.</h2>
            <p className="mt-2 text-sm text-ink-500">
              Verified belayers can RSVP to rope sessions marked "verified only." You can skip and do it later.
            </p>
            <div className="mt-6 rounded-2xl bg-white border border-ink-100 p-5">
              <p className="text-sm text-ink-700">
                Upload a photo of your Top Rope, Lead, or Trad certification. We approve within 24 hours (auto-approve after 5 seconds in this demo).
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-2">
              <Button onClick={() => setCertOpen(true)}>Start verification</Button>
              <Button variant="outline" onClick={finish}>
                Skip for now
              </Button>
            </div>
          </>
        )}
      </div>

      <CertVerificationSheet
        open={certOpen}
        onOpenChange={(o) => {
          setCertOpen(o);
          if (!o) finish();
        }}
      />
    </div>
  );
}
