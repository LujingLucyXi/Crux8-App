import * as React from 'react';
import { cn } from '@/lib/utils';
import { CartoonAvatar } from './CartoonAvatar';
import { avatarFromSeed, type AvatarConfig } from '@/lib/avatar';

interface AvatarProps {
  /** Uploaded photo. Wins over everything else. */
  photoUrl?: string;
  /** Explicit avatar config. Wins over `seed`. */
  config?: AvatarConfig;
  /** Any stable string (userId, name). Deterministically generates a config. */
  seed?: string;
  alt?: string;
  size?: number;
  fallback?: string;
  className?: string;
  /** Shiny gold ring — this climber has unlocked their DNA (finished
   *  the quiz). A deliberate curiosity hook (Lucy 2026-10-21): people
   *  see the ring on someone else and want to know how to get one. */
  ring?: boolean;
}

/**
 * Resolution order: uploaded photo → explicit config → deterministic
 * config derived from a seed string. No external avatar services.
 */
export function Avatar({ photoUrl, config, seed, alt, size = 32, fallback, className, ring }: AvatarProps) {
  const resolved = React.useMemo(
    () => config ?? avatarFromSeed(seed ?? fallback ?? alt ?? 'anon'),
    [config, seed, fallback, alt],
  );
  const inner = photoUrl ? (
    <img
      src={photoUrl}
      alt={alt ?? 'avatar'}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn('rounded-full object-cover shrink-0 bg-ink-100', !ring && className)}
    />
  ) : (
    <CartoonAvatar config={resolved} size={size} className={ring ? undefined : className} />
  );
  if (!ring) return inner;
  // Box-shadow ring: zero layout cost, so tight rows keep their sizing.
  return (
    <span
      title="Climber DNA unlocked"
      className={cn('avatar-dna-ring relative inline-flex shrink-0 rounded-full', className)}
      style={{ width: size, height: size }}
    >
      {inner}
    </span>
  );
}

interface AvatarStackProps {
  users: Array<{ id: string; avatar?: AvatarConfig; photo_url?: string; display_name: string }>;
  max?: number;
  size?: number;
}

export function AvatarStack({ users, max = 3, size = 24 }: AvatarStackProps) {
  const shown = users.slice(0, max);
  const overlap = Math.round(size / 3);
  return (
    <div className="flex" style={{ marginRight: overlap }}>
      {shown.map((u, i) => (
        <div
          key={u.id}
          style={{ marginLeft: i === 0 ? 0 : -overlap, zIndex: shown.length - i }}
          className={cn('ring-2 ring-white rounded-full')}
        >
          <Avatar photoUrl={u.photo_url} config={u.avatar} seed={u.id} alt={u.display_name} size={size} fallback={u.display_name} />
        </div>
      ))}
    </div>
  );
}
