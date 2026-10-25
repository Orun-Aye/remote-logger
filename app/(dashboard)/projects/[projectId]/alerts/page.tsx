"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  useAlerts,
  useAlertStats,
  useAlertRules,
  useUpdateAlertStatus,
  useUpdateAlertRule,
  useDeleteAlertRule,
  useCreateAlertRule,
} from "@/hooks/alerts.hook";
import {
  useAISuggestions,
  useAcceptSuggestion,
} from "@/hooks/aiSuggestion.hook";
import { useProject, useProjects } from "@/hooks/project.hooks";
import { MetricCard } from "@/components/shared/MetricCard";
import { SignalDot } from "@/components/shared/SignalDot";
import { PageHeader } from "@/components/shared/PageHeader";
import { CreateAlertModal } from "@/components/alerts/CreateAlertModal";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Loader2,
  MoreVertical,
  Plus,
  Power,
  PowerOff,
  Search,
  Sparkles,
  Trash2,
  Mail,
  MessageSquare,
  Webhook,
  Github,
} from "lucide-react";
import {
  Alert,
  AlertFilters,
  AlertRule,
  SimpleCondition,
  CompositeCondition,
} from "@/services/alert.service";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ============================================
// Severity / Status helpers
// ============================================

const SEVERITY_DOT: Record<string, "danger" | "warn" | "info"> = {
  critical: "danger",
  warning: "warn",
  info: "info",
};

const STATUS_DOT: Record<string, "danger" | "warn" | "ok" | "info"> = {
  active: "danger",
  acknowledged: "warn",
  resolved: "ok",
  snoozed: "info",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  active: "bg-status-danger/10 text-status-danger border-status-danger/30",
  acknowledged: "bg-status-warn/10 text-status-warn border-status-warn/30",
  resolved: "bg-status-ok/10 text-status-ok border-status-ok/30",
  snoozed: "bg-data-info/10 text-data-info border-data-info/30",
};

const SEVERITY_BADGE_CLASS: Record<string, string> = {
  critical: "bg-status-danger/10 text-status-danger border-status-danger/30",
  warning: "bg-status-warn/10 text-status-warn border-status-warn/30",
  info: "bg-data-info/10 text-data-info border-data-info/30",
};

const CHANNEL_ICON: Record<string, typeof Mail> = {
  email: Mail,
  slack: MessageSquare,
  webhook: Webhook,
  github: Github,
};

// ============================================
// Tabs
// ============================================

type TabKey = "events" | "rules" | "ai-suggestions";

const TABS: { key: TabKey; label: string; icon: typeof Bell }[] = [
  { key: "events", label: "Events", icon: Bell },
  { key: "rules", label: "Rules", icon: BookOpen },
  { key: "ai-suggestions", label: "AI Suggestions", icon: Brain },
];

// ============================================
// Main Page
// ============================================

export default function ProjectAlertsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [activeTab, setActiveTab] = useState<TabKey>("events");

  const { data: projectData } = useProject(projectId);
  const projectName =
    (projectData as any)?.data?.name ||
    (projectData as any)?.name ||
    "Project";

  return (
    <div className="flex flex-col h-full bg-bg-base">
      {/* Header */}
      <div className="shrink-0 border-b border-border-subtle">
        <PageHeader
          title={`${projectName} Alerts`}
          description="Monitor alert events, manage rules, and review AI suggestions for this project"
          badge={<AlertTriangle className="h-5 w-5 text-status-warn" />}
        />

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 -mb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2",
                  isActive
                    ? "text-signal border-signal"
                    : "text-text-muted hover:text-text-primary border-transparent hover:border-border-subtle"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === "events" && (
          <EventsTab projectId={projectId} />
        )}
        {activeTab === "rules" && (
          <RulesTab projectId={projectId} />
        )}
        {activeTab === "ai-suggestions" && (
          <AISuggestionsTab projectId={projectId} />
        )}
      </div>
    </div>
  );
}

// ============================================
// Events Tab
// ============================================

function EventsTab({ projectId }: { projectId: string }) {
  const [page, setPage] = useState(1);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 20;

  const apiFilters: AlertFilters = useMemo(() => {
    const filters: AlertFilters = { page, limit };
    if (severityFilter !== "all")
      filters.severity = severityFilter as AlertFilters["severity"];
    if (statusFilter !== "all")
      filters.status = statusFilter as AlertFilters["status"];
    return filters;
  }, [page, severityFilter, statusFilter]);

  const { data: alertsData, isLoading: alertsLoading } = useAlerts(
    projectId,
    apiFilters
  );
  const { data: statsData, isLoading: statsLoading } =
    useAlertStats(projectId);
  const updateStatusMutation = useUpdateAlertStatus();

  const alerts: Alert[] = useMemo(
    () => alertsData?.data || [],
    [alertsData]
  );
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

  const totalPages = meta?.total
    ? Math.ceil(meta.total / limit)
    : 1;

  const handleStatusChange = useCallback(
    async (
      alertId: string,
      status: "acknowledged" | "resolved"
    ) => {
      const loadingToast = toast.loading(
        status === "acknowledged"
          ? "Acknowledging..."
          : "Resolving..."
      );
      try {
        await updateStatusMutation.mutateAsync({
          alertId,
          status,
        });
        toast.success(
          status === "acknowledged"
            ? "Alert acknowledged"
            : "Alert resolved",
          { id: loadingToast }
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to update alert",
          { id: loadingToast }
        );
      }
    },
    [updateStatusMutation]
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
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
        />
        <MetricCard
          label="Acknowledged"
          value={
            statsLoading ? "..." : (stats?.acknowledged ?? 0)
          }
          icon={<Eye className="h-4 w-4" />}
          variant="warning"
        />
        <MetricCard
          label="Resolved"
          value={statsLoading ? "..." : (stats?.resolved ?? 0)}
          icon={<CheckCircle2 className="h-4 w-4" />}
          variant="success"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-bg-surface border-border-subtle"
          />
        </div>
        <Select
          value={severityFilter}
          onValueChange={(v) => {
            setSeverityFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[150px] bg-bg-surface border-border-subtle">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent className="bg-bg-elevated border-border-subtle">
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[150px] bg-bg-surface border-border-subtle">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-bg-elevated border-border-subtle">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="acknowledged">
              Acknowledged
            </SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="snoozed">Snoozed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alert List */}
      {alertsLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-signal" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <Card className="border-border-subtle bg-bg-surface">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <SignalDot
              status="ok"
              size="lg"
              className="mb-4"
            />
            <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
              No alerts
            </h3>
            <p className="text-sm text-text-secondary max-w-md">
              {searchTerm ||
              severityFilter !== "all" ||
              statusFilter !== "all"
                ? "No alerts match your current filters."
                : "All clear! No alerts have been triggered for this project."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <Card
              key={alert._id}
              className="border-border-subtle bg-bg-surface hover:border-signal/30 transition-colors"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <SignalDot
                      status={
                        SEVERITY_DOT[alert.severity] ||
                        "info"
                      }
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
                            SEVERITY_BADGE_CLASS[
                              alert.severity
                            ] || ""
                          }`}
                        >
                          {alert.severity
                            .charAt(0)
                            .toUpperCase() +
                            alert.severity.slice(1)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            STATUS_BADGE_CLASS[
                              alert.status
                            ] || ""
                          }`}
                        >
                          {alert.status
                            .charAt(0)
                            .toUpperCase() +
                            alert.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-text-secondary line-clamp-2 mb-2">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(
                            new Date(alert.triggeredAt),
                            { addSuffix: true }
                          )}
                        </span>
                        {alert.environment && (
                          <Badge
                            variant="outline"
                            className="text-xs border-border-subtle text-text-muted"
                          >
                            {alert.environment}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {alert.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(
                            alert._id,
                            "acknowledged"
                          )
                        }
                        disabled={
                          updateStatusMutation.isPending
                        }
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
                          handleStatusChange(
                            alert._id,
                            "resolved"
                          )
                        }
                        disabled={
                          updateStatusMutation.isPending
                        }
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
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((p) => Math.max(1, p - 1))
            }
            disabled={page <= 1}
            className="border-border-subtle"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-text-secondary">
            Page{" "}
            <span className="text-signal font-semibold">
              {page}
            </span>{" "}
            of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((p) =>
                Math.min(totalPages, p + 1)
              )
            }
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

// ============================================
// Rules Tab
// ============================================

function RulesTab({ projectId }: { projectId: string }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false);

  const { data: projectsResponse } = useProjects();
  const allProjects = useMemo(
    () => (projectsResponse as any)?.data ?? [],
    [projectsResponse]
  );

  const { data: rulesData, isLoading } =
    useAlertRules(projectId);
  const rules: AlertRule[] = useMemo(
    () => rulesData?.data || [],
    [rulesData]
  );
  const updateMutation = useUpdateAlertRule();
  const deleteMutation = useDeleteAlertRule();

  const filteredRules = useMemo(() => {
    if (!searchTerm) return rules;
    const lower = searchTerm.toLowerCase();
    return rules.filter(
      (r) =>
        r.name.toLowerCase().includes(lower) ||
        r.description?.toLowerCase().includes(lower)
    );
  }, [rules, searchTerm]);

  const handleToggle = async (rule: AlertRule) => {
    const loadingToast = toast.loading(
      `${rule.isActive ? "Disabling" : "Enabling"} rule...`
    );
    try {
      await updateMutation.mutateAsync({
        ruleId: rule._id,
        data: { isActive: !rule.isActive },
      });
      toast.success(
        `Rule ${rule.isActive ? "disabled" : "enabled"}`,
        { id: loadingToast }
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update rule",
        { id: loadingToast }
      );
    }
  };

  const handleDelete = async (rule: AlertRule) => {
    if (
      !confirm(
        `Are you sure you want to delete "${rule.name}"?`
      )
    )
      return;
    const loadingToast = toast.loading("Deleting rule...");
    try {
      await deleteMutation.mutateAsync(rule._id);
      toast.success("Rule deleted", { id: loadingToast });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete rule",
        { id: loadingToast }
      );
    }
  };

  const conditionText = (
    condition: SimpleCondition | CompositeCondition
  ): string => {
    if ("operator" in condition && "conditions" in condition) {
      const parts = (
        condition as CompositeCondition
      ).conditions
        .map((c) => {
          const p: string[] = [];
          if (c.level) p.push(c.level);
          if (c.keyword) p.push(`"${c.keyword}"`);
          return p.join("+") || "any";
        })
        .join(
          ` ${(condition as CompositeCondition).operator} `
        );
      return parts;
    }
    const sc = condition as SimpleCondition;
    const parts: string[] = [];
    if (sc.level) parts.push(sc.level);
    if (sc.keyword) parts.push(`"${sc.keyword}"`);
    if (sc.service) parts.push(`svc:${sc.service}`);
    if (sc.eventType) parts.push(`type:${sc.eventType}`);
    return parts.join(" + ") || "Any";
  };

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search rules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-bg-surface border-border-subtle"
          />
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-signal text-bg-void hover:bg-signal/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {/* Rules List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-signal" />
        </div>
      ) : filteredRules.length === 0 ? (
        <Card className="border-border-subtle bg-bg-surface">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-text-muted mb-4" />
            <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
              No alert rules configured
            </h3>
            <p className="text-sm text-text-secondary max-w-md mb-6">
              {searchTerm
                ? "No rules match your search."
                : "Create your first alert rule to get notified when specific conditions are met."}
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-signal text-bg-void hover:bg-signal/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRules.map((rule) => (
            <Card
              key={rule._id}
              className="border-border-subtle bg-bg-surface hover:border-signal/30 transition-colors"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <SignalDot
                      status={
                        rule.isActive ? "ok" : "info"
                      }
                      pulse={rule.isActive}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-display font-semibold text-text-primary">
                          {rule.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            rule.isActive
                              ? "bg-status-ok/10 text-status-ok border-status-ok/30"
                              : "bg-bg-elevated text-text-muted border-border-subtle"
                          }`}
                        >
                          {rule.isActive
                            ? "Active"
                            : "Inactive"}
                        </Badge>
                      </div>
                      {rule.description && (
                        <p className="text-xs text-text-secondary mb-1">
                          {rule.description}
                        </p>
                      )}
                      <p className="text-xs font-mono text-text-muted">
                        {conditionText(rule.condition)}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-text-muted hover:text-text-primary h-8 w-8 p-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-bg-elevated border-border-subtle"
                    >
                      <DropdownMenuItem
                        onClick={() =>
                          handleToggle(rule)
                        }
                        className="text-text-secondary hover:text-signal"
                      >
                        {rule.isActive ? (
                          <PowerOff className="h-4 w-4 mr-2" />
                        ) : (
                          <Power className="h-4 w-4 mr-2" />
                        )}
                        {rule.isActive
                          ? "Disable"
                          : "Enable"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border-faint" />
                      <DropdownMenuItem
                        onClick={() =>
                          handleDelete(rule)
                        }
                        className="text-status-danger hover:bg-status-danger/10"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
                  {rule.notifyChannels?.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Bell className="h-3 w-3" />
                      <div className="flex gap-1">
                        {rule.notifyChannels.map(
                          (ch: string) => {
                            const ChannelIcon = CHANNEL_ICON[ch] || Bell;
                            return (
                              <Badge
                                key={ch}
                                variant="outline"
                                className="text-[10px] capitalize bg-signal/10 border-signal/30 text-signal gap-1"
                              >
                                <ChannelIcon className="h-2.5 w-2.5" />
                                {ch}
                              </Badge>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
                  <span>
                    Created{" "}
                    {format(
                      new Date(rule.createdAt),
                      "MMM d, yyyy"
                    )}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateAlertModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        projects={allProjects}
        defaultProjectId={projectId}
      />
    </div>
  );
}

// ============================================
// AI Suggestions Tab
// ============================================

function AISuggestionsTab({
  projectId,
}: {
  projectId: string;
}) {
  const {
    data: suggestionsData,
    isLoading,
    error,
  } = useAISuggestions(projectId);
  const acceptMutation = useAcceptSuggestion(projectId);

  const suggestions = useMemo(() => {
    if (!suggestionsData) return [];
    if (Array.isArray(suggestionsData))
      return suggestionsData;
    if (
      suggestionsData &&
      typeof suggestionsData === "object" &&
      "suggestions" in suggestionsData
    ) {
      return (suggestionsData as any).suggestions || [];
    }
    return [];
  }, [suggestionsData]);

  const handleAccept = async (suggestion: any) => {
    const loadingToast = toast.loading(
      "Creating rule from suggestion..."
    );
    try {
      await acceptMutation.mutateAsync({
        suggestionId: suggestion.id || suggestion._id,
        ruleConfig: suggestion.ruleConfig || {
          name: suggestion.title || suggestion.name,
          condition: suggestion.condition || {
            level: "error",
          },
          isActive: true,
          notifyChannels: ["email"],
        },
      });
      toast.success("Alert rule created from suggestion!", {
        id: loadingToast,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to accept suggestion",
        { id: loadingToast }
      );
    }
  };

  const getConfidenceStyle = (
    confidence: number | string | undefined
  ) => {
    if (!confidence) return "bg-bg-elevated text-text-muted";
    const value =
      typeof confidence === "string"
        ? parseFloat(confidence)
        : confidence;
    if (value >= 0.8)
      return "bg-status-ok/10 text-status-ok border-status-ok/30";
    if (value >= 0.5)
      return "bg-status-warn/10 text-status-warn border-status-warn/30";
    return "bg-data-info/10 text-data-info border-data-info/30";
  };

  const formatConfidence = (
    confidence: number | string | undefined
  ) => {
    if (!confidence) return "N/A";
    const value =
      typeof confidence === "string"
        ? parseFloat(confidence)
        : confidence;
    return `${Math.round(value * 100)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-signal" />
        <div>
          <h3 className="font-display font-semibold text-text-primary">
            AI-Generated Suggestions
          </h3>
          <p className="text-sm text-text-secondary">
            Apperio analyzes your log patterns and suggests
            alert rules you might find useful.
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-signal" />
        </div>
      ) : error ? (
        <Card className="border-border-subtle bg-bg-surface">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="h-12 w-12 text-status-warn mb-4" />
            <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
              Unable to load suggestions
            </h3>
            <p className="text-sm text-text-secondary max-w-md">
              There was an error fetching AI suggestions.
              This may happen if the project doesn&apos;t have
              enough log data yet.
            </p>
          </div>
        </Card>
      ) : suggestions.length === 0 ? (
        <Card className="border-border-subtle bg-bg-surface">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Brain className="h-12 w-12 text-text-muted mb-4" />
            <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
              No suggestions available
            </h3>
            <p className="text-sm text-text-secondary max-w-md">
              Apperio will generate alert rule suggestions
              as it learns from your log patterns. Keep
              sending logs and check back later.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {suggestions.map(
            (suggestion: any, index: number) => (
              <Card
                key={
                  suggestion.id ||
                  suggestion._id ||
                  index
                }
                className="border-border-subtle bg-bg-surface hover:border-signal/30 transition-colors"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Sparkles className="h-4 w-4 text-signal shrink-0" />
                        <h4 className="font-display font-semibold text-text-primary">
                          {suggestion.title ||
                            suggestion.name ||
                            `Suggestion ${index + 1}`}
                        </h4>
                        {suggestion.confidence !==
                          undefined && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${getConfidenceStyle(
                              suggestion.confidence
                            )}`}
                          >
                            {formatConfidence(
                              suggestion.confidence
                            )}{" "}
                            confidence
                          </Badge>
                        )}
                        {suggestion.severity && (
                          <Badge
                            variant="outline"
                            className={`text-xs capitalize ${
                              SEVERITY_BADGE_CLASS[
                                suggestion.severity
                              ] || ""
                            }`}
                          >
                            {suggestion.severity}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary mb-3">
                        {suggestion.description ||
                          suggestion.reason ||
                          "AI-detected pattern that may benefit from an alert rule."}
                      </p>
                      {suggestion.condition && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-text-muted">
                            Condition:
                          </span>
                          <span className="font-mono text-text-secondary bg-bg-base px-2 py-0.5 rounded border border-border-faint">
                            {suggestion.condition
                              .level &&
                              `level:${suggestion.condition.level}`}
                            {suggestion.condition
                              .keyword &&
                              ` keyword:"${suggestion.condition.keyword}"`}
                            {suggestion.condition
                              .frequency &&
                              ` >= ${suggestion.condition.frequency}/${
                                suggestion.condition
                                  .intervalMinutes || 5
                              }min`}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      onClick={() =>
                        handleAccept(suggestion)
                      }
                      disabled={
                        acceptMutation.isPending
                      }
                      className="bg-signal text-bg-void hover:bg-signal/90 shrink-0"
                    >
                      {acceptMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                      )}
                      Accept
                    </Button>
                  </div>
                </div>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}
