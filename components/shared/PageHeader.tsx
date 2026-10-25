'use client';

import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

/** Page title in the display face, a one-line description, and a hairline rule. */
export function PageHeader({ title, description, actions, badge, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border-subtle pb-6',
        className
      )}
    >
      <div className="min-w-0 space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="truncate font-display text-[28px] leading-tight text-text-primary">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="max-w-2xl text-[15px] text-text-secondary">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
