"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { MousePointerClick, Clock, List, Target } from "lucide-react";
import { format } from "date-fns";
import { useApperioStore } from "@/store/apperio-store";
import {
  useInteractionOverview,
  useInteractionTimeline,
  useInteractionTopElements,
  useInteractionMostClicked,
} from "@/hooks/analytics.hook";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { TabLayout } from "@/components/shared/TabLayout";
import { TimeSeriesChart } from "@/components/shared/TimeSeriesChart";
import { SkeletonDashboard } from "@/components/shared/SkeletonDashboard";
import { SignalDot } from "@/components/shared/SignalDot";
import { CHART_COLORS, CHART_PALETTE } from "@/lib/charts/observatory-theme";
import { formatCompact, timeAgo, resolveTimeRangeParams } from "@/lib/format-utils";

const TABS = [
  { id: "overview", label: "Overview", icon: <Clock className="w-4 h-4" /> },
  { id: "top-elements", label: "Top Elements", icon: <Target className="w-4 h-4" /> },
  { id: "most-clicked", label: "Most Clicked", icon: <MousePointerClick className="w-4 h-4" /> },
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

export default function InteractionsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = typeof params?.projectId === "string" ? params.projectId : "";
  const selectedTimeRange = useApperioStore((s) => s.selectedTimeRange);
  const customTimeRange = useApperioStore((s) => s.customTimeRange);
  const trp = useMemo(() => resolveTimeRangeParams(selectedTimeRange, customTimeRange), [selectedTimeRange, customTimeRange]);

  const { data: overviewRaw, isLoading: ovLoading } = useInteractionOverview(projectId, trp);
  const { data: timelineRaw, isLoading: tlLoading } = useInteractionTimeline(projectId, trp);
  const { data: topRaw, isLoading: teLoading } = useInteractionTopElements(projectId, { ...trp, limit: 20 });
  const { data: clickedRaw, isLoading: mcLoading } = useInteractionMostClicked(projectId, { ...trp, limit: 20 });

  const ov = asObj(overviewRaw);
  const timeline = extract<any>(timelineRaw, "timeline", "data");
  const topElements = extract<any>(topRaw, "elements", "data");
  const mostClicked = extract<any>(clickedRaw, "elements", "data");

  if (ovLoading) {
    return (
      <div className="bg-bg-base min-h-full">
        <PageHeader title="User Interactions" description="Click, scroll, and keypress analytics" />
        <SkeletonDashboard />
      </div>
    );
  }

  return (
    <div className="bg-bg-base min-h-full space-y-6">
      <PageHeader title="User Interactions" description="Click, scroll, and keypress analytics" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Interactions" value={formatCompact(ov?.totalInteractions)} icon={<MousePointerClick className="w-4 h-4" />} />
        <MetricCard label="Clicks" value={formatCompact(ov?.clicks)} />
        <MetricCard label="Scrolls" value={formatCompact(ov?.scrolls)} />
        <MetricCard label="Keypresses" value={formatCompact(ov?.keypresses)} />
      </div>

      <TabLayout tabs={TABS} defaultTab="overview">
        {(activeTab) => {
          if (activeTab === "overview") {
            if (tlLoading) return <div className="rounded-lg border border-border-subtle bg-bg-surface p-6"><div className="animate-pulse h-[300px] bg-bg-elevated rounded" /></div>;
            if (!timeline.length) return <Empty text="No interaction data recorded yet" />;
            return (
              <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
                <h3 className="text-sm font-display font-semibold text-text-primary mb-4">Interactions Over Time</h3>
                <TimeSeriesChart
                  data={timeline}
                  series={[
                    { key: "clicks", label: "Clicks", color: CHART_COLORS.signal, type: "line" },
                    { key: "scrolls", label: "Scrolls", color: CHART_COLORS.data, type: "line" },
                    { key: "keypresses", label: "Keypresses", color: CHART_PALETTE[2], type: "line" },
                  ]}
                  height={320}
                  formatXAxis={formatChartTs}
                  showLegend
                />
              </div>
            );
          }

          if (activeTab === "top-elements") {
            if (teLoading) return <div className="rounded-lg border border-border-subtle bg-bg-surface p-6"><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="animate-pulse h-10 bg-bg-elevated rounded" />)}</div></div>;
            if (!topElements.length) return <Empty text="No element interaction data available" />;
            return (
              <div className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle bg-bg-base">
                      <th className="text-left px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider">Target</th>
                      <th className="text-right px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider w-24">Count</th>
                      <th className="text-right px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider w-28">Last Seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topElements.map((el: any, i: number) => (
                      <tr key={i} className="border-b border-border-subtle last:border-b-0 hover:bg-bg-elevated/50 transition-colors">
                        <td className="px-4 py-3 text-text-primary font-mono text-xs truncate max-w-[400px]" title={el.target}>{el.target || "--"}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-text-primary">{formatCompact(el.count)}</td>
                        <td className="px-4 py-3 text-right text-xs text-text-muted">{timeAgo(el.lastSeen)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          if (activeTab === "most-clicked") {
            if (mcLoading) return <div className="rounded-lg border border-border-subtle bg-bg-surface p-6"><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="animate-pulse h-10 bg-bg-elevated rounded" />)}</div></div>;
            if (!mostClicked.length) return <Empty text="No click data available" />;
            return (
              <div className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle bg-bg-base">
                      <th className="text-left px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider">Target</th>
                      <th className="text-left px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider w-24">Type</th>
                      <th className="text-right px-4 py-3 text-xs font-body text-text-muted uppercase tracking-wider w-24">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mostClicked.map((el: any, i: number) => (
                      <tr key={i} className="border-b border-border-subtle last:border-b-0 hover:bg-bg-elevated/50 transition-colors">
                        <td className="px-4 py-3 text-text-primary font-mono text-xs truncate max-w-[400px]" title={el.target}>{el.target || "--"}</td>
                        <td className="px-4 py-3 text-text-secondary text-xs">{el.type || "click"}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-text-primary">{formatCompact(el.count)}</td>
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
