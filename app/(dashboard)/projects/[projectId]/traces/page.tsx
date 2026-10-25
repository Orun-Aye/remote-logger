"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useApperioStore } from "@/store/apperio-store";
import { useTraces } from "@/hooks/trace.hook";
import { PageHeader } from "@/components/shared/PageHeader";
import { SkeletonTable } from "@/components/shared/SkeletonDashboard";
import { SignalDot } from "@/components/shared/SignalDot";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GitBranch,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
  Search,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { TraceSummary } from "@/services/trace.service";

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

function truncateId(id: string | undefined | null, len = 12): string {
  if (!id) return "—";
  if (id.length <= len) return id;
  return id.slice(0, len) + "...";
}

// ============================================
// Main Page
// ============================================

export default function TracesPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = typeof params?.projectId === "string" ? params.projectId : "";
  const selectedTimeRange = useApperioStore((s) => s.selectedTimeRange);

  const [timeRange, setTimeRange] = useState<string>(selectedTimeRange || "24h");
  const [statusFilter, setStatusFilter] = useState("all");
  const [minDuration, setMinDuration] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 25;

  const queryParams = useMemo((): Record<string, string> => {
    const p: Record<string, string> = {
      timeRange,
      page: String(page),
      limit: String(limit),
    };
    if (statusFilter !== "all") p.status = statusFilter;
    if (minDuration) p.minDuration = minDuration;
    if (serviceFilter !== "all") p.service = serviceFilter;
    return p;
  }, [timeRange, statusFilter, minDuration, serviceFilter, page]);

  const {
    data: tracesResponse,
    isLoading,
    error,
  } = useTraces(projectId, queryParams);

  const traces: TraceSummary[] = useMemo(() => {
    const raw = tracesResponse?.data;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      if (Array.isArray(obj.traces)) return obj.traces;
      if (Array.isArray(obj.data)) return obj.data;
    }
    return [];
  }, [tracesResponse]);
  const meta = tracesResponse?.meta ?? (tracesResponse?.data as Record<string, unknown>)?.meta as
    | { total?: number; page?: number }
    | undefined;
  const totalPages = meta?.total ? Math.ceil(meta.total / limit) : 1;

  // Extract unique services for filter dropdown
  const availableServices = useMemo(() => {
    const serviceSet = new Set<string>();
    traces.forEach((t) => {
      if (t.services) {
        t.services.forEach((s) => serviceSet.add(s));
      }
    });
    return Array.from(serviceSet).sort();
  }, [traces]);

  return (
    <div className="flex flex-col h-full bg-bg-base">
      {/* Header */}
      <div className="shrink-0">
        <PageHeader
          title="Distributed Traces"
          description="End-to-end request tracing across services"
          badge={<GitBranch className="h-5 w-5 text-signal" />}
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${projectId}`}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Link>
            </Button>
          }
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-6 space-y-6">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={timeRange} onValueChange={(v) => { setTimeRange(v); setPage(1); }}>
            <SelectTrigger className="w-36 bg-bg-surface border-border-subtle">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent className="bg-bg-elevated border-border-subtle">
              <SelectItem value="1h">Last 1 hour</SelectItem>
              <SelectItem value="6h">Last 6 hours</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={serviceFilter} onValueChange={(v) => { setServiceFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40 bg-bg-surface border-border-subtle">
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent className="bg-bg-elevated border-border-subtle">
              <SelectItem value="all">All Services</SelectItem>
              {availableServices.map((svc) => (
                <SelectItem key={svc} value={svc}>
                  {svc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-28 bg-bg-surface border-border-subtle">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-bg-elevated border-border-subtle">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="ok">Success</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <Input
              type="number"
              placeholder="Min duration (ms)"
              value={minDuration}
              onChange={(e) => { setMinDuration(e.target.value); setPage(1); }}
              className="w-44 pl-9 bg-bg-surface border-border-subtle"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <SkeletonTable rows={8} />
        ) : error ? (
          <Card className="border-border-subtle bg-bg-surface">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertTriangle className="h-12 w-12 text-status-danger mb-4" />
              <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
                Failed to load traces
              </h3>
              <p className="text-sm text-text-secondary max-w-md">
                An error occurred while fetching traces. Please try again.
              </p>
            </div>
          </Card>
        ) : traces.length === 0 ? (
          <Card className="border-border-subtle bg-bg-surface">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <GitBranch className="h-12 w-12 text-text-muted mb-4" />
              <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
                No traces recorded
              </h3>
              <p className="text-sm text-text-secondary max-w-md">
                Enable tracing in your SDK configuration to capture distributed
                traces across your services.
              </p>
            </div>
          </Card>
        ) : (
          <div className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[minmax(120px,1fr)_minmax(100px,1fr)_100px_80px_80px_120px] gap-4 px-4 py-3 border-b border-border-subtle bg-bg-base/50">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Trace ID
              </span>
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Root Service
              </span>
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Duration
              </span>
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Spans
              </span>
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Status
              </span>
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Start Time
              </span>
            </div>

            {/* Table Rows */}
            {traces.map((trace) => {
              const traceId = trace._id;
              const hasErrors = trace.hasErrors > 0;
              const rootService =
                trace.rootSpanName ||
                (trace.services && trace.services.length > 0 ? trace.services[0] : "unknown");

              return (
                <Link
                  key={traceId}
                  href={`/projects/${projectId}/traces/${encodeURIComponent(traceId)}`}
                  className="grid grid-cols-[minmax(120px,1fr)_minmax(100px,1fr)_100px_80px_80px_120px] gap-4 px-4 py-3 border-b border-border-subtle last:border-b-0 hover:bg-bg-elevated/50 transition-colors cursor-pointer group"
                >
                  {/* Trace ID */}
                  <span className="font-mono text-sm text-text-primary group-hover:text-signal transition-colors truncate">
                    {truncateId(traceId)}
                  </span>

                  {/* Root Service */}
                  <span className="text-sm text-text-secondary truncate">
                    {rootService}
                  </span>

                  {/* Duration */}
                  <span className="text-sm font-mono text-text-primary">
                    {formatDuration(trace.duration)}
                  </span>

                  {/* Spans */}
                  <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                    <Layers className="h-3 w-3 text-text-muted" />
                    {trace.spanCount}
                  </span>

                  {/* Status */}
                  <span className="flex items-center gap-1.5">
                    {hasErrors ? (
                      <>
                        <SignalDot status="danger" size="sm" pulse={false} />
                        <Badge
                          variant="outline"
                          className="text-xs bg-status-danger/10 text-status-danger border-status-danger/30"
                        >
                          Error
                        </Badge>
                      </>
                    ) : (
                      <>
                        <SignalDot status="ok" size="sm" pulse={false} />
                        <Badge
                          variant="outline"
                          className="text-xs bg-status-ok/10 text-status-ok border-status-ok/30"
                        >
                          OK
                        </Badge>
                      </>
                    )}
                  </span>

                  {/* Start Time */}
                  <span className="text-sm text-text-muted">
                    {formatDistanceToNow(new Date(trace.startTime), {
                      addSuffix: true,
                    })}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.total > limit && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">
              Showing {(page - 1) * limit + 1}-
              {Math.min(page * limit, meta.total)} of {meta.total} traces
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="border-border-subtle"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-text-secondary font-mono">
                {page} / {Math.ceil(meta.total / limit)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page * limit >= meta.total}
                onClick={() => setPage((p) => p + 1)}
                className="border-border-subtle"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
