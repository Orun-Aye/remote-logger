"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useApperioStore } from "@/store/apperio-store";
import { useEnvironmentStats } from "@/hooks/analytics.hook";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { ObservatoryBarChart } from "@/components/shared/ObservatoryBarChart";
import { SkeletonDashboard } from "@/components/shared/SkeletonDashboard";
import { SignalDot } from "@/components/shared/SignalDot";
import {
  formatDuration,
  formatPercent as sharedFormatPercent,
  formatCompact,
  resolveTimeRangeParams,
} from "@/lib/format-utils";
import {
  Globe,
  Server,
  AlertTriangle,
  Clock,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EnvironmentEntryRaw {
  environment: string;
  name?: string;
  logCount?: number;
  totalLogs?: number;
  errorCount: number;
  errorRate: number;
  avgResponseTime?: number;
  warnCount?: number;
  lastActivity?: string;
}

interface EnvironmentEntry {
  environment: string;
  name?: string;
  logCount: number;
  errorCount: number;
  errorRate: number;
  avgResponseTime?: number;
  warnCount?: number;
  lastActivity?: string;
}

// ---------------------------------------------------------------------------
// Helpers (thin wrappers preserving "--" for missing values)
// ---------------------------------------------------------------------------

function formatMs(ms: number | undefined | null): string {
  if (ms == null || isNaN(ms)) return "--";
  return formatDuration(ms);
}

function formatPercent(val: number | undefined | null): string {
  if (val == null || isNaN(val)) return "--";
  return sharedFormatPercent(val);
}

function formatCount(val: number | undefined | null): string {
  if (val == null || isNaN(val)) return "--";
  return formatCompact(val);
}

function envHealthStatus(errorRate: number): "ok" | "warn" | "danger" {
  if (errorRate >= 5) return "danger";
  if (errorRate >= 1) return "warn";
  return "ok";
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
// Environment Comparison Table
// ---------------------------------------------------------------------------

function EnvironmentTable({
  environments,
  projectId,
}: {
  environments: EnvironmentEntry[];
  projectId: string;
}) {
  if (environments.length === 0) return null;

  const sorted = [...environments].sort((a, b) => b.logCount - a.logCount);

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
      <h3 className="text-sm font-display font-semibold text-text-primary mb-4">
        Environment Comparison
      </h3>
      <div className="rounded-lg border border-border-subtle overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-bg-surface">
              <th className="text-left text-text-muted text-xs uppercase tracking-wider font-medium px-4 py-3">
                Environment
              </th>
              <th className="text-right text-text-muted text-xs uppercase tracking-wider font-medium px-4 py-3">
                Log Count
              </th>
              <th className="text-right text-text-muted text-xs uppercase tracking-wider font-medium px-4 py-3">
                Error Count
              </th>
              <th className="text-right text-text-muted text-xs uppercase tracking-wider font-medium px-4 py-3">
                Error Rate
              </th>
              <th className="text-right text-text-muted text-xs uppercase tracking-wider font-medium px-4 py-3">
                Avg Response Time
              </th>
              <th className="text-center text-text-muted text-xs uppercase tracking-wider font-medium px-4 py-3">
                Status
              </th>
              <th className="text-right text-text-muted text-xs uppercase tracking-wider font-medium px-4 py-3">
                Last Activity
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((env, i) => {
              const envName = env.environment || env.name || "unknown";
              const healthStatus = envHealthStatus(env.errorRate);

              return (
                <tr
                  key={i}
                  className="border-t border-border-subtle even:bg-bg-elevated/30 hover:bg-bg-elevated/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Server className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <span className="text-text-primary text-xs font-mono font-medium">
                        {envName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-text-primary text-xs font-mono">
                    {formatCount(env.logCount)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-mono">
                    <span className={env.errorCount > 0 ? "text-status-danger" : "text-text-primary"}>
                      {formatCount(env.errorCount)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-mono">
                    <span
                      className={
                        env.errorRate >= 5
                          ? "text-status-danger"
                          : env.errorRate >= 1
                          ? "text-status-warn"
                          : "text-status-ok"
                      }
                    >
                      {formatPercent(env.errorRate)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-text-primary text-xs font-mono">
                    {formatMs(env.avgResponseTime)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <SignalDot
                        status={healthStatus}
                        size="sm"
                        pulse={healthStatus === "danger"}
                      />
                      <span className="text-xs text-text-secondary capitalize">
                        {healthStatus === "ok"
                          ? "Healthy"
                          : healthStatus === "warn"
                          ? "Degraded"
                          : "Unhealthy"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-text-muted text-xs font-mono">
                    {formatDate(env.lastActivity)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/projects/${projectId}/logs?environment=${encodeURIComponent(envName)}`}
                      className="inline-flex items-center gap-1 text-xs text-data-info hover:text-signal transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Logs
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function EnvironmentsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = typeof params?.projectId === "string" ? params.projectId : "";

  const selectedTimeRange = useApperioStore((s) => s.selectedTimeRange);
  const customTimeRange = useApperioStore((s) => s.customTimeRange);
  const timeParams = useMemo(
    () => resolveTimeRangeParams(selectedTimeRange, customTimeRange),
    [selectedTimeRange, customTimeRange]
  );

  const {
    data: envStatsRaw,
    isLoading,
  } = useEnvironmentStats(projectId, timeParams);

  const rawEnvironments: EnvironmentEntryRaw[] = Array.isArray(envStatsRaw)
    ? envStatsRaw
    : envStatsRaw?.environments ?? [];

  // Normalize field names: backend returns `totalLogs`, frontend uses `logCount`
  const environments: EnvironmentEntry[] = rawEnvironments.map((e) => ({
    ...e,
    logCount: e.logCount ?? e.totalLogs ?? 0,
  }));

  // Derived metrics
  const totalEnvironments = environments.length;
  const totalLogs = environments.reduce((sum, e) => sum + (e.logCount ?? 0), 0);
  const totalErrors = environments.reduce((sum, e) => sum + (e.errorCount ?? 0), 0);
  const overallErrorRate = totalLogs > 0 ? (totalErrors / totalLogs) * 100 : 0;
  const unhealthyCount = environments.filter((e) => e.errorRate >= 5).length;

  // Bar chart: Log volume by environment
  const volumeChartData = environments
    .sort((a, b) => b.logCount - a.logCount)
    .slice(0, 12)
    .map((e) => ({
      name: e.environment || e.name || "unknown",
      logs: e.logCount,
      errors: e.errorCount,
    }));

  // Bar chart: Error rates by environment
  const errorRateChartData = environments
    .filter((e) => e.errorRate > 0)
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, 12)
    .map((e) => ({
      name: e.environment || e.name || "unknown",
      errorRate: Math.round(e.errorRate * 10) / 10,
    }));

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="space-y-6 bg-bg-base min-h-screen">
        <PageHeader
          title="Environments"
          description="Compare metrics across environments"
        />
        <SkeletonDashboard />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------

  if (environments.length === 0) {
    return (
      <div className="space-y-6 bg-bg-base min-h-screen">
        <PageHeader
          title="Environments"
          description="Compare metrics across environments"
        />
        <div className="bg-bg-surface border border-border-subtle rounded-lg p-12 text-center">
          <Globe className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
            No environment data available
          </h3>
          <p className="text-text-muted text-sm max-w-md mx-auto">
            Environment comparisons will appear here once your logs include
            environment metadata. Configure the SDK with an environment value
            (e.g., "production", "staging", "development") to start tracking.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6 bg-bg-base min-h-screen">
      <PageHeader
        title="Environments"
        description="Compare metrics across environments"
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Environments"
          value={totalEnvironments}
          icon={<Globe className="w-4 h-4" />}
        />
        <MetricCard
          label="Total Logs"
          value={formatCount(totalLogs)}
          icon={<BarChart3 className="w-4 h-4" />}
        />
        <MetricCard
          label="Overall Error Rate"
          value={formatPercent(overallErrorRate)}
          icon={<AlertTriangle className="w-4 h-4" />}
          variant={
            overallErrorRate >= 5
              ? "danger"
              : overallErrorRate >= 1
              ? "warning"
              : "success"
          }
        />
        <MetricCard
          label="Unhealthy Envs"
          value={unhealthyCount}
          icon={<Clock className="w-4 h-4" />}
          variant={unhealthyCount > 0 ? "danger" : "success"}
          subtitle={
            unhealthyCount > 0
              ? `${unhealthyCount} environment${unhealthyCount > 1 ? "s" : ""} with >5% error rate`
              : "All environments healthy"
          }
        />
      </div>

      {/* Environment Table */}
      <EnvironmentTable environments={environments} projectId={projectId} />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Log Volume Chart */}
        {volumeChartData.length > 0 && (
          <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
            <h3 className="text-sm font-display font-semibold text-text-primary mb-4">
              Log Volume by Environment
            </h3>
            <ObservatoryBarChart
              data={volumeChartData}
              series={[
                {
                  key: "logs",
                  label: "Logs",
                  color: "var(--chart-1)",
                  stackId: "stack",
                },
                {
                  key: "errors",
                  label: "Errors",
                  color: "var(--chart-4)",
                  stackId: "stack",
                },
              ]}
              layout="horizontal"
              height={Math.max(250, volumeChartData.length * 36)}
              showLegend
              formatValue={(val: number) => formatCount(val)}
            />
          </div>
        )}

        {/* Error Rate Chart */}
        {errorRateChartData.length > 0 && (
          <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
            <h3 className="text-sm font-display font-semibold text-text-primary mb-4">
              Error Rate by Environment
            </h3>
            <ObservatoryBarChart
              data={errorRateChartData}
              series={[
                {
                  key: "errorRate",
                  label: "Error Rate (%)",
                  color: "var(--status-danger)",
                },
              ]}
              layout="horizontal"
              height={Math.max(250, errorRateChartData.length * 36)}
              showLegend={false}
              formatValue={(val: number) => `${val}%`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
