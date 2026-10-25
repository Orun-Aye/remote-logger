"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApperioStore } from "@/store/apperio-store";
import { useSessions, useSessionStats } from "@/hooks/analytics.hook";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { SkeletonDashboard } from "@/components/shared/SkeletonDashboard";
import { SignalDot } from "@/components/shared/SignalDot";
import { ViewToggle, type ViewMode } from "@/components/shared/ViewToggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Clock,
  ArrowUpDown,
  Monitor,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Activity,
  BarChart3,
  MousePointerClick,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatDuration, resolveTimeRangeParams } from "@/lib/format-utils";

// ============================================
// Helpers
// ============================================

function truncateId(id: string, len = 12): string {
  if (id.length <= len) return id;
  return id.slice(0, len) + "...";
}

function detectDevice(userAgent?: string): "desktop" | "mobile" | "tablet" | "unknown" {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobile|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}

const DeviceIcon = ({ device }: { device: string }) => {
  switch (device) {
    case "mobile":
      return <Smartphone className="h-3.5 w-3.5" />;
    case "desktop":
    case "tablet":
      return <Monitor className="h-3.5 w-3.5" />;
    default:
      return <Monitor className="h-3.5 w-3.5" />;
  }
};

// ============================================
// Main Page
// ============================================

export default function SessionsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = typeof params?.projectId === "string" ? params.projectId : "";
  const router = useRouter();
  const selectedTimeRange = useApperioStore((s) => s.selectedTimeRange);
  const customTimeRange = useApperioStore((s) => s.customTimeRange);
  const timeRangeParams = useMemo(
    () => resolveTimeRangeParams(selectedTimeRange, customTimeRange),
    [selectedTimeRange, customTimeRange]
  );

  const [page, setPage] = useState(1);
  const [sessionsView, setSessionsView] = useState<ViewMode>("table");
  const limit = 20;

  // Data hooks
  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = useSessions(projectId, { page, limit, ...timeRangeParams });

  const { data: statsData, isLoading: statsLoading } = useSessionStats(projectId, timeRangeParams);

  const sessions = useMemo(() => {
    if (!sessionsData) return [];
    if (Array.isArray(sessionsData)) return sessionsData;
    if (sessionsData.sessions) return sessionsData.sessions;
    if (sessionsData.data) {
      return Array.isArray(sessionsData.data) ? sessionsData.data : [];
    }
    return [];
  }, [sessionsData]);

  const meta = useMemo(() => {
    if (!sessionsData) return null;
    if (sessionsData.meta) return sessionsData.meta;
    if (sessionsData.pagination) return sessionsData.pagination;
    return null;
  }, [sessionsData]);

  const stats = useMemo(() => {
    if (!statsData) return null;
    return statsData;
  }, [statsData]);

  const totalPages = meta?.total ? Math.ceil(meta.total / limit) : 1;

  return (
    <div className="flex flex-col h-full bg-bg-base">
      {/* Header */}
      <div className="shrink-0">
        <PageHeader
          title="Sessions"
          description="User session analysis and behavior tracking"
          badge={<Users className="h-5 w-5 text-signal" />}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Sessions"
            value={statsLoading ? "..." : (stats?.totalSessions ?? stats?.total ?? 0)}
            icon={<Users className="h-4 w-4" />}
          />
          <MetricCard
            label="Avg Duration"
            value={
              statsLoading
                ? "..."
                : stats?.avgDuration
                  ? formatDuration(stats.avgDuration)
                  : "0s"
            }
            icon={<Clock className="h-4 w-4" />}
          />
          <MetricCard
            label="Bounce Rate"
            value={
              statsLoading
                ? "..."
                : stats?.bounceRate !== undefined
                  ? `${(stats.bounceRate * 100).toFixed(1)}%`
                  : "0%"
            }
            icon={<ArrowUpDown className="h-4 w-4" />}
            variant={
              stats?.bounceRate && stats.bounceRate > 0.7
                ? "danger"
                : stats?.bounceRate && stats.bounceRate > 0.4
                  ? "warning"
                  : "default"
            }
          />
          <MetricCard
            label="Active Sessions"
            value={statsLoading ? "..." : (stats?.activeSessions ?? stats?.active ?? 0)}
            icon={<Activity className="h-4 w-4" />}
            variant="success"
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-display font-semibold text-text-primary">
            Sessions
          </h3>
          <ViewToggle mode={sessionsView} onChange={setSessionsView} />
        </div>

        {/* Sessions List */}
        {sessionsLoading ? (
          <SkeletonDashboard />
        ) : sessionsError ? (
          <Card className="border-border-subtle bg-bg-surface">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Activity className="h-12 w-12 text-status-danger mb-4" />
              <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
                Failed to load sessions
              </h3>
              <p className="text-sm text-text-secondary max-w-md">
                An error occurred while fetching session data. Please try again later.
              </p>
            </div>
          </Card>
        ) : sessions.length === 0 ? (
          <Card className="border-border-subtle bg-bg-surface">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-12 w-12 text-text-muted mb-4" />
              <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
                No sessions recorded yet
              </h3>
              <p className="text-sm text-text-secondary max-w-md">
                Sessions will appear here once users interact with your application.
                Make sure your SDK is configured with session tracking enabled.
              </p>
            </div>
          </Card>
        ) : sessionsView === "table" ? (
          <div className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[minmax(130px,1fr)_140px_100px_80px_80px_80px_90px] gap-4 px-4 py-3 border-b border-border-subtle bg-bg-base/50">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Session ID
              </span>
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Start Time
              </span>
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Duration
              </span>
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Events
              </span>
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Pages
              </span>
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Device
              </span>
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Status
              </span>
            </div>

            {/* Table Rows */}
            {sessions.map((session: any) => {
              const sessionId =
                session.sessionId || session._id || session.id || "";
              const startTime = session.startTime || session.firstSeen || session.timestamp;
              const duration = session.duration ?? session.totalDuration ?? 0;
              const eventCount = session.eventCount ?? session.events ?? session.logCount ?? 0;
              const pageCount = session.pageCount ?? session.pageViews ?? session.pages ?? session.uniquePages ?? 0;
              const device = session.device || detectDevice(session.userAgent);
              const isActive =
                session.status === "active" ||
                session.isActive === true ||
                (!session.endTime && !session.lastSeen);

              return (
                <Link
                  key={sessionId}
                  href={`/projects/${projectId}/sessions/${encodeURIComponent(sessionId)}`}
                  className="grid grid-cols-[minmax(130px,1fr)_140px_100px_80px_80px_80px_90px] gap-4 px-4 py-3 border-b border-border-subtle last:border-b-0 hover:bg-bg-elevated/50 transition-colors cursor-pointer group"
                >
                  {/* Session ID */}
                  <span className="font-mono text-sm text-text-primary group-hover:text-signal transition-colors truncate">
                    {truncateId(sessionId)}
                  </span>

                  {/* Start Time */}
                  <span className="text-sm text-text-secondary">
                    {startTime
                      ? formatDistanceToNow(new Date(startTime), { addSuffix: true })
                      : "--"}
                  </span>

                  {/* Duration */}
                  <span className="text-sm font-mono text-text-primary">
                    {formatDuration(duration)}
                  </span>

                  {/* Events */}
                  <span className="text-sm text-text-secondary">{eventCount}</span>

                  {/* Pages */}
                  <span className="text-sm text-text-secondary">{pageCount}</span>

                  {/* Device */}
                  <span className="flex items-center gap-1.5 text-sm text-text-muted">
                    <DeviceIcon device={device} />
                    <span className="capitalize text-xs">{device}</span>
                  </span>

                  {/* Status */}
                  <span className="flex items-center gap-1.5">
                    <SignalDot
                      status={isActive ? "ok" : "info"}
                      size="sm"
                      pulse={isActive}
                    />
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        isActive
                          ? "bg-status-ok/10 text-status-ok border-status-ok/30"
                          : "bg-bg-elevated text-text-muted border-border-subtle"
                      )}
                    >
                      {isActive ? "Active" : "Ended"}
                    </Badge>
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sessions.map((session: any) => {
              const sessionId =
                session.sessionId || session._id || session.id || "";
              const startTime = session.startTime || session.firstSeen || session.timestamp;
              const duration = session.duration ?? session.totalDuration ?? 0;
              const eventCount = session.eventCount ?? session.events ?? session.logCount ?? 0;
              const pageCount = session.pageCount ?? session.pageViews ?? session.pages ?? session.uniquePages ?? 0;
              const device = session.device || detectDevice(session.userAgent);
              const hasErrors = session.hasErrors === true || (session.errorCount ?? 0) > 0;
              const isActive =
                session.status === "active" ||
                session.isActive === true ||
                (!session.endTime && !session.lastSeen);

              return (
                <Link
                  key={sessionId}
                  href={`/projects/${projectId}/sessions/${encodeURIComponent(sessionId)}`}
                  className="block"
                >
                  <Card className="border-border-subtle bg-bg-surface hover:bg-bg-elevated/50 transition-colors cursor-pointer group p-4 space-y-3">
                    {/* Top row: ID + status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm text-text-primary group-hover:text-signal transition-colors truncate">
                        {truncateId(sessionId)}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        {hasErrors && (
                          <SignalDot status="danger" size="sm" />
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            isActive
                              ? "bg-status-ok/10 text-status-ok border-status-ok/30"
                              : "bg-bg-elevated text-text-muted border-border-subtle"
                          )}
                        >
                          {isActive ? "Active" : "Ended"}
                        </Badge>
                      </div>
                    </div>

                    {/* Start time + duration */}
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {startTime
                          ? formatDistanceToNow(new Date(startTime), { addSuffix: true })
                          : "--"}
                      </span>
                      <span className="font-mono text-text-secondary">
                        {formatDuration(duration)}
                      </span>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <MousePointerClick className="h-3 w-3" />
                        {eventCount} events
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        {pageCount} pages
                      </span>
                      <span className="flex items-center gap-1">
                        <DeviceIcon device={device} />
                        <span className="capitalize">{device}</span>
                      </span>
                    </div>
                  </Card>
                </Link>
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
              Previous
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
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
