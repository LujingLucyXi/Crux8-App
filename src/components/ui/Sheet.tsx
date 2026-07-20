import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Xmark } from 'iconoir-react';
import { cn } from '@/lib/utils';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export function SheetContent({
  className,
  children,
  title,
  showClose = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { title?: string; showClose?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40 animate-fade-in" />
      <DialogPrimitive.Content
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-2xl bg-white border-t border-ink-100 p-5 animate-slide-up',
          'mx-auto max-w-[560px]',
          className,
        )}
        {...props}
      >
        {title && (
          <DialogPrimitive.Title className="text-lg font-semibold text-ink-900 pr-8">
            {title}
          </DialogPrimitive.Title>
        )}
        {showClose && (
          <DialogPrimitive.Close asChild>
            <button
              className="absolute right-4 top-4 rounded-full p-1.5 text-ink-500 hover:bg-paper-50"
              aria-label="Close"
            >
              <Xmark width={20} height={20} />
            </button>
          </DialogPrimitive.Close>
        )}
        <DialogPrimitive.Description className="sr-only">Sheet content</DialogPrimitive.Description>
        <div className={cn(title && 'mt-4')}>{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
