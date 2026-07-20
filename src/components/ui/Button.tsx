import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variantCls: Record<Variant, string> = {
  primary: 'bg-ink-900 text-white hover:bg-ink-700 active:bg-ink-900',
  outline: 'bg-white border border-ink-100 text-ink-900 hover:bg-paper-50',
  ghost: 'bg-transparent text-ink-700 hover:bg-paper-50',
  destructive: 'bg-white border border-coral-500 text-coral-500 hover:bg-coral-100',
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
          'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/30',
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
