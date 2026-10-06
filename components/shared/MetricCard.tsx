import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type MetricCardVariant = 'default' | 'success' | 'warning' | 'danger';
type TrendDirection = 'up' | 'down' | 'neutral';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    direction: TrendDirection;
    value: string;
    label?: string;
  };
  subtitle?: string;
  variant?: MetricCardVariant;
  sparkline?: React.ReactNode;
  className?: string;
  /** Overrides the value text style, e.g. a smaller font for long strings. */
  valueClassName?: string;
  /** Tooltip for the value, e.g. the full text behind a truncated one. */
  valueTitle?: string;
}

const variantStyles: Record<MetricCardVariant, string> = {
  default: 'border-border-subtle',
  success: 'border-l-2 border-l-status-ok border-t-border-subtle border-r-border-subtle border-b-border-subtle bg-status-ok/5',
  warning: 'border-l-2 border-l-status-warn border-t-border-subtle border-r-border-subtle border-b-border-subtle bg-status-warn/5',
  danger: 'border-l-2 border-l-status-danger border-t-border-subtle border-r-border-subtle border-b-border-subtle bg-status-danger/5',
};

const trendColors: Record<TrendDirection, string> = {
  up: 'text-status-ok',
  down: 'text-status-danger',
  neutral: 'text-text-muted',
};

const TrendIcon = ({ direction }: { direction: TrendDirection }) => {
  if (direction === 'up') return <TrendingUp className="h-3 w-3" />;
  if (direction === 'down') return <TrendingDown className="h-3 w-3" />;
  return <Minus className="h-3 w-3" />;
};

export function MetricCard({
  label,
  value,
  icon,
  trend,
  subtitle,
  variant = 'default',
  sparkline,
  className,
  valueClassName,
  valueTitle,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-bg-surface p-5 min-h-[120px] flex flex-col justify-between',
        variantStyles[variant],
        className
      )}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <span className="text-text-muted">{icon}</span>}
            <span className="text-xs font-body text-text-muted uppercase tracking-wider">
              {label}
            </span>
          </div>
          {trend && (
            <div className={cn('flex items-center gap-1 text-xs', trendColors[trend.direction])}>
              <TrendIcon direction={trend.direction} />
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "text-[28px] font-display font-bold text-text-primary leading-none",
            valueClassName
          )}
          title={valueTitle}
        >
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-text-muted">{subtitle}</p>
        )}
      </div>
      {sparkline && <div className="mt-3 h-12">{sparkline}</div>}
    </div>
  );
}
