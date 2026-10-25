"use client";

import { useState, useMemo } from "react";
import { useProjects } from "@/hooks/project.hooks";
import {
  useAlertRules,
  useUpdateAlertRule,
  useDeleteAlertRule,
  useTestAlertRule,
  useSnoozeAlertRule,
} from "@/hooks/alerts.hook";
import { CreateAlertModal } from "@/components/alerts/CreateAlertModal";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Loader2,
  Trash2,
  Power,
  PowerOff,
  FlaskConical,
  BellOff,
  MoreVertical,
  Clock,
  Shield,
  BookOpen,
} from "lucide-react";
import {
  AlertRule,
  SimpleCondition,
  CompositeCondition,
} from "@/services/alert.service";
import { format, isFuture } from "date-fns";
import { toast } from "sonner";

function isCompositeCondition(
  condition: SimpleCondition | CompositeCondition
): condition is CompositeCondition {
  return "operator" in condition && "conditions" in condition;
}

function ConditionSummary({
  condition,
}: {
  condition: SimpleCondition | CompositeCondition;
}) {
  if (isCompositeCondition(condition)) {
    const parts = condition.conditions
      .map((sub) => {
        const subParts: string[] = [];
        if (sub.level) subParts.push(sub.level);
        if (sub.keyword) subParts.push(`"${sub.keyword}"`);
        if (sub.service) subParts.push(`svc:${sub.service}`);
        return subParts.join("+") || "any";
      })
      .join(` ${condition.operator} `);

    return (
      <span className="text-xs font-mono text-text-secondary">
        {parts}
        {condition.frequency && (
          <span className="text-text-muted ml-1">
            {" "}
            &ge;{condition.frequency}/{condition.intervalMinutes || 5}min
          </span>
        )}
      </span>
    );
  }

  const parts: string[] = [];
  if (condition.level) parts.push(condition.level);
  if (condition.keyword) parts.push(`"${condition.keyword}"`);
  if (condition.service) parts.push(`svc:${condition.service}`);
  if (condition.environment) parts.push(`env:${condition.environment}`);
  if (condition.eventType) parts.push(`type:${condition.eventType}`);

  return (
    <span className="text-xs font-mono text-text-secondary">
      {parts.join(" + ") || "Any"}
      {condition.frequency && (
        <span className="text-text-muted ml-1">
          {" "}
          &ge;{condition.frequency}/{condition.intervalMinutes || 5}min
        </span>
      )}
      {condition.responseTimeThreshold && (
        <span className="text-text-muted ml-1">
          {" "}
          rt&gt;{condition.responseTimeThreshold}ms
        </span>
      )}
    </span>
  );
}

function TestRuleDialog({
  ruleId,
  open,
  onOpenChange,
}: {
  ruleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const testMutation = useTestAlertRule();
  const [result, setResult] = useState<{
    matchedCount: number;
    previewLogs: any[];
  } | null>(null);

  const handleTest = async () => {
    try {
      const res = await testMutation.mutateAsync({ ruleId, limitLogs: 100 });
      if (res?.data) {
        setResult(res.data);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to test rule"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-bg-surface border-border-subtle">
        <DialogHeader>
          <DialogTitle className="text-text-primary font-display">
            Test Alert Rule
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Dry-run this rule against the last 100 logs to see which would
            trigger an alert.
          </p>

          {!result ? (
            <Button
              onClick={handleTest}
              disabled={testMutation.isPending}
              className="bg-signal text-bg-void hover:bg-signal/90"
            >
              {testMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FlaskConical className="h-4 w-4 mr-2" />
              )}
              Run Test
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-bg-base rounded-lg border border-border-faint">
                <div className="text-lg font-display font-bold text-signal">
                  {result.matchedCount} match
                  {result.matchedCount !== 1 ? "es" : ""}
                </div>
                <p className="text-xs text-text-muted">
                  out of last 100 logs
                </p>
              </div>

              {result.previewLogs && result.previewLogs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-text-secondary">
                    Preview Matches
                  </h4>
                  <div className="max-h-[300px] overflow-y-auto space-y-1">
                    {result.previewLogs.slice(0, 10).map((log: any, i: number) => (
                      <div
                        key={i}
                        className="p-2 bg-bg-base rounded border border-border-faint text-xs font-mono"
                      >
                        <span className="text-level-error">
                          [{log.level}]
                        </span>{" "}
                        <span className="text-text-secondary">
                          {log.message?.slice(0, 120)}
                          {log.message?.length > 120 ? "..." : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setResult(null)}
                className="border-border-subtle"
              >
                Run Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SnoozeDialog({
  ruleId,
  open,
  onOpenChange,
}: {
  ruleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const snoozeMutation = useSnoozeAlertRule();
  const [duration, setDuration] = useState("60");

  const handleSnooze = async () => {
    const loadingToast = toast.loading("Snoozing rule...");
    try {
      await snoozeMutation.mutateAsync({
        ruleId,
        durationMinutes: parseInt(duration),
      });
      toast.success(`Rule snoozed for ${duration} minutes`, {
        id: loadingToast,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to snooze rule",
        { id: loadingToast }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-bg-surface border-border-subtle">
        <DialogHeader>
          <DialogTitle className="text-text-primary font-display">
            Snooze Alert Rule
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Temporarily pause this rule. No alerts will be triggered during the
            snooze period.
          </p>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="bg-bg-base border-border-subtle">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-bg-elevated border-border-subtle">
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
              <SelectItem value="240">4 hours</SelectItem>
              <SelectItem value="480">8 hours</SelectItem>
              <SelectItem value="1440">24 hours</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="border-border-subtle"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSnooze}
              disabled={snoozeMutation.isPending}
              className="bg-signal text-bg-void hover:bg-signal/90"
            >
              {snoozeMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <BellOff className="h-4 w-4 mr-2" />
              )}
              Snooze
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RuleRow({
  rule,
  projectName,
}: {
  rule: AlertRule;
  projectName: string;
}) {
  const updateMutation = useUpdateAlertRule();
  const deleteMutation = useDeleteAlertRule();
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [snoozeDialogOpen, setSnoozeDialogOpen] = useState(false);

  const isSnoozed = rule.snoozeUntil && isFuture(new Date(rule.snoozeUntil));

  const handleToggleActive = async () => {
    const loadingToast = toast.loading(
      `${rule.isActive ? "Disabling" : "Enabling"} rule...`
    );
    try {
      await updateMutation.mutateAsync({
        ruleId: rule._id,
        data: { isActive: !rule.isActive },
      });
      toast.success(`Rule ${rule.isActive ? "disabled" : "enabled"}`, {
        id: loadingToast,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update rule",
        { id: loadingToast }
      );
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the rule "${rule.name}"?`))
      return;
    const loadingToast = toast.loading("Deleting rule...");
    try {
      await deleteMutation.mutateAsync(rule._id);
      toast.success("Rule deleted successfully", { id: loadingToast });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete rule",
        { id: loadingToast }
      );
    }
  };

  return (
    <>
      <div className="grid grid-cols-[1fr_140px_1fr_80px_80px_100px_48px] items-center gap-4 px-5 py-4 border-b border-border-faint hover:bg-bg-elevated/50 transition-colors">
        {/* Rule Name */}
        <div className="flex items-center gap-2 min-w-0">
          <SignalDot
            status={isSnoozed ? "warn" : rule.isActive ? "ok" : "info"}
            pulse={rule.isActive && !isSnoozed}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {rule.name}
            </p>
            {rule.description && (
              <p className="text-xs text-text-muted truncate">
                {rule.description}
              </p>
            )}
            {isSnoozed && rule.snoozeUntil && (
              <p className="text-xs text-status-warn flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                Until {format(new Date(rule.snoozeUntil), "MMM d, HH:mm")}
              </p>
            )}
          </div>
        </div>

        {/* Project */}
        <span className="text-sm text-text-secondary truncate">
          {projectName}
        </span>

        {/* Condition */}
        <div className="min-w-0 overflow-hidden">
          <ConditionSummary condition={rule.condition} />
        </div>

        {/* Severity - channels as proxy */}
        <div className="flex gap-1 flex-wrap">
          {rule.notifyChannels?.length > 0 ? (
            rule.notifyChannels.slice(0, 2).map((ch: string) => (
              <Badge
                key={ch}
                variant="outline"
                className="text-[10px] capitalize bg-signal/10 border-signal/30 text-signal"
              >
                {ch}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-text-muted">--</span>
          )}
        </div>

        {/* Status */}
        <Badge
          variant="outline"
          className={`text-xs ${
            isSnoozed
              ? "bg-status-warn/10 text-status-warn border-status-warn/30"
              : rule.isActive
              ? "bg-status-ok/10 text-status-ok border-status-ok/30"
              : "bg-bg-elevated text-text-muted border-border-subtle"
          }`}
        >
          {isSnoozed ? "Snoozed" : rule.isActive ? "Active" : "Inactive"}
        </Badge>

        {/* Created */}
        <span className="text-xs text-text-muted">
          {format(new Date(rule.createdAt), "MMM d, yy")}
        </span>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
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
              onClick={() => setTestDialogOpen(true)}
              className="text-text-secondary hover:text-signal"
            >
              <FlaskConical className="h-4 w-4 mr-2" />
              Test Rule
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSnoozeDialogOpen(true)}
              className="text-text-secondary hover:text-signal"
            >
              <BellOff className="h-4 w-4 mr-2" />
              Snooze Rule
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleToggleActive}
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
              onClick={handleDelete}
              className="text-status-danger hover:bg-status-danger/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Rule
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TestRuleDialog
        ruleId={rule._id}
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
      />
      <SnoozeDialog
        ruleId={rule._id}
        open={snoozeDialogOpen}
        onOpenChange={setSnoozeDialogOpen}
      />
    </>
  );
}

export default function AlertRulesPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: projectsResponse, isLoading: isProjectsLoading } =
    useProjects();
  const projects = useMemo(
    () => (projectsResponse as any)?.data ?? [],
    [projectsResponse]
  );

  const effectiveProjectId =
    selectedProjectId || (projects[0]?._id ?? "");

  const { data: rulesData, isLoading: isRulesLoading } =
    useAlertRules(effectiveProjectId);
  const rules: AlertRule[] = useMemo(
    () => rulesData?.data || [],
    [rulesData]
  );

  const filteredRules = useMemo(() => {
    if (!searchTerm) return rules;
    const lower = searchTerm.toLowerCase();
    return rules.filter(
      (rule) =>
        rule.name.toLowerCase().includes(lower) ||
        rule.description?.toLowerCase().includes(lower)
    );
  }, [rules, searchTerm]);

  const isLoading = isProjectsLoading || isRulesLoading;

  // Build project name lookup
  const projectNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of projects) {
      map[p._id] = p.name;
    }
    return map;
  }, [projects]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center gap-3">
          <Select
            value={effectiveProjectId}
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger className="w-[200px] bg-bg-surface border-border-subtle">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent className="bg-bg-elevated border-border-subtle">
              {projects.map((project: any) => (
                <SelectItem key={project._id} value={project._id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-signal text-bg-void hover:bg-signal/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Rule
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
        <Input
          placeholder="Search rules..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-bg-surface border-border-subtle"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
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
                ? "No rules match your search criteria."
                : "Create your first alert rule to get notified when specific conditions are met in your logs."}
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-signal text-bg-void hover:bg-signal/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Rule
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="border-border-subtle bg-bg-surface overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_140px_1fr_80px_80px_100px_48px] items-center gap-4 px-5 py-3 bg-bg-elevated border-b border-border-subtle text-xs font-medium text-text-muted uppercase tracking-wider">
            <span>Rule Name</span>
            <span>Project</span>
            <span>Condition</span>
            <span>Channels</span>
            <span>Status</span>
            <span>Created</span>
            <span />
          </div>

          {/* Table Body */}
          {filteredRules.map((rule) => (
            <RuleRow
              key={rule._id}
              rule={rule}
              projectName={
                projectNameMap[rule.projectId] || "Unknown"
              }
            />
          ))}
        </Card>
      )}

      <CreateAlertModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        projects={projects}
      />
    </div>
  );
}
