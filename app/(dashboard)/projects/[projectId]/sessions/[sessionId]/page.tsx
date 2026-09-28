"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useSessionDetail, useSessionTimeline } from "@/hooks/analytics.hook";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { JsonTreeViewer } from "@/components/shared/JsonTreeViewer";
import { SignalDot } from "@/components/shared/SignalDot";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SessionReplayTab } from "@/components/replay/SessionReplayTab";
import {
  ArrowLeft,
  Clock,
  Layers,
  FileText,
  MousePointerClick,
  AlertTriangle,
  Globe,
  Terminal,
  Wifi,
  Eye,
  Users,
  Video,
  ListTree,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface TimelineEvent {
  _id?: string;
  id?: string;
  timestamp: string;
  eventType?: string;
  type?: string;
  level?: string;
  message?: string;
  url?: string;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// ============================================
// Helpers
// ============================================

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function truncateId(id: string, len = 12): string {
  if (id.length <= len) return id;
  return id.slice(0, len) + "...";
}

function getEventTypeLabel(event: TimelineEvent): string {
  return event.eventType || event.type || event.level || "unknown";
}

type EventCategory = "pageview" | "interaction" | "error" | "network" | "console" | "other";

function categorizeEvent(event: TimelineEvent): EventCategory {
  const et = getEventTypeLabel(event).toLowerCase();
  if (et === "pageview" || et === "page_view") return "pageview";
  if (et === "interaction" || et === "click" || et === "input") return "interaction";
  if (et === "error" || event.level === "error" || event.level === "fatal") return "error";
  if (et === "network" || et === "fetch" || et === "xhr") return "network";
  if (et === "console" || et === "log") return "console";
  return "other";
}

const EVENT_COLORS: Record<EventCategory, string> = {
  pageview: "bg-data-info",
  interaction: "bg-signal",
  error: "bg-status-danger",
  network: "bg-data-purple",
  console: "bg-text-muted",
  other: "bg-text-muted",
};

const EVENT_TEXT_COLORS: Record<EventCategory, string> = {
  pageview: "text-data-info",
  interaction: "text-signal",
  error: "text-status-danger",
  network: "text-data-purple",
  console: "text-text-muted",
  other: "text-text-muted",
};

const EVENT_BORDER_COLORS: Record<EventCategory, string> = {
  pageview: "border-data-info/40",
  interaction: "border-signal/40",
  error: "border-status-danger/40",
  network: "border-data-purple/40",
  console: "border-border-subtle",
  other: "border-border-subtle",
};

const EventIcon = ({ category }: { category: EventCategory }) => {
  switch (category) {
    case "pageview":
      return <Eye className="h-3.5 w-3.5" />;
    case "interaction":
      return <MousePointerClick className="h-3.5 w-3.5" />;
    case "error":
      return <AlertTriangle className="h-3.5 w-3.5" />;
    case "network":
      return <Wifi className="h-3.5 w-3.5" />;
    case "console":
      return <Terminal className="h-3.5 w-3.5" />;
    default:
      return <FileText className="h-3.5 w-3.5" />;
  }
};

// ============================================
// Session Timeline Component (inline)
// ============================================

function SessionTimeline({
  events,
  sessionStart,
  sessionEnd,
  selectedEventId,
  onEventSelect,
}: {
  events: TimelineEvent[];
  sessionStart: number;
  sessionEnd: number;
  selectedEventId: string | null;
  onEventSelect: (eventId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const totalDuration = sessionEnd - sessionStart || 1;

  // Generate time axis labels
  const timeLabels = useMemo(() => {
    const labels: { position: number; label: string }[] = [];
    const labelCount = Math.min(8, Math.max(3, Math.floor(totalDuration / 5000)));
    for (let i = 0; i <= labelCount; i++) {
      const ratio = i / labelCount;
      const time = sessionStart + totalDuration * ratio;
      labels.push({
        position: ratio * 100,
        label: format(new Date(time), "HH:mm:ss"),
      });
    }
    return labels;
  }, [sessionStart, sessionEnd, totalDuration]);

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden">
      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-border-faint bg-bg-base/50">
        <span className="text-xs text-text-muted font-medium">Event Types:</span>
        {(["pageview", "interaction", "error", "network", "console"] as EventCategory[]).map(
          (cat) => (
            <span key={cat} className="flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-full", EVENT_COLORS[cat])} />
              <span className="text-xs text-text-secondary capitalize">{cat}</span>
            </span>
          )
        )}
      </div>

      {/* Timeline Track */}
      <div className="px-4 py-6" ref={containerRef}>
        <div className="relative h-16">
          {/* Baseline */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-border-subtle" />

          {/* Event dots */}
          {events.map((event, idx) => {
            const eventTime = new Date(event.timestamp).getTime();
            const position = ((eventTime - sessionStart) / totalDuration) * 100;
            const clampedPosition = Math.max(0, Math.min(100, position));
            const category = categorizeEvent(event);
            const eventId = event._id || event.id || String(idx);
            const isSelected = selectedEventId === eventId;

            return (
              <button
                key={eventId}
                onClick={() => onEventSelect(eventId)}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 transition-all duration-150",
                  "rounded-full border-2",
                  isSelected
                    ? "w-4 h-4 ring-2 ring-signal/30 scale-125"
                    : "w-3 h-3 hover:scale-125",
                  EVENT_COLORS[category],
                  EVENT_BORDER_COLORS[category]
                )}
                style={{ left: `${clampedPosition}%` }}
                title={`${category}: ${event.message || getEventTypeLabel(event)}`}
              >
                {/* Vertical tick */}
                <span
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 w-px",
                    isSelected ? "h-5 bg-signal/60" : "h-3 bg-border-subtle",
                    "top-full mt-0.5"
                  )}
                />
              </button>
            );
          })}
        </div>

        {/* Time Axis */}
        <div className="relative h-5 mt-2">
          {timeLabels.map((label, idx) => (
            <span
              key={idx}
              className="absolute text-[10px] text-text-muted font-mono -translate-x-1/2"
              style={{ left: `${label.position}%` }}
            >
              {label.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Page
// ============================================

export default function SessionDetailPage() {
  const params = useParams<{ projectId: string; sessionId: string }>();
  const projectId = typeof params?.projectId === "string" ? params.projectId : "";
  const sessionId = typeof params?.sessionId === "string" ? params.sessionId : "";
  const router = useRouter();

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Tab lives in the URL (?tab=replay) so a replay can be linked to directly
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeTab = searchParams.get("tab") === "replay" ? "replay" : "timeline";
  // ?at=<epoch ms>: start the replay at that moment (e.g. an error)
  const replayAt = Number(searchParams.get("at")) || undefined;
  const setActiveTab = (tab: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (tab === "replay") next.set("tab", "replay");
    else next.delete("tab");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  // Data hooks
  const {
    data: detailData,
    isLoading: detailLoading,
    error: detailError,
  } = useSessionDetail(projectId, sessionId);

  const {
    data: timelineData,
    isLoading: timelineLoading,
  } = useSessionTimeline(projectId, sessionId);

  // Parse session detail
  const sessionDetail = useMemo(() => {
    if (!detailData) return null;
    return detailData;
  }, [detailData]);

  // Parse timeline events
  const events: TimelineEvent[] = useMemo(() => {
    if (!timelineData) return [];
    if (Array.isArray(timelineData)) return timelineData;
    if (timelineData.events) return timelineData.events;
    if (timelineData.timeline) return timelineData.timeline;
    if (timelineData.data) {
      return Array.isArray(timelineData.data) ? timelineData.data : [];
    }
    return [];
  }, [timelineData]);

  // Compute session boundaries from events
  const sessionBounds = useMemo(() => {
    if (events.length === 0) {
      return { start: Date.now(), end: Date.now() };
    }
    const timestamps = events.map((e) => new Date(e.timestamp).getTime());
    return {
      start: Math.min(...timestamps),
      end: Math.max(...timestamps),
    };
  }, [events]);

  // Selected event detail
  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return events.find(
      (e) => (e._id || e.id) === selectedEventId
    ) || null;
  }, [events, selectedEventId]);

  // Session metrics
  const duration = sessionDetail?.duration ??
    sessionDetail?.totalDuration ??
    (sessionBounds.end - sessionBounds.start);
  const eventCount = sessionDetail?.eventCount ?? events.length;
  const pageCount = sessionDetail?.pageCount ??
    sessionDetail?.uniquePages ??
    new Set(events.filter((e) => categorizeEvent(e) === "pageview").map((e) => e.url)).size;

  const isLoading = detailLoading || timelineLoading;

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-80" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (detailError) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-16 bg-bg-surface border border-border-subtle rounded-lg">
          <AlertTriangle className="h-12 w-12 text-status-danger mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-status-danger">
            Failed to load session
          </h2>
          <p className="text-text-secondary mt-2">
            Could not fetch session details. The session may not exist.
          </p>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link href={`/projects/${projectId}/sessions`}>Back to Sessions</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title={`Session ${truncateId(sessionId, 16)}`}
        description={
          sessionBounds.start
            ? `Started ${format(new Date(sessionBounds.start), "MMM dd, yyyy HH:mm:ss")}`
            : undefined
        }
        badge={<Users className="h-5 w-5 text-signal" />}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Duration"
          value={formatDuration(duration)}
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricCard
          label="Events"
          value={eventCount}
          icon={<Layers className="h-4 w-4" />}
        />
        <MetricCard
          label="Pages Visited"
          value={pageCount}
          icon={<Globe className="h-4 w-4" />}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
        <TabsList>
          <TabsTrigger value="timeline">
            <ListTree />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="replay">
            <Video />
            Replay
          </TabsTrigger>
        </TabsList>

        <TabsContent value="replay">
          <SessionReplayTab projectId={projectId} sessionId={sessionId} startAt={replayAt} />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          {/* Timeline */}
          {events.length > 0 ? (
            <SessionTimeline
              events={events}
              sessionStart={sessionBounds.start}
              sessionEnd={sessionBounds.end}
              selectedEventId={selectedEventId}
              onEventSelect={(id) =>
                setSelectedEventId((prev) => (prev === id ? null : id))
              }
            />
          ) : (
            <Card className="border-border-subtle bg-bg-surface">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Layers className="h-10 w-10 text-text-muted mb-3" />
                <h3 className="text-sm font-display font-semibold text-text-primary mb-1">
                  No timeline events
                </h3>
                <p className="text-xs text-text-secondary">
                  No events were recorded for this session.
                </p>
              </div>
            </Card>
          )}

          {/* Selected Event Detail */}
          {selectedEvent && (
            <Card className="border-border-subtle bg-bg-surface overflow-hidden">
              <div className="px-5 py-4 border-b border-border-faint bg-bg-base/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex items-center gap-1.5 text-sm font-medium",
                      EVENT_TEXT_COLORS[categorizeEvent(selectedEvent)]
                    )}
                  >
                    <EventIcon category={categorizeEvent(selectedEvent)} />
                    <span className="capitalize">{getEventTypeLabel(selectedEvent)}</span>
                  </span>
                  <span className="text-xs text-text-muted font-mono">
                    {format(new Date(selectedEvent.timestamp), "HH:mm:ss.SSS")}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEventId(null)}
                  className="text-text-muted hover:text-text-primary text-xs"
                >
                  Close
                </Button>
              </div>

              <div className="p-5 space-y-4">
                {/* Event Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-text-muted block mb-1">Type</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs capitalize",
                        `${EVENT_TEXT_COLORS[categorizeEvent(selectedEvent)]}`,
                        `border ${EVENT_BORDER_COLORS[categorizeEvent(selectedEvent)]}`
                      )}
                    >
                      {getEventTypeLabel(selectedEvent)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-text-muted block mb-1">Timestamp</span>
                    <span className="text-sm text-text-primary font-mono">
                      {format(new Date(selectedEvent.timestamp), "yyyy-MM-dd HH:mm:ss.SSS")}
                    </span>
                  </div>
                  {selectedEvent.url && (
                    <div className="sm:col-span-2">
                      <span className="text-xs text-text-muted block mb-1">URL</span>
                      <span className="text-sm text-text-primary font-mono break-all">
                        {selectedEvent.url}
                      </span>
                    </div>
                  )}
                  {selectedEvent.message && (
                    <div className="sm:col-span-2">
                      <span className="text-xs text-text-muted block mb-1">Message</span>
                      <span className="text-sm text-text-primary">
                        {selectedEvent.message}
                      </span>
                    </div>
                  )}
                </div>

                {/* Error details */}
                {selectedEvent.error && (
                  <div>
                    <span className="text-xs text-text-muted block mb-2">Error</span>
                    <div className="rounded-md border border-status-danger/20 bg-status-danger/5 p-3 space-y-1">
                      <p className="text-sm font-medium text-status-danger">
                        {selectedEvent.error.name}: {selectedEvent.error.message}
                      </p>
                      {selectedEvent.error.stack && (
                        <pre className="text-xs text-text-muted font-mono whitespace-pre-wrap mt-2 max-h-40 overflow-y-auto">
                          {selectedEvent.error.stack}
                        </pre>
                      )}
                    </div>
                  </div>
                )}

                {/* Data / Metadata */}
                {(selectedEvent.data || selectedEvent.metadata || selectedEvent.context) && (
                  <div>
                    <span className="text-xs text-text-muted block mb-2">Data</span>
                    <JsonTreeViewer
                      data={selectedEvent.data || selectedEvent.metadata || selectedEvent.context}
                      initialExpanded={true}
                      maxDepth={5}
                    />
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Event List (vertical) */}
          {events.length > 0 && (
            <Card className="border-border-subtle bg-bg-surface overflow-hidden">
              <div className="px-5 py-3 border-b border-border-faint bg-bg-base/50">
                <h3 className="text-sm font-display font-semibold text-text-primary">
                  All Events ({events.length})
                </h3>
              </div>
              <div className="divide-y divide-border-faint max-h-[400px] overflow-y-auto">
                {events.map((event, idx) => {
                  const eventId = event._id || event.id || String(idx);
                  const category = categorizeEvent(event);
                  const isSelected = selectedEventId === eventId;

                  return (
                    <button
                      key={eventId}
                      onClick={() =>
                        setSelectedEventId((prev) => (prev === eventId ? null : eventId))
                      }
                      className={cn(
                        "w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-bg-elevated/50 transition-colors",
                        isSelected && "bg-signal/5 border-l-2 border-l-signal"
                      )}
                    >
                      <span className="text-xs text-text-muted font-mono w-20 shrink-0">
                        {format(new Date(event.timestamp), "HH:mm:ss")}
                      </span>
                      <span className={cn("shrink-0", EVENT_TEXT_COLORS[category])}>
                        <EventIcon category={category} />
                      </span>
                      <span className="text-sm text-text-primary truncate flex-1">
                        {event.message || getEventTypeLabel(event)}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] capitalize shrink-0",
                          EVENT_TEXT_COLORS[category],
                          EVENT_BORDER_COLORS[category]
                        )}
                      >
                        {category}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
