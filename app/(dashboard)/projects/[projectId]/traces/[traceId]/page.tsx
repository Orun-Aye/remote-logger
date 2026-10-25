"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTraceDetail, useTraceSpans } from "@/hooks/trace.hook";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { JsonTreeViewer } from "@/components/shared/JsonTreeViewer";
import { SignalDot } from "@/components/shared/SignalDot";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  GitBranch,
  Clock,
  Layers,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SpanData } from "@/services/trace.service";
import { LogEntry } from "@/types/analytics";

// ============================================
// Helpers
// ============================================

function formatDuration(ms: number): string {
  if (ms < 1) return "<1ms";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(2)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function truncateId(id: string, len = 16): string {
  if (id.length <= len) return id;
  return id.slice(0, len) + "...";
}

// Color palette for services
const SERVICE_COLORS = [
  { bg: "bg-signal/80", bar: "bg-signal", text: "text-signal" },
  { bg: "bg-data-info/80", bar: "bg-data-info", text: "text-data-info" },
  { bg: "bg-data-purple/80", bar: "bg-data-purple", text: "text-data-purple" },
  { bg: "bg-status-warn/80", bar: "bg-status-warn", text: "text-status-warn" },
  { bg: "bg-[#e879f9]/80", bar: "bg-[#e879f9]", text: "text-[#e879f9]" },
  { bg: "bg-[#fb923c]/80", bar: "bg-[#fb923c]", text: "text-[#fb923c]" },
  { bg: "bg-[#38bdf8]/80", bar: "bg-[#38bdf8]", text: "text-[#38bdf8]" },
  { bg: "bg-[#a78bfa]/80", bar: "bg-[#a78bfa]", text: "text-[#a78bfa]" },
];

function getServiceColor(service: string, serviceMap: Map<string, number>) {
  if (!serviceMap.has(service)) {
    serviceMap.set(service, serviceMap.size % SERVICE_COLORS.length);
  }
  return SERVICE_COLORS[serviceMap.get(service)!];
}

// ============================================
// Span Tree builder
// ============================================

interface SpanNode {
  span: SpanData;
  children: SpanNode[];
  depth: number;
}

function buildSpanTree(spans: SpanData[]): SpanNode[] {
  const spanMap = new Map<string, SpanNode>();
  const roots: SpanNode[] = [];

  // Create nodes
  spans.forEach((span) => {
    spanMap.set(span.spanId, { span, children: [], depth: 0 });
  });

  // Build tree
  spans.forEach((span) => {
    const node = spanMap.get(span.spanId)!;
    if (span.parentSpanId && spanMap.has(span.parentSpanId)) {
      const parent = spanMap.get(span.parentSpanId)!;
      parent.children.push(node);
      node.depth = parent.depth + 1;
    } else {
      roots.push(node);
    }
  });

  // Flatten tree with depth info
  function setDepths(nodes: SpanNode[], depth: number) {
    nodes.forEach((node) => {
      node.depth = depth;
      setDepths(node.children, depth + 1);
    });
  }
  setDepths(roots, 0);

  return roots;
}

function flattenTree(nodes: SpanNode[], collapsed: Set<string>): SpanNode[] {
  const result: SpanNode[] = [];
  function walk(nodeList: SpanNode[]) {
    nodeList.forEach((node) => {
      result.push(node);
      if (!collapsed.has(node.span.spanId)) {
        walk(node.children);
      }
    });
  }
  walk(nodes);
  return result;
}

// ============================================
// Waterfall Visualization Component
// ============================================

function WaterfallVisualization({
  spans,
  traceStart,
  traceDuration,
  selectedSpanId,
  onSpanClick,
}: {
  spans: SpanData[];
  traceStart: number;
  traceDuration: number;
  selectedSpanId: string | null;
  onSpanClick: (spanId: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const serviceMap = useMemo(() => new Map<string, number>(), []);

  const spanTree = useMemo(() => buildSpanTree(spans), [spans]);
  const flatSpans = useMemo(
    () => flattenTree(spanTree, collapsed),
    [spanTree, collapsed]
  );

  const toggleCollapse = useCallback((spanId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(spanId)) {
        next.delete(spanId);
      } else {
        next.add(spanId);
      }
      return next;
    });
  }, []);

  // Time axis labels
  const timeLabels = useMemo(() => {
    const labels: { position: number; label: string }[] = [];
    const count = 6;
    for (let i = 0; i <= count; i++) {
      const ratio = i / count;
      const timeMs = traceDuration * ratio;
      labels.push({
        position: ratio * 100,
        label: formatDuration(timeMs),
      });
    }
    return labels;
  }, [traceDuration]);

  if (spans.length === 0) {
    return (
      <Card className="border-border-subtle bg-bg-surface">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Layers className="h-10 w-10 text-text-muted mb-3" />
          <h3 className="text-sm font-display font-semibold text-text-primary mb-1">
            No span data available
          </h3>
          <p className="text-xs text-text-secondary">
            No spans were recorded for this trace.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden">
      {/* Time Axis */}
      <div className="relative h-8 border-b border-border-faint bg-bg-base/50 mx-4">
        <div className="absolute left-[200px] right-0 top-0 bottom-0">
          {timeLabels.map((label, idx) => (
            <span
              key={idx}
              className="absolute bottom-1 text-[10px] text-text-muted font-mono -translate-x-1/2"
              style={{ left: `${label.position}%` }}
            >
              {label.label}
            </span>
          ))}
        </div>
      </div>

      {/* Span Rows */}
      <div className="divide-y divide-border-faint">
        {flatSpans.map((node) => {
          const { span, depth, children } = node;
          const color = getServiceColor(span.service, serviceMap);
          const spanStart = new Date(span.startTime).getTime() - traceStart;
          const leftPercent = Math.max(0, (spanStart / traceDuration) * 100);
          const widthPercent = Math.max(0.5, (span.duration / traceDuration) * 100);
          const isSelected = selectedSpanId === span.spanId;
          const hasChildren = children.length > 0;
          const isCollapsed = collapsed.has(span.spanId);
          const hasErrors = span.hasErrors > 0;

          return (
            <button
              key={span.spanId}
              onClick={() => onSpanClick(span.spanId)}
              className={cn(
                "w-full flex items-center h-10 hover:bg-bg-elevated/50 transition-colors text-left",
                isSelected && "bg-signal/5 border-l-2 border-l-signal"
              )}
            >
              {/* Label side */}
              <div
                className="flex items-center gap-1 w-[200px] shrink-0 px-3 overflow-hidden"
                style={{ paddingLeft: `${12 + depth * 16}px` }}
              >
                {/* Collapse toggle */}
                {hasChildren ? (
                  <button
                    onClick={(e) => toggleCollapse(span.spanId, e)}
                    className="shrink-0 text-text-muted hover:text-text-primary"
                  >
                    {isCollapsed ? (
                      <ChevronRightIcon className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                ) : (
                  <span className="w-3 shrink-0" />
                )}

                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    color.bar
                  )}
                />
                <span className="text-xs text-text-primary truncate">
                  {span.name || span.service}
                </span>
                {hasErrors && (
                  <XCircle className="w-3 h-3 text-status-danger shrink-0" />
                )}
              </div>

              {/* Waterfall bar */}
              <div className="flex-1 relative h-full px-2">
                <div
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 h-5 rounded-sm transition-all",
                    isSelected ? "ring-1 ring-signal/50" : "",
                    hasErrors ? "bg-status-danger/70" : color.bar,
                    "opacity-80 hover:opacity-100"
                  )}
                  style={{
                    left: `${leftPercent}%`,
                    width: `${Math.max(widthPercent, 0.3)}%`,
                    minWidth: "4px",
                  }}
                />
                {/* Duration label */}
                <span
                  className="absolute top-1/2 -translate-y-1/2 text-[10px] text-text-muted font-mono whitespace-nowrap"
                  style={{
                    left: `${leftPercent + widthPercent + 0.5}%`,
                  }}
                >
                  {formatDuration(span.duration)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Service Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-border-faint bg-bg-base/50">
        <span className="text-xs text-text-muted">Services:</span>
        {Array.from(serviceMap.entries()).map(([service, idx]) => (
          <span key={service} className="flex items-center gap-1.5">
            <span
              className={cn("w-2 h-2 rounded-full", SERVICE_COLORS[idx].bar)}
            />
            <span className="text-xs text-text-secondary">{service}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Main Page
// ============================================

export default function TraceDetailPage() {
  const params = useParams<{ projectId: string; traceId: string }>();
  const projectId = typeof params?.projectId === "string" ? params.projectId : "";
  const traceId = typeof params?.traceId === "string" ? params.traceId : "";
  const router = useRouter();

  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Data hooks
  const {
    data: detailResponse,
    isLoading: detailLoading,
    error: detailError,
  } = useTraceDetail(projectId, traceId);

  const {
    data: spansResponse,
    isLoading: spansLoading,
  } = useTraceSpans(projectId, traceId);

  const logs: LogEntry[] = useMemo(
    () => detailResponse?.data || [],
    [detailResponse?.data]
  );

  const spans: SpanData[] = useMemo(
    () => spansResponse?.data || [],
    [spansResponse?.data]
  );

  // Compute trace summary
  const traceSummary = useMemo(() => {
    if (logs.length === 0 && spans.length === 0) return null;

    const timestamps = logs.map((l) => new Date(l.timestamp).getTime());
    const spanStarts = spans.map((s) => new Date(s.startTime).getTime());
    const spanEnds = spans.map((s) => new Date(s.endTime).getTime());
    const allStarts = [...timestamps, ...spanStarts];
    const allEnds = [...timestamps, ...spanEnds];

    const startTime = Math.min(...allStarts);
    const endTime = Math.max(...allEnds);
    const duration = endTime - startTime;
    const hasErrors = spans.some((s) => s.hasErrors > 0) ||
      logs.some((l) => l.level === "error" || l.level === "fatal");

    return {
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      duration,
      spanCount: spans.length,
      logCount: logs.length,
      hasErrors,
    };
  }, [logs, spans]);

  // Selected span
  const selectedSpan = useMemo(
    () => spans.find((s) => s.spanId === selectedSpanId) || null,
    [spans, selectedSpanId]
  );

  // Logs for selected span
  const selectedSpanLogs = useMemo(() => {
    if (!selectedSpanId) return [];
    return logs.filter(
      (log) =>
        (log.context as Record<string, string> | undefined)?.spanId === selectedSpanId ||
        (log.metadata as Record<string, string> | undefined)?.spanId === selectedSpanId
    );
  }, [logs, selectedSpanId]);

  const handleCopyTraceId = useCallback(() => {
    navigator.clipboard.writeText(traceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [traceId]);

  const isLoading = detailLoading || spansLoading;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-80" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (detailError) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-16 bg-bg-surface border border-border-subtle rounded-lg">
          <AlertTriangle className="h-12 w-12 text-status-danger mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-status-danger">
            Failed to load trace
          </h2>
          <p className="text-text-secondary mt-2">
            Could not fetch trace details. The trace may not exist or an error occurred.
          </p>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link href={`/projects/${projectId}/traces`}>Back to Traces</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title={`Trace ${truncateId(traceId)}`}
        description={
          traceSummary
            ? `Started ${format(new Date(traceSummary.startTime), "MMM dd, yyyy HH:mm:ss")}`
            : undefined
        }
        badge={<GitBranch className="h-5 w-5 text-signal" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyTraceId}
              className="text-text-muted hover:text-text-primary"
            >
              {copied ? (
                <Check className="w-4 h-4 mr-1 text-status-ok" />
              ) : (
                <Copy className="w-4 h-4 mr-1" />
              )}
              {copied ? "Copied" : "Copy ID"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Duration"
          value={traceSummary ? formatDuration(traceSummary.duration) : "0ms"}
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricCard
          label="Spans"
          value={traceSummary?.spanCount ?? 0}
          icon={<Layers className="h-4 w-4" />}
        />
        <MetricCard
          label="Status"
          value={traceSummary?.hasErrors ? "Error" : "OK"}
          icon={
            traceSummary?.hasErrors ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )
          }
          variant={traceSummary?.hasErrors ? "danger" : "success"}
        />
      </div>

      {/* Waterfall */}
      <WaterfallVisualization
        spans={spans}
        traceStart={
          traceSummary ? new Date(traceSummary.startTime).getTime() : Date.now()
        }
        traceDuration={traceSummary?.duration || 1}
        selectedSpanId={selectedSpanId}
        onSpanClick={(id) =>
          setSelectedSpanId((prev) => (prev === id ? null : id))
        }
      />

      {/* Selected Span Detail */}
      {selectedSpan && (
        <Card className="border-border-subtle bg-bg-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-border-faint bg-bg-base/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Layers className="h-4 w-4 text-signal" />
              <h3 className="text-sm font-display font-semibold text-text-primary">
                Span Detail
              </h3>
              {selectedSpan.hasErrors > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs bg-status-danger/10 text-status-danger border-status-danger/30"
                >
                  Error
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSpanId(null)}
              className="text-text-muted hover:text-text-primary text-xs"
            >
              Close
            </Button>
          </div>

          <div className="p-5 space-y-4">
            {/* Span Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <span className="text-xs text-text-muted block mb-1">Name</span>
                <span className="text-sm text-text-primary font-medium">
                  {selectedSpan.name}
                </span>
              </div>
              <div>
                <span className="text-xs text-text-muted block mb-1">Service</span>
                <Badge
                  variant="outline"
                  className="text-xs bg-signal/10 text-signal border-signal/30"
                >
                  {selectedSpan.service}
                </Badge>
              </div>
              <div>
                <span className="text-xs text-text-muted block mb-1">Duration</span>
                <span className="text-sm text-text-primary font-mono">
                  {formatDuration(selectedSpan.duration)}
                </span>
              </div>
              <div>
                <span className="text-xs text-text-muted block mb-1">Span ID</span>
                <span className="text-sm text-text-primary font-mono">
                  {truncateId(selectedSpan.spanId)}
                </span>
              </div>
              <div>
                <span className="text-xs text-text-muted block mb-1">Start Time</span>
                <span className="text-sm text-text-primary font-mono">
                  {format(new Date(selectedSpan.startTime), "HH:mm:ss.SSS")}
                </span>
              </div>
              <div>
                <span className="text-xs text-text-muted block mb-1">Status</span>
                <span className="flex items-center gap-1.5">
                  <SignalDot
                    status={selectedSpan.hasErrors > 0 ? "danger" : "ok"}
                    size="sm"
                    pulse={false}
                  />
                  <span className="text-sm text-text-primary">
                    {selectedSpan.hasErrors > 0 ? "Error" : "OK"}
                  </span>
                </span>
              </div>
              {selectedSpan.parentSpanId && (
                <div>
                  <span className="text-xs text-text-muted block mb-1">Parent Span</span>
                  <button
                    onClick={() => setSelectedSpanId(selectedSpan.parentSpanId)}
                    className="text-sm text-signal font-mono hover:underline"
                  >
                    {truncateId(selectedSpan.parentSpanId)}
                  </button>
                </div>
              )}
            </div>

            {/* Span Logs */}
            {selectedSpanLogs.length > 0 && (
              <div>
                <span className="text-xs text-text-muted block mb-2">
                  Logs ({selectedSpanLogs.length})
                </span>
                <div className="rounded-md border border-border-faint bg-bg-base divide-y divide-border-faint max-h-60 overflow-y-auto">
                  {selectedSpanLogs.map((log, idx) => (
                    <div key={log._id || idx} className="flex items-start gap-3 px-3 py-2">
                      <SignalDot
                        status={
                          log.level === "error" || log.level === "fatal"
                            ? "danger"
                            : log.level === "warn"
                              ? "warn"
                              : "ok"
                        }
                        size="sm"
                        pulse={false}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs text-text-muted font-mono mr-2">
                          {format(new Date(log.timestamp), "HH:mm:ss.SSS")}
                        </span>
                        <span className="text-sm text-text-primary">
                          {log.message}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] shrink-0 border-border-subtle text-text-muted"
                      >
                        {log.level}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Span Data */}
            <div>
              <span className="text-xs text-text-muted block mb-2">Raw Span Data</span>
              <JsonTreeViewer
                data={selectedSpan}
                initialExpanded={false}
                maxDepth={4}
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
