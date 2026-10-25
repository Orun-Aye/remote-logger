"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useAlertRules,
  useUpdateAlertRule,
  useDeleteAlertRule,
} from "@/hooks/alerts.hook";
import {
  useAISuggestions,
  useAcceptSuggestion,
} from "@/hooks/aiSuggestion.hook";
import { useProjects } from "@/hooks/project.hooks";
import { PageHeader } from "@/components/shared/PageHeader";
import { SignalDot } from "@/components/shared/SignalDot";
import { CreateAlertModal } from "@/components/alerts/CreateAlertModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  Plus,
  Search,
  MoreVertical,
  Power,
  PowerOff,
  Trash2,
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Brain,
  Bell,
  Mail,
  MessageSquare,
  Webhook,
  Github,
  ArrowLeft,
} from "lucide-react";
import {
  AlertRule,
  SimpleCondition,
  CompositeCondition,
} from "@/services/alert.service";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ============================================
// Helpers
// ============================================

const CHANNEL_ICON: Record<string, typeof Mail> = {
  email: Mail,
  slack: MessageSquare,
  webhook: Webhook,
  github: Github,
};

function conditionSummary(
  condition: SimpleCondition | CompositeCondition
): string {
  if ("operator" in condition && "conditions" in condition) {
    const composite = condition as CompositeCondition;
    const parts = composite.conditions
      .map((c) => {
        const p: string[] = [];
        if (c.level) p.push(`level:${c.level}`);
        if (c.keyword) p.push(`"${c.keyword}"`);
        if (c.service) p.push(`svc:${c.service}`);
        if (c.eventType) p.push(`type:${c.eventType}`);
        return p.join("+") || "any";
      })
      .join(` ${composite.operator} `);
    const freq =
      composite.frequency && composite.intervalMinutes
        ? ` >= ${composite.frequency}/${composite.intervalMinutes}min`
        : "";
    return parts + freq;
  }
  const sc = condition as SimpleCondition;
  const parts: string[] = [];
  if (sc.level) parts.push(`level:${sc.level}`);
  if (sc.keyword) parts.push(`"${sc.keyword}"`);
  if (sc.service) parts.push(`svc:${sc.service}`);
  if (sc.eventType) parts.push(`type:${sc.eventType}`);
  if (sc.responseTimeThreshold) parts.push(`rt>${sc.responseTimeThreshold}ms`);
  const freq =
    sc.frequency && sc.intervalMinutes
      ? ` >= ${sc.frequency}/${sc.intervalMinutes}min`
      : "";
  return (parts.join(" + ") || "Any") + freq;
}

const SEVERITY_BADGE_CLASS: Record<string, string> = {
  critical: "bg-status-danger/10 text-status-danger border-status-danger/30",
  warning: "bg-status-warn/10 text-status-warn border-status-warn/30",
  info: "bg-data-info/10 text-data-info border-data-info/30",
};

// ============================================
// Main Page
// ============================================

export default function AlertRulesPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const router = useRouter();

  const { data: projectsResponse } = useProjects();
  const allProjects = useMemo(
    () => (projectsResponse as any)?.data ?? [],
    [projectsResponse]
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Data hooks
  const { data: rulesData, isLoading: rulesLoading } = useAlertRules(projectId);
  const {
    data: suggestionsData,
    isLoading: suggestionsLoading,
    error: suggestionsError,
  } = useAISuggestions(projectId);

  const updateMutation = useUpdateAlertRule();
  const deleteMutation = useDeleteAlertRule();
  const acceptMutation = useAcceptSuggestion(projectId);

  // Parse rules
  const rules: AlertRule[] = useMemo(
    () => rulesData?.data || [],
    [rulesData]
  );

  const filteredRules = useMemo(() => {
    if (!searchTerm) return rules;
    const lower = searchTerm.toLowerCase();
    return rules.filter(
      (r) =>
        r.name.toLowerCase().includes(lower) ||
        r.description?.toLowerCase().includes(lower)
    );
  }, [rules, searchTerm]);

  // Parse suggestions
  const suggestions = useMemo(() => {
    if (!suggestionsData) return [];
    if (Array.isArray(suggestionsData)) return suggestionsData;
    if (
      suggestionsData &&
      typeof suggestionsData === "object" &&
      "suggestions" in suggestionsData
    ) {
      return (suggestionsData as any).suggestions || [];
    }
    return [];
  }, [suggestionsData]);

  // Rule actions
  const handleToggle = useCallback(
    async (rule: AlertRule) => {
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
          error instanceof Error ? error.message : "Failed to update rule",
          { id: loadingToast }
        );
      }
    },
    [updateMutation]
  );

  const handleDelete = useCallback(
    async (rule: AlertRule) => {
      if (!confirm(`Are you sure you want to delete "${rule.name}"?`)) return;
      const loadingToast = toast.loading("Deleting rule...");
      try {
        await deleteMutation.mutateAsync(rule._id);
        toast.success("Rule deleted", { id: loadingToast });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete rule",
          { id: loadingToast }
        );
      }
    },
    [deleteMutation]
  );

  const handleAcceptSuggestion = useCallback(
    async (suggestion: any) => {
      const loadingToast = toast.loading("Creating rule from suggestion...");
      try {
        await acceptMutation.mutateAsync({
          suggestionId: suggestion.id || suggestion._id,
          ruleConfig: suggestion.ruleConfig || {
            name: suggestion.title || suggestion.name,
            condition: suggestion.condition || { level: "error" },
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
    },
    [acceptMutation]
  );

  const formatConfidence = (confidence: number | string | undefined): string => {
    if (!confidence) return "N/A";
    const value = typeof confidence === "string" ? parseFloat(confidence) : confidence;
    return `${Math.round(value * 100)}%`;
  };

  const getConfidenceStyle = (confidence: number | string | undefined): string => {
    if (!confidence) return "bg-bg-elevated text-text-muted";
    const value = typeof confidence === "string" ? parseFloat(confidence) : confidence;
    if (value >= 0.8) return "bg-status-ok/10 text-status-ok border-status-ok/30";
    if (value >= 0.5) return "bg-status-warn/10 text-status-warn border-status-warn/30";
    return "bg-data-info/10 text-data-info border-data-info/30";
  };

  return (
    <div className="flex flex-col h-full bg-bg-base">
      {/* Header */}
      <div className="shrink-0">
        <PageHeader
          title="Alert Rules"
          description="Configure alert conditions and notification channels"
          badge={<BookOpen className="h-5 w-5 text-signal" />}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back
              </Button>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-signal text-bg-void hover:bg-signal/90"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Create Rule
              </Button>
            </div>
          }
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-6 space-y-8">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search rules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-bg-surface border-border-subtle"
          />
        </div>

        {/* Rules List */}
        <div className="space-y-4">
          <h2 className="text-sm font-display font-semibold text-text-primary uppercase tracking-wider">
            Rules ({filteredRules.length})
          </h2>

          {rulesLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-signal" />
            </div>
          ) : filteredRules.length === 0 ? (
            <Card className="border-border-subtle bg-bg-surface">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="h-12 w-12 text-text-muted mb-4" />
                <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
                  No rules configured for this project
                </h3>
                <p className="text-sm text-text-secondary max-w-md mb-6">
                  {searchTerm
                    ? "No rules match your search."
                    : "Create your first alert rule to get notified when specific conditions are met."}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-signal text-bg-void hover:bg-signal/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Rule
                  </Button>
                )}
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
                      {/* Left: rule info */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <SignalDot
                          status={rule.isActive ? "ok" : "info"}
                          pulse={rule.isActive}
                          className="mt-1 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-display font-semibold text-text-primary">
                              {rule.name}
                            </h3>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                rule.isActive
                                  ? "bg-status-ok/10 text-status-ok border-status-ok/30"
                                  : "bg-bg-elevated text-text-muted border-border-subtle"
                              )}
                            >
                              {rule.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {rule.snoozeUntil &&
                              new Date(rule.snoozeUntil) > new Date() && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-data-info/10 text-data-info border-data-info/30"
                                >
                                  Snoozed
                                </Badge>
                              )}
                          </div>
                          {rule.description && (
                            <p className="text-xs text-text-secondary mb-1.5">
                              {rule.description}
                            </p>
                          )}
                          <p className="text-xs font-mono text-text-muted bg-bg-base px-2 py-1 rounded border border-border-faint inline-block">
                            {conditionSummary(rule.condition)}
                          </p>
                        </div>
                      </div>

                      {/* Right: actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Toggle */}
                        <button
                          onClick={() => handleToggle(rule)}
                          disabled={updateMutation.isPending}
                          className={cn(
                            "relative w-10 h-5 rounded-full transition-colors",
                            rule.isActive
                              ? "bg-signal"
                              : "bg-bg-elevated border border-border-subtle"
                          )}
                          title={rule.isActive ? "Disable rule" : "Enable rule"}
                        >
                          <span
                            className={cn(
                              "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                              rule.isActive ? "left-[22px]" : "left-0.5"
                            )}
                          />
                        </button>

                        {/* Dropdown */}
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
                              onClick={() => handleToggle(rule)}
                              className="text-text-secondary hover:text-signal"
                            >
                              {rule.isActive ? (
                                <PowerOff className="h-4 w-4 mr-2" />
                              ) : (
                                <Power className="h-4 w-4 mr-2" />
                              )}
                              {rule.isActive ? "Disable" : "Enable"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border-faint" />
                            <DropdownMenuItem
                              onClick={() => handleDelete(rule)}
                              className="text-status-danger hover:bg-status-danger/10"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
                      {/* Channels */}
                      {rule.notifyChannels?.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Bell className="h-3 w-3" />
                          <div className="flex gap-1">
                            {rule.notifyChannels.map((ch: string) => {
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
                            })}
                          </div>
                        </div>
                      )}
                      <span>
                        Created {format(new Date(rule.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* AI-Suggested Rules Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-signal" />
            <div>
              <h2 className="text-sm font-display font-semibold text-text-primary uppercase tracking-wider">
                AI-Suggested Rules
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Apperio analyzes your log patterns and suggests alert rules you might find useful.
              </p>
            </div>
          </div>

          {suggestionsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-signal" />
            </div>
          ) : suggestionsError ? (
            <Card className="border-border-subtle bg-bg-surface">
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <AlertTriangle className="h-10 w-10 text-status-warn mb-3" />
                <h3 className="text-sm font-display font-semibold text-text-primary mb-1">
                  Unable to load suggestions
                </h3>
                <p className="text-xs text-text-secondary max-w-md">
                  AI suggestions require sufficient log data. Keep sending logs and check back later.
                </p>
              </div>
            </Card>
          ) : suggestions.length === 0 ? (
            <Card className="border-border-subtle bg-bg-surface">
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Brain className="h-10 w-10 text-text-muted mb-3" />
                <h3 className="text-sm font-display font-semibold text-text-primary mb-1">
                  No suggestions available
                </h3>
                <p className="text-xs text-text-secondary max-w-md">
                  Apperio will generate suggestions as it learns from your log patterns.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion: any, index: number) => (
                <Card
                  key={suggestion.id || suggestion._id || index}
                  className="border-border-subtle bg-bg-surface hover:border-signal/30 transition-colors"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <Sparkles className="h-4 w-4 text-signal shrink-0" />
                          <h4 className="font-display font-semibold text-text-primary">
                            {suggestion.title || suggestion.name || `Suggestion ${index + 1}`}
                          </h4>
                          {suggestion.confidence !== undefined && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                getConfidenceStyle(suggestion.confidence)
                              )}
                            >
                              {formatConfidence(suggestion.confidence)} confidence
                            </Badge>
                          )}
                          {suggestion.severity && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs capitalize",
                                SEVERITY_BADGE_CLASS[suggestion.severity] || ""
                              )}
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
                            <span className="text-text-muted">Condition:</span>
                            <span className="font-mono text-text-secondary bg-bg-base px-2 py-0.5 rounded border border-border-faint">
                              {suggestion.condition.level &&
                                `level:${suggestion.condition.level}`}
                              {suggestion.condition.keyword &&
                                ` keyword:"${suggestion.condition.keyword}"`}
                              {suggestion.condition.frequency &&
                                ` >= ${suggestion.condition.frequency}/${
                                  suggestion.condition.intervalMinutes || 5
                                }min`}
                            </span>
                          </div>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleAcceptSuggestion(suggestion)}
                        disabled={acceptMutation.isPending}
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
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Rule Modal */}
      <CreateAlertModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        projects={allProjects}
        defaultProjectId={projectId}
      />
    </div>
  );
}
