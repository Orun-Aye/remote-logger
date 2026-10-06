"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Eye, Clock, FileText, Link2, ArrowRightLeft } from "lucide-react";
import { format } from "date-fns";
import { useApperioStore } from "@/store/apperio-store";
import {
  usePageviewOverview,
  usePageviewTimeline,
  usePageviewTopPages,
  usePageviewReferrers,
  usePageviewNavigationFlow,
} from "@/hooks/analytics.hook";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { TabLayout } from "@/components/shared/TabLayout";
import { TimeSeriesChart } from "@/components/shared/TimeSeriesChart";
import { SkeletonDashboard } from "@/components/shared/SkeletonDashboard";
import { SignalDot } from "@/components/shared/SignalDot";
import { CHART_COLORS } from "@/lib/charts/observatory-theme";
import { formatCompact, truncateUrl, resolveTimeRangeParams } from "@/lib/format-utils";

const TABS = [
  { id: "overview", label: "Overview", icon: <Clock className="w-4 h-4" /> },
  { id: "top-pages", label: "Top Pages", icon: <FileText className="w-4 h-4" /> },
  { id: "referrers", label: "Referrers", icon: <Link2 className="w-4 h-4" /> },
  { id: "nav-flow", label: "Navigation Flow", icon: <ArrowRightLeft className="w-4 h-4" /> },
];

function formatChartTs(value: string): string {
  try { return format(new Date(value), "MMM dd HH:mm"); } catch { return value; }
}

const extract = <T,>(raw: unknown, ...keys: string[]): T[] => {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    for (const k of keys) { const v = (raw as Record<string, unknown>)[k]; if (Array.isArray(v)) return v; }
  }
  return [];
};

const asObj = (raw: unknown): Record<string, any> | null =>
  raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, any>) : null;

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-border-subtle bg-bg-surface">
      <SignalDot status="ok" size="lg" pulse={false} className="mb-3" />
      <p className="text-text-secondary text-sm">{text}</p>
    </div>
  );
}

export default function PageviewAnalyticsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = typeof params?.projectId === "string" ? params.projectId : "";
  const selectedTimeRange = useApperioStore((s) => s.selectedTimeRange);
  const customTimeRange = useApperioStore((s) => s.customTimeRange);
  const trp = useMemo(() => resolveTimeRangeParams(selectedTimeRange, customTimeRange), [selectedTimeRange, customTimeRange]);

  const { data: overviewRaw, isLoading: ovLoading } = usePageviewOverview(projectId, trp);
  const { data: timelineRaw, isLoading: tlLoading } = usePageviewTimeline(projectId, trp);
  const { data: topPagesRaw, isLoading: tpLoading } = usePageviewTopPages(projectId, { ...trp, limit: 20 });
  const { data: referrersRaw, isLoading: rfLoading } = usePageviewReferrers(projectId, { ...trp, limit: 20 });
  const { data: navFlowRaw, isLoading: nfLoading } = usePageviewNavigationFlow(projectId, { ...trp, limit: 20 });

  const ov = asObj(overviewRaw);
  const timeline = extract<any>(timelineRaw, "timeline", "data");
  const topPages = extract<any>(topPagesRaw, "pages", "data");
  const referrers = extract<any>(referrersRaw, "referrers", "data");
  const navFlow = extract<any>(navFlowRaw, "flows", "data");

  // Compute max referrer count for progress bars
  const maxRefCount = useMemo(() => {
    if (!referrers.length) return 1;
    return Math.max(...referrers.map((r: any) => r.count ?? 0), 1);
  }, [referrers]);

  if (ovLoading) {
    return (
      <div className="p-6 bg-bg-base min-h-full">
        <PageHeader title="Pageview Analytics" description="Page traffic and navigation patterns" />
        <SkeletonDashboard />
      </div>
    );
  }

  const topPageObj = ov?.topPage && typeof ov.topPage === "object" ? ov.topPage : null;
  const topPageUrl: string =
    topPageObj?.url || (typeof ov?.topPage === "string" ? ov.topPage : "");
  // Every page shares the site's host, so the path is the useful part
  const topPagePath = (() => {
    if (!topPageUrl) return "None";
    try {
      const { pathname, search } = new URL(topPageUrl);
      return `${pathname}${search}`;
    } catch {
      return topPageUrl;
    }
  })();

  return (
    <div className="p-6 bg-bg-base min-h-full space-y-6">
      <PageHeader title="Pageview Analytics" description="Page traffic and navigation patterns" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="Total Pageviews" value={formatCompact(ov?.totalPageviews)} icon={<Eye className="w-4 h-4" />} />
        <MetricCard label="Unique Pages" value={formatCompact(ov?.uniquePages)} />
        <MetricCard
          label="Top Page"
          className="min-w-0"
          value={topPagePath}
          valueClassName="text-lg font-mono font-semibold leading-tight truncate"
          valueTitle={topPageUrl || undefined}
          subtitle={topPageObj?.count ? `${formatCompact(topPageObj.count)} views` : undefined}
        />
      </div>

      <TabLayout tabs={TABS} defaultTab="overview">
        {(activeTab) => {
          if (activeTab === "overview") {
            if (tlLoading) return <div className="rounded-lg border border-border-subtle bg-bg-surface p-6"><div className="animate-pulse h-[300px] bg-bg-elevated rounded" /></div>;
            if (!timeline.length) return <Empty text="No pageview data recorded yet" />;
            return (
              <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
                <h3 className="text-sm font-display font-semibold text-text-primary mb-4">Pageviews Over Time</h3>
                <TimeSeriesChart
                  data={timeline}
                  series={[
                    { key: "count", label: "Pageviews", color: CHART_COLORS.signal, type: "area" },
                  ]}
                  height={320}
                  formatXAxis={formatChartTs}
                  showLegend={false}
                />
              </div>
            );
          }

          if (activeTab === "top-pages") {
            if (tpLoading) return <div className="rounded-lg border border-border-subtle bg-bg-surface p-6"><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="animate-pulse h-10 bg-bg-elevated rounded" />)}</div></div>;
            if (!topPages.length) return <Empty text="No page data available" />;
            return (
              <div className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle bg-bg-base">
                      <th className="text-left px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider">URL</th>
                      <th className="text-left px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider w-40">Title</th>
                      <th className="text-right px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider w-24">Views</th>
                      <th className="text-right px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider w-28">Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPages.map((pg: any, i: number) => (
                      <tr key={i} className="border-b border-border-subtle last:border-b-0 hover:bg-bg-elevated/50 transition-colors">
                        <td className="px-4 py-3 text-text-primary font-mono text-xs truncate max-w-[300px]" title={pg.url}>{truncateUrl(pg.url || "", 50)}</td>
                        <td className="px-4 py-3 text-text-secondary text-xs truncate max-w-[160px]" title={pg.title}>{pg.title || "--"}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-text-primary">{formatCompact(pg.views ?? pg.count)}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-text-muted">{formatCompact(pg.uniqueSessions ?? pg.sessions)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          if (activeTab === "referrers") {
            if (rfLoading) return <div className="rounded-lg border border-border-subtle bg-bg-surface p-6"><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="animate-pulse h-10 bg-bg-elevated rounded" />)}</div></div>;
            if (!referrers.length) return <Empty text="No referrer data available" />;
            return (
              <div className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle bg-bg-base">
                      <th className="text-left px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider">Referrer</th>
                      <th className="text-right px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider w-24">Count</th>
                      <th className="text-left px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider w-48">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrers.map((ref: any, i: number) => {
                      const pct = maxRefCount > 0 ? ((ref.count ?? 0) / maxRefCount) * 100 : 0;
                      return (
                        <tr key={i} className="border-b border-border-subtle last:border-b-0 hover:bg-bg-elevated/50 transition-colors">
                          <td className="px-4 py-3 text-text-primary text-xs truncate max-w-[300px] font-mono" title={ref.referrer}>{ref.referrer || "(direct)"}</td>
                          <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-text-primary">{formatCompact(ref.count)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-bg-elevated overflow-hidden">
                                <div className="h-full rounded-full bg-signal/60" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-text-muted tabular-nums w-12 text-right">
                                {ref.percentage != null ? `${ref.percentage.toFixed(1)}%` : `${pct.toFixed(0)}%`}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          }

          if (activeTab === "nav-flow") {
            if (nfLoading) return <div className="rounded-lg border border-border-subtle bg-bg-surface p-6"><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="animate-pulse h-10 bg-bg-elevated rounded" />)}</div></div>;
            if (!navFlow.length) return <Empty text="No navigation flow data available" />;
            return (
              <div className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle bg-bg-base">
                      <th className="text-left px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider">From</th>
                      <th className="text-center px-2 py-3 text-xs text-text-muted w-8" />
                      <th className="text-left px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider">To</th>
                      <th className="text-right px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider w-24">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {navFlow.map((flow: any, i: number) => (
                      <tr key={i} className="border-b border-border-subtle last:border-b-0 hover:bg-bg-elevated/50 transition-colors">
                        <td className="px-4 py-3 text-text-primary font-mono text-xs truncate max-w-[250px]" title={flow.from}>{truncateUrl(flow.from || "", 40)}</td>
                        <td className="px-2 py-3 text-center text-text-muted"><ArrowRightLeft className="w-3.5 h-3.5 inline" /></td>
                        <td className="px-4 py-3 text-text-primary font-mono text-xs truncate max-w-[250px]" title={flow.to}>{truncateUrl(flow.to || "", 40)}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-text-primary">{formatCompact(flow.count)}</td>
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
