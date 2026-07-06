"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  LineChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  CHART_COLORS,
  GRID_PROPS,
  AXIS_PROPS,
  ANIMATION_CONFIG,
  CURSOR_LINE_PROPS,
} from "@/lib/charts/observatory-theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TimeSeriesDataPoint {
  timestamp: string;
  [key: string]: string | number;
}

interface TimeSeriesConfig {
  key: string;
  label: string;
  color: string;
  type?: "line" | "area";
  strokeDasharray?: string;
}

interface AnomalyMarker {
  timestamp: string;
  severity: "critical" | "warning" | "info";
  label?: string;
}

export interface DeployMarkerLine {
  /** Must match (or be snapped to) an x-axis bucket value in `data`. */
  timestamp: string;
  label?: string;
  verdict?: "healthy" | "improved" | "degraded" | "unknown";
}

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  series: TimeSeriesConfig[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showBrush?: boolean;
  xAxisKey?: string;
  formatXAxis?: (value: string) => string;
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number, name: string) => string;
  className?: string;
  /** Anomaly markers rendered as dashed vertical reference lines */
  anomalies?: AnomalyMarker[];
  /** Deploy/release markers rendered as solid vertical reference lines (Phase 7) */
  deployMarkers?: DeployMarkerLine[];
}

// ---------------------------------------------------------------------------
// Default chart palette (references Observatory CSS custom properties)
// ---------------------------------------------------------------------------

const DEFAULT_CHART_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  formatValue?: (value: number, name: string) => string;
}

function CustomTooltip({ active, payload, label, formatValue }: ChartTooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (active && payload?.length) {
      clearTimeout(timerRef.current);
      setVisible(true);
    } else {
      timerRef.current = setTimeout(() => setVisible(false), 150);
    }
    return () => clearTimeout(timerRef.current);
  }, [active, payload]);

  if (!visible || !payload?.length) return null;

  return (
    <div
      className="rounded-lg border border-border-subtle/60 p-3 text-sm"
      style={{
        backgroundColor: "rgba(11, 18, 32, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.04)",
        opacity: active ? 1 : 0,
        transition: "opacity 200ms ease",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <p className="text-text-muted text-[11px] mb-1.5 font-mono">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: entry.color,
                  boxShadow: `0 0 6px ${entry.color}`,
                }}
              />
              <span className="text-text-secondary text-xs">{entry.name}</span>
            </div>
            <span className="text-text-primary font-semibold font-mono text-xs">
              {formatValue
                ? formatValue(entry.value, entry.name)
                : entry.value?.toLocaleString()}
            </span>
          </div>
        ))}
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
  dataKey?: string;
}

interface CustomLegendProps {
  payload?: LegendEntry[];
  hoveredSeries?: string | null;
  onSeriesHover?: (dataKey: string | null) => void;
}

function CustomLegend({ payload, hoveredSeries, onSeriesHover }: CustomLegendProps) {
  if (!payload?.length) return null;
  return (
    <div className="flex items-center justify-center gap-5 pt-3">
      {payload.map((entry, i) => {
        const isDimmed = hoveredSeries != null && entry.dataKey !== hoveredSeries;
        return (
          <div
            key={i}
            className="flex items-center gap-1.5 font-body text-xs cursor-default select-none"
            style={{
              opacity: isDimmed ? 0.35 : 1,
              transition: "opacity 200ms ease",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={() => onSeriesHover?.(entry.dataKey ?? null)}
            onMouseLeave={() => onSeriesHover?.(null)}
          >
            <div
              className="w-[10px] h-[3px] rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.value}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ANOMALY_SEVERITY_COLORS: Record<string, string> = {
  critical: "var(--status-danger, #ef4444)",
  warning: "var(--status-warn, #f59e0b)",
  info: "var(--data-info, #4d8ef8)",
};

const DEPLOY_VERDICT_COLORS: Record<string, string> = {
  degraded: "var(--status-danger, #ef4444)",
  improved: "var(--signal, #00d97e)",
  healthy: "var(--signal, #00d97e)",
  unknown: "var(--data-info, #4d8ef8)",
};

export function TimeSeriesChart({
  data,
  series,
  height = 300,
  showGrid = true,
  showLegend = true,
  showBrush = false,
  xAxisKey = "timestamp",
  formatXAxis,
  formatYAxis,
  formatTooltip,
  className,
  anomalies,
  deployMarkers,
}: TimeSeriesChartProps) {
  const [hoveredSeries, setHoveredSeries] = useState<string | null>(null);

  const handleSeriesHover = useCallback((dataKey: string | null) => {
    setHoveredSeries(dataKey);
  }, []);

  // Empty state
  if (!data || data.length === 0) {
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

  // Determine if we need an AreaChart or LineChart.
  const hasArea = series.some((s) => s.type !== "line");
  const ChartContainer = hasArea ? AreaChart : LineChart;

  // Resolve colors: fall back to default palette when a series has no color.
  const resolvedSeries = series.map((s, idx) => ({
    ...s,
    color: s.color || DEFAULT_CHART_PALETTE[idx % DEFAULT_CHART_PALETTE.length],
    type: s.type ?? "area",
  }));

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ChartContainer data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          {/* SVG defs: gradients + glow filters */}
          <defs>
            {resolvedSeries
              .filter((s) => s.type === "area")
              .map((s) => (
                <linearGradient
                  key={`gradient-${s.key}`}
                  id={`gradient-${s.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.01} />
                </linearGradient>
              ))}
            {/* Glow filter for each series — subtle drop shadow under the stroke */}
            {resolvedSeries.map((s) => (
              <filter key={`glow-${s.key}`} id={`glow-${s.key}`} height="200%">
                <feGaussianBlur
                  in="SourceGraphic"
                  stdDeviation="3"
                  result="blur"
                />
                <feFlood floodColor={s.color} floodOpacity="0.35" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="shadow" />
                <feMerge>
                  <feMergeNode in="shadow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
          </defs>

          {showGrid && (
            <CartesianGrid
              stroke={GRID_PROPS.stroke}
              strokeOpacity={GRID_PROPS.strokeOpacity}
              vertical={false}
            />
          )}

          <XAxis
            dataKey={xAxisKey}
            {...AXIS_PROPS}
            tickFormatter={formatXAxis}
            stroke={CHART_COLORS.grid}
          />

          <YAxis
            {...AXIS_PROPS}
            tickFormatter={formatYAxis}
            stroke={CHART_COLORS.grid}
            width={48}
          />

          <Tooltip
            content={<CustomTooltip formatValue={formatTooltip} />}
            cursor={CURSOR_LINE_PROPS}
          />

          {showLegend && (
            <Legend
              content={
                <CustomLegend
                  hoveredSeries={hoveredSeries}
                  onSeriesHover={handleSeriesHover}
                />
              }
            />
          )}

          {/* Render series */}
          {resolvedSeries.map((s) => {
            const isDimmed = hoveredSeries != null && hoveredSeries !== s.key;
            const seriesOpacity = isDimmed ? 0.2 : 1;

            return s.type === "area" ? (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#gradient-${s.key})`}
                fillOpacity={seriesOpacity}
                strokeOpacity={seriesOpacity}
                strokeDasharray={s.strokeDasharray}
                dot={false}
                activeDot={{
                  r: 5,
                  strokeWidth: 2,
                  stroke: s.color,
                  fill: "var(--bg-surface)",
                  style: { filter: `drop-shadow(0 0 6px ${s.color})` },
                }}
                filter={!isDimmed ? `url(#glow-${s.key})` : undefined}
                style={{ transition: "opacity 200ms ease" }}
                {...ANIMATION_CONFIG}
              />
            ) : (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                strokeOpacity={seriesOpacity}
                strokeDasharray={s.strokeDasharray}
                dot={false}
                activeDot={{
                  r: 5,
                  strokeWidth: 2,
                  stroke: s.color,
                  fill: "var(--bg-surface)",
                  style: { filter: `drop-shadow(0 0 6px ${s.color})` },
                }}
                filter={!isDimmed ? `url(#glow-${s.key})` : undefined}
                style={{ transition: "opacity 200ms ease" }}
                {...ANIMATION_CONFIG}
              />
            );
          })}

          {/* Deploy/release markers (Phase 7 Change Intelligence) */}
          {deployMarkers?.map((m, i) => (
            <ReferenceLine
              key={`deploy-${i}`}
              x={m.timestamp}
              stroke={DEPLOY_VERDICT_COLORS[m.verdict || "unknown"]}
              strokeWidth={1.5}
              strokeOpacity={0.8}
              label={{
                value: m.label || "Deploy",
                position: "insideTopRight",
                fill: DEPLOY_VERDICT_COLORS[m.verdict || "unknown"],
                fontSize: 10,
                fontWeight: 600,
              }}
            />
          ))}

          {/* Anomaly markers */}
          {anomalies?.map((a, i) => (
            <ReferenceLine
              key={`anomaly-${i}`}
              x={a.timestamp}
              stroke={ANOMALY_SEVERITY_COLORS[a.severity] || ANOMALY_SEVERITY_COLORS.info}
              strokeDasharray="4 3"
              strokeWidth={1.5}
              strokeOpacity={0.7}
              label={a.label ? {
                value: a.label,
                position: "top",
                fill: ANOMALY_SEVERITY_COLORS[a.severity] || ANOMALY_SEVERITY_COLORS.info,
                fontSize: 10,
                fontWeight: 600,
              } : undefined}
            />
          ))}

          {showBrush && (
            <Brush
              dataKey={xAxisKey}
              height={28}
              fill="var(--bg-elevated)"
              stroke="var(--border-subtle)"
              travellerWidth={8}
              tickFormatter={formatXAxis}
            />
          )}
        </ChartContainer>
      </ResponsiveContainer>
    </div>
  );
}
