import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck, EyeClosed } from 'iconoir-react';
import { Textarea, Input, Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { AvatarCustomizer } from '@/components/ui/AvatarCustomizer';
import { DEFAULT_AVATAR } from '@/lib/avatar';
import { OGBadge } from '@/components/OGBadge';
import { CertVerificationSheet } from '@/components/sheets/CertVerificationSheet';
import { ProfileEditSheet } from '@/components/sheets/ProfileEditSheet';
import { profileCompleteness } from '@/lib/profileCompleteness';
import { ArchetypeEmblem } from '@/components/ArchetypeEmblem';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { useAppStore, type BadgeId } from '@/store/useAppStore';
import { InviteSection } from '@/components/InviteSection';
import { PeopleFinder } from '@/components/PeopleFinder';
import { normalizeInviteCode } from '@/lib/inviteCode';
import type { VerificationCategory } from '@/seed/types';
import { cn } from '@/lib/utils';
import { kgToLbs, lbsToKg, ftInToCm } from '@/lib/weight';
import { levelFromXp } from '@/lib/rewards';
import { DnaBanner } from '@/components/DnaBanner';
import { DnaDetailSheet } from '@/components/sheets/DnaDetailSheet';

const BADGE_META: Record<BadgeId, { label: string; emoji: string; grad: string }> = {
  first_session: { label: 'First Session', emoji: '🧗', grad: 'linear-gradient(135deg,#C9A24B,#E8C766)' },
  first_recap: { label: 'First Recap', emoji: '📓', grad: 'linear-gradient(135deg,#948F82,#C9A24B)' },
  verified_belayer: { label: 'Verified Belayer', emoji: '🛡️', grad: 'linear-gradient(135deg,#0EA5A5,#38BDF8)' },
  adventurer: { label: 'Adventurer', emoji: '🏔️', grad: 'linear-gradient(135deg,#F4B942,#FF5A5F)' },
  community: { label: 'Community', emoji: '🤝', grad: 'linear-gradient(135deg,#E8C766,#C49A6C)' },
  cruxmate_x5: { label: 'CruxMate ×5', emoji: '⚡', grad: 'linear-gradient(135deg,#C6F135,#0EA5A5)' },
  trust_champion: { label: 'Trust Champion', emoji: '🏆', grad: 'linear-gradient(135deg,#FFB020,#C9A24B)' },
};

const BADGE_ORDER: BadgeId[] = [
  'first_session',
  'first_recap',
  'verified_belayer',
  'adventurer',
  'community',
  'cruxmate_x5',
  'trust_champion',
];

const CATEGORY_LABEL: Record<VerificationCategory, string> = {
  top_rope: 'Top Rope',
  lead: 'Lead',
  trad: 'Trad',
};

export function Profile() {
  const nav = useNavigate();
  const me = useAppStore((s) => s.me);
  const gyms = useAppStore((s) => s.gyms);
  const verifications = useAppStore((s) => s.verifications);
  const myConfirmCounts = useAppStore((s) => s.myConfirmCounts);
  const badges = useAppStore((s) => s.badges);
  const xp = useAppStore((s) => s.xp);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const ensureInviteCode = useAppStore((s) => s.ensureInviteCode);

  // Personal invite code — generated once, persisted on the profile.
  useEffect(() => {
    ensureInviteCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [certOpen, setCertOpen] = useState(false);
  const [certPreset, setCertPreset] = useState<VerificationCategory | undefined>(undefined);
  const [about, setAbout] = useState(me?.about ?? '');
  const [editingAbout, setEditingAbout] = useState(false);
  const [hwOpen, setHwOpen] = useState(false);
  const [dnaOpen, setDnaOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [draftAvatar, setDraftAvatar] = useState(me?.avatar ?? DEFAULT_AVATAR);
  const [draftPhoto, setDraftPhoto] = useState<string | undefined>(me?.photo_url);
  const [weightLbs, setWeightLbs] = useState(me?.weight_kg ? String(kgToLbs(me.weight_kg)) : '');
  const [heightFt, setHeightFt] = useState(me?.height_cm ? String(Math.floor(me.height_cm / 2.54 / 12)) : '');
  const [heightIn, setHeightIn] = useState(
    me?.height_cm ? String(Math.round(me.height_cm / 2.54 - Math.floor(me.height_cm / 2.54 / 12) * 12)) : '',
  );

  if (!me) return null;

  const gym = gyms.find((g) => g.id === me.home_gym_id);
  const level = levelFromXp(xp);
  const openCert = (cat: VerificationCategory) => {
    setCertPreset(cat);
    setCertOpen(true);
  };

  return (
    <div className="pb-4">
      {/* Header card */}
      <div className="rounded-2xl bg-paper-100 border border-ink-100 p-5">
        <div className="flex items-start gap-4">
          <button
            onClick={() => {
              setDraftAvatar(me.avatar ?? DEFAULT_AVATAR);
              setDraftPhoto(me.photo_url);
              setAvatarOpen(true);
            }}
            className="relative shrink-0 group"
            aria-label="Edit avatar"
          >
            <Avatar photoUrl={me.photo_url} config={me.avatar} alt={me.display_name} size={80} fallback={me.display_name} ring={!!me.quiz_result_type} />
            <span className="absolute -bottom-1 -right-1 rounded-full bg-brand-600 text-[#161310] text-[9px] font-semibold px-2 py-0.5 border-2 border-white">
              Edit
            </span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-ink-900">{me.display_name}</h1>
            {typeof me.founding_no === 'number' && (
              <span className="mt-1.5 flex items-center gap-2">
                <OGBadge size={40} variant="neon" />
                <span className="leading-tight">
                  <span className="block text-xs font-extrabold tracking-wide text-ink-900">
                    OG · Founding member
                  </span>
                  <span className="block text-[11px] font-medium text-ink-500">
                    #{me.founding_no} of the first 88
                  </span>
                </span>
              </span>
            )}
            {me.pronouns && <p className="text-sm text-ink-500">{me.pronouns}</p>}
            {me.signature && <p className="mt-0.5 text-sm text-ink-700 italic">“{me.signature}”</p>}
            {me.location && <p className="text-xs text-ink-500">📍 {me.location}</p>}
            {me.tags && me.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {me.tags.map((t) => (
                  <span key={t} className="rounded-full bg-brand-100 text-brand-600 text-[10px] font-semibold px-2 py-0.5">
                    {t}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {gym && (
                <span className="rounded-full border border-teal-600 text-teal-600 text-[11px] font-medium px-2.5 py-0.5">
                  {gym.short_name}
                </span>
              )}
              <span className="rounded-full border border-gold-500 text-gold-500 text-[11px] font-medium px-2.5 py-0.5">
                Top: {me.top_grade}
              </span>
              {me.boulder_grade && (
                <span className="rounded-full border border-gold-500 text-gold-500 text-[11px] font-medium px-2.5 py-0.5">
                  Boulder: {me.boulder_grade}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {(['top_rope', 'lead', 'trad'] as VerificationCategory[]).map((cat) => {
            const v = verifications[cat];
            const isVerified = v.status === 'verified';           // peer-confirmed
            const isSelf = v.status === 'self_attested';           // self-reported
            return (
              <button
                key={cat}
                onClick={() => openCert(cat)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full text-xs font-semibold px-3 py-1.5 transition-colors',
                  isVerified
                    ? 'bg-teal-600 text-white'
                    : isSelf
                    ? 'bg-brand-100 text-brand-600 border border-brand-400'
                    : 'border border-ink-300 text-ink-300 hover:border-ink-500 hover:text-ink-700',
                )}
              >
                {isVerified ? <ShieldCheck width={12} height={12} /> : isSelf ? '•' : '○'}
                <span>
                  {CATEGORY_LABEL[cat]} Belay
                  {isVerified ? ' · peer-confirmed' : isSelf ? ' · self-reported' : ''}
                </span>
              </button>
            );
          })}
        </div>

        {/* Peer-confirm progress toward / from the badge */}
        <div className="mt-2.5 space-y-1">
          {(['top_rope', 'lead', 'trad'] as VerificationCategory[]).map((cat) => {
            const v = verifications[cat];
            const n = myConfirmCounts[cat] ?? 0;
            if (v.status === 'verified') {
              return (
                <p key={cat} className="text-[11px] font-medium text-teal-600">
                  🛡 {CATEGORY_LABEL[cat]}: peer-confirmed
                  {n > 0 ? ` by ${n} cruxmate${n === 1 ? '' : 's'}` : ''}
                </p>
              );
            }
            if (v.status === 'self_attested') {
              return (
                <p key={cat} className="text-[11px] text-ink-500">
                  {CATEGORY_LABEL[cat]}: {n} of 2 cruxmate confirms toward peer-confirmed
                </p>
              );
            }
            return null;
          })}
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setProfileEditOpen(true)}>
            Edit profile
          </Button>
          {/* Body stats editing lives with the other editing now
              (declutter 2026-10-16) — its mid-page section is gone;
              the sheet itself still carries the weight-safe explainer. */}
          <Button variant="outline" className="flex-1" onClick={() => setHwOpen(true)}>
            Body stats · hidden
          </Button>
        </div>
      </div>

      {/* Profile completeness (Lucy 2026-10-16): orientation is
          deliberately short now — this meter is how the deferred
          details (grades, belay, bio, photo…) get filled in over
          time. Hidden at 100%. */}
      {(() => {
        const completeness = profileCompleteness(me, {
          belayAttested: (['top_rope', 'lead', 'trad'] as VerificationCategory[]).some(
            (c) => verifications[c].status === 'self_attested' || verifications[c].status === 'verified',
          ),
        });
        if (completeness.pct >= 100 || completeness.missing.length === 0) return null;
        return (
          <div className="mt-4 rounded-2xl bg-paper-100 border border-ink-100 p-5">
            <div className="flex items-baseline justify-between">
              <p className="font-semibold text-ink-900">
                Your profile is {completeness.pct}% complete
              </p>
              <span className="text-xs text-ink-500">
                {completeness.missing.length} to go
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-brand-gradient transition-all"
                style={{ width: `${completeness.pct}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-ink-500">
              Next up: {completeness.missing[0].label.charAt(0).toLowerCase() + completeness.missing[0].label.slice(1)}.
              Complete profiles get matched with better partners.
            </p>
            <Button variant="outline" className="mt-3 w-full" onClick={() => setProfileEditOpen(true)}>
              Complete your profile
            </Button>
          </div>
        );
      })()}

      {/* ── Climber DNA (from the quiz) ──
          Identity banner (Lucy 2026-10-20): the same golden strip
          other climbers see on my profile sheet — tap opens the full
          card. Without a result the face-down banner IS the nudge:
          tapping goes straight to the test. DNA axes stay below as
          the detail layer. */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
          Climber DNA 🧬
        </h2>
        {me.quiz_result_type ? (
          <>
            <DnaBanner archetypeId={me.quiz_result_type} onClick={() => setDnaOpen(true)} />
            <DnaDetailSheet
              archetypeId={me.quiz_result_type}
              displayName={me.display_name}
              isMe
              open={dnaOpen}
              onOpenChange={setDnaOpen}
            />
            {me.quiz_dna && (
              <div className="mt-3 rounded-2xl bg-paper-100 border border-ink-100 p-5">
                <div className="space-y-2.5">
                  {me.quiz_dna.map((axis) => (
                    <div key={axis.key}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-ink-700">
                          {axis.emoji} {axis.label}
                        </span>
                        <span className="text-ink-400 font-medium">{axis.value}%</span>
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
              </div>
            )}
          </>
        ) : (
          <DnaBanner
            archetypeId={null}
            onClick={() =>
              window.open(
                `https://play.crux8.app?name=${encodeURIComponent(me.display_name)}`,
                '_blank',
              )
            }
          />
        )}
      </section>

      {/* ── Friends: my invite card + the finder, ONE block (merged
          2026-10-15 — the separate "My invite" and "Add friends" blocks
          repeated headers and the same invite CTA twice on one screen).
          The finder runs embedded here: its own Cruxmates / Add
          cruxmate sections, no second invite button (the card above
          carries it). ── */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
          Friends
        </h2>
        {me.invite_code ? (
          <div className="mb-3">
            <InviteSection code={normalizeInviteCode(me.invite_code)} displayName={me.display_name} />
          </div>
        ) : null}
        <PeopleFinder hideInviteButton />
      </section>

      {/* About / Story */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">About / Story</h2>
        {editingAbout ? (
          <div className="rounded-2xl bg-paper-100 border border-ink-100 p-4">
            <Textarea
              value={about}
              onChange={(e) => setAbout(e.target.value.slice(0, 500))}
              rows={4}
              placeholder="Share your climbing story — how you started, what you love, what you're projecting."
            />
            <p className="text-[10px] text-ink-300 mt-1 text-right">{about.length} / 500</p>
            <div className="mt-2 flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAbout(me.about ?? '');
                  setEditingAbout(false);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  updateProfile({ about });
                  setEditingAbout(false);
                  toast('Profile saved');
                }}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditingAbout(true)}
            className="w-full text-left rounded-2xl bg-paper-100 border border-ink-100 p-4 hover:border-ink-300"
          >
            {me.about ? (
              <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{me.about}</p>
            ) : (
              <p className="text-sm text-ink-300 italic">
                Share your climbing story — tap to add.
              </p>
            )}
          </button>
        )}
      </section>

      {/* Badges — with the tier/XP progress folded in as one slim
          row (declutter 2026-10-16: the giant gradient Level slab is
          gone from Profile; Home's header already carries the tier
          pill, and logging a send lives on Home too). */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Badges</h2>
        <div className="mb-3 flex items-center gap-3 rounded-2xl bg-paper-100 border border-ink-100 px-4 py-3">
          <span className="text-2xl shrink-0">{level.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink-900 leading-tight">
              Tier {level.level} · {level.title}
            </p>
            <div className="mt-1.5 h-1.5 rounded-full bg-ink-100 overflow-hidden">
              <div className="h-full rounded-full bg-lime-400" style={{ width: `${level.pct}%` }} />
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-base font-black leading-none text-ink-900">{xp}</p>
            <p className="text-[10px] font-semibold text-ink-400">XP</p>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
          {BADGE_ORDER.map((id) => {
            const earned = badges.includes(id);
            const meta = BADGE_META[id];
            return (
              <div key={id} className="flex flex-col items-center gap-1 shrink-0 w-20 text-center">
                <div
                  className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition',
                    earned ? 'shadow-brand' : 'bg-paper-50 border border-ink-100 grayscale opacity-45',
                  )}
                  style={earned ? { backgroundImage: meta.grad } : undefined}
                >
                  {meta.emoji}
                </div>
                <p
                  className={cn(
                    'text-[10px] font-semibold leading-tight',
                    earned ? 'text-ink-900' : 'text-ink-300',
                  )}
                >
                  {meta.label}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Avatar customizer sheet */}
      <Sheet open={avatarOpen} onOpenChange={setAvatarOpen}>
        <SheetContent title="Your climber">
          <AvatarCustomizer
            value={draftAvatar}
            onChange={setDraftAvatar}
            photoUrl={draftPhoto}
            onPhotoChange={(url) => {
              setDraftPhoto(url);
              // Photos apply the moment they're picked (2026-10-16 bug:
              // a photo living only in this sheet's draft vanished if
              // the sheet closed without Save). Write through now —
              // Save/Cancel below govern the drawn-avatar traits.
              // Removal passes an explicit null so the server column
              // clears too; undefined would be skipped by the row
              // mapper and the launch rebuild would resurrect it.
              if (url) updateProfile({ photo_url: url });
              else updateProfile({ photo_url: null as unknown as string });
            }}
          />
          <div className="flex gap-2 pt-6">
            <Button variant="outline" className="flex-1" onClick={() => setAvatarOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                updateProfile({ avatar: draftAvatar, photo_url: draftPhoto });
                toast('Look updated');
                setAvatarOpen(false);
              }}
            >
              Save
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Height + weight edit sheet */}
      <Sheet open={hwOpen} onOpenChange={setHwOpen}>
        <SheetContent title="Body stats">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 text-teal-600 text-[10px] font-semibold px-2 py-0.5 mb-3">
            <EyeClosed width={11} height={11} />
            HIDDEN FROM OTHERS
          </div>
          <p className="text-sm text-ink-500 mb-4">
            Used only to compute the <b>weight-safe</b> chip on belay pairings. Never shown to other users.
          </p>
          <div className="space-y-4">
            <div>
              <Label>Weight (lbs)</Label>
              <Input
                type="number"
                min={60}
                max={400}
                value={weightLbs}
                onChange={(e) => setWeightLbs(e.target.value)}
                placeholder="e.g. 145"
              />
            </div>
            <div>
              <Label>Height</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  min={3}
                  max={8}
                  value={heightFt}
                  onChange={(e) => setHeightFt(e.target.value)}
                  placeholder="ft"
                />
                <Input
                  type="number"
                  min={0}
                  max={11}
                  value={heightIn}
                  onChange={(e) => setHeightIn(e.target.value)}
                  placeholder="in"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setHwOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  const wKg = weightLbs ? lbsToKg(Number(weightLbs)) : undefined;
                  const hCm =
                    heightFt || heightIn
                      ? ftInToCm(Number(heightFt || 0), Number(heightIn || 0))
                      : undefined;
                  updateProfile({ weight_kg: wKg, height_cm: hCm });
                  toast('Body stats saved · hidden from others');
                  setHwOpen(false);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <CertVerificationSheet
        open={certOpen}
        onOpenChange={(o) => {
          setCertOpen(o);
          if (!o) setCertPreset(undefined);
        }}
        presetCategory={certPreset}
      />


      <ProfileEditSheet open={profileEditOpen} onOpenChange={setProfileEditOpen} />
    </div>
  );
}


