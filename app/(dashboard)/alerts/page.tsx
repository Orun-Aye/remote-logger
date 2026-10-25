"use client";

import { useState, useMemo } from "react";
import {
  useUserAlerts,
  useUserAlertStats,
  useUpdateAlertStatus,
} from "@/hooks/alerts.hook";
import { MetricCard } from "@/components/shared/MetricCard";
import { SignalDot } from "@/components/shared/SignalDot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Eye,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Alert, AlertFilters } from "@/services/alert.service";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const SEVERITY_MAP: Record<string, { dot: "danger" | "warn" | "info"; label: string; textClass: string }> = {
  critical: { dot: "danger", label: "Critical", textClass: "text-status-danger" },
  warning: { dot: "warn", label: "Warning", textClass: "text-status-warn" },
  info: { dot: "info", label: "Info", textClass: "text-data-info" },
};

const STATUS_MAP: Record<string, { dot: "danger" | "warn" | "ok" | "info"; label: string; textClass: string }> = {
  active: { dot: "danger", label: "Active", textClass: "text-status-danger" },
  acknowledged: { dot: "warn", label: "Acknowledged", textClass: "text-status-warn" },
  resolved: { dot: "ok", label: "Resolved", textClass: "text-signal" },
  snoozed: { dot: "info", label: "Snoozed", textClass: "text-data-info" },
};

export default function AlertEventsPage() {
  const [page, setPage] = useState(1);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 20;

  const apiFilters: AlertFilters = useMemo(() => {
    const filters: AlertFilters = { page, limit };
    if (severityFilter !== "all") {
      filters.severity = severityFilter as AlertFilters["severity"];
    }
    if (statusFilter !== "all") {
      filters.status = statusFilter as AlertFilters["status"];
    }
    return filters;
  }, [page, severityFilter, statusFilter]);

  const { data: alertsData, isLoading: alertsLoading } = useUserAlerts(apiFilters);
  const { data: statsData, isLoading: statsLoading } = useUserAlertStats();
  const updateStatusMutation = useUpdateAlertStatus();

  const alerts: Alert[] = useMemo(() => alertsData?.data || [], [alertsData]);
  const meta = alertsData?.meta;
  const stats = statsData?.data;

  const filteredAlerts = useMemo(() => {
    if (!searchTerm) return alerts;
    const lower = searchTerm.toLowerCase();
    return alerts.filter(
      (a) =>
        a.title.toLowerCase().includes(lower) ||
        a.message.toLowerCase().includes(lower)
    );
  }, [alerts, searchTerm]);

  const totalPages = meta?.total ? Math.ceil(meta.total / limit) : 1;

  const handleStatusChange = async (
    alertId: string,
    status: "acknowledged" | "resolved"
  ) => {
    const loadingToast = toast.loading(
      status === "acknowledged" ? "Acknowledging alert..." : "Resolving alert..."
    );
    try {
      await updateStatusMutation.mutateAsync({ alertId, status });
      toast.success(
        status === "acknowledged" ? "Alert acknowledged" : "Alert resolved",
        { id: loadingToast }
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update alert",
        { id: loadingToast }
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Alerts"
          value={statsLoading ? "..." : (stats?.total ?? 0)}
          icon={<Bell className="h-4 w-4" />}
          subtitle={
            stats?.byTimeRange
              ? `${stats.byTimeRange.last24h} in last 24h`
              : undefined
          }
        />
        <MetricCard
          label="Active"
          value={statsLoading ? "..." : (stats?.active ?? 0)}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant="danger"
          subtitle="Require attention"
        />
        <MetricCard
          label="Acknowledged"
          value={statsLoading ? "..." : (stats?.acknowledged ?? 0)}
          icon={<Eye className="h-4 w-4" />}
          variant="warning"
          subtitle="Being investigated"
        />
        <MetricCard
          label="Resolved"
          value={statsLoading ? "..." : (stats?.resolved ?? 0)}
          icon={<CheckCircle2 className="h-4 w-4" />}
          variant="success"
          subtitle="Successfully handled"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-bg-surface border-border-subtle text-text-primary placeholder:text-text-muted"
          />
        </div>
        <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[160px] bg-bg-surface border-border-subtle">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent className="bg-bg-elevated border-border-subtle">
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[160px] bg-bg-surface border-border-subtle">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-bg-elevated border-border-subtle">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="snoozed">Snoozed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alert List */}
      {alertsLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-signal" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <Card className="border-border-subtle bg-bg-surface">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <SignalDot status="ok" size="lg" className="mb-4" />
            <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
              No alerts
            </h3>
            <p className="text-sm text-text-secondary max-w-md">
              {searchTerm || severityFilter !== "all" || statusFilter !== "all"
                ? "No alerts match your current filters. Try adjusting the search or filter criteria."
                : "All clear! No alerts have been triggered. Alerts will appear here when your alert rules are triggered."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const severity = SEVERITY_MAP[alert.severity] || SEVERITY_MAP.info;
            const status = STATUS_MAP[alert.status] || STATUS_MAP.active;

            return (
              <Card
                key={alert._id}
                className="border-border-subtle bg-bg-surface hover:border-signal/30 transition-colors"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <SignalDot
                        status={severity.dot}
                        pulse={alert.status === "active"}
                        className="mt-1.5 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-display font-semibold text-text-primary truncate">
                            {alert.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              severity.dot === "danger"
                                ? "bg-status-danger/10 text-status-danger border-status-danger/30"
                                : severity.dot === "warn"
                                ? "bg-status-warn/10 text-status-warn border-status-warn/30"
                                : "bg-data-info/10 text-data-info border-data-info/30"
                            }`}
                          >
                            {severity.label}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              status.dot === "danger"
                                ? "bg-status-danger/10 text-status-danger border-status-danger/30"
                                : status.dot === "warn"
                                ? "bg-status-warn/10 text-status-warn border-status-warn/30"
                                : status.dot === "ok"
                                ? "bg-status-ok/10 text-status-ok border-status-ok/30"
                                : "bg-data-info/10 text-data-info border-data-info/30"
                            }`}
                          >
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-text-secondary line-clamp-2 mb-2">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(alert.triggeredAt), {
                              addSuffix: true,
                            })}
                          </span>
                          {alert.environment && (
                            <Badge
                              variant="outline"
                              className="text-xs border-border-subtle text-text-muted"
                            >
                              {alert.environment}
                            </Badge>
                          )}
                          {alert.tags && alert.tags.length > 0 && (
                            <span className="text-text-muted">
                              {alert.tags.slice(0, 2).join(", ")}
                              {alert.tags.length > 2 && ` +${alert.tags.length - 2}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {alert.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleStatusChange(alert._id, "acknowledged")
                          }
                          disabled={updateStatusMutation.isPending}
                          className="border-status-warn/30 text-status-warn hover:bg-status-warn/10 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Acknowledge
                        </Button>
                      )}
                      {(alert.status === "active" ||
                        alert.status === "acknowledged") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleStatusChange(alert._id, "resolved")
                          }
                          disabled={updateStatusMutation.isPending}
                          className="border-status-ok/30 text-status-ok hover:bg-status-ok/10 text-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
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
  );
}
