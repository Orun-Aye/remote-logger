"use client";

import { useState, useMemo } from "react";
import { useDashboardData } from "@/hooks/dashboard.hook";
import { useProjects } from "@/hooks/project.hooks";
import { useUserAlertStats, useUserAlerts } from "@/hooks/alerts.hook";
import { useApperioStore } from "@/store/apperio-store";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { Sparkline } from "@/components/shared/Sparkline";
import { SkeletonDashboard } from "@/components/shared/SkeletonDashboard";
import { SignalDot } from "@/components/shared/SignalDot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ViewToggle, type ViewMode } from "@/components/shared/ViewToggle";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatCompact,
  formatPercent,
  formatDuration,
  timeAgo,
  getPreviousPeriodLabel,
} from "@/lib/format-utils";
import {
  Activity,
  AlertTriangle,
  Bug,
  FolderOpen,
  Plus,
  RefreshCw,
  ScrollText,
  ArrowRight,
  Clock,
  Gauge,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTimeRangeDates(
  timeRange: string,
  customRange?: { start: Date; end: Date } | null
): { startDate: string; endDate: string } {
  if (timeRange === "custom" && customRange) {
    return {
      startDate: customRange.start.toISOString(),
      endDate: customRange.end.toISOString(),
    };
  }
  const end = new Date();
  const start = new Date();
  const match = timeRange.match(/^(\d+)([hdwm])$/);
  if (match) {
    const val = parseInt(match[1]);
    const unit = match[2];
    if (unit === "h") start.setHours(start.getHours() - val);
    else if (unit === "d") start.setDate(start.getDate() - val);
    else if (unit === "w") start.setDate(start.getDate() - val * 7);
    else if (unit === "m") start.setMonth(start.getMonth() - val);
  } else {
    start.setHours(start.getHours() - 24);
  }
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

function deriveProjectHealth(project: any): "ok" | "warn" | "danger" {
  const errorRate = project?.metrics?.recentActivity?.errorsLast24h ?? 0;
  const healthScore = project?.metrics?.healthScore ?? 100;
  if (healthScore < 50 || errorRate > 50) return "danger";
  if (healthScore < 75 || errorRate > 10) return "warn";
  return "ok";
}

const severityBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  critical: "destructive",
  warning: "secondary",
  info: "outline",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const selectedTimeRange = useApperioStore((s) => s.selectedTimeRange);
  const customTimeRange = useApperioStore((s) => s.customTimeRange);
  const [projectsView, setProjectsView] = useState<ViewMode>("cards");
  const [alertsView, setAlertsView] = useState<ViewMode>("cards");
  const { startDate, endDate } = useMemo(
    () => getTimeRangeDates(selectedTimeRange, customTimeRange),
    [selectedTimeRange, customTimeRange]
  );

  const {
    overview,
    isLoading: dashboardLoading,
    hasData: dashboardHasData,
    refetch,
  } = useDashboardData({ startDate, endDate });

  const { data: projectsResponse, isLoading: projectsLoading } = useProjects();
  const { data: alertStatsResponse, isLoading: alertStatsLoading } = useUserAlertStats();
  const { data: alertsResponse } = useUserAlerts({ limit: 5 } as any);

  const isLoading = dashboardLoading || projectsLoading || alertStatsLoading;

  if (isLoading) {
    return (
      <div className="p-6 md:px-8 lg:p-10">
        <SkeletonDashboard />
      </div>
    );
  }

  const projects: any[] = projectsResponse?.data ?? [];
  const overviewData = overview?.data ?? null;
  const alertStats = alertStatsResponse?.data ?? null;
  const recentAlerts: any[] = alertsResponse?.data ?? [];

  const totalLogs = overviewData?.summary?.totalLogs ?? 0;
  const totalErrors = overviewData?.summary?.totalErrors ?? 0;
  const errorRate = overviewData?.summary?.errorRate ?? 0;
  const avgResponseTime = overviewData?.summary?.averageResponseTime ?? 0;
  const activeAlerts = alertStats?.active ?? 0;
  const activeProjectCount = projects.filter((p: any) => p.isActive !== false).length;

  // Period comparison data (from new backend)
  const comparison = overviewData?.comparison;
  const sparklines = overviewData?.sparklines;
  const periodLabel = getPreviousPeriodLabel(selectedTimeRange);

  // Build chart data from overview logsOverTime
  const logsOverTime: any[] = overviewData?.logsOverTime ?? [];
  const chartData = logsOverTime.map((point: any) => ({
    date: point.timestamp instanceof Date
      ? point.timestamp.toISOString()
      : typeof point.timestamp === "string"
      ? point.timestamp
      : new Date(point.timestamp).toISOString(),
    logs: point.total ?? 0,
    errors: point.errors ?? 0,
  }));

  // Helper to derive trend from comparison data
  function getTrend(compData?: { change: number }): { direction: "up" | "down" | "neutral"; value: string } | undefined {
    if (!compData || compData.change === undefined) return undefined;
    const change = compData.change;
    return {
      direction: change > 0 ? "up" : change < 0 ? "down" : "neutral",
      value: `${Math.abs(change).toFixed(1)}%`,
    };
  }

  // Empty state: no projects at all
  if (projects.length === 0 && !dashboardHasData) {
    return (
      <div className="p-6 md:px-8 lg:p-10">
        <div className="flex items-center justify-between mb-6">
          <PageHeader title="Dashboard" description="Cross-project overview" />
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-signal/10 flex items-center justify-center mb-6">
            <FolderOpen className="w-8 h-8 text-signal" />
          </div>
          <h2 className="text-2xl font-display font-bold text-text-primary mb-2">
            Welcome to Apperio
          </h2>
          <p className="text-text-secondary max-w-md mb-6">
            Create your first project to start monitoring your applications in real-time.
          </p>
          <Button variant="signal" asChild>
            <Link href="/projects/new">
              <Plus className="w-4 h-4 mr-2" />
              Create First Project
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:px-8 lg:p-10 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Dashboard" description="Cross-project overview" />
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Metric Cards — with sparklines and real comparison data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Total Logs"
          value={formatCompact(totalLogs)}
          icon={<ScrollText className="h-4 w-4" />}
          trend={getTrend(comparison?.totalLogs)}
          subtitle={comparison ? periodLabel : undefined}
          sparkline={
            sparklines?.logs?.length ? (
              <Sparkline data={sparklines.logs} color="var(--signal)" />
            ) : undefined
          }
        />
        <MetricCard
          label="Total Errors"
          value={formatCompact(totalErrors)}
          icon={<Bug className="h-4 w-4" />}
          variant={totalErrors > 0 ? "danger" : "default"}
          trend={getTrend(comparison?.totalErrors)}
          subtitle={comparison ? periodLabel : undefined}
          sparkline={
            sparklines?.errors?.length ? (
              <Sparkline data={sparklines.errors} color="var(--status-danger)" />
            ) : undefined
          }
        />
        <MetricCard
          label="Error Rate"
          value={formatPercent(errorRate)}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={errorRate > 5 ? "warning" : "default"}
          trend={getTrend(comparison?.errorRate)}
          subtitle={comparison ? periodLabel : undefined}
          sparkline={
            sparklines?.errorRate?.length ? (
              <Sparkline data={sparklines.errorRate} color="var(--status-warn)" />
            ) : undefined
          }
        />
        <MetricCard
          label="Avg Response"
          value={formatDuration(avgResponseTime)}
          icon={<Gauge className="h-4 w-4" />}
          trend={getTrend(comparison?.averageResponseTime)}
          subtitle={comparison ? periodLabel : undefined}
        />
        <MetricCard
          label="Active Projects"
          value={activeProjectCount}
          icon={<Activity className="h-4 w-4" />}
          variant="success"
        />
      </div>

      {/* Log Volume Chart */}
      <Card className="bg-bg-surface border-border-subtle pt-0">
        <CardHeader className="flex items-center gap-2 border-b border-border-subtle py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle className="text-sm font-body text-text-secondary uppercase tracking-wider">
              Log Volume
            </CardTitle>
            <p className="text-xs text-text-muted">
              Logs and errors over the selected time range
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {chartData.length > 0 ? (
            <ChartContainer
              config={{
                logs: { label: "Log Volume", color: "var(--signal)" },
                errors: { label: "Errors", color: "var(--status-danger)" },
              } satisfies ChartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fillLogs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-logs)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-logs)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillErrors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-errors)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-errors)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  width={40}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                        })
                      }
                      indicator="dot"
                    />
                  }
                />
                <Area
                  dataKey="errors"
                  type="natural"
                  fill="url(#fillErrors)"
                  stroke="var(--color-errors)"
                  stackId="a"
                />
                <Area
                  dataKey="logs"
                  type="natural"
                  fill="url(#fillLogs)"
                  stroke="var(--color-logs)"
                  stackId="a"
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-text-muted text-sm">
              Log volume data will appear here once logs are ingested.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two-Column: Project Health + Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Project Health Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-body text-text-secondary uppercase tracking-wider">
              Project Health
            </h3>
            <div className="flex items-center gap-3">
              <ViewToggle mode={projectsView} onChange={setProjectsView} />
              <Link
                href="/projects"
                className="text-xs text-signal hover:text-signal-bright transition-colors flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <div>
            {projects.length > 0 ? (
              projectsView === "cards" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {projects.slice(0, 6).map((project: any) => {
                    const health = deriveProjectHealth(project);
                    return (
                      <Link
                        key={project._id}
                        href={`/projects/${project._id}`}
                        className="group flex items-center gap-3 p-3 rounded-lg border border-border-subtle bg-bg-base hover:bg-bg-elevated hover:border-border-accent transition-all duration-200"
                      >
                        <SignalDot status={health} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-display font-semibold text-text-primary truncate group-hover:text-signal transition-colors">
                            {project.name}
                          </p>
                          <p className="text-xs text-text-muted">
                            {formatCompact(project.metrics?.totalLogs ?? project.logCount ?? 0)} logs
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-border-subtle overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle bg-bg-base">
                        <th className="text-left px-4 py-2.5 text-xs font-body text-text-muted uppercase tracking-wider">Project</th>
                        <th className="text-right px-4 py-2.5 text-xs font-body text-text-muted uppercase tracking-wider w-24">Logs</th>
                        <th className="text-center px-4 py-2.5 text-xs font-body text-text-muted uppercase tracking-wider w-20">Health</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.slice(0, 6).map((project: any) => {
                        const health = deriveProjectHealth(project);
                        return (
                          <tr key={project._id} className="border-b border-border-subtle last:border-b-0 hover:bg-bg-elevated/50 transition-colors">
                            <td className="px-4 py-2.5">
                              <Link href={`/projects/${project._id}`} className="text-text-primary hover:text-signal transition-colors font-medium text-sm">
                                {project.name}
                              </Link>
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums text-text-secondary">
                              {formatCompact(project.metrics?.totalLogs ?? project.logCount ?? 0)}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <SignalDot status={health} size="sm" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-32 text-text-muted text-sm">
                No projects found.
              </div>
            )}
          </div>
        </div>

        {/* Recent Alerts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-body text-text-secondary uppercase tracking-wider">
              Recent Alerts
            </h3>
            <div className="flex items-center gap-3">
              <ViewToggle mode={alertsView} onChange={setAlertsView} />
              <Link
                href="/alerts"
                className="text-xs text-signal hover:text-signal-bright transition-colors flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <div>
            {recentAlerts.length > 0 ? (
              alertsView === "cards" ? (
                <div className="space-y-3">
                  {recentAlerts.slice(0, 5).map((alert: any) => (
                    <div
                      key={alert._id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border-subtle bg-bg-base"
                    >
                      <SignalDot
                        status={
                          alert.severity === "critical"
                            ? "danger"
                            : alert.severity === "warning"
                            ? "warn"
                            : "info"
                        }
                        size="sm"
                        pulse={alert.status === "active"}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {alert.title || alert.message || "Untitled alert"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={severityBadgeVariant[alert.severity] ?? "outline"}
                            className="text-[10px]"
                          >
                            {alert.severity}
                          </Badge>
                          <span className="text-xs text-text-muted flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(alert.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-border-subtle overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle bg-bg-base">
                        <th className="text-left px-4 py-2.5 text-xs font-body text-text-muted uppercase tracking-wider">Alert</th>
                        <th className="text-center px-4 py-2.5 text-xs font-body text-text-muted uppercase tracking-wider w-24">Severity</th>
                        <th className="text-center px-4 py-2.5 text-xs font-body text-text-muted uppercase tracking-wider w-24">Status</th>
                        <th className="text-right px-4 py-2.5 text-xs font-body text-text-muted uppercase tracking-wider w-24">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAlerts.slice(0, 5).map((alert: any) => (
                        <tr key={alert._id} className="border-b border-border-subtle last:border-b-0 hover:bg-bg-elevated/50 transition-colors">
                          <td className="px-4 py-2.5 text-text-primary text-sm truncate max-w-[200px]">
                            {alert.title || alert.message || "Untitled alert"}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <Badge
                              variant={severityBadgeVariant[alert.severity] ?? "outline"}
                              className="text-[10px]"
                            >
                              {alert.severity}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`text-xs font-medium ${alert.status === "resolved" ? "text-status-ok" : alert.status === "acknowledged" ? "text-status-warn" : "text-status-danger"}`}>
                              {alert.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs text-text-muted">
                            {timeAgo(alert.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-32 text-text-muted text-sm">
                No recent alerts. All systems operational.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Status Bar */}
      <div className="flex items-center gap-2 p-3 rounded-lg border border-border-subtle bg-bg-surface">
        <SignalDot
          status={
            overviewData?.health?.criticalProjects > 0
              ? "danger"
              : overviewData?.health?.warningProjects > 0
              ? "warn"
              : "ok"
          }
          size="md"
        />
        <span className="text-sm text-text-secondary">
          {overviewData?.health?.criticalProjects > 0
            ? `${overviewData.health.criticalProjects} critical project${overviewData.health.criticalProjects > 1 ? "s" : ""} require attention`
            : overviewData?.health?.warningProjects > 0
            ? `${overviewData.health.warningProjects} project${overviewData.health.warningProjects > 1 ? "s" : ""} with warnings`
            : "All systems operational"}
        </span>
      </div>
    </div>
  );
}
