"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Terminal, Clock, List } from "lucide-react";
import { format } from "date-fns";
import { useApperioStore } from "@/store/apperio-store";
import {
  useConsoleOverview,
  useConsoleMessages,
  useConsoleTimeline,
} from "@/hooks/analytics.hook";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { TabLayout } from "@/components/shared/TabLayout";
import { TimeSeriesChart } from "@/components/shared/TimeSeriesChart";
import { SkeletonDashboard } from "@/components/shared/SkeletonDashboard";
import { SignalDot } from "@/components/shared/SignalDot";
import { CHART_COLORS } from "@/lib/charts/observatory-theme";
import { formatCompact, formatPercent, timeAgo, resolveTimeRangeParams } from "@/lib/format-utils";

const TABS = [
  { id: "overview", label: "Overview", icon: <Clock className="w-4 h-4" /> },
  { id: "messages", label: "Messages", icon: <List className="w-4 h-4" /> },
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

const LEVEL_BADGE: Record<string, string> = {
  fatal: "bg-status-danger/10 text-status-danger",
  error: "bg-status-danger/10 text-status-danger",
  warn: "bg-status-warn/10 text-status-warn",
  warning: "bg-status-warn/10 text-status-warn",
  info: "bg-data-info/10 text-data-info",
  debug: "bg-text-muted/10 text-text-muted",
  trace: "bg-text-muted/10 text-text-muted",
};

function LevelBadge({ level }: { level: string }) {
  const cls = LEVEL_BADGE[level?.toLowerCase()] ?? LEVEL_BADGE.info;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {level || "info"}
    </span>
  );
}

export default function ConsoleMonitorPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = typeof params?.projectId === "string" ? params.projectId : "";
  const selectedTimeRange = useApperioStore((s) => s.selectedTimeRange);
  const customTimeRange = useApperioStore((s) => s.customTimeRange);
  const trp = useMemo(() => resolveTimeRangeParams(selectedTimeRange, customTimeRange), [selectedTimeRange, customTimeRange]);
  const [msgPage, setMsgPage] = useState(1);

  const { data: overviewRaw, isLoading: ovLoading } = useConsoleOverview(projectId, trp);
  const { data: timelineRaw, isLoading: tlLoading } = useConsoleTimeline(projectId, trp);
  const { data: messagesRaw, isLoading: mgLoading } = useConsoleMessages(projectId, { ...trp, page: msgPage, limit: 25 });

  const ov = asObj(overviewRaw);
  const errorRate = useMemo(() => {
    if (!ov?.total) return 0;
    return ((ov?.byLevel?.error ?? 0) / ov.total) * 100;
  }, [ov]);
  const timeline = extract<any>(timelineRaw, "timeline", "data");
  const messages = extract<any>(messagesRaw, "messages", "data");
  const msgMeta = asObj(messagesRaw);

  if (ovLoading) {
    return (
      <div className="bg-bg-base min-h-full">
        <PageHeader title="Console Monitor" description="Console output and message analytics" />
        <SkeletonDashboard />
      </div>
    );
  }

  return (
    <div className="bg-bg-base min-h-full space-y-6">
      <PageHeader title="Console Monitor" description="Console output and message analytics" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Messages" value={formatCompact(ov?.total)} icon={<Terminal className="w-4 h-4" />} />
        <MetricCard label="Errors" value={formatCompact(ov?.byLevel?.error)} variant="danger" />
        <MetricCard label="Warnings" value={formatCompact(ov?.byLevel?.warn)} variant="warning" />
        <MetricCard
          label="Error Rate"
          value={formatPercent(errorRate)}
          variant={errorRate > 10 ? "danger" : errorRate > 3 ? "warning" : "default"}
        />
      </div>

      <TabLayout tabs={TABS} defaultTab="overview">
        {(activeTab) => {
          if (activeTab === "overview") {
            if (tlLoading) return <div className="rounded-lg border border-border-subtle bg-bg-surface p-6"><div className="animate-pulse h-[300px] bg-bg-elevated rounded" /></div>;
            if (!timeline.length) return <Empty text="No console data recorded yet" />;
            return (
              <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
                <h3 className="text-sm font-display font-semibold text-text-primary mb-4">Console Messages Over Time</h3>
                <TimeSeriesChart
                  data={timeline}
                  series={[
                    { key: "error", label: "Error", color: CHART_COLORS.danger, type: "area" },
                    { key: "warn", label: "Warning", color: CHART_COLORS.warn, type: "area" },
                    { key: "info", label: "Info", color: CHART_COLORS.data, type: "line" },
                    { key: "debug", label: "Debug", color: CHART_COLORS.muted, type: "line", strokeDasharray: "4 4" },
                  ]}
                  height={320}
                  formatXAxis={formatChartTs}
                  showLegend
                />
              </div>
            );
          }

          if (activeTab === "messages") {
            if (mgLoading) return <div className="rounded-lg border border-border-subtle bg-bg-surface p-6"><div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="animate-pulse h-12 bg-bg-elevated rounded" />)}</div></div>;
            if (!messages.length) return <Empty text="No console messages recorded" />;
            return (
              <div>
                <div className="space-y-2">
                  {messages.map((msg: any, i: number) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border-subtle bg-bg-surface p-4 hover:bg-bg-elevated/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <LevelBadge level={msg.level} />
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-sm text-text-primary whitespace-pre-wrap break-all leading-relaxed">
                            {msg.message || "--"}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-text-muted">{timeAgo(msg.timestamp)}</span>
                            {msg.url && (
                              <span className="text-xs text-text-muted font-mono truncate max-w-[300px]" title={msg.url}>
                                {msg.url}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Pagination */}
                {(msgMeta?.meta?.total ?? 0) > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-text-muted">Page {msgPage} of {msgMeta?.meta?.total}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setMsgPage((p) => Math.max(1, p - 1))} disabled={msgPage <= 1} className="px-3 py-1.5 text-xs rounded border border-border-subtle bg-bg-surface text-text-secondary hover:bg-bg-elevated disabled:opacity-40">Prev</button>
                      <button onClick={() => setMsgPage((p) => p + 1)} disabled={msgPage >= (msgMeta?.meta?.total ?? 1)} className="px-3 py-1.5 text-xs rounded border border-border-subtle bg-bg-surface text-text-secondary hover:bg-bg-elevated disabled:opacity-40">Next</button>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          return null;
        }}
      </TabLayout>
    </div>
  );
}
