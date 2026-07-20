import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white border border-ink-100 p-4',
        className,
      )}
      {...props}
    />
  );
}

export function Chip({
  className,
  active,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { active?: boolean }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
        active
          ? 'bg-ink-900 text-white border-ink-900'
          : 'bg-white text-ink-700 border-ink-100 hover:border-ink-300',
        className,
      )}
      {...props}
    />
  );
}
