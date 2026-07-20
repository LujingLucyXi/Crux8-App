import * as React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: number;
  fallback?: string;
  className?: string;
}

export function Avatar({ src, alt, size = 32, fallback, className }: AvatarProps) {
  const [errored, setErrored] = React.useState(false);
  const initials = (fallback ?? alt ?? '?')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const style: React.CSSProperties = { width: size, height: size };

  if (!src || errored) {
    return (
      <div
        style={style}
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-ink-100 text-ink-700 font-semibold text-xs',
          className,
        )}
      >
        {initials}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt ?? 'avatar'}
      style={style}
      onError={() => setErrored(true)}
      className={cn('rounded-full object-cover bg-ink-100', className)}
    />
  );
}

interface AvatarStackProps {
  users: Array<{ id: string; avatar_url?: string; display_name: string }>;
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
          className="ring-2 ring-white rounded-full"
        >
          <Avatar src={u.avatar_url} alt={u.display_name} size={size} fallback={u.display_name} />
        </div>
      ))}
    </div>
  );
}
