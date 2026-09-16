"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Calendar } from "lucide-react";
import { useProject } from "@/hooks/project.hooks";
import { useLogs, useLogSummary } from "@/hooks/log.hooks";
import { useAlertStats } from "@/hooks/alerts.hook";
import { useNetworkSlowest } from "@/hooks/analytics.hook";
import { useRecentEvents } from "@/hooks/recentEvents.hook";
import { useApperioStore, type TimeRange } from "@/store/apperio-store";
import { SkeletonDashboard } from "@/components/shared/SkeletonDashboard";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Project } from "@/types/project.types";
import { LogEntry } from "@/types/analytics";
import { resolveTimeRangeParams } from "@/lib/format-utils";

const RANGE_PRESETS: ReadonlyArray<{ value: TimeRange; label: string }> = [
  { value: "1h", label: "1h" },
  { value: "6h", label: "6h" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
];

function rangeHours(
  range: TimeRange,
  custom?: { start: Date; end: Date } | null,
): number {
  switch (range) {
    case "1h":
      return 1;
    case "6h":
      return 6;
    case "24h":
      return 24;
    case "7d":
      return 24 * 7;
    case "30d":
      return 24 * 30;
    case "custom": {
      // Backend computes startTime = now - hours, so we need enough hours to
      // reach back to `customRange.start`. A future end date doesn't add
      // queryable history — clip to now.
      if (!custom) return 24;
      const ms = Date.now() - custom.start.getTime();
      return Math.max(1, Math.round(ms / (60 * 60 * 1000)));
    }
  }
}

function rangeShortLabel(
  range: TimeRange,
  custom?: { start: Date; end: Date } | null,
): string {
  if (range === "custom" && custom) {
    return `${format(custom.start, "MMM d")} – ${format(custom.end, "MMM d")}`;
  }
  return range === "custom" ? "custom" : range;
}

function rangeProseLabel(
  range: TimeRange,
  custom?: { start: Date; end: Date } | null,
): string {
  if (range === "custom" && custom) {
    return `between ${format(custom.start, "MMM d")} and ${format(
      custom.end,
      "MMM d",
    )}`;
  }
  switch (range) {
    case "1h":
      return "in the last hour";
    case "6h":
      return "in the last 6 hours";
    case "24h":
      return "in the last 24h";
    case "7d":
      return "in the last 7 days";
    case "30d":
      return "in the last 30 days";
    default:
      return "in the selected range";
  }
}

function rangePreviousLabel(range: TimeRange): string {
  switch (range) {
    case "1h":
    case "6h":
    case "24h":
      return "from the prior period";
    case "7d":
      return "from last week";
    case "30d":
      return "from last month";
    default:
      return "from the prior period";
  }
}

function formatN(n: number | undefined | null): string {
  if (n === undefined || n === null) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

function deriveHealthStatus(
  analytics: Project["analytics"] | undefined,
): "ok" | "warn" | "danger" {
  if (!analytics) return "ok";
  const errorRate = analytics.overview?.errorRate ?? 0;
  const perfHealth = analytics.performance?.health;
  if (errorRate > 10 || perfHealth === "critical") return "danger";
  if (errorRate > 5 || perfHealth === "warning" || perfHealth === "degraded")
    return "warn";
  return "ok";
}

function statusColorVar(status: "ok" | "warn" | "danger") {
  return status === "ok"
    ? "var(--signal)"
    : status === "warn"
      ? "var(--status-warn)"
      : "var(--status-danger)";
}

function relativeTime(iso: string): string {
  if (!iso) return "";
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: false }) + " ago";
  } catch {
    return iso;
  }
}

function Sparkline({
  data,
  color = "var(--signal)",
  height = 36,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  if (!data || data.length < 2) return <svg width="100%" height={height} />;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * 100,
    height - ((v - min) / range) * (height - 6) - 3,
  ]);
  const ptsStr = pts.map((p) => p.join(",")).join(" ");
  const id = `sl-${Math.random().toString(36).slice(2, 9)}`;
  return (
    <svg
      width="100%"
      height={height}
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${ptsStr} 100,${height}`}
        fill={`url(#${id})`}
      />
      <polyline
        points={ptsStr}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        style={{ vectorEffect: "non-scaling-stroke" }}
      />
    </svg>
  );
}

function HealthRing({
  score,
  size = 112,
  stroke = 5,
}: {
  score: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color =
    score >= 80
      ? "var(--signal)"
      : score >= 50
        ? "var(--status-warn)"
        : "var(--status-danger)";
  return (
    <svg width={size} height={size} style={{ overflow: "visible" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--border-subtle)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{
          transition: "stroke-dashoffset 800ms cubic-bezier(0,0,0.2,1)",
          filter: `drop-shadow(0 0 8px ${color})`,
        }}
      />
    </svg>
  );
}

function LevelDot({ level, size = 6 }: { level: LogLevel; size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `var(--level-${level})`,
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

type ProjectShape = Project["project"];

function ProjectHero({
  project,
  logsToday,
  logsTotal,
  errorsToday,
  errorTrend,
  activeAlerts,
  healthScore,
  healthStatus,
  selectedRange,
  customRange,
  onRangeChange,
  onCustomRangeChange,
}: {
  project: ProjectShape;
  logsToday: number;
  logsTotal: number;
  errorsToday: number;
  errorTrend: number;
  activeAlerts: number;
  healthScore: number;
  healthStatus: "ok" | "warn" | "danger";
  selectedRange: TimeRange;
  customRange: { start: Date; end: Date } | null;
  onRangeChange: (range: TimeRange) => void;
  onCustomRangeChange: (range: { start: Date; end: Date } | null) => void;
}) {
  const statusColor = statusColorVar(healthStatus);
  const errorTrendDown = errorTrend < 0;
  const rangeShort = rangeShortLabel(selectedRange, customRange);
  const rangeProse = rangeProseLabel(selectedRange, customRange);
  const previousLabel = rangePreviousLabel(selectedRange);

  return (
    <div className="relative overflow-hidden border-b border-border-faint px-8 py-7">
      <svg
        width="100%"
        height="100%"
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
      >
        <defs>
          <pattern
            id="hero-grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="var(--text-primary)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>

      <div className="relative flex items-start justify-between gap-8">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-text-muted">
            <span>Project Overview</span>
            <span className="h-[3px] w-[3px] rounded-full bg-text-muted" />
            <span>last {rangeShort}</span>
            <span className="h-[3px] w-[3px] rounded-full bg-text-muted" />
            <span
              className="flex items-center gap-1.5"
              style={{ color: statusColor }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: statusColor,
                  boxShadow: `0 0 6px ${statusColor}`,
                  animation: "apperio-pulse 2s infinite",
                }}
              />
              LIVE
            </span>
          </div>

          <h1 className="mb-2 font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.025em] text-text-primary">
            {project.name}
            {project.apiKey && (
              <span className="ml-3 align-middle font-mono text-[13px] font-normal text-text-muted">
                {project.apiKey.slice(0, 16)}…
              </span>
            )}
          </h1>

          <p
            className="text-[14.5px] leading-[1.55] text-text-secondary"
            style={{ maxWidth: 680 }}
          >
            <strong className="font-semibold text-signal">
              {healthStatus === "ok"
                ? "Healthy."
                : healthStatus === "warn"
                  ? "Watch."
                  : "Critical."}
            </strong>{" "}
            {formatN(logsToday)} logs and{" "}
            <span
              style={{
                color:
                  errorsToday > 0
                    ? "var(--status-warn)"
                    : "var(--text-secondary)",
              }}
            >
              {formatN(errorsToday)} errors
            </span>{" "}
            {rangeProse}
            {errorTrend !== 0 && (
              <>
                , error rate{" "}
                <span
                  style={{
                    color: errorTrendDown
                      ? "var(--signal)"
                      : "var(--status-warn)",
                    fontWeight: 500,
                  }}
                >
                  {errorTrendDown ? "↓" : "↑"} {Math.abs(errorTrend)}%
                </span>{" "}
                {previousLabel}
              </>
            )}
            .
            {activeAlerts > 0 ? (
              <>
                {" "}
                <span className="font-medium text-status-warn">
                  {activeAlerts} active alert{activeAlerts !== 1 ? "s" : ""}
                </span>
                .
              </>
            ) : (
              <> No active alerts.</>
            )}
          </p>

          <div className="mt-4 flex flex-wrap gap-6 font-mono">
            <HeroStat label="API Version" value="v1" />
            <HeroStat label="Total Logs" value={formatN(logsTotal)} tabular />
            <HeroStat
              label="Rate Limit"
              value={`${
                project.rateLimitConfig?.maxRequestsPerMinute ?? 100
              }/min`}
              tabular
            />
            <HeroStat
              label="Created"
              value={
                project.createdAt
                  ? new Date(project.createdAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"
              }
            />
            <HeroStat
              label="Status"
              value={project.isActive ? "Active" : "Inactive"}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-border-subtle"
          >
            <Link href={`/projects/${project._id}/settings`}>Settings</Link>
          </Button>
          <div className="flex flex-shrink-0 flex-col items-end gap-3.5">
            <RangePill
              selectedRange={selectedRange}
              customRange={customRange}
              onRangeChange={onRangeChange}
              onCustomRangeChange={onCustomRangeChange}
            />
            <div className="relative">
              <HealthRing score={healthScore} size={112} stroke={5} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="tabular-nums font-display text-[30px] font-extrabold leading-none text-text-primary">
                  {healthScore}
                </div>
                <div className="mt-[3px] font-mono text-[9.5px] uppercase tracking-[0.08em] text-text-muted">
                  Health
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RangePill({
  selectedRange,
  customRange,
  onRangeChange,
  onCustomRangeChange,
}: {
  selectedRange: TimeRange;
  customRange: { start: Date; end: Date } | null;
  onRangeChange: (range: TimeRange) => void;
  onCustomRangeChange: (range: { start: Date; end: Date } | null) => void;
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const isCustom = selectedRange === "custom";
  const customLabel =
    isCustom && customRange
      ? `${format(customRange.start, "MMM d")} – ${format(
          customRange.end,
          "MMM d",
        )}`
      : "Custom";

  return (
    <div
      className="inline-flex items-center rounded-md border border-border-subtle bg-bg-surface p-[3px] font-mono text-[11px]"
      role="radiogroup"
      aria-label="Time range"
    >
      {RANGE_PRESETS.map((preset) => {
        const active = selectedRange === preset.value;
        return (
          <button
            key={preset.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onRangeChange(preset.value)}
            className={`rounded px-2.5 py-1 uppercase tracking-[0.05em] transition-colors ${
              active
                ? "bg-bg-elevated text-signal"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {preset.label}
          </button>
        );
      })}
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="radio"
            aria-checked={isCustom}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 uppercase tracking-[0.05em] transition-colors ${
              isCustom
                ? "bg-bg-elevated text-signal"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Calendar className="h-3 w-3" />
            <span className="normal-case tracking-normal">{customLabel}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-auto border-border-subtle bg-bg-surface p-0"
        >
          <CalendarComponent
            mode="range"
            defaultMonth={customRange?.start ?? new Date()}
            selected={
              customRange
                ? ({
                    from: customRange.start,
                    to: customRange.end,
                  } as DateRange)
                : undefined
            }
            onSelect={(range) => {
              if (range?.from && range?.to) {
                onCustomRangeChange({ start: range.from, end: range.to });
                setCalendarOpen(false);
              } else if (range === undefined) {
                onCustomRangeChange(null);
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function HeroStat({
  label,
  value,
  tabular = false,
}: {
  label: string;
  value: string;
  tabular?: boolean;
}) {
  return (
    <div>
      <div className="mb-[3px] font-mono text-[10px] uppercase tracking-[0.07em] text-text-muted">
        {label}
      </div>
      <div
        className={`text-[12px] text-text-secondary ${
          tabular ? "tabular-nums" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  subtitle,
  trend,
  trendDirection,
  sparkData,
  color = "var(--signal)",
  large = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  trend?: string;
  trendDirection?: "up" | "down" | "flat";
  sparkData?: number[];
  color?: string;
  large?: boolean;
}) {
  const trendColor =
    trendDirection === "up"
      ? "var(--status-warn)"
      : trendDirection === "down"
        ? "var(--signal)"
        : "var(--text-muted)";

  return (
    <div
      className="relative flex flex-col gap-2.5 overflow-hidden rounded-lg border border-border-subtle bg-bg-surface px-[18px] pt-[18px] pb-[14px]"
      style={{ minHeight: large ? 152 : 130 }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-text-muted">
          {label}
        </span>
        {trend && (
          <span
            className="flex items-center gap-[3px] font-mono text-[10.5px]"
            style={{ color: trendColor }}
          >
            {trendDirection === "up"
              ? "↑"
              : trendDirection === "down"
                ? "↓"
                : "→"}
            <span className="tabular-nums">{trend}</span>
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span
          className="tabular-nums font-display font-extrabold leading-none tracking-[-0.025em] text-text-primary"
          style={{ fontSize: large ? 40 : 32 }}
        >
          {value}
        </span>
        {unit && (
          <span className="font-mono text-[14px] text-text-muted">{unit}</span>
        )}
      </div>

      {subtitle && (
        <span className="font-mono text-[11.5px] text-text-muted">
          {subtitle}
        </span>
      )}

      {sparkData && sparkData.length > 1 && (
        <div className="-mb-[14px] -ml-[18px] -mr-[18px] mt-auto h-9">
          <Sparkline data={sparkData} color={color} height={36} />
        </div>
      )}
    </div>
  );
}

function VolumeChart({
  logs,
  errors,
  height = 140,
  rangeLabel,
  axisTicks,
}: {
  logs: number[];
  errors: number[];
  height?: number;
  rangeLabel: string;
  axisTicks: string[];
}) {
  const w = 600;
  const safeLogs = logs.length > 1 ? logs : [0, 0];
  const safeErrors = errors.length > 1 ? errors : [0, 0];
  const maxLog = Math.max(...safeLogs, 1);
  const maxErr = Math.max(...safeErrors, 1);
  const points = safeLogs.map((v, i) => [
    (i / (safeLogs.length - 1)) * w,
    height - (v / maxLog) * (height - 12) - 6,
  ]);
  const errPoints = safeErrors.map((v, i) => [
    (i / (safeErrors.length - 1)) * w,
    height - (v / maxErr) * (height - 12) * 0.5 - 6,
  ]);

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface px-4 pt-3.5 pb-2">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
            Log Volume · {rangeLabel}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-text-muted">
            <span
              className="block"
              style={{ width: 8, height: 2, background: "var(--signal)" }}
            />
            total
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-text-muted">
            <span
              className="block"
              style={{
                width: 8,
                height: 2,
                background: "var(--status-danger)",
              }}
            />
            errors
          </span>
        </div>
        <span className="font-mono text-[10.5px] text-text-muted">
          now → -{rangeLabel}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${w} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        className="apperio-svg-draw block"
      >
        <defs>
          <linearGradient id="logGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--signal)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--signal)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75].map((y) => (
          <line
            key={y}
            x1="0"
            y1={height * y + 6}
            x2={w}
            y2={height * y + 6}
            stroke="var(--border-faint)"
            strokeWidth="0.5"
            strokeDasharray="2 4"
          />
        ))}
        <polygon
          points={`0,${height} ${points
            .map((p) => p.join(","))
            .join(" ")} ${w},${height}`}
          fill="url(#logGrad)"
        />
        <polyline
          points={points.map((p) => p.join(",")).join(" ")}
          fill="none"
          stroke="var(--signal)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ vectorEffect: "non-scaling-stroke" }}
        />
        <polyline
          points={errPoints.map((p) => p.join(",")).join(" ")}
          fill="none"
          stroke="var(--status-danger)"
          strokeWidth="1.2"
          strokeDasharray="3 3"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ vectorEffect: "non-scaling-stroke" }}
        />
        {points.length > 0 && (
          <circle
            cx={w}
            cy={points[points.length - 1][1]}
            r="3"
            fill="var(--signal)"
            style={{ filter: "drop-shadow(0 0 4px var(--signal))" }}
          />
        )}
      </svg>
      <div className="tabular-nums mt-1.5 flex justify-between font-mono text-[10px] text-text-muted">
        {axisTicks.map((tick, i) => (
          <span key={`${tick}-${i}`}>{tick}</span>
        ))}
      </div>
    </div>
  );
}

function ActivityStream({
  items,
  projectId,
}: {
  items: LogEntry[];
  projectId: string;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border-subtle bg-bg-surface">
      <div className="flex items-center justify-between border-b border-border-faint px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: "var(--signal)",
              boxShadow: "0 0 6px var(--signal)",
              animation: "apperio-pulse 2s infinite",
            }}
          />
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
            Live Activity
          </span>
        </div>
        <Link
          href={`/projects/${projectId}/logs`}
          className="font-mono text-[11px] text-text-muted hover:text-text-secondary"
        >
          View all logs →
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {items.length === 0 && (
          <div className="px-4 py-8 text-center font-mono text-[11.5px] text-text-muted">
            Waiting for log activity…
          </div>
        )}
        {items.map((item, i) => {
          const level = (item.level || "info") as LogLevel;
          const isError = level === "error" || level === "fatal";
          const src =
            item.service ||
            item.error?.url ||
            (item.eventType ? item.eventType : "—");
          return (
            <Link
              key={item._id || i}
              href={`/projects/${projectId}/logs?logId=${item._id}`}
              className="apperio-stream-row group flex w-full items-start gap-2.5 border-l-2 border-l-transparent px-4 py-1.5 text-left transition-colors hover:bg-bg-elevated"
              style={{
                animation: `apperio-slide-in 300ms cubic-bezier(0,0,0.2,1) ${
                  i * 30
                }ms both`,
              }}
            >
              <span
                className="tabular-nums w-[60px] flex-shrink-0 font-mono text-[10.5px] text-text-muted"
                style={{ paddingTop: 2 }}
              >
                {relativeTime(item.timestamp)}
              </span>
              <div className="flex gap-6 w-full items-center">
                <span style={{ paddingTop: 0 }}>
                  <LevelDot level={level} />
                </span>
                <span
                  className="flex-1 overflow-hidden truncate"
                  style={{
                    fontFamily: isError
                      ? "var(--font-mono)"
                      : "var(--font-body)",
                    fontSize: isError ? 11.5 : 12.5,
                    color: isError
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                    lineHeight: 1.45,
                  }}
                >
                  {item.message || item.error?.message || "(no message)"}
                </span>
              </div>
              <span
                className="flex-shrink-0 truncate font-mono text-[10px] text-text-muted opacity-60"
                style={{ maxWidth: 140, paddingTop: 2 }}
              >
                {src}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function TopErrors({
  errors,
  projectId,
}: {
  errors: Array<{ message: string; count: number; service?: string }>;
  projectId: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-bg-surface">
      <div className="flex items-center justify-between border-b border-border-faint px-4 py-2.5">
        <div className="flex items-center gap-2">
          <LevelDot level="error" />
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
            Top Errors · 24h
          </span>
        </div>
        <Link
          href={`/projects/${projectId}/errors`}
          className="font-mono text-[11px] text-text-muted hover:text-text-secondary"
        >
          All errors →
        </Link>
      </div>
      <div>
        {errors.length === 0 && (
          <div className="px-4 py-8 text-center font-mono text-[11.5px] text-text-muted">
            No errors in the last 24h.
          </div>
        )}
        {errors.map((e, i) => (
          <div
            key={i}
            className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-bg-elevated"
            style={{
              borderBottom:
                i < errors.length - 1
                  ? "1px solid var(--border-faint)"
                  : "none",
            }}
          >
            <div className="min-w-[42px] text-right">
              <span className="tabular-nums font-display text-[18px] font-bold text-text-primary">
                {e.count}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 truncate font-mono text-[12.5px] text-text-primary">
                {e.message}
              </div>
              {e.service && (
                <div className="font-mono text-[10.5px] text-text-muted">
                  {e.service}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlowestEndpoints({
  endpoints,
  projectId,
  isLoading,
}: {
  endpoints: Array<{ url: string; p95: number; calls: number; method?: string }>;
  projectId: string;
  isLoading: boolean;
}) {
  const max = Math.max(...endpoints.map((e) => e.p95), 1);
  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-bg-surface">
      <div className="flex items-center justify-between border-b border-border-faint px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--data-info)" }}
          />
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
            Slowest Endpoints · p95
          </span>
        </div>
        <Link
          href={`/projects/${projectId}/performance`}
          className="font-mono text-[11px] text-text-muted hover:text-text-secondary"
        >
          Performance →
        </Link>
      </div>
      <div>
        {isLoading && endpoints.length === 0 && (
          <div className="px-4 py-8 text-center font-mono text-[11.5px] text-text-muted">
            Loading endpoints…
          </div>
        )}
        {!isLoading && endpoints.length === 0 && (
          <div className="px-4 py-8 text-center font-mono text-[11.5px] text-text-muted">
            No network requests captured in this range.
          </div>
        )}
        {endpoints.map((e, i) => (
          <div
            key={`${e.url}-${i}`}
            className="relative flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-bg-elevated"
            style={{
              borderBottom:
                i < endpoints.length - 1
                  ? "1px solid var(--border-faint)"
                  : "none",
            }}
          >
            <div
              className="pointer-events-none absolute inset-y-0 left-0"
              style={{
                width: `${(e.p95 / max) * 100}%`,
                background:
                  "linear-gradient(90deg, transparent, rgba(139,189,212,0.06))",
              }}
            />
            <div className="relative min-w-0 flex-1">
              <div className="mb-0.5 truncate font-mono text-[12.5px] text-text-primary">
                {e.url}
              </div>
              <div className="tabular-nums font-mono text-[10.5px] text-text-muted">
                {formatN(e.calls)} request{e.calls === 1 ? "" : "s"}
                {e.method ? ` · ${e.method}` : ""}
              </div>
            </div>
            <div className="relative flex flex-shrink-0 items-baseline gap-1">
              <span
                className="tabular-nums font-display text-[18px] font-bold"
                style={{
                  color:
                    e.p95 > 1000
                      ? "var(--status-warn)"
                      : "var(--text-primary)",
                }}
              >
                {Math.round(e.p95)}
              </span>
              <span className="font-mono text-[11px] text-text-muted">ms</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type TimelineEvent = {
  id: string;
  type: "deploy" | "alert" | "team" | "config";
  label: string;
  meta: string;
  timestamp: string;
  href?: string;
};

function EventTimeline({
  events,
  isLoading,
}: {
  events: TimelineEvent[];
  isLoading: boolean;
}) {
  const colors: Record<TimelineEvent["type"], string> = {
    deploy: "var(--signal)",
    alert: "var(--status-warn)",
    team: "var(--data-info)",
    config: "var(--text-secondary)",
  };
  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-bg-surface">
      <div className="flex items-center justify-between border-b border-border-faint px-4 py-2.5">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          Recent Events
        </span>
      </div>
      <div className="py-2">
        {isLoading && events.length === 0 && (
          <div className="px-4 py-8 text-center font-mono text-[11.5px] text-text-muted">
            Loading events…
          </div>
        )}
        {!isLoading && events.length === 0 && (
          <div className="px-4 py-8 text-center font-mono text-[11.5px] text-text-muted">
            No recent events. Connect a GitHub repo in settings to see deploys.
          </div>
        )}
        {events.map((e, i) => {
          const node = (
            <div
              className="relative px-4 pl-9"
              style={{ paddingTop: 8, paddingBottom: 8 }}
            >
              {i < events.length - 1 && (
                <div
                  className="absolute left-[22px]"
                  style={{
                    top: 24,
                    bottom: -8,
                    width: 1,
                    background: "var(--border-faint)",
                  }}
                />
              )}
              <div
                className="absolute"
                style={{
                  left: 18,
                  top: 11,
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: "var(--bg-base)",
                  border: `2px solid ${colors[e.type]}`,
                  boxShadow: i === 0 ? `0 0 6px ${colors[e.type]}` : "none",
                }}
              />
              <div className="mb-[1px] flex items-center gap-1.5">
                <span className="text-[12.5px] font-medium text-text-primary truncate">
                  {e.label}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10.5px] text-text-muted">
                <span>{relativeTime(e.timestamp)}</span>
                <span>·</span>
                <span className="truncate">{e.meta}</span>
              </div>
            </div>
          );
          return e.href ? (
            <Link key={e.id} href={e.href} className="block hover:bg-bg-elevated">
              {node}
            </Link>
          ) : (
            <div key={e.id}>{node}</div>
          );
        })}
      </div>
    </div>
  );
}

const QUICK_LINKS = [
  { slug: "logs", label: "Logs", icon: "❒", color: "var(--signal)" },
  { slug: "errors", label: "Errors", icon: "◉", color: "var(--status-danger)" },
  {
    slug: "performance",
    label: "Performance",
    icon: "◔",
    color: "var(--data-info)",
  },
  {
    slug: "web-vitals",
    label: "Web Vitals",
    icon: "◎",
    color: "var(--data-purple)",
  },
  { slug: "traces", label: "Traces", icon: "◈", color: "var(--status-warn)" },
  { slug: "insights", label: "Insights", icon: "✦", color: "var(--signal)" },
  {
    slug: "alerts",
    label: "Alerts",
    icon: "▲",
    color: "var(--status-danger)",
    absolute: true,
  },
  {
    slug: "settings",
    label: "Settings",
    icon: "⚙",
    color: "var(--text-secondary)",
  },
];

function QuickLinksBar({ projectId }: { projectId: string }) {
  return (
    <div
      className="rounded-lg border border-border-subtle bg-bg-surface"
      style={{ padding: 4 }}
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: "repeat(8, minmax(0, 1fr))" }}
      >
        {QUICK_LINKS.map((link, i) => {
          const href = link.absolute
            ? `/${link.slug}`
            : `/projects/${projectId}/${link.slug}`;
          return (
            <Link
              key={link.slug}
              href={href}
              className="flex flex-col items-center gap-1.5 rounded-md px-2 py-3 transition-colors hover:bg-bg-elevated"
              style={{
                borderRight:
                  i < QUICK_LINKS.length - 1
                    ? "1px solid var(--border-faint)"
                    : "none",
              }}
            >
              <span
                className="leading-none"
                style={{ fontSize: 18, color: link.color }}
              >
                {link.icon}
              </span>
              <span className="font-body text-[11.5px] font-medium text-text-secondary">
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SdkStatusCard({
  isActive,
  logCount,
}: {
  isActive: boolean;
  logCount: number;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-surface px-4 py-3.5"
      style={{ borderLeft: "2px solid var(--signal)" }}
    >
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md"
        style={{
          background: "var(--signal-muted)",
          border: "1px solid rgba(174,247,142,0.15)",
        }}
      >
        <span style={{ color: "var(--signal)", fontSize: 14 }}>◇</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 text-[13px] font-medium text-text-primary">
          {logCount > 0 && isActive
            ? "SDK is connected and reporting"
            : logCount === 0
              ? "Waiting for first log batch"
              : "SDK reporting paused"}
        </div>
        <div className="font-mono text-[11.5px] text-text-muted">
          {logCount > 0
            ? `${formatN(logCount)} total logs ingested`
            : "Add the Apperio SDK to your app to start streaming logs"}
        </div>
      </div>
      <Link
        href="/docs/api/sdk"
        className="font-mono text-[11.5px] uppercase tracking-[0.05em] text-signal"
      >
        SDK config →
      </Link>
    </div>
  );
}

export default function ProjectDashboard() {
  const params = useParams<{ projectId: string }>();
  const projectId =
    typeof params?.projectId === "string" ? params.projectId : "";

  const selectedTimeRange = useApperioStore((s) => s.selectedTimeRange);
  const customTimeRange = useApperioStore((s) => s.customTimeRange);
  const setTimeRange = useApperioStore((s) => s.setTimeRange);
  const setCustomTimeRange = useApperioStore((s) => s.setCustomTimeRange);
  const timeRangeParams = useMemo(
    () => resolveTimeRangeParams(selectedTimeRange, customTimeRange),
    [selectedTimeRange, customTimeRange],
  );
  const timeRangeHours = useMemo(
    () => rangeHours(selectedTimeRange, customTimeRange),
    [selectedTimeRange, customTimeRange],
  );

  const { data: projectData, isLoading: projectLoading } = useProject(
    projectId,
    { timeRange: timeRangeHours },
  );
  useLogSummary(projectId, timeRangeParams.timeRange);
  const { data: alertStatsResponse } = useAlertStats(projectId);
  const { data: recentLogsResponse } = useLogs(projectId, {
    limit: 12,
  });
  // The slowest-endpoints API takes a preset string ("1h"|"6h"|"24h"|"7d"|"30d"),
  // not start/end dates. For "custom" we fall back to "30d" — close enough for v1.
  const slowestRangePreset =
    selectedTimeRange === "custom" ? "30d" : selectedTimeRange;
  const { data: slowestEndpointsRaw, isLoading: slowestLoading } =
    useNetworkSlowest(projectId, {
      timeRange: slowestRangePreset,
      limit: 5,
    });
  const { events: recentEvents, isLoading: recentEventsLoading } =
    useRecentEvents(projectId, 8);

  const pData = projectData as Project | undefined;
  const project = pData?.project;
  const analytics = pData?.analytics;
  const recommendations = pData?.recommendations;
  const alertStats = alertStatsResponse?.data ?? null;

  const healthStatus = deriveHealthStatus(analytics);
  const logsTotal = analytics?.overview?.totalLogs ?? 0;
  const avgResponseTime =
    analytics?.responseTime?.current?.avgResponseTime ?? 0;
  const totalRequests = analytics?.performance?.metrics?.totalRequests ?? 0;
  const perfHealth = analytics?.performance?.health ?? "unknown";
  const healthScore = recommendations?.healthScore ?? 0;
  const activeAlertCount = alertStats?.active ?? 0;
  const criticalAlerts = alertStats?.bySeverity?.critical ?? 0;
  const warningAlerts = alertStats?.bySeverity?.warning ?? 0;

  // Filter `analytics.trends.logs` (daily buckets, capped server-side at 30d)
  // to the active range window. Buckets whose day overlaps `[startTime, endTime]`
  // are included — for sub-day ranges (1h, 6h) the current day's bucket is the
  // best resolution we have without backend hourly bucketing.
  const logsTrendInRange = useMemo(() => {
    const trends = analytics?.trends?.logs ?? [];
    if (trends.length === 0) return [];
    const now = Date.now();
    const startMs =
      selectedTimeRange === "custom" && customTimeRange
        ? customTimeRange.start.getTime()
        : now - timeRangeHours * 60 * 60 * 1000;
    const endMs =
      selectedTimeRange === "custom" && customTimeRange
        ? customTimeRange.end.getTime()
        : now;
    return trends.filter((t) => {
      const dateStr = t._id?.date;
      if (!dateStr) return false;
      const dayStart = new Date(`${dateStr}T00:00:00Z`).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      return dayEnd > startMs && dayStart <= endMs;
    });
  }, [
    analytics?.trends?.logs,
    selectedTimeRange,
    customTimeRange,
    timeRangeHours,
  ]);

  const logsInRange = useMemo(
    () => logsTrendInRange.reduce((sum, t) => sum + (t.totalLogs ?? 0), 0),
    [logsTrendInRange],
  );
  const errorsInRange = useMemo(
    () => logsTrendInRange.reduce((sum, t) => sum + (t.errorLogs ?? 0), 0),
    [logsTrendInRange],
  );
  const errorRate = logsInRange > 0 ? (errorsInRange / logsInRange) * 100 : 0;

  const responseTrend = analytics?.responseTime?.trends ?? [];
  const responseSpark = useMemo(
    () =>
      responseTrend
        .map((t) => Math.round((t.avgResponseTime ?? 0) * 100) / 100)
        .filter((v) => Number.isFinite(v)),
    [responseTrend],
  );

  const logVolumeSeries = useMemo(
    () => logsTrendInRange.map((t) => t.totalLogs ?? 0),
    [logsTrendInRange],
  );
  const errorVolumeSeries = useMemo(
    () => logsTrendInRange.map((t) => t.errorLogs ?? 0),
    [logsTrendInRange],
  );

  const errorTrend = useMemo(() => {
    const pts = analytics?.errors?.trends ?? [];
    if (pts.length < 2) return 0;
    const last = pts[pts.length - 1]?.errorCount ?? 0;
    const prev = pts[pts.length - 2]?.errorCount ?? 0;
    if (prev === 0) return 0;
    return Math.round(((last - prev) / prev) * 100);
  }, [analytics?.errors?.trends]);

  const recentLogs: LogEntry[] = useMemo(() => {
    const raw = recentLogsResponse?.logs ?? [];
    return Array.isArray(raw) ? (raw as LogEntry[]).slice(0, 10) : [];
  }, [recentLogsResponse]);

  const topErrors = useMemo(() => {
    const list = analytics?.errors?.topErrors ?? [];
    return list.slice(0, 5).map((e) => ({
      message: e._id,
      count: e.count,
      service: e.services?.[0],
    }));
  }, [analytics?.errors?.topErrors]);

  const slowestEndpoints = useMemo(() => {
    const list = (slowestEndpointsRaw as
      | Array<{
          url?: string;
          p95?: number;
          calls?: number;
          method?: string;
        }>
      | undefined) ?? [];
    return list
      .filter((e) => e.url && typeof e.p95 === "number")
      .map((e) => ({
        url: e.url as string,
        p95: e.p95 as number,
        calls: e.calls ?? 0,
        method: e.method,
      }));
  }, [slowestEndpointsRaw]);

  const rangeShort = rangeShortLabel(selectedTimeRange, customTimeRange);
  const logVolumeAxisTicks = useMemo(() => {
    const h = timeRangeHours;
    if (h <= 1) {
      return ["-60m", "-45m", "-30m", "-15m", "0"];
    }
    if (h <= 24) {
      const step = Math.max(1, Math.round(h / 4));
      return [4, 3, 2, 1, 0].map((i) => (i === 0 ? "0" : `-${i * step}h`));
    }
    const days = Math.round(h / 24);
    const step = Math.max(1, Math.round(days / 4));
    return [4, 3, 2, 1, 0].map((i) => (i === 0 ? "0" : `-${i * step}d`));
  }, [timeRangeHours]);

  const logsPerHourAvg = Math.max(1, timeRangeHours);
  const logsAvgPerHour = formatN(Math.round(logsInRange / logsPerHourAvg));

  if (projectLoading) {
    return (
      <div className="p-6 md:px-8 lg:p-10">
        <SkeletonDashboard />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 md:px-8 lg:p-10">
        <div className="rounded-lg border border-border-subtle bg-bg-surface py-16 text-center">
          <h2 className="font-display text-2xl font-bold text-text-primary">
            Project not found
          </h2>
          <p className="mt-2 text-text-secondary">
            The project you are looking for does not exist or you do not have
            access.
          </p>
          <div className="mt-6">
            <Button variant="signal" asChild>
              <Link href="/projects">Back to Projects</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-base">
      <ProjectHero
        project={project}
        logsToday={logsInRange}
        logsTotal={logsTotal}
        errorsToday={errorsInRange}
        errorTrend={errorTrend}
        activeAlerts={activeAlertCount}
        healthScore={healthScore}
        healthStatus={healthStatus}
        selectedRange={selectedTimeRange}
        customRange={customTimeRange}
        onRangeChange={setTimeRange}
        onCustomRangeChange={setCustomTimeRange}
      />

      <div className="flex flex-1 flex-col gap-4 px-8 pt-5 pb-10">
        <div
          className="grid gap-3.5"
          style={{ gridTemplateColumns: "1.4fr 1fr 1fr 1fr" }}
        >
          <MetricCard
            large
            label={`Logs · ${rangeShort}`}
            value={formatN(logsInRange)}
            subtitle={`${formatN(logsTotal)} total · ${logsAvgPerHour}/hr avg`}
            sparkData={logVolumeSeries.length > 1 ? logVolumeSeries : undefined}
            color="var(--signal)"
          />
          <MetricCard
            label={`Errors · ${rangeShort}`}
            value={formatN(errorsInRange)}
            subtitle={`${errorRate.toFixed(2)}% error rate`}
            trend={errorTrend !== 0 ? `${errorTrend}%` : undefined}
            trendDirection={
              errorTrend < 0 ? "down" : errorTrend > 0 ? "up" : "flat"
            }
            sparkData={
              errorVolumeSeries.length > 1 ? errorVolumeSeries : undefined
            }
            color="var(--status-danger)"
          />
          <MetricCard
            label="Response · avg"
            value={avgResponseTime > 0 ? Math.round(avgResponseTime) : "—"}
            unit={avgResponseTime > 0 ? "ms" : undefined}
            subtitle={`${perfHealth} · ${formatN(totalRequests)} requests`}
            sparkData={responseSpark.length > 1 ? responseSpark : undefined}
            color="var(--data-info)"
          />
          <MetricCard
            label="Active Alerts"
            value={activeAlertCount}
            subtitle={
              activeAlertCount === 0
                ? "All quiet"
                : `${criticalAlerts} critical · ${warningAlerts} warning`
            }
            color="var(--status-warn)"
          />
        </div>

        {logVolumeSeries.length > 1 && (
          <VolumeChart
            logs={logVolumeSeries}
            errors={errorVolumeSeries}
            height={140}
            rangeLabel={rangeShort}
            axisTicks={logVolumeAxisTicks}
          />
        )}

        <div
          className="grid gap-3.5"
          style={{ gridTemplateColumns: "1.2fr 1fr" }}
        >
          <div style={{ minHeight: 380, display: "flex" }}>
            <div className="flex-1">
              <ActivityStream items={recentLogs} projectId={projectId} />
            </div>
          </div>
          <div className="flex flex-col gap-3.5" style={{ minHeight: 380 }}>
            <TopErrors errors={topErrors} projectId={projectId} />
            <SlowestEndpoints
              endpoints={slowestEndpoints}
              projectId={projectId}
              isLoading={slowestLoading}
            />
          </div>
        </div>

        <div
          className="grid gap-3.5"
          style={{ gridTemplateColumns: "1fr 2fr" }}
        >
          <EventTimeline events={recentEvents} isLoading={recentEventsLoading} />
          <div className="flex flex-col gap-3.5">
            <div className="px-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
              Quick Navigation
            </div>
            <QuickLinksBar projectId={projectId} />
            <SdkStatusCard
              isActive={!!project.isActive}
              logCount={project.logCount ?? 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
