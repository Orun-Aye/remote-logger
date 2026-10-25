"use client";

import { useMemo, useState, useCallback } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  Sector,
} from "recharts";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DistributionDataPoint {
  name: string;
  value: number;
  color?: string;
}

interface DistributionChartProps {
  data: DistributionDataPoint[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Default chart palette (8 colors from Observatory CSS custom properties)
// The first 5 mirror --chart-1..5; the remaining 3 extend the palette.
// ---------------------------------------------------------------------------

const DEFAULT_PALETTE = [
  "var(--chart-1)", // #00d97e  signal green
  "var(--chart-2)", // #4d8ef8  data blue
  "var(--chart-3)", // #f59e0b  amber
  "var(--chart-4)", // #ef4444  red
  "var(--chart-5)", // #6fa3ff  light blue
  "#a78bfa",        // violet
  "#f472b6",        // pink
  "#34d399",        // emerald
];

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: DistributionDataPoint & { fill?: string; color?: string };
  }>;
  formatValue?: (value: number) => string;
}

function CustomTooltip({ active, payload, formatValue }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const color = entry.payload.fill || entry.payload.color;

  // Calculate total and percentage
  const total = payload.reduce((sum, p) => sum + p.value, 0);
  const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0.0";

  return (
    <div
      className="border border-border-subtle rounded-lg p-3 text-sm"
      style={{
        backgroundColor: "rgba(11, 18, 32, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 6px ${color}`,
            }}
          />
          <span className="text-text-secondary">{entry.name}</span>
        </div>
        <span
          className="text-text-primary font-semibold font-mono"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {formatValue ? formatValue(entry.value) : entry.value.toLocaleString()} ({percentage}%)
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom Legend
// ---------------------------------------------------------------------------

interface LegendEntry {
  value: string;
  color: string;
}

function CustomLegend({ payload }: { payload?: LegendEntry[] }) {
  if (!payload?.length) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-3">
      {payload.map((entry, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 font-body text-xs text-text-secondary"
        >
          <div
            className="shrink-0 rounded"
            style={{
              width: "10px",
              height: "3px",
              backgroundColor: entry.color,
            }}
          />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Active Shape (hover scale-up effect)
// ---------------------------------------------------------------------------

function renderActiveShape(props: unknown): React.JSX.Element {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  } = props as {
    cx: number;
    cy: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    fill: string;
  };

  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={Math.max(0, innerRadius - 2)}
      outerRadius={outerRadius + 6}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      style={{ filter: `drop-shadow(0 0 8px ${fill})`, transition: "all 0.2s ease" }}
    />
  );
}

// ---------------------------------------------------------------------------
// Pie label renderer (external labels with percentage)
// ---------------------------------------------------------------------------

interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
}

function renderLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: LabelProps) {
  if (percent < 0.03) return null; // Hide labels for tiny slices
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      style={{
        fontSize: 11,
        fill: "var(--text-secondary)",
        fontFamily: "var(--font-body), Inter, sans-serif",
      }}
    >
      {name} ({(percent * 100).toFixed(0)}%)
    </text>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DistributionChart({
  data,
  height = 300,
  innerRadius = 60,
  outerRadius = 100,
  showLegend = true,
  showLabels = false,
  formatValue,
  className,
}: DistributionChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  // Compute total for center label
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  // Resolve colors from palette when not explicitly provided
  const resolvedData = useMemo(
    () =>
      data.map((d, i) => ({
        ...d,
        fill: d.color || DEFAULT_PALETTE[i % DEFAULT_PALETTE.length],
      })),
    [data]
  );

  const onMouseEnter = useCallback((_: unknown, index: number) => {
    setActiveIndex(index);
  }, []);

  const onMouseLeave = useCallback(() => {
    setActiveIndex(undefined);
  }, []);

  const isDonut = innerRadius > 0;

  // Empty state
  if (!data || data.length === 0 || total === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-text-muted text-sm",
          className
        )}
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  return (
    <div className={cn("w-full relative", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={resolvedData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={resolvedData.length > 1 ? 2 : 0}
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            label={showLabels ? renderLabel : undefined}
            labelLine={showLabels}
            strokeWidth={0}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {resolvedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fill}
                style={{ outline: "none", transition: "opacity 0.2s ease" }}
                opacity={activeIndex !== undefined && activeIndex !== index ? 0.5 : 1}
              />
            ))}
          </Pie>

          <Tooltip
            content={<CustomTooltip formatValue={formatValue} />}
          />

          {showLegend && <Legend content={<CustomLegend />} />}
        </PieChart>
      </ResponsiveContainer>

      {/* Center label for donut mode */}
      {isDonut && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{ paddingBottom: showLegend ? 32 : 0 }}
        >
          <span
            className="text-text-primary font-display font-bold"
            style={{ fontSize: 22, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}
          >
            {formatValue ? formatValue(total) : total.toLocaleString()}
          </span>
          <span className="text-text-muted text-xs mt-1">Total</span>
        </div>
      )}
    </div>
  );
}
