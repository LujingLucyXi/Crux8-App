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
  const hasHeader = Boolean(title) || showClose;
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40 animate-fade-in" />
      <DialogPrimitive.Content
        className={cn(
          // svh (not vh, not dvh): the panel is bottom-anchored, so the cap must
          // NEVER exceed the actually visible viewport. vh uses the large
          // viewport and overruns shrunken in-app-browser chrome (sheet top
          // unreachable). dvh tracks the dynamic viewport, but in webviews /
          // in-app browsers it can resolve LARGER than the visible area —
          // then the panel overshoots downward, its bottom (Sign out, etc.)
          // sits below the fold, and because the content fits the oversized
          // panel, the inner scroller never engages: bottom items are cut off
          // with no way to scroll to them (bit the header Menu twice).
          // svh is the SMALLEST the viewport can be, so the cap can never
          // overshoot. Same support as dvh; where unsupported the declaration
          // drops and the panel sizes to content (also fully visible).
          // Header is a fixed flex row, only the body scrolls — so the close
          // button can never scroll away.
          'fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[92svh] max-w-[560px] flex-col overflow-hidden rounded-t-2xl bg-paper-100 border-t border-ink-100 animate-slide-up',
          className,
        )}
        {...props}
      >
        {hasHeader && (
          <div className="relative shrink-0 px-5 pt-5">
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
          </div>
        )}
        <DialogPrimitive.Description className="sr-only">Sheet content</DialogPrimitive.Description>
        <div
          className={cn(
            // flex-1 + min-h-0: without min-h-0 a flex child refuses to shrink
            // below its content height, so overflow-y-auto never engages and
            // tall content is CLIPPED by the container's overflow-hidden
            // instead of scrolling (bit the header Menu: Sign out unreachable).
            'flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]',
            hasHeader ? 'pt-4' : 'pt-5',
          )}
        >
          {children}
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
