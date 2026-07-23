import { NavArrowRight } from 'iconoir-react';
import { cn } from '@/lib/utils';

interface SectionProps {
  title: string;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
  className?: string;
}

/** Section header + full-bleed horizontal scroller. */
export function CarouselSection({ title, action, children, className }: SectionProps) {
  return (
    <section className={cn('mt-7', className)}>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500">{title}</h2>
        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-teal-600 hover:text-teal-500"
          >
            {action.label}
            <NavArrowRight width={12} height={12} />
          </button>
        )}
      </div>
      {/* full-bleed: negative margin cancels the page's px-4 so cards can
          bleed to the screen edge, which reads as "scrollable" */}
      <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 w-max pr-4">{children}</div>
      </div>
    </section>
  );
}

/** Non-scrolling section (for stacked content). */
export function StackSection({ title, action, children, className }: SectionProps) {
  return (
    <section className={cn('mt-7', className)}>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500">{title}</h2>
        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-teal-600 hover:text-teal-500"
          >
            {action.label}
            <NavArrowRight width={12} height={12} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
