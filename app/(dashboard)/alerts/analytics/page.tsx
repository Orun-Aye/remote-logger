"use client";

import { useState, useMemo } from "react";
import { useProjects } from "@/hooks/project.hooks";
import { useAlertAnalytics } from "@/hooks/alerts.hook";
import { MetricCard } from "@/components/shared/MetricCard";
import { TimeSeriesChart } from "@/components/shared/TimeSeriesChart";
import { ObservatoryBarChart } from "@/components/shared/ObservatoryBarChart";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Clock,
  Volume2,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { CHART_COLORS } from "@/lib/charts/observatory-theme";

export default function AlertAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"1d" | "7d" | "30d">("7d");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const { data: projectsResponse, isLoading: isProjectsLoading } =
    useProjects();
  const projects = useMemo(
    () => (projectsResponse as any)?.data ?? [],
    [projectsResponse]
  );

  const effectiveProjectId =
    selectedProjectId || (projects[0]?._id ?? "");

  const { data: analyticsData, isLoading: isAnalyticsLoading } =
    useAlertAnalytics(effectiveProjectId, timeRange);

  const analytics = analyticsData?.data;

  const isLoading = isProjectsLoading || isAnalyticsLoading;

  // Transform frequency trends for the time series chart
  const timelineData = useMemo(() => {
    if (!analytics?.frequencyTrends) return [];
    return analytics.frequencyTrends.map(
      (point: { _id: string; count: number }) => ({
        timestamp: point._id,
        alerts: point.count,
      })
    );
  }, [analytics]);

  // Transform severity distribution for bar chart
  const severityData = useMemo(() => {
    if (!analytics?.severityDistribution) return [];
    const colorMap: Record<string, string> = {
      critical: CHART_COLORS.danger,
      warning: CHART_COLORS.warn,
      info: CHART_COLORS.data,
    };
    return analytics.severityDistribution.map(
      (item: { _id: string; count: number }) => ({
        name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
        count: item.count,
        fill: colorMap[item._id] || CHART_COLORS.muted,
      })
    );
  }, [analytics]);

  // Noisiest rules
  const noisiestRules = useMemo(() => {
    if (!analytics?.noisiestRules) return [];
    return analytics.noisiestRules.slice(0, 10);
  }, [analytics]);

  // MTTR display
  const avgResolutionTime = useMemo(() => {
    if (!analytics?.mttr?.avgMinutes) return "N/A";
    const mins = analytics.mttr.avgMinutes;
    if (mins < 60) return `${Math.round(mins)}m`;
    const hours = Math.floor(mins / 60);
    const remaining = Math.round(mins % 60);
    if (remaining === 0) return `${hours}h`;
    return `${hours}h ${remaining}m`;
  }, [analytics]);

  const noisiestRuleName = useMemo(() => {
    if (!noisiestRules.length) return "N/A";
    return noisiestRules[0].ruleName || "Unknown";
  }, [noisiestRules]);

  const totalEvents = useMemo(() => {
    if (!analytics?.frequencyTrends) return 0;
    return analytics.frequencyTrends.reduce(
      (sum: number, t: { count: number }) => sum + t.count,
      0
    );
  }, [analytics]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center gap-3">
          <Select
            value={effectiveProjectId}
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger className="w-[200px] bg-bg-surface border-border-subtle">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent className="bg-bg-elevated border-border-subtle">
              {projects.map((project: any) => (
                <SelectItem key={project._id} value={project._id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={timeRange}
            onValueChange={(v) => setTimeRange(v as "1d" | "7d" | "30d")}
          >
            <SelectTrigger className="w-[140px] bg-bg-surface border-border-subtle">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-bg-elevated border-border-subtle">
              <SelectItem value="1d">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-signal" />
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              label="Avg Resolution Time"
              value={avgResolutionTime}
              icon={<Clock className="h-4 w-4" />}
              subtitle={
                analytics?.mttr?.resolvedCount
                  ? `Based on ${analytics.mttr.resolvedCount} resolved alerts`
                  : "No resolved alerts in range"
              }
            />
            <MetricCard
              label="Noisiest Rule"
              value={
                noisiestRuleName.length > 24
                  ? noisiestRuleName.slice(0, 24) + "..."
                  : noisiestRuleName
              }
              icon={<Volume2 className="h-4 w-4" />}
              subtitle={
                noisiestRules.length
                  ? `${noisiestRules[0].count} triggers`
                  : "No rules triggered"
              }
              variant="warning"
            />
            <MetricCard
              label={`Total Events (${timeRange})`}
              value={totalEvents.toLocaleString()}
              icon={<BarChart3 className="h-4 w-4" />}
              subtitle={`In the last ${
                timeRange === "1d"
                  ? "24 hours"
                  : timeRange === "7d"
                  ? "7 days"
                  : "30 days"
              }`}
            />
          </div>

          {/* Alert Frequency Timeline */}
          <Card className="border-border-subtle bg-bg-surface p-6">
            <h3 className="font-display font-semibold text-text-primary mb-1">
              Alert Frequency
            </h3>
            <p className="text-sm text-text-muted mb-4">
              Number of alerts triggered over time
            </p>
            <TimeSeriesChart
              data={timelineData}
              series={[
                {
                  key: "alerts",
                  label: "Alerts",
                  color: CHART_COLORS.signal,
                  type: "area",
                },
              ]}
              height={280}
              showLegend={false}
            />
          </Card>

          {/* Two-column: Severity Distribution + Noisiest Rules */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Severity Distribution */}
            <Card className="border-border-subtle bg-bg-surface p-6">
              <h3 className="font-display font-semibold text-text-primary mb-1">
                Alerts by Severity
              </h3>
              <p className="text-sm text-text-muted mb-4">
                Distribution of alert severity levels
              </p>
              <ObservatoryBarChart
                data={severityData}
                series={[
                  {
                    key: "count",
                    label: "Alerts",
                    color: CHART_COLORS.signal,
                  },
                ]}
                height={260}
                layout="vertical"
                showLegend={false}
              />
            </Card>

            {/* Noisiest Rules Table */}
            <Card className="border-border-subtle bg-bg-surface p-6">
              <h3 className="font-display font-semibold text-text-primary mb-1">
                Top Noisiest Rules
              </h3>
              <p className="text-sm text-text-muted mb-4">
                Rules that triggered the most alerts
              </p>
              {noisiestRules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertTriangle className="h-10 w-10 text-text-muted mb-3" />
                  <p className="text-sm text-text-secondary">
                    No rules have been triggered in this time range.
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {/* Table Header */}
                  <div className="grid grid-cols-[1fr_80px_120px] items-center gap-3 pb-2 border-b border-border-subtle text-xs font-medium text-text-muted uppercase tracking-wider">
                    <span>Rule</span>
                    <span className="text-right">Triggers</span>
                    <span className="text-right">Last Fired</span>
                  </div>

                  {/* Table Rows */}
                  {noisiestRules.map(
                    (
                      rule: {
                        ruleId: string;
                        ruleName: string;
                        count: number;
                        lastTriggered: string;
                      },
                      index: number
                    ) => (
                      <div
                        key={rule.ruleId}
                        className="grid grid-cols-[1fr_80px_120px] items-center gap-3 py-3 border-b border-border-faint last:border-0"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge
                            variant="outline"
                            className="shrink-0 text-[10px] font-mono border-signal/30 text-signal w-6 justify-center"
                          >
                            {index + 1}
                          </Badge>
                          <span className="text-sm text-text-primary truncate">
                            {rule.ruleName || "Unnamed Rule"}
                          </span>
                        </div>
                        <span className="text-sm font-mono text-text-primary text-right font-semibold">
                          {rule.count.toLocaleString()}
                        </span>
                        <span className="text-xs text-text-muted text-right">
                          {rule.lastTriggered
                            ? new Date(rule.lastTriggered).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "--"}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
