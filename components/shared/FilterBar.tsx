'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';

interface FilterBarProps {
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  /** Current search value (controlled) */
  searchValue?: string;
  /** Called when search value changes (debounced) */
  onSearchChange?: (value: string) => void;
  /** Filter chips rendered in the center */
  filters?: React.ReactNode;
  /** Action buttons rendered on the right (export, save, live tail, etc.) */
  actions?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  searchPlaceholder = 'Search...',
  searchValue: controlledValue,
  onSearchChange,
  filters,
  actions,
  className,
}: FilterBarProps) {
  const [internalValue, setInternalValue] = useState(controlledValue ?? '');
  const value = controlledValue ?? internalValue;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (controlledValue === undefined) setInternalValue(val);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onSearchChange?.(val);
      }, 300);
    },
    [controlledValue, onSearchChange]
  );

  const handleClear = useCallback(() => {
    if (controlledValue === undefined) setInternalValue('');
    if (timerRef.current) clearTimeout(timerRef.current);
    onSearchChange?.('');
  }, [controlledValue, onSearchChange]);

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 bg-bg-base border-b border-border-faint sticky top-0 z-10 flex-wrap',
        className
      )}
    >
      {/* Search input */}
      <div className="relative flex-shrink-0 min-w-[200px] max-w-sm flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={searchPlaceholder}
          className="w-full h-9 pl-9 pr-8 rounded-md bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gs-900/50 focus:ring-1 focus:ring-gs-900/10 transition-colors"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter chips */}
      {filters && (
        <div className="flex items-center gap-2 flex-wrap">{filters}</div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action buttons */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}

/** A single filter chip button for use inside FilterBar's `filters` prop */
interface FilterChipProps {
  label: string;
  active?: boolean;
  count?: number;
  onClick?: () => void;
  className?: string;
}

export function FilterChip({ label, active, count, onClick, className }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
        active
          ? 'bg-signal/10 text-signal border border-signal/30'
          : 'bg-bg-surface text-text-secondary border border-border-subtle hover:border-border-accent hover:text-text-primary',
        className
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={cn('text-[10px] px-1 rounded-full', active ? 'bg-signal/20' : 'bg-bg-elevated')}>
          {count}
        </span>
      )}
    </button>
  );
}
