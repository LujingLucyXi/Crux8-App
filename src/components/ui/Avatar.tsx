import * as React from 'react';
import { cn } from '@/lib/utils';
import { PunkAvatar } from './PunkAvatar';
import { avatarFromSeed, type AvatarConfig } from '@/lib/avatar';

interface AvatarProps {
  /** Explicit avatar config. Wins over `seed`. */
  config?: AvatarConfig;
  /** Any stable string (userId, name). Deterministically generates a config. */
  seed?: string;
  alt?: string;
  size?: number;
  fallback?: string;
  className?: string;
}

/**
 * All CruxMate avatars are generated punk-rock SVGs — no photo uploads,
 * no external services. Pass either an explicit `config` (the user's saved
 * customization) or a `seed` string to derive one deterministically.
 */
export function Avatar({ config, seed, alt, size = 32, fallback, className }: AvatarProps) {
  const resolved = React.useMemo(
    () => config ?? avatarFromSeed(seed ?? fallback ?? alt ?? 'anon'),
    [config, seed, fallback, alt],
  );
  return <PunkAvatar config={resolved} size={size} className={className} />;
}

interface AvatarStackProps {
  users: Array<{ id: string; avatar?: AvatarConfig; display_name: string }>;
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
          <Avatar config={u.avatar} seed={u.id} alt={u.display_name} size={size} fallback={u.display_name} />
        </div>
      ))}
    </div>
  );
}
