"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useApperioStore } from "@/store/apperio-store";
import {
  useActivityFeed,
  useActivityStats,
} from "@/hooks/analytics.hook";
import { useProjectWebSocket } from "@/hooks/useWebsocket";
import { useLogTrends } from "@/hooks/log.hooks";
import { useChartDeployMarkers } from "@/hooks/changes.hooks";
import { PageHeader } from "@/components/shared/PageHeader";
import { TimeSeriesChart } from "@/components/shared/TimeSeriesChart";
import { CHART_COLORS } from "@/lib/charts/observatory-theme";
import { MetricCard } from "@/components/shared/MetricCard";
import { SignalDot } from "@/components/shared/SignalDot";
import { SkeletonDashboard } from "@/components/shared/SkeletonDashboard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Zap,
  Server,
  AlertTriangle,
  Pause,
  Play,
  ArrowDown,
  Radio,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { resolveTimeRangeParams } from "@/lib/format-utils";

// ============================================
// Types
// ============================================

interface ActivityEvent {
  _id?: string;
  id?: string;
  timestamp: string;
  level: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
  message: string;
  service?: string;
  eventType?: string;
  environment?: string;
  projectId?: string;
}

// ============================================
// Helpers
// ============================================

type LevelStatus = "ok" | "warn" | "danger" | "fatal" | "info";

function levelToStatus(level: string): LevelStatus {
  switch (level) {
    case "error":
      return "danger";
    case "fatal":
      return "fatal";
    case "warn":
      return "warn";
    case "info":
      return "ok";
    case "debug":
    case "trace":
    default:
      return "info";
  }
}

const LEVEL_TEXT_COLORS: Record<string, string> = {
  fatal: "text-level-fatal",
  error: "text-level-error",
  warn: "text-level-warn",
  info: "text-level-info",
  debug: "text-level-debug",
  trace: "text-level-trace",
};

const LEVEL_BADGE_CLASSES: Record<string, string> = {
  fatal: "bg-status-fatal/10 text-status-fatal border-status-fatal/30",
  error: "bg-status-danger/10 text-status-danger border-status-danger/30",
  warn: "bg-status-warn/10 text-status-warn border-status-warn/30",
  info: "bg-status-ok/10 text-status-ok border-status-ok/30",
  debug: "bg-data-info/10 text-data-info border-data-info/30",
  trace: "bg-bg-elevated text-text-muted border-border-subtle",
};

type LevelFilter = "all" | "error" | "warn" | "info" | "debug";

const LEVEL_FILTER_OPTIONS: { key: LevelFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "error", label: "Error" },
  { key: "warn", label: "Warn" },
  { key: "info", label: "Info" },
  { key: "debug", label: "Debug" },
];

// ============================================
// Event volume chart
// ============================================

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const PRESET_HOURS: Record<string, number> = {
  "1h": 1,
  "6h": 6,
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
};

function EventVolumeChart({
  projectId,
  selectedTimeRange,
  customTimeRange,
}: {
  projectId: string;
  selectedTimeRange: string;
  customTimeRange: { start: Date; end: Date } | null;
}) {
  const range = useMemo(() => {
    if (selectedTimeRange === "custom" && customTimeRange) {
      const hours = (customTimeRange.end.getTime() - customTimeRange.start.getTime()) / HOUR_MS;
      return {
        startDate: customTimeRange.start,
        endDate: customTimeRange.end,
        groupBy: hours <= 24 * 7 ? ("hour" as const) : ("day" as const),
      };
    }
    const hours = PRESET_HOURS[selectedTimeRange] ?? 24;
    // End on the next hour boundary: the current hour keeps filling in on
    // refetch, and the query key stays stable within the hour
    const endDate = new Date(Math.ceil(Date.now() / HOUR_MS) * HOUR_MS);
    return {
      startDate: new Date(endDate.getTime() - hours * HOUR_MS),
      endDate,
      groupBy: hours <= 24 * 7 ? ("hour" as const) : ("day" as const),
    };
  }, [selectedTimeRange, customTimeRange]);

  const { data, isLoading } = useLogTrends(projectId, range);

  // The backend only returns buckets that have logs; zero-fill the rest so the
  // categorical x-axis is evenly spaced and deploy lines land in the right place
  const series = useMemo(() => {
    const step = range.groupBy === "hour" ? HOUR_MS : DAY_MS;
    const keyLength = range.groupBy === "hour" ? 13 : 10;
    const byKey = new Map((Array.isArray(data) ? data : []).map((b) => [b._id, b]));
    const points: Array<{ timestamp: string; count: number; errorCount: number }> = [];
    const endMs = range.endDate.getTime();
    for (
      let t = Math.floor(range.startDate.getTime() / step) * step;
      t < endMs;
      t += step
    ) {
      const iso = new Date(t).toISOString();
      const bucket = byKey.get(iso.slice(0, keyLength));
      points.push({
        timestamp: iso,
        count: bucket?.count ?? 0,
        errorCount: bucket?.errorCount ?? 0,
      });
    }
    return points;
  }, [data, range]);

  const deployMarkerLines = useChartDeployMarkers(
    projectId,
    series.map((p) => p.timestamp)
  );

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
      <h3 className="text-sm font-display font-semibold text-text-primary mb-4">
        Event Volume
      </h3>
      {isLoading ? (
        <div className="h-[220px] w-full bg-bg-elevated rounded animate-pulse" />
      ) : (
        <TimeSeriesChart
          data={series}
          series={[
            {
              key: "count",
              label: "Events",
              color: CHART_COLORS.signal,
              type: "area",
            },
            {
              key: "errorCount",
              label: "Errors",
              color: CHART_COLORS.danger,
              type: "line",
              strokeDasharray: "4 3",
            },
          ]}
          height={220}
          showLegend
          formatXAxis={(value: string) =>
            format(new Date(value), range.groupBy === "hour" ? "MMM d HH:mm" : "MMM d")
          }
          deployMarkers={deployMarkerLines}
        />
      )}
    </div>
  );
}

// ============================================
// Main Page
// ============================================

export default function ActivityPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = typeof params?.projectId === "string" ? params.projectId : "";
  const selectedTimeRange = useApperioStore((s) => s.selectedTimeRange);
  const customTimeRange = useApperioStore((s) => s.customTimeRange);
  const timeRangeParams = useMemo(
    () => resolveTimeRangeParams(selectedTimeRange, customTimeRange),
    [selectedTimeRange, customTimeRange]
  );

  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [page, setPage] = useState(1);
  const [liveMode, setLiveMode] = useState(true);
  const [realtimeEvents, setRealtimeEvents] = useState<ActivityEvent[]>([]);
  const feedEndRef = useRef<HTMLDivElement>(null);
  const limit = 50;

  // WebSocket (Socket.io via project room)
  const { connectionStatus, lastMessage, isConnected } = useProjectWebSocket(projectId);

  // Data hooks
  const {
    data: feedData,
    isLoading: feedLoading,
    error: feedError,
  } = useActivityFeed(projectId, {
    page,
    limit,
    level: levelFilter !== "all" ? levelFilter : undefined,
  });

  const { data: statsData, isLoading: statsLoading } = useActivityStats(
    projectId,
    timeRangeParams
  );

  // Parse feed events
  const apiEvents: ActivityEvent[] = useMemo(() => {
    if (!feedData) return [];
    if (Array.isArray(feedData)) return feedData;
    if (feedData.events) return feedData.events;
    if (feedData.logs) return feedData.logs;
    if (feedData.data) {
      return Array.isArray(feedData.data) ? feedData.data : [];
    }
    return [];
  }, [feedData]);

  const meta = useMemo(() => {
    if (!feedData) return null;
    if (feedData.meta) return feedData.meta;
    if (feedData.pagination) return feedData.pagination;
    return null;
  }, [feedData]);

  // Parse stats
  const stats = useMemo(() => {
    if (!statsData) return null;
    return statsData;
  }, [statsData]);

  // Handle WebSocket messages (Socket.io format: { type, payload })
  useEffect(() => {
    if (!lastMessage || !liveMode) return;

    // Only handle NEW_LOG messages
    if (lastMessage.type !== "NEW_LOG") return;

    const log = lastMessage.payload?.log;
    if (!log) return;

    // Check if this message is a log event for our project
    const eventProjectId = log.projectId || log.project_id;
    if (eventProjectId && eventProjectId !== projectId) return;

    const newEvent: ActivityEvent = {
      _id: log._id || log.id || `ws-${Date.now()}-${Math.random()}`,
      timestamp: log.timestamp || new Date().toISOString(),
      level: log.level || "info",
      message: log.message || log.msg || "New event",
      service: log.service,
      eventType: log.eventType || log.type,
      environment: log.environment,
      projectId: eventProjectId,
    };

    // Apply level filter
    if (levelFilter !== "all" && newEvent.level !== levelFilter) return;

    setRealtimeEvents((prev) => [newEvent, ...prev].slice(0, 100));
  }, [lastMessage, liveMode, projectId, levelFilter]);

  // Auto-scroll to top when live mode is on and new events arrive
  useEffect(() => {
    if (liveMode && realtimeEvents.length > 0 && feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [realtimeEvents.length, liveMode]);

  // Clear realtime events when filter changes
  useEffect(() => {
    setRealtimeEvents([]);
  }, [levelFilter, page]);

  // Combine realtime + API events (realtime first, deduplicated)
  const allEvents = useMemo(() => {
    const existingIds = new Set(apiEvents.map((e) => e._id || e.id));
    const uniqueRealtime = realtimeEvents.filter(
      (e) => !existingIds.has(e._id || e.id)
    );
    return [...uniqueRealtime, ...apiEvents];
  }, [realtimeEvents, apiEvents]);

  const totalPages = meta?.total ? Math.ceil(meta.total / limit) : 1;

  return (
    <div className="flex flex-col h-full bg-bg-base">
      {/* Header */}
      <div className="shrink-0 px-6 pt-6">
        <PageHeader
          title="Activity Feed"
          description="Real-time event stream"
          badge={<Activity className="h-5 w-5 text-signal" />}
          actions={
            <div className="flex items-center gap-3">
              {/* Live indicator */}
              <div className="flex items-center gap-2">
                {isConnected && liveMode ? (
                  <>
                    <SignalDot status="ok" size="md" pulse={true} />
                    <span className="text-xs font-medium text-status-ok">Live</span>
                  </>
                ) : (
                  <>
                    <SignalDot
                      status={isConnected ? "info" : "danger"}
                      size="md"
                      pulse={false}
                    />
                    <span className="text-xs font-medium text-text-muted">
                      {isConnected ? "Paused" : "Disconnected"}
                    </span>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLiveMode((v) => !v)}
                className={cn(
                  "border-border-subtle",
                  liveMode && "border-signal/30 text-signal"
                )}
              >
                {liveMode ? (
                  <Pause className="w-3.5 h-3.5 mr-1.5" />
                ) : (
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                )}
                {liveMode ? "Pause" : "Resume"}
              </Button>
            </div>
          }
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            label="Events Today"
            value={statsLoading ? "..." : (stats?.eventsToday ?? stats?.totalEvents ?? 0)}
            icon={<Zap className="h-4 w-4" />}
          />
          <MetricCard
            label="Active Services"
            value={statsLoading ? "..." : (stats?.activeServices ?? stats?.services ?? 0)}
            icon={<Server className="h-4 w-4" />}
          />
          <MetricCard
            label="Error Rate"
            value={
              statsLoading
                ? "..."
                : stats?.errorRate !== undefined
                  ? `${(stats.errorRate * 100).toFixed(1)}%`
                  : stats?.errorPercentage !== undefined
                    ? `${stats.errorPercentage.toFixed(1)}%`
                    : "0%"
            }
            icon={<AlertTriangle className="h-4 w-4" />}
            variant={
              (stats?.errorRate ?? 0) > 0.1 || (stats?.errorPercentage ?? 0) > 10
                ? "danger"
                : (stats?.errorRate ?? 0) > 0.05 || (stats?.errorPercentage ?? 0) > 5
                  ? "warning"
                  : "default"
            }
          />
        </div>

        <EventVolumeChart
          projectId={projectId}
          selectedTimeRange={selectedTimeRange}
          customTimeRange={customTimeRange}
        />

        {/* Level Filter */}
        <div className="flex items-center gap-2">
          {LEVEL_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                setLevelFilter(opt.key);
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                levelFilter === opt.key
                  ? "bg-signal/10 text-signal border border-signal/30"
                  : "bg-bg-surface text-text-secondary border border-border-subtle hover:border-border-accent hover:text-text-primary"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Realtime banner */}
        {realtimeEvents.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-signal/5 border border-signal/20">
            <Radio className="h-3.5 w-3.5 text-signal animate-pulse" />
            <span className="text-xs text-signal font-medium">
              {realtimeEvents.length} new event{realtimeEvents.length !== 1 ? "s" : ""} received
            </span>
          </div>
        )}

        {/* Activity Feed */}
        {feedLoading && page === 1 ? (
          <SkeletonDashboard />
        ) : feedError ? (
          <Card className="border-border-subtle bg-bg-surface">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertTriangle className="h-12 w-12 text-status-danger mb-4" />
              <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
                Failed to load activity feed
              </h3>
              <p className="text-sm text-text-secondary max-w-md">
                An error occurred while fetching events. Please try again.
              </p>
            </div>
          </Card>
        ) : allEvents.length === 0 ? (
          <Card className="border-border-subtle bg-bg-surface">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Activity className="h-12 w-12 text-text-muted mb-4" />
              <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
                No activity yet
              </h3>
              <p className="text-sm text-text-secondary max-w-md">
                Events will appear here as your application generates logs.
                {levelFilter !== "all" &&
                  " Try changing the level filter to see more events."}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-0 rounded-lg border border-border-subtle bg-bg-surface overflow-hidden">
            <div ref={feedEndRef} />
            {allEvents.map((event, idx) => {
              const eventId = event._id || event.id || String(idx);
              const status = levelToStatus(event.level);
              const isRealtime = realtimeEvents.some(
                (re) => (re._id || re.id) === eventId
              );

              return (
                <div
                  key={eventId}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 border-b border-border-faint last:border-b-0 transition-colors",
                    isRealtime && "bg-signal/3 animate-in fade-in duration-300"
                  )}
                >
                  {/* Timestamp */}
                  <span className="text-xs text-text-muted font-mono w-20 shrink-0 pt-0.5">
                    {format(new Date(event.timestamp), "HH:mm:ss")}
                  </span>

                  {/* Level dot */}
                  <SignalDot
                    status={status}
                    size="sm"
                    pulse={false}
                    className="mt-1.5 shrink-0"
                  />

                  {/* Message */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary leading-relaxed">
                      {event.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-text-muted">
                        {formatDistanceToNow(new Date(event.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-2 shrink-0">
                    {event.service && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-signal/10 text-signal border-signal/30"
                      >
                        {event.service}
                      </Badge>
                    )}
                    {event.eventType && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-data-info/10 text-data-info border-data-info/30"
                      >
                        {event.eventType}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        LEVEL_BADGE_CLASSES[event.level] || LEVEL_BADGE_CLASSES.info
                      )}
                    >
                      {event.level}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="border-border-subtle"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Newer
            </Button>
            <span className="text-sm text-text-secondary">
              Page <span className="text-signal font-semibold">{page}</span> of{" "}
              {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="border-border-subtle"
            >
              Older
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

