"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, TrendingUp, TrendingDown, Clock, Hash } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useApperioStore } from "@/store/apperio-store";
import {
  useErrorTimeline,
  useTopErrors,
  useErrorDistribution,
  useErrorStats,
  useErrorTrends,
} from "@/hooks/analytics.hook";
import { formatCompact, computeChange, resolveTimeRangeParams } from "@/lib/format-utils";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { Sparkline } from "@/components/shared/Sparkline";
import { TabLayout } from "@/components/shared/TabLayout";
import { TimeSeriesChart } from "@/components/shared/TimeSeriesChart";
import { DistributionChart } from "@/components/shared/DistributionChart";
import { SkeletonDashboard } from "@/components/shared/SkeletonDashboard";
import { SignalDot } from "@/components/shared/SignalDot";
import { ViewToggle, type ViewMode } from "@/components/shared/ViewToggle";
import { CHART_COLORS } from "@/lib/charts/observatory-theme";
import { useAnomalies } from "@/hooks/anomaly.hook";
import { useDeployMarkers } from "@/hooks/changes.hooks";

// ---------------------------------------------------------------------------
// Types for API response shapes
// ---------------------------------------------------------------------------

interface ErrorTimelinePoint {
  timestamp: string;
  count: number;
  [key: string]: string | number;
}

interface TopError {
  _id: string;
  name: string;
  message: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  status?: string;
}

interface ErrorDistributionItem {
  name: string;
  value: number;
  color?: string;
}

interface ErrorStatsData {
  totalErrors: number;
  errorRate: number;
  previousTotalErrors?: number;
  previousErrorRate?: number;
  trendPercentage?: number;
  topError?: string;
}

interface ErrorTrendPoint {
  timestamp: string;
  error: number;
  warn: number;
  fatal: number;
  [key: string]: string | number;
}

// ---------------------------------------------------------------------------
// Tabs Configuration
// ---------------------------------------------------------------------------

const ERROR_TABS = [
  { id: "timeline", label: "Timeline", icon: <Clock className="w-4 h-4" /> },
  { id: "distribution", label: "Distribution", icon: <Hash className="w-4 h-4" /> },
  { id: "top-errors", label: "Top Errors", icon: <AlertTriangle className="w-4 h-4" /> },
  { id: "trends", label: "Trends", icon: <TrendingUp className="w-4 h-4" /> },
];

// ---------------------------------------------------------------------------
// Helper: compute trend direction for MetricCard (wraps computeChange)
// ---------------------------------------------------------------------------

function computeTrend(current: number, previous: number | undefined) {
  if (previous === undefined || previous === 0) return null;
  const info = computeChange(current, previous);
  return {
    direction: info.direction,
    value: `${Math.abs(info.value).toFixed(1)}%`,
  };
}

// ---------------------------------------------------------------------------
// Helper: format timestamp for chart axis
// ---------------------------------------------------------------------------

function formatChartTimestamp(value: string): string {
  try {
    const date = new Date(value);
    return format(date, "MMM dd HH:mm");
  } catch {
    return value;
  }
}

// ---------------------------------------------------------------------------
// Top Errors Table
// ---------------------------------------------------------------------------

function TopErrorsTable({
  errors,
  projectId,
  viewMode = "table",
}: {
  errors: TopError[];
  projectId: string;
  viewMode?: ViewMode;
}) {
  const router = useRouter();

  if (!errors || errors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <SignalDot status="ok" size="lg" pulse={false} className="mb-3" />
        <p className="text-text-secondary text-sm font-body">No errors recorded</p>
        <p className="text-text-muted text-xs mt-1">
          Errors will appear here when your application reports them.
        </p>
      </div>
    );
  }

  if (viewMode === "cards") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {errors.map((error) => (
          <button
            key={error._id}
            onClick={() => router.push(`/projects/${projectId}/errors/${error._id}`)}
            className="rounded-lg border border-border-subtle bg-bg-surface hover:bg-bg-elevated/50 transition-colors cursor-pointer group p-4 text-left space-y-3"
          >
            {/* Top row: name + count badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text-primary font-medium truncate group-hover:text-signal transition-colors">
                  {error.name}
                </p>
                <p className="text-xs text-text-muted truncate mt-0.5">{error.message}</p>
              </div>
              <span className="shrink-0 text-sm font-mono font-semibold text-status-danger bg-status-danger/10 px-2 py-0.5 rounded">
                {formatCompact(error.count)}
              </span>
            </div>

            {/* Timestamps */}
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span>
                First:{" "}
                {error.firstSeen
                  ? formatDistanceToNow(new Date(error.firstSeen), { addSuffix: true })
                  : "--"}
              </span>
              <span>
                Last:{" "}
                {error.lastSeen
                  ? formatDistanceToNow(new Date(error.lastSeen), { addSuffix: true })
                  : "--"}
              </span>
            </div>

            {/* Status */}
            <div>
              {error.status === "resolved" ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-status-ok/10 text-status-ok text-xs">
                  <SignalDot status="ok" size="sm" pulse={false} />
                  Resolved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-status-danger/10 text-status-danger text-xs">
                  <SignalDot status="danger" size="sm" />
                  Active
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_80px_140px_140px_90px] gap-4 px-4 py-3 border-b border-border-subtle bg-bg-base">
        <span className="text-xs font-body text-text-muted uppercase tracking-wider">Error Name</span>
        <span className="text-xs font-body text-text-muted uppercase tracking-wider text-right">Count</span>
        <span className="text-xs font-body text-text-muted uppercase tracking-wider">First Seen</span>
        <span className="text-xs font-body text-text-muted uppercase tracking-wider">Last Seen</span>
        <span className="text-xs font-body text-text-muted uppercase tracking-wider">Status</span>
      </div>

      {/* Table rows */}
      {errors.map((error) => (
        <button
          key={error._id}
          onClick={() => router.push(`/projects/${projectId}/errors/${error._id}`)}
          className="grid grid-cols-[1fr_80px_140px_140px_90px] gap-4 px-4 py-3 border-b border-border-subtle last:border-b-0 w-full text-left hover:bg-bg-elevated/50 transition-colors group"
        >
          <div className="min-w-0">
            <p className="text-sm text-text-primary font-medium truncate group-hover:text-signal transition-colors">
              {error.name}
            </p>
            <p className="text-xs text-text-muted truncate mt-0.5">{error.message}</p>
          </div>
          <span className="text-sm font-mono text-status-danger text-right font-semibold">
            {formatCompact(error.count)}
          </span>
          <span className="text-xs text-text-muted font-mono">
            {error.firstSeen
              ? formatDistanceToNow(new Date(error.firstSeen), { addSuffix: true })
              : "--"}
          </span>
          <span className="text-xs text-text-muted font-mono">
            {error.lastSeen
              ? formatDistanceToNow(new Date(error.lastSeen), { addSuffix: true })
              : "--"}
          </span>
          <span className="text-xs">
            {error.status === "resolved" ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-status-ok/10 text-status-ok">
                <SignalDot status="ok" size="sm" pulse={false} />
                Resolved
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-status-danger/10 text-status-danger">
                <SignalDot status="danger" size="sm" />
                Active
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function ErrorAnalyticsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = typeof params?.projectId === "string" ? params.projectId : "";

  const [topErrorsView, setTopErrorsView] = useState<ViewMode>("table");
  const selectedTimeRange = useApperioStore((s) => s.selectedTimeRange);
  const customTimeRange = useApperioStore((s) => s.customTimeRange);
  const timeRangeParams = useMemo(
    () => resolveTimeRangeParams(selectedTimeRange, customTimeRange),
    [selectedTimeRange, customTimeRange]
  );

  // Data hooks
  const {
    data: timelineData,
    isLoading: timelineLoading,
  } = useErrorTimeline(projectId, timeRangeParams);

  const {
    data: topErrorsData,
    isLoading: topErrorsLoading,
  } = useTopErrors(projectId, { ...timeRangeParams, limit: 20 });

  const {
    data: distributionData,
    isLoading: distributionLoading,
  } = useErrorDistribution(projectId, timeRangeParams);

  const {
    data: statsData,
    isLoading: statsLoading,
  } = useErrorStats(projectId, timeRangeParams);

  const {
    data: trendsData,
    isLoading: trendsLoading,
  } = useErrorTrends(projectId, timeRangeParams);

  // Anomaly data for chart overlays
  const { data: anomalyData } = useAnomalies(projectId, {
    type: "error_rate_increase",
    resolved: false,
    limit: 20,
  });

  const anomalyMarkers = useMemo(() => {
    const anomalies = Array.isArray(anomalyData) ? anomalyData : (anomalyData as any)?.data ?? [];
    return anomalies.map((a: any) => ({
      timestamp: a.detectedAt,
      severity: a.severity as "critical" | "warning" | "info",
      label: "!",
    }));
  }, [anomalyData]);

  // Deploy markers for chart overlays (Phase 7 Change Intelligence)
  const markerRange = useMemo(() => {
    if (selectedTimeRange === "custom" && customTimeRange) {
      return { from: customTimeRange.start, to: customTimeRange.end };
    }
    const rangeMs: Record<string, number> = {
      "1h": 60 * 60 * 1000,
      "6h": 6 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };
    const ms = rangeMs[selectedTimeRange] ?? rangeMs["24h"];
    return { from: new Date(Date.now() - ms), to: new Date() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTimeRange, customTimeRange, timeRangeParams]);

  const { data: deployMarkerData } = useDeployMarkers(
    projectId,
    markerRange.from,
    markerRange.to
  );

  // Normalize data — handle both raw arrays and wrapped objects from API
  const extractArray = <T,>(raw: unknown, ...keys: string[]): T[] => {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object") {
      for (const key of keys) {
        const val = (raw as Record<string, unknown>)[key];
        if (Array.isArray(val)) return val;
      }
    }
    return [];
  };

  const stats: ErrorStatsData | null =
    statsData && typeof statsData === "object" && !Array.isArray(statsData)
      ? (statsData as ErrorStatsData)
      : null;
  const timeline: ErrorTimelinePoint[] = extractArray(timelineData, "timeline", "data");

  // Snap deploy markers to the nearest timeline bucket so the categorical
  // x-axis can place the reference line
  const deployMarkerLines = useMemo(() => {
    if (!deployMarkerData?.length || !timeline.length) return [];
    const buckets = timeline.map((p) => ({
      ts: p.timestamp,
      time: +new Date(p.timestamp),
    }));
    return deployMarkerData.map((m) => {
      const target = +new Date(m.date);
      let nearest = buckets[0];
      for (const b of buckets) {
        if (Math.abs(b.time - target) < Math.abs(nearest.time - target)) {
          nearest = b;
        }
      }
      return {
        timestamp: nearest.ts,
        label: m.kind === "release" ? m.release || "Release" : "Deploy",
        verdict: m.verdict as "healthy" | "improved" | "degraded" | "unknown" | undefined,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deployMarkerData, timeline]);
  const topErrors: TopError[] = extractArray(topErrorsData, "errors", "topErrors", "data");
  const distribution: ErrorDistributionItem[] = extractArray(distributionData, "distribution", "data");
  const trends: ErrorTrendPoint[] = extractArray(trendsData, "trends", "data");

  // Derived values for metric cards
  const totalErrors = stats?.totalErrors ?? 0;
  const errorRate = stats?.errorRate ?? 0;
  const trendInfo = computeTrend(totalErrors, stats?.previousTotalErrors);
  const topErrorName: string =
    stats?.topError
    ?? (topErrors.length > 0 ? topErrors[0]?.name : undefined)
    ?? "None";

  // Sparkline data: error counts from the timeline series
  const errorSparklineData = useMemo(
    () => timeline.map((pt) => pt.count ?? 0),
    [timeline]
  );

  // Loading state
  const isCriticalLoading = statsLoading;

  if (isCriticalLoading) {
    return (
      <div className="p-6 bg-bg-base min-h-full">
        <PageHeader
          title="Error Analytics"
          description="Error trends and distribution"
        />
        <SkeletonDashboard />
      </div>
    );
  }

  return (
    <div className="p-6 bg-bg-base min-h-full space-y-6">
      {/* Header */}
      <PageHeader
        title="Error Analytics"
        description="Error trends and distribution"
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Errors"
          value={formatCompact(totalErrors)}
          variant="danger"
          icon={<AlertTriangle className="w-4 h-4" />}
          sparkline={
            errorSparklineData.length >= 2 ? (
              <Sparkline data={errorSparklineData} color="var(--status-danger)" />
            ) : undefined
          }
        />
        <MetricCard
          label="Error Rate"
          value={`${errorRate.toFixed(2)}%`}
          variant={errorRate > 5 ? "danger" : errorRate > 1 ? "warning" : "default"}
          trend={
            stats?.previousErrorRate !== undefined
              ? computeTrend(errorRate, stats.previousErrorRate) ?? undefined
              : undefined
          }
        />
        <MetricCard
          label="Trend"
          value={
            trendInfo
              ? `${trendInfo.direction === "up" ? "+" : trendInfo.direction === "down" ? "-" : ""}${trendInfo.value}`
              : "N/A"
          }
          icon={
            trendInfo?.direction === "up" ? (
              <TrendingUp className="w-4 h-4 text-status-danger" />
            ) : trendInfo?.direction === "down" ? (
              <TrendingDown className="w-4 h-4 text-status-ok" />
            ) : undefined
          }
          subtitle="vs previous period"
        />
        <MetricCard
          label="Most Common Error"
          value={
            topErrorName.length > 24
              ? topErrorName.slice(0, 24) + "..."
              : topErrorName
          }
          subtitle={topErrors.length > 0 && topErrors[0]?.count != null ? `${formatCompact(topErrors[0].count)} occurrences` : undefined}
        />
      </div>

      {/* Tabbed Content */}
      <TabLayout tabs={ERROR_TABS} defaultTab="timeline">
        {(activeTab) => {
          // ---- Timeline Tab ----
          if (activeTab === "timeline") {
            if (timelineLoading) {
              return (
                <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
                  <div className="animate-pulse h-[300px] bg-bg-elevated rounded" />
                </div>
              );
            }
            if (!timeline || timeline.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-border-subtle bg-bg-surface">
                  <SignalDot status="ok" size="lg" pulse={false} className="mb-3" />
                  <p className="text-text-secondary text-sm">No errors recorded</p>
                  <p className="text-text-muted text-xs mt-1">
                    Error timeline data will appear here once errors are reported.
                  </p>
                </div>
              );
            }
            return (
              <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
                <h3 className="text-sm font-display font-semibold text-text-primary mb-4">
                  Error Count Over Time
                </h3>
                <TimeSeriesChart
                  data={timeline}
                  series={[
                    {
                      key: "count",
                      label: "Errors",
                      color: CHART_COLORS.danger,
                      type: "area",
                    },
                  ]}
                  height={320}
                  formatXAxis={formatChartTimestamp}
                  showLegend={false}
                  anomalies={anomalyMarkers}
                  deployMarkers={deployMarkerLines}
                />
              </div>
            );
          }

          // ---- Distribution Tab ----
          if (activeTab === "distribution") {
            if (distributionLoading) {
              return (
                <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
                  <div className="animate-pulse h-[300px] bg-bg-elevated rounded" />
                </div>
              );
            }
            if (!distribution || distribution.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-border-subtle bg-bg-surface">
                  <SignalDot status="ok" size="lg" pulse={false} className="mb-3" />
                  <p className="text-text-secondary text-sm">No errors recorded</p>
                  <p className="text-text-muted text-xs mt-1">
                    Error distribution data will appear here once errors are reported.
                  </p>
                </div>
              );
            }
            return (
              <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
                <h3 className="text-sm font-display font-semibold text-text-primary mb-4">
                  Error Distribution by Type
                </h3>
                <DistributionChart
                  data={distribution}
                  height={360}
                  showLegend
                  showLabels
                />
              </div>
            );
          }

          // ---- Top Errors Tab ----
          if (activeTab === "top-errors") {
            if (topErrorsLoading) {
              return (
                <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="animate-pulse h-14 bg-bg-elevated rounded" />
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-display font-semibold text-text-primary">
                    Top Errors by Occurrence
                  </h3>
                  <ViewToggle mode={topErrorsView} onChange={setTopErrorsView} />
                </div>
                <TopErrorsTable errors={topErrors} projectId={projectId} viewMode={topErrorsView} />
              </div>
            );
          }

          // ---- Trends Tab ----
          if (activeTab === "trends") {
            if (trendsLoading) {
              return (
                <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
                  <div className="animate-pulse h-[300px] bg-bg-elevated rounded" />
                </div>
              );
            }
            if (!trends || trends.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-border-subtle bg-bg-surface">
                  <SignalDot status="ok" size="lg" pulse={false} className="mb-3" />
                  <p className="text-text-secondary text-sm">No errors recorded</p>
                  <p className="text-text-muted text-xs mt-1">
                    Trend data will appear here once errors are reported.
                  </p>
                </div>
              );
            }
            return (
              <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
                <h3 className="text-sm font-display font-semibold text-text-primary mb-4">
                  Error Level Trends
                </h3>
                <TimeSeriesChart
                  data={trends}
                  series={[
                    {
                      key: "error",
                      label: "Error",
                      color: CHART_COLORS.danger,
                      type: "line",
                    },
                    {
                      key: "warn",
                      label: "Warning",
                      color: CHART_COLORS.warn,
                      type: "line",
                    },
                    {
                      key: "fatal",
                      label: "Fatal",
                      color: "#c0392b",
                      type: "line",
                      strokeDasharray: "4 4",
                    },
                  ]}
                  height={320}
                  formatXAxis={formatChartTimestamp}
                  showLegend
                />
              </div>
            );
          }

          return null;
        }}
      </TabLayout>
    </div>
  );
}
