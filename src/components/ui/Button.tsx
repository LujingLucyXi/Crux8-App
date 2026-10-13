import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'punch' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variantCls: Record<Variant, string> = {
  // Enamel-pin gold — the everyday primary CTA (gold rim + gloss).
  primary: 'enamel text-[#161310] font-semibold bg-[linear-gradient(160deg,#E8C766,#C9A24B)] hover:brightness-105',
  // Enamel bright gold — the top-conversion action.
  punch: 'enamel text-[#161310] font-extrabold bg-[linear-gradient(160deg,#F0D488,#D9B45F)] hover:brightness-[1.03]',
  outline: 'bg-paper-100 border border-ink-100 text-ink-900 hover:border-brand-400 hover:text-brand-600',
  ghost: 'bg-transparent text-ink-700 hover:bg-brand-100',
  destructive: 'bg-paper-100 border border-coral-500 text-coral-500 hover:bg-coral-100',
};

const sizeCls: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-medium select-none touch-manipulation transition active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/30',
          variantCls[variant],
          sizeCls[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
