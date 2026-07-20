import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'iconoir-react';
import { cn } from '@/lib/utils';

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer h-5 w-5 shrink-0 rounded-md border border-ink-300 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/30 data-[state=checked]:bg-ink-900 data-[state=checked]:border-ink-900 flex items-center justify-center transition-colors',
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="text-white flex items-center justify-center">
      <Check width={14} height={14} strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = 'Checkbox';
