"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Wifi, Clock, List, Zap, Snail } from "lucide-react";
import { format } from "date-fns";
import { useApperioStore } from "@/store/apperio-store";
import {
  useNetworkOverview,
  useNetworkRequests,
  useNetworkTimeline,
  useNetworkTopEndpoints,
  useNetworkSlowest,
} from "@/hooks/analytics.hook";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { TabLayout } from "@/components/shared/TabLayout";
import { TimeSeriesChart } from "@/components/shared/TimeSeriesChart";
import { SkeletonDashboard } from "@/components/shared/SkeletonDashboard";
import { SignalDot } from "@/components/shared/SignalDot";
import { CHART_COLORS } from "@/lib/charts/observatory-theme";
import { formatCompact, formatDuration, formatPercent, truncateUrl, timeAgo, resolveTimeRangeParams } from "@/lib/format-utils";

const TABS = [
  { id: "overview", label: "Overview", icon: <Clock className="w-4 h-4" /> },
  { id: "requests", label: "Requests", icon: <List className="w-4 h-4" /> },
  { id: "top-endpoints", label: "Top Endpoints", icon: <Zap className="w-4 h-4" /> },
  { id: "slowest", label: "Slowest", icon: <Snail className="w-4 h-4" /> },
];

function statusColor(status: number | undefined): string {
  if (!status) return "text-text-muted";
  if (status >= 500) return "text-status-danger";
  if (status >= 400) return "text-status-warn";
  if (status >= 300) return "text-text-muted";
  return "text-status-ok";
}

function formatChartTs(value: string): string {
  try { return format(new Date(value), "MMM dd HH:mm"); } catch { return value; }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const extract = <T,>(raw: unknown, ...keys: string[]): T[] => {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    for (const k of keys) { const v = (raw as Record<string, unknown>)[k]; if (Array.isArray(v)) return v; }
  }
  return [];
};

const asObj = (raw: unknown): Record<string, any> | null =>
  raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, any>) : null;

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-border-subtle bg-bg-surface">
      <SignalDot status="ok" size="lg" pulse={false} className="mb-3" />
      <p className="text-text-secondary text-sm">{text}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function NetworkMonitoringPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = typeof params?.projectId === "string" ? params.projectId : "";
  const selectedTimeRange = useApperioStore((s) => s.selectedTimeRange);
  const customTimeRange = useApperioStore((s) => s.customTimeRange);
  const trp = useMemo(() => resolveTimeRangeParams(selectedTimeRange, customTimeRange), [selectedTimeRange, customTimeRange]);
  const [reqPage, setReqPage] = useState(1);

  const { data: overviewRaw, isLoading: ovLoading } = useNetworkOverview(projectId, trp);
  const { data: timelineRaw, isLoading: tlLoading } = useNetworkTimeline(projectId, trp);
  const { data: requestsRaw, isLoading: rqLoading } = useNetworkRequests(projectId, { ...trp, page: reqPage, limit: 20 });
  const { data: topRaw, isLoading: teLoading } = useNetworkTopEndpoints(projectId, { ...trp, limit: 20 });
  const { data: slowRaw, isLoading: slLoading } = useNetworkSlowest(projectId, { ...trp, limit: 20 });

  const ov = asObj(overviewRaw);
  const timeline = extract<any>(timelineRaw, "timeline", "data");
  const requests = extract<any>(requestsRaw, "requests", "data");
  const topEndpoints = extract<any>(topRaw, "endpoints", "data");
  const slowest = extract<any>(slowRaw, "endpoints", "data");
  const reqMeta = asObj(requestsRaw);

  if (ovLoading) {
    return (
      <div className="bg-bg-base min-h-full">
        <PageHeader title="Network Monitoring" description="HTTP request analytics and performance" />
        <SkeletonDashboard />
      </div>
    );
  }

  return (
    <div className="bg-bg-base min-h-full space-y-6">
      <PageHeader title="Network Monitoring" description="HTTP request analytics and performance" />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Requests" value={formatCompact(ov?.totalRequests)} icon={<Wifi className="w-4 h-4" />} />
        <MetricCard
          label="Failure Rate"
          value={formatPercent(ov?.failureRate)}
          variant={ov?.failureRate > 10 ? "danger" : ov?.failureRate > 3 ? "warning" : "default"}
        />
        <MetricCard label="Avg Duration" value={formatDuration(ov?.avgDuration)} />
        <MetricCard label="P95 Duration" value={formatDuration(ov?.p95Duration)} />
      </div>

      {/* Tabs */}
      <TabLayout tabs={TABS} defaultTab="overview">
        {(activeTab) => {
          if (activeTab === "overview") {
            if (tlLoading) return <div className="rounded-lg border border-border-subtle bg-bg-surface p-6"><div className="animate-pulse h-[300px] bg-bg-elevated rounded" /></div>;
            if (!timeline.length) return <Empty text="No network data recorded yet" />;
            return (
              <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
                <h3 className="text-sm font-display font-semibold text-text-primary mb-4">Requests Over Time</h3>
                <TimeSeriesChart
                  data={timeline}
                  series={[
                    { key: "totalRequests", label: "Total", color: CHART_COLORS.signal, type: "area" },
                    { key: "failedRequests", label: "Failed", color: CHART_COLORS.danger, type: "line" },
                  ]}
                  height={320}
                  formatXAxis={formatChartTs}
                  showLegend
                />
              </div>
            );
          }

          if (activeTab === "requests") {
            if (rqLoading) return <div className="rounded-lg border border-border-subtle bg-bg-surface p-6"><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="animate-pulse h-10 bg-bg-elevated rounded" />)}</div></div>;
            if (!requests.length) return <Empty text="No network requests recorded" />;
            return (
              <div>
                <div className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle bg-bg-base">
                        <th className="text-left px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider">URL</th>
                        <th className="text-left px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider w-20">Method</th>
                        <th className="text-right px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider w-20">Status</th>
                        <th className="text-right px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider w-24">Duration</th>
                        <th className="text-right px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider w-28">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((r: any, i: number) => (
                        <tr key={i} className="border-b border-border-subtle last:border-b-0 hover:bg-bg-elevated/50 transition-colors">
                          <td className="px-4 py-3 text-text-primary truncate max-w-[300px] font-mono text-xs" title={r.url}>{truncateUrl(r.url || "", 50)}</td>
                          <td className="px-4 py-3 text-text-secondary font-mono text-xs">{r.method || "GET"}</td>
                          <td className={`px-4 py-3 text-right font-mono text-xs tabular-nums ${statusColor(r.status)}`}>{r.status ?? "--"}</td>
                          <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-text-secondary">{formatDuration(r.duration)}</td>
                          <td className="px-4 py-3 text-right text-xs text-text-muted">{timeAgo(r.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {(reqMeta?.totalPages ?? 0) > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-text-muted">Page {reqPage} of {reqMeta?.totalPages}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setReqPage((p) => Math.max(1, p - 1))} disabled={reqPage <= 1} className="px-3 py-1.5 text-xs rounded border border-border-subtle bg-bg-surface text-text-secondary hover:bg-bg-elevated disabled:opacity-40">Prev</button>
                      <button onClick={() => setReqPage((p) => p + 1)} disabled={reqPage >= (reqMeta?.totalPages ?? 1)} className="px-3 py-1.5 text-xs rounded border border-border-subtle bg-bg-surface text-text-secondary hover:bg-bg-elevated disabled:opacity-40">Next</button>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          if (activeTab === "top-endpoints") {
            if (teLoading) return <div className="rounded-lg border border-border-subtle bg-bg-surface p-6"><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="animate-pulse h-10 bg-bg-elevated rounded" />)}</div></div>;
            if (!topEndpoints.length) return <Empty text="No endpoint data available" />;
            return (
              <div className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle bg-bg-base">
                      <th className="text-left px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider">URL</th>
                      <th className="text-left px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider w-20">Method</th>
                      <th className="text-right px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider w-20">Count</th>
                      <th className="text-right px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider w-28">Avg Duration</th>
                      <th className="text-right px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider w-24">Error Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topEndpoints.map((e: any, i: number) => (
                      <tr key={i} className="border-b border-border-subtle last:border-b-0 hover:bg-bg-elevated/50 transition-colors">
                        <td className="px-4 py-3 text-text-primary truncate max-w-[300px] font-mono text-xs" title={e.url}>{truncateUrl(e.url || "", 50)}</td>
                        <td className="px-4 py-3 text-text-secondary font-mono text-xs">{e.method || "GET"}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-text-primary">{formatCompact(e.count)}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-text-secondary">{formatDuration(e.avgDuration)}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-text-secondary">{formatPercent(e.errorRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          if (activeTab === "slowest") {
            if (slLoading) return <div className="rounded-lg border border-border-subtle bg-bg-surface p-6"><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="animate-pulse h-10 bg-bg-elevated rounded" />)}</div></div>;
            if (!slowest.length) return <Empty text="No slow endpoint data available" />;
            return (
              <div className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle bg-bg-base">
                      <th className="text-left px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider">URL</th>
                      <th className="text-left px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider w-20">Method</th>
                      <th className="text-right px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider w-28">Avg Duration</th>
                      <th className="text-right px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider w-28">Max Duration</th>
                      <th className="text-right px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider w-24">P95</th>
                      <th className="text-right px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider w-20">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slowest.map((e: any, i: number) => (
                      <tr key={i} className="border-b border-border-subtle last:border-b-0 hover:bg-bg-elevated/50 transition-colors">
                        <td className="px-4 py-3 text-text-primary truncate max-w-[300px] font-mono text-xs" title={e.url}>{truncateUrl(e.url || "", 50)}</td>
                        <td className="px-4 py-3 text-text-secondary font-mono text-xs">{e.method || "GET"}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-status-warn">{formatDuration(e.avgDuration)}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-status-danger">{formatDuration(e.maxDuration)}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-text-secondary">{formatDuration(e.p95)}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-text-muted">{formatCompact(e.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          return null;
        }}
      </TabLayout>
    </div>
  );
}
