import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { CartoonAvatar, hairBucket, type HairBucket } from './CartoonAvatar';
import { Button } from './Button';
import { fileToAvatarDataUrl, dataUrlBytes } from '@/lib/image';
import {
  type AvatarConfig, type HairStyle, type Accessory,
  SKIN_TONES, SKIN_HEX,
  HAIR_COLORS, HAIR_HEX, HAIR_COLOR_LABEL,
  EYES_OPTS, EYES_LABEL,
  BACKDROPS, BACKDROP_HEX,
  avatarFromSeed, DEFAULT_AVATAR,
} from '@/lib/avatar';
import { cn } from '@/lib/utils';

// The cartoon renderer draws only these 6 hair silhouettes and 4 accessories —
// so we present exactly those, one representative value per bucket. This keeps
// every control visibly changing the avatar (no inert options).
const HAIR_OPTIONS: { value: HairStyle; label: string; bucket: HairBucket }[] = [
  { value: 'mohawk', label: 'Spikes', bucket: 'spikes' },
  { value: 'buzz', label: 'Buzz', bucket: 'buzz' },
  { value: 'bob', label: 'Bob', bucket: 'bob' },
  { value: 'topknot', label: 'Bun', bucket: 'bun' },
  { value: 'long', label: 'Long', bucket: 'long' },
  { value: 'bald', label: 'Bald', bucket: 'bald' },
];
const ACCESSORY_OPTIONS: { value: Accessory; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'nosering', label: 'Nose ring' },
  { value: 'bandana', label: 'Bandana' },
  { value: 'beanie', label: 'Beanie' },
];

interface Props {
  value: AvatarConfig;
  onChange: (next: AvatarConfig) => void;
  /** Uploaded photo, if any. Overrides the drawn avatar. */
  photoUrl?: string;
  onPhotoChange?: (dataUrl: string | undefined) => void;
}

/**
 * Punk-rock avatar builder. Live preview + 6 trait rows.
 * Used in Onboarding step 2 and the Profile edit sheet.
 */
export function AvatarCustomizer({ value: rawValue, onChange, photoUrl, onPhotoChange }: Props) {
  // Defensive: never render against an undefined config (old profiles lacked one).
  const value = rawValue ?? DEFAULT_AVATAR;
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const supportsPhoto = typeof onPhotoChange === 'function';

  const handleFile = async (file?: File) => {
    if (!file || !onPhotoChange) return;
    setBusy(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      onPhotoChange(dataUrl);
      toast('Photo added', { description: `Stored at ~${Math.round(dataUrlBytes(dataUrl) / 1024)} KB` });
    } catch (err) {
      const code = err instanceof Error ? err.message : 'decode-failed';
      toast('Could not use that image', {
        description:
          code === 'not-an-image' ? 'Pick a JPG, PNG, or WebP.'
          : code === 'too-large' ? 'That file is over 12 MB.'
          : "We couldn't read that file.",
      });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const set = <K extends keyof AvatarConfig>(k: K, v: AvatarConfig[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div>
      {/* Live preview + randomize */}
      <div className="flex flex-col items-center gap-3 mb-6">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt="Your photo"
            className="w-32 h-32 rounded-full object-cover ring-4 ring-white bg-ink-100"
          />
        ) : (
          <CartoonAvatar config={value} size={128} className="ring-4 ring-white rounded-full" />
        )}

        {supportsPhoto && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
                {busy ? 'Processing…' : photoUrl ? '🔄 Replace photo' : '📷 Upload photo'}
              </Button>
              {photoUrl && (
                <Button variant="outline" size="sm" onClick={() => onPhotoChange?.(undefined)}>
                  Use drawn avatar
                </Button>
              )}
            </div>
            <p className="text-[11px] text-ink-300 text-center max-w-[260px]">
              Photos are cropped square and downscaled to 256px, then stored on this device only.
            </p>
          </>
        )}

        {!photoUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange(avatarFromSeed(Math.random().toString(36)))}
          >
            🎲 Randomize
          </Button>
        )}
      </div>

      <div className={cn("space-y-5", photoUrl && "opacity-40 pointer-events-none")}>
        {/* Skin */}
        <Row label="Skin">
          {SKIN_TONES.map((t) => (
            <Swatch
              key={t}
              color={SKIN_HEX[t]}
              active={value.skin === t}
              onClick={() => set('skin', t)}
              title={t}
            />
          ))}
        </Row>

        {/* Hair style — grouped by the 6 silhouettes the cartoon actually draws */}
        <Row label="Hair">
          {HAIR_OPTIONS.map((h) => (
            <Pill key={h.value} active={hairBucket(value.hair) === h.bucket} onClick={() => set('hair', h.value)}>
              {h.label}
            </Pill>
          ))}
        </Row>

        {/* Hair color */}
        <Row label="Hair color">
          {HAIR_COLORS.map((c) => (
            <Swatch
              key={c}
              color={HAIR_HEX[c]}
              active={value.hairColor === c}
              onClick={() => set('hairColor', c)}
              title={HAIR_COLOR_LABEL[c]}
            />
          ))}
        </Row>

        {/* Eyes */}
        <Row label="Face">
          {EYES_OPTS.map((e) => (
            <Pill key={e} active={value.eyes === e} onClick={() => set('eyes', e)}>
              {EYES_LABEL[e]}
            </Pill>
          ))}
        </Row>

        {/* Accessory — only the ones the cartoon renders */}
        <Row label="Accessory">
          {ACCESSORY_OPTIONS.map((a) => (
            <Pill key={a.value} active={value.accessory === a.value} onClick={() => set('accessory', a.value)}>
              {a.label}
            </Pill>
          ))}
        </Row>

        {/* Backdrop */}
        <Row label="Backdrop">
          {BACKDROPS.map((b) => (
            <Swatch
              key={b}
              color={BACKDROP_HEX[b]}
              active={value.backdrop === b}
              onClick={() => set('backdrop', b)}
              title={b}
            />
          ))}
        </Row>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-ink-500 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Swatch({
  color, active, onClick, title,
}: { color: string; active: boolean; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        'w-9 h-9 rounded-full border-2 transition-transform',
        active ? 'border-ink-900 scale-110' : 'border-ink-100 hover:scale-105',
      )}
      style={{ background: color }}
    />
  );
}

function Pill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-700 border-ink-100 hover:border-ink-300',
      )}
    >
      {children}
    </button>
  );
}
