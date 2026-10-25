"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useApperioStore } from "@/store/apperio-store";
import { resolveTimeRangeParams } from "@/lib/format-utils";
import { useDetectRegressions, useBaseline } from "@/hooks/regression.hook";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { TimeSeriesChart } from "@/components/shared/TimeSeriesChart";
import { SkeletonDashboard } from "@/components/shared/SkeletonDashboard";
import { SignalDot } from "@/components/shared/SignalDot";
import { Button } from "@/components/ui/button";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  Shield,
  TrendingDown,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RegressionEntry {
  metric: string;
  currentValue: number;
  baselineValue: number;
  zScore: number;
  detectedAt?: string;
  status?: "new" | "acknowledged" | "resolved";
  severity?: "low" | "medium" | "high" | "critical";
  change?: number;
  changePercent?: number;
  unit?: string;
}

interface BaselineData {
  period?: string;
  timeRange?: string;
  metrics?: Record<
    string,
    {
      mean: number;
      stddev: number;
      p50?: number;
      p95?: number;
      p99?: number;
    }
  >;
  timeseries?: Array<{
    timestamp: string;
    baseline?: number;
    current?: number;
    [key: string]: string | number | undefined;
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatValue(val: number | undefined | null, unit?: string): string {
  if (val == null || isNaN(val)) return "--";
  if (unit === "ms") {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}s`;
    return `${Math.round(val)}ms`;
  }
  if (unit === "%") return `${val.toFixed(1)}%`;
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return val.toFixed(1);
}

function formatZScore(z: number | undefined | null): string {
  if (z == null || isNaN(z)) return "--";
  return z.toFixed(2);
}

function zScoreSeverity(z: number | undefined | null): "low" | "medium" | "high" | "critical" {
  if (z == null || isNaN(z)) return "low";
  const absZ = Math.abs(z);
  if (absZ >= 4) return "critical";
  if (absZ >= 3) return "high";
  if (absZ >= 2) return "medium";
  return "low";
}

function severityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "text-status-danger";
    case "high":
      return "text-status-danger";
    case "medium":
      return "text-status-warn";
    default:
      return "text-data-info";
  }
}

function severityBgColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-status-danger/10 border-status-danger/20";
    case "high":
      return "bg-status-danger/10 border-status-danger/20";
    case "medium":
      return "bg-status-warn/10 border-status-warn/20";
    default:
      return "bg-data-info/10 border-data-info/20";
  }
}

function statusSignal(status: string | undefined): "danger" | "warn" | "ok" {
  if (status === "new") return "danger";
  if (status === "acknowledged") return "warn";
  return "ok";
}

function statusLabel(status: string | undefined): string {
  if (status === "acknowledged") return "Acknowledged";
  if (status === "resolved") return "Resolved";
  return "New";
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "--";
  try {
    const date = new Date(iso);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--";
  }
}

// ---------------------------------------------------------------------------
// Regression Row (expandable)
// ---------------------------------------------------------------------------

function RegressionRow({ entry }: { entry: RegressionEntry }) {
  const [expanded, setExpanded] = useState(false);
  const severity = entry.severity || zScoreSeverity(entry.zScore);

  const changeVal = entry.changePercent ?? entry.change;
  const isIncrease = (changeVal ?? entry.zScore) > 0;

  return (
    <>
      <tr
        className="border-t border-border-subtle hover:bg-bg-elevated/50 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button className="text-text-muted hover:text-text-primary transition-colors">
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <span className="text-text-primary text-xs font-mono font-medium">
              {entry.metric}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-right text-text-primary text-xs font-mono">
          {formatValue(entry.currentValue, entry.unit)}
        </td>
        <td className="px-4 py-3 text-right text-text-muted text-xs font-mono">
          {formatValue(entry.baselineValue, entry.unit)}
        </td>
        <td className="px-4 py-3 text-right">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium border ${severityBgColor(severity)} ${severityColor(severity)}`}
          >
            {isIncrease ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {formatZScore(entry.zScore)}
          </span>
        </td>
        <td className="px-4 py-3 text-right text-text-muted text-xs font-mono">
          {formatDate(entry.detectedAt)}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <SignalDot
              status={statusSignal(entry.status)}
              size="sm"
              pulse={entry.status === "new"}
            />
            <span className="text-xs text-text-secondary">
              {statusLabel(entry.status)}
            </span>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-bg-elevated/20">
          <td colSpan={6} className="px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-text-muted block mb-1">Severity</span>
                <span className={`font-medium capitalize ${severityColor(severity)}`}>
                  {severity}
                </span>
              </div>
              <div>
                <span className="text-text-muted block mb-1">Change</span>
                <span className="text-text-primary font-mono">
                  {changeVal != null
                    ? `${isIncrease ? "+" : ""}${changeVal.toFixed(1)}%`
                    : "--"}
                </span>
              </div>
              <div>
                <span className="text-text-muted block mb-1">Z-Score</span>
                <span className="text-text-primary font-mono">
                  {formatZScore(entry.zScore)}
                  {entry.zScore != null && !isNaN(entry.zScore)
                    ? ` (${Math.abs(entry.zScore).toFixed(1)} standard deviations)`
                    : ""}
                </span>
              </div>
              <div>
                <span className="text-text-muted block mb-1">Impact</span>
                <span className="text-text-primary font-mono">
                  {entry.currentValue !== entry.baselineValue
                    ? `${formatValue(entry.baselineValue, entry.unit)} -> ${formatValue(entry.currentValue, entry.unit)}`
                    : "No change"}
                </span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function RegressionsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = typeof params?.projectId === "string" ? params.projectId : "";

  const selectedTimeRange = useApperioStore((s) => s.selectedTimeRange);
  const customTimeRange = useApperioStore((s) => s.customTimeRange);
  const timeParams = useMemo(
    () => resolveTimeRangeParams(selectedTimeRange, customTimeRange),
    [selectedTimeRange, customTimeRange]
  );

  const {
    data: regressionsRaw,
    isLoading: regressionsLoading,
    refetch: refetchRegressions,
  } = useDetectRegressions(projectId, timeParams);

  const {
    data: baselineRaw,
    isLoading: baselineLoading,
  } = useBaseline(projectId, timeParams);

  const regressions: RegressionEntry[] = (() => {
    if (Array.isArray(regressionsRaw)) return regressionsRaw;
    if (regressionsRaw && typeof regressionsRaw === "object") {
      const raw = regressionsRaw as Record<string, unknown>;
      if (Array.isArray(raw.regressions)) return raw.regressions;
      if (Array.isArray(raw.data)) return raw.data;
    }
    return [];
  })();

  const baseline: BaselineData | null =
    baselineRaw && typeof baselineRaw === "object" ? (baselineRaw as BaselineData) : null;

  const isLoading = regressionsLoading && baselineLoading;

  // Compute metric card values
  const regressionCount = regressions.length;
  const avgZScore =
    regressions.length > 0
      ? regressions.reduce((sum, r) => sum + Math.abs(r.zScore ?? 0), 0) / regressions.length
      : 0;
  const baselinePeriod = baseline?.period ?? baseline?.timeRange ?? selectedTimeRange;
  const criticalCount = regressions.filter(
    (r) => (r.severity || zScoreSeverity(r.zScore)) === "critical"
  ).length;

  // Prepare baseline chart data
  const timeseriesData = baseline?.timeseries ?? [];

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="space-y-6 bg-bg-base min-h-screen">
        <PageHeader
          title="Performance Regressions"
          description="Detect degradations from baseline"
        />
        <SkeletonDashboard />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------

  if (regressions.length === 0 && !regressionsLoading) {
    return (
      <div className="space-y-6 bg-bg-base min-h-screen">
        <PageHeader
          title="Performance Regressions"
          description="Detect degradations from baseline"
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchRegressions()}
              className="gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          }
        />

        {/* Metric cards even in empty state */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            label="Regressions Detected"
            value="0"
            icon={<AlertTriangle className="w-4 h-4" />}
            variant="success"
          />
          <MetricCard
            label="Avg Z-Score"
            value="--"
            icon={<BarChart3 className="w-4 h-4" />}
          />
          <MetricCard
            label="Baseline Period"
            value={baselinePeriod ?? "--"}
            icon={<Clock className="w-4 h-4" />}
          />
        </div>

        <div className="bg-bg-surface border border-border-subtle rounded-lg p-12 text-center">
          <Shield className="w-12 h-12 text-status-ok mx-auto mb-4" />
          <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
            No regressions detected
          </h3>
          <p className="text-text-muted text-sm max-w-md mx-auto">
            Your performance is stable! All metrics are within their expected
            baselines. Regressions will appear here when response times or
            error rates deviate significantly from normal.
          </p>
        </div>

        {/* Baseline chart if data exists */}
        {timeseriesData.length > 0 && (
          <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
            <h3 className="text-sm font-display font-semibold text-text-primary mb-4">
              Baseline vs Current
            </h3>
            <TimeSeriesChart
              data={timeseriesData as Array<{ timestamp: string; [key: string]: string | number }>}
              series={[
                {
                  key: "baseline",
                  label: "Baseline",
                  color: "var(--chart-2)",
                  type: "area",
                },
                {
                  key: "current",
                  label: "Current",
                  color: "var(--chart-1)",
                  type: "line",
                },
              ]}
              height={300}
              showLegend
            />
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render with regressions
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6 bg-bg-base min-h-screen">
      <PageHeader
        title="Performance Regressions"
        description="Detect degradations from baseline"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchRegressions()}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Regressions Detected"
          value={regressionCount}
          icon={<AlertTriangle className="w-4 h-4" />}
          variant={regressionCount > 0 ? "danger" : "success"}
        />
        <MetricCard
          label="Avg Z-Score"
          value={formatZScore(avgZScore)}
          icon={<BarChart3 className="w-4 h-4" />}
          variant={
            avgZScore >= 3 ? "danger" : avgZScore >= 2 ? "warning" : "default"
          }
          subtitle={
            avgZScore >= 3
              ? "Significant deviation"
              : avgZScore >= 2
              ? "Moderate deviation"
              : "Minor deviation"
          }
        />
        <MetricCard
          label="Critical Issues"
          value={criticalCount}
          icon={<Activity className="w-4 h-4" />}
          variant={criticalCount > 0 ? "danger" : "success"}
        />
        <MetricCard
          label="Baseline Period"
          value={baselinePeriod ?? "--"}
          icon={<Clock className="w-4 h-4" />}
        />
      </div>

      {/* Baseline Chart */}
      {timeseriesData.length > 0 && (
        <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
          <h3 className="text-sm font-display font-semibold text-text-primary mb-4">
            Baseline vs Current Period
          </h3>
          <TimeSeriesChart
            data={timeseriesData as Array<{ timestamp: string; [key: string]: string | number }>}
            series={[
              {
                key: "baseline",
                label: "Baseline",
                color: "var(--chart-2)",
                type: "area",
              },
              {
                key: "current",
                label: "Current",
                color: "var(--chart-1)",
                type: "line",
              },
            ]}
            height={340}
            showLegend
            showBrush={timeseriesData.length > 30}
          />
        </div>
      )}

      {/* Regression List Table */}
      <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
        <h3 className="text-sm font-display font-semibold text-text-primary mb-4">
          Detected Regressions
        </h3>
        <div className="rounded-lg border border-border-subtle overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-bg-surface">
                <th className="text-left text-text-muted text-xs uppercase tracking-wider font-medium px-4 py-3">
                  Metric
                </th>
                <th className="text-right text-text-muted text-xs uppercase tracking-wider font-medium px-4 py-3">
                  Current
                </th>
                <th className="text-right text-text-muted text-xs uppercase tracking-wider font-medium px-4 py-3">
                  Baseline
                </th>
                <th className="text-right text-text-muted text-xs uppercase tracking-wider font-medium px-4 py-3">
                  Z-Score
                </th>
                <th className="text-right text-text-muted text-xs uppercase tracking-wider font-medium px-4 py-3">
                  Detected At
                </th>
                <th className="text-right text-text-muted text-xs uppercase tracking-wider font-medium px-4 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {regressions.map((entry, i) => (
                <RegressionRow key={i} entry={entry} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
