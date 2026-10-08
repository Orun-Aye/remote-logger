"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, Clock, Hash, Globe, ChevronRight, Sparkles, CheckCircle2, Circle, Lightbulb } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useErrorDetails } from "@/hooks/analytics.hook";
import { useRootCause } from "@/hooks/useInsights";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { TimeSeriesChart } from "@/components/shared/TimeSeriesChart";
import { StackTraceViewer } from "@/components/shared/StackTraceViewer";
import { JsonTreeViewer } from "@/components/shared/JsonTreeViewer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SignalDot } from "@/components/shared/SignalDot";
import { CHART_COLORS } from "@/lib/charts/observatory-theme";

// ---------------------------------------------------------------------------
// Types for the API response
// ---------------------------------------------------------------------------

interface ErrorOccurrence {
  timestamp: string;
  count: number;
  [key: string]: string | number;
}

interface ErrorDetailData {
  name: string;
  message: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  status?: string;
  stack?: string;
  context?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  url?: string;
  userAgent?: string;
  environment?: string;
  service?: string;
  timeline?: ErrorOccurrence[];
  occurrences?: ErrorOccurrence[];
  error?: {
    name?: string;
    message?: string;
    stack?: string;
    url?: string;
    lineNumber?: number;
    columnNumber?: number;
  };
}

/** One log entry, as the details API returns it under `occurrences`. */
interface RawOccurrence {
  _id?: string;
  timestamp?: string;
  url?: string;
  userAgent?: string;
  environment?: string;
  service?: string;
  context?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  error?: ErrorDetailData["error"];
}

interface RawErrorDetails {
  message?: string;
  occurrences?: RawOccurrence[];
  stats?: { count?: number; firstSeen?: string; lastSeen?: string };
}

type NormalizedErrorDetail = ErrorDetailData & { logId?: string };

/**
 * The details API answers `{ message, occurrences, stats }`, with the newest
 * occurrences first, while this page reads flat fields. Map one onto the other.
 */
function normalizeErrorDetail(data: unknown): NormalizedErrorDetail | null {
  if (!data || typeof data !== "object") return null;
  if (!("stats" in data) && !("occurrences" in data)) return data as NormalizedErrorDetail;
  const raw = data as RawErrorDetails;
  const latest = raw.occurrences?.[0];
  return {
    name: latest?.error?.name ?? "Error",
    message: raw.message ?? latest?.error?.message ?? "",
    count: raw.stats?.count ?? raw.occurrences?.length ?? 0,
    firstSeen: raw.stats?.firstSeen ?? latest?.timestamp ?? "",
    lastSeen: raw.stats?.lastSeen ?? latest?.timestamp ?? "",
    stack: latest?.error?.stack,
    context: latest?.context,
    metadata: latest?.metadata,
    url: latest?.url,
    userAgent: latest?.userAgent,
    environment: latest?.environment,
    service: latest?.service,
    error: latest?.error,
    logId: latest?._id,
  };
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// ---------------------------------------------------------------------------
// Helper: format timestamp for chart axis
// ---------------------------------------------------------------------------

function formatChartTimestamp(value: string): string {
  try {
    const date = new Date(value);
    return format(date, "MMM dd HH:mm");
  } catch {
    return value;
  }
}

// ---------------------------------------------------------------------------
// Helper: format compact numbers
// ---------------------------------------------------------------------------

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function ErrorDetailSkeleton() {
  return (
    <div className="p-6 bg-bg-base min-h-full space-y-6">
      <div className="flex items-center gap-3">
        <div className="animate-pulse h-9 w-9 bg-bg-elevated rounded" />
        <div className="space-y-2">
          <div className="animate-pulse h-7 w-80 bg-bg-elevated rounded" />
          <div className="animate-pulse h-4 w-48 bg-bg-elevated rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border-subtle bg-bg-surface p-5 space-y-3">
            <div className="animate-pulse h-3 w-20 bg-bg-elevated rounded" />
            <div className="animate-pulse h-8 w-24 bg-bg-elevated rounded" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
        <div className="animate-pulse h-4 w-40 bg-bg-elevated rounded mb-4" />
        <div className="animate-pulse h-[250px] w-full bg-bg-elevated rounded" />
      </div>
      <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
        <div className="animate-pulse h-4 w-32 bg-bg-elevated rounded mb-4" />
        <div className="animate-pulse h-[180px] w-full bg-bg-elevated rounded" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function ErrorDetailPage() {
  const params = useParams<{ projectId: string; errorId: string }>();
  const router = useRouter();
  const projectId = typeof params?.projectId === "string" ? params.projectId : "";
  // The segment is the error message, URL-encoded by the errors list
  const errorId = typeof params?.errorId === "string" ? safeDecode(params.errorId) : "";

  const [rcaExpanded, setRcaExpanded] = useState(false);

  const { data: detailData, isLoading, error: fetchError } = useErrorDetails(projectId, errorId);
  const errorDetail = useMemo(() => normalizeErrorDetail(detailData), [detailData]);
  // Root cause analysis looks up one log entry by id: use the newest occurrence
  const { data: rootCause, isLoading: rcaLoading } = useRootCause(
    projectId,
    errorDetail?.logId ?? "",
    rcaExpanded
  );

  // Derive timeline data from the response
  const timelineData: ErrorOccurrence[] = useMemo(() => {
    if (!errorDetail) return [];
    return errorDetail.timeline ?? errorDetail.occurrences ?? [];
  }, [errorDetail]);

  // Derive stack trace
  const stackTrace = useMemo(() => {
    if (!errorDetail) return null;
    return errorDetail.stack ?? errorDetail.error?.stack ?? null;
  }, [errorDetail]);

  // Derive context/metadata
  const contextData = useMemo(() => {
    if (!errorDetail) return null;
    const combined: Record<string, unknown> = {};
    if (errorDetail.context && Object.keys(errorDetail.context).length > 0) {
      combined.context = errorDetail.context;
    }
    if (errorDetail.metadata && Object.keys(errorDetail.metadata).length > 0) {
      combined.metadata = errorDetail.metadata;
    }
    if (errorDetail.url) combined.url = errorDetail.url;
    if (errorDetail.userAgent) combined.userAgent = errorDetail.userAgent;
    if (errorDetail.environment) combined.environment = errorDetail.environment;
    if (errorDetail.service) combined.service = errorDetail.service;
    if (errorDetail.error?.url) combined.errorUrl = errorDetail.error.url;
    if (errorDetail.error?.lineNumber !== undefined) {
      combined.lineNumber = errorDetail.error.lineNumber;
    }
    if (errorDetail.error?.columnNumber !== undefined) {
      combined.columnNumber = errorDetail.error.columnNumber;
    }
    return Object.keys(combined).length > 0 ? combined : null;
  }, [errorDetail]);

  // Error display name
  const errorName = errorDetail?.name ?? errorDetail?.error?.name ?? "Unknown Error";
  const errorMessage = errorDetail?.message ?? errorDetail?.error?.message ?? "";

  // Loading
  if (isLoading) {
    return <ErrorDetailSkeleton />;
  }

  // Fetch error
  if (fetchError) {
    return (
      <div className="p-6 bg-bg-base min-h-full">
        <div className="text-center py-16 bg-bg-surface border border-border-subtle rounded-lg">
          <AlertTriangle className="w-12 h-12 text-status-danger mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-status-danger">
            Failed to load error details
          </h2>
          <p className="text-text-secondary mt-2">
            Could not fetch error details. The error may not exist or an error occurred.
          </p>
          <div className="mt-4">
            <Button variant="signal" onClick={() => router.push(`/projects/${projectId}/errors`)}>
              Back to Error Analytics
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No data
  if (!errorDetail) {
    return (
      <div className="p-6 bg-bg-base min-h-full">
        <div className="text-center py-16 bg-bg-surface border border-border-subtle rounded-lg">
          <SignalDot status="ok" size="lg" pulse={false} className="mx-auto mb-4" />
          <h2 className="text-lg font-display font-semibold text-text-primary">
            Error not found
          </h2>
          <p className="text-text-muted text-sm mt-2">
            This error may have been resolved or does not exist.
          </p>
          <div className="mt-4">
            <Button variant="signal" onClick={() => router.push(`/projects/${projectId}/errors`)}>
              Back to Error Analytics
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-bg-base min-h-full space-y-6">
      {/* Header with back button */}
      <PageHeader
        title={errorName}
        description={errorMessage}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/projects/${projectId}/errors`)}
            className="text-text-muted hover:text-text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Errors
          </Button>
        }
        badge={
          errorDetail.status === "resolved" ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-ok/10 text-status-ok text-xs font-medium">
              <SignalDot status="ok" size="sm" pulse={false} />
              Resolved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-danger/10 text-status-danger text-xs font-medium">
              <SignalDot status="danger" size="sm" />
              Active
            </span>
          )
        }
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Occurrences"
          value={formatCompact(errorDetail.count ?? 0)}
          variant="danger"
          icon={<Hash className="w-4 h-4" />}
        />
        <MetricCard
          label="First Seen"
          value={
            errorDetail.firstSeen
              ? format(new Date(errorDetail.firstSeen), "MMM dd, yyyy")
              : "Unknown"
          }
          icon={<Clock className="w-4 h-4" />}
          subtitle={
            errorDetail.firstSeen
              ? formatDistanceToNow(new Date(errorDetail.firstSeen), { addSuffix: true })
              : undefined
          }
        />
        <MetricCard
          label="Last Seen"
          value={
            errorDetail.lastSeen
              ? format(new Date(errorDetail.lastSeen), "MMM dd, yyyy")
              : "Unknown"
          }
          icon={<Clock className="w-4 h-4" />}
          subtitle={
            errorDetail.lastSeen
              ? formatDistanceToNow(new Date(errorDetail.lastSeen), { addSuffix: true })
              : undefined
          }
        />
      </div>

      {/* Additional info bar */}
      {(errorDetail.environment || errorDetail.service || errorDetail.url) && (
        <div className="flex flex-wrap items-center gap-4 bg-bg-surface border border-border-subtle rounded-lg px-4 py-3">
          {errorDetail.environment && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-muted">Environment</span>
              <span className="text-sm text-text-primary font-mono px-2 py-0.5 bg-bg-elevated rounded">
                {errorDetail.environment}
              </span>
            </div>
          )}
          {errorDetail.service && (
            <>
              <div className="h-4 w-px bg-border-subtle" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-text-muted">Service</span>
                <span className="text-sm text-text-primary font-mono px-2 py-0.5 bg-bg-elevated rounded">
                  {errorDetail.service}
                </span>
              </div>
            </>
          )}
          {errorDetail.url && (
            <>
              <div className="h-4 w-px bg-border-subtle" />
              <div className="flex items-center gap-1.5 min-w-0">
                <Globe className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span className="text-sm text-text-secondary font-mono truncate">
                  {errorDetail.url}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Root Cause Analysis — Sentry Seer-inspired collapsible section */}
      <div className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden">
        <button
          onClick={() => setRcaExpanded(!rcaExpanded)}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-bg-elevated/50 transition-colors"
        >
          <ChevronRight
            className={`w-4 h-4 text-text-muted transition-transform duration-200 ${
              rcaExpanded ? "rotate-90" : ""
            }`}
          />
          <Sparkles className="w-4 h-4 text-signal" />
          <span className="text-sm font-display font-semibold text-text-primary">
            Root Cause Analysis
          </span>
          <span className="bg-signal/10 text-signal text-[10px] rounded px-1.5 py-0.5 font-medium">
            AI
          </span>
          {rootCause?.confidence && (
            <Badge
              variant={
                rootCause.confidence === "high"
                  ? "status-ok"
                  : rootCause.confidence === "medium"
                  ? "status-warn"
                  : "status-danger"
              }
              className="text-[10px] ml-auto"
            >
              {rootCause.confidence} confidence
            </Badge>
          )}
        </button>

        {/* Collapsible content */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            rcaExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-5 pb-5 border-t border-border-faint">
            {/* Loading state */}
            {rcaLoading && (
              <div className="py-6 flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-signal" />
                <span className="text-sm text-text-secondary">Analyzing error patterns</span>
                <span className="flex gap-1 ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal animate-ai-dot" />
                  <span className="w-1.5 h-1.5 rounded-full bg-signal animate-ai-dot [animation-delay:160ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-signal animate-ai-dot [animation-delay:320ms]" />
                </span>
              </div>
            )}

            {/* RCA Result — 3-step progressive disclosure */}
            {rootCause && !rcaLoading && (
              <div className="pt-4 space-y-4">
                {/* Step indicators with vertical line */}
                <div className="relative pl-8 space-y-5">
                  {/* Vertical connecting line */}
                  <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border-faint" />

                  {/* Step 1: Analysis */}
                  <div className="relative">
                    <div className="absolute -left-8 top-0.5 w-[22px] h-[22px] rounded-full bg-signal/10 border-2 border-signal flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-signal" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">
                        Analysis
                      </p>
                      <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                        {rootCause.analysis}
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Source */}
                  <div className="relative">
                    <div className="absolute -left-8 top-0.5 w-[22px] h-[22px] rounded-full bg-signal/10 border-2 border-signal flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-signal" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">
                        Source
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant={rootCause.source === "ai" ? "signal" : "outline"}>
                          {rootCause.source === "ai" ? "Claude AI" : "Statistical Heuristic"}
                        </Badge>
                        <Badge
                          variant={
                            rootCause.confidence === "high"
                              ? "status-ok"
                              : rootCause.confidence === "medium"
                              ? "status-warn"
                              : "status-danger"
                          }
                        >
                          {rootCause.confidence} confidence
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Recommendation */}
                  <div className="relative">
                    <div className="absolute -left-8 top-0.5 w-[22px] h-[22px] rounded-full border-2 border-border-subtle bg-bg-surface flex items-center justify-center">
                      <Lightbulb className="w-3 h-3 text-text-muted" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">
                        Next Steps
                      </p>
                      <p className="text-xs text-text-muted">
                        Review the analysis above and check related logs in the timeline for more context.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Source unavailability fallback banner */}
                {rootCause.source === "heuristic" && (
                  <div className="bg-bg-elevated/50 border border-border-faint rounded-lg px-4 py-3 text-xs text-text-muted">
                    AI insights temporarily unavailable. Showing statistical analysis.
                    Set <code className="font-mono text-text-secondary">ANTHROPIC_ENABLED=true</code> for AI-powered analysis.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Timeline Chart */}
      {timelineData.length > 0 && (
        <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
          <h3 className="text-sm font-display font-semibold text-text-primary mb-4">
            Occurrences Over Time
          </h3>
          <TimeSeriesChart
            data={timelineData}
            series={[
              {
                key: "count",
                label: "Occurrences",
                color: CHART_COLORS.danger,
                type: "area",
              },
            ]}
            height={280}
            formatXAxis={formatChartTimestamp}
            showLegend={false}
          />
        </div>
      )}

      {/* Stack Trace */}
      {stackTrace && (
        <div className="space-y-2">
          <h3 className="text-sm font-display font-semibold text-text-primary">
            Stack Trace
          </h3>
          <StackTraceViewer stackTrace={stackTrace} projectId={projectId} />
        </div>
      )}

      {/* Context / Metadata */}
      {contextData && (
        <div className="space-y-2">
          <h3 className="text-sm font-display font-semibold text-text-primary">
            Context & Metadata
          </h3>
          <JsonTreeViewer data={contextData} label="Error Context" initialExpanded maxDepth={6} />
        </div>
      )}

      {/* Empty state for no extra data */}
      {!stackTrace && !contextData && timelineData.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-border-subtle bg-bg-surface">
          <SignalDot status="ok" size="lg" pulse={false} className="mb-3" />
          <p className="text-text-secondary text-sm">No additional error data available</p>
          <p className="text-text-muted text-xs mt-1">
            Stack traces, timeline, and context data will appear when provided by the SDK.
          </p>
        </div>
      )}
    </div>
  );
}
