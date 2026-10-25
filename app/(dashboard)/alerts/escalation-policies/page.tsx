"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Shield,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Mail,
  Zap,
  Globe,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useProjects } from "@/hooks/project.hooks";
import {
  useEscalationPolicies,
  useCreateEscalationPolicy,
  useUpdateEscalationPolicy,
  useDeleteEscalationPolicy,
} from "@/hooks/alerts.hook";
import { EscalationLevel, EscalationPolicy } from "@/services/alert.service";
import { SignalDot } from "@/components/shared/SignalDot";

const DEFAULT_LEVEL: EscalationLevel = {
  level: 1,
  delayMinutes: 15,
  notifyChannels: ["email"],
  recipients: [],
};

export default function EscalationPoliciesPage() {
  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const projects = useMemo(
    () => (projectsData as any)?.data || [],
    [projectsData]
  );
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const effectiveProjectId =
    selectedProjectId || projects[0]?._id || "";

  const { data: policiesData, isLoading: policiesLoading } =
    useEscalationPolicies(effectiveProjectId);
  const policies: EscalationPolicy[] = useMemo(
    () => policiesData?.data || [],
    [policiesData]
  );

  const createMutation = useCreateEscalationPolicy();
  const updateMutation = useUpdateEscalationPolicy();
  const deleteMutation = useDeleteEscalationPolicy();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPolicy, setEditingPolicy] =
    useState<EscalationPolicy | null>(null);
  const [deletingPolicyId, setDeletingPolicyId] = useState<string | null>(
    null
  );

  const isLoading = projectsLoading || policiesLoading;

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
              {projects.map((p: any) => (
                <SelectItem key={p._id} value={p._id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => setShowCreateDialog(true)}
            disabled={!effectiveProjectId}
            className="bg-signal text-bg-void hover:bg-signal/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Policy
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-signal" />
        </div>
      ) : policies.length === 0 ? (
        <Card className="border-border-subtle bg-bg-surface p-12 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-text-muted" />
          <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
            No escalation policies
          </h3>
          <p className="text-sm text-text-muted mb-6 max-w-md mx-auto">
            Configure escalation policies to automatically route alerts to the
            right team members when they remain unacknowledged. Create your
            first policy to get started.
          </p>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-signal text-bg-void hover:bg-signal/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Policy
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {policies.map((policy) => (
            <PolicyCard
              key={policy._id}
              policy={policy}
              onEdit={() => setEditingPolicy(policy)}
              onDelete={() => setDeletingPolicyId(policy._id)}
              onToggleActive={() => {
                updateMutation.mutate({
                  id: policy._id,
                  data: { isActive: !policy.isActive },
                });
              }}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      {(showCreateDialog || editingPolicy) && (
        <PolicyFormDialog
          open={showCreateDialog || !!editingPolicy}
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateDialog(false);
              setEditingPolicy(null);
            }
          }}
          policy={editingPolicy}
          projectId={effectiveProjectId}
          onSubmit={(data) => {
            if (editingPolicy) {
              updateMutation.mutate(
                { id: editingPolicy._id, data },
                { onSuccess: () => setEditingPolicy(null) }
              );
            } else {
              createMutation.mutate(data as any, {
                onSuccess: () => setShowCreateDialog(false),
              });
            }
          }}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingPolicyId}
        onOpenChange={(open) => !open && setDeletingPolicyId(null)}
      >
        <AlertDialogContent className="bg-bg-surface border-border-subtle">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text-primary font-display">
              Delete Escalation Policy
            </AlertDialogTitle>
            <AlertDialogDescription className="text-text-muted">
              This will permanently delete this escalation policy. Any rules
              using it will no longer have an escalation path.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border-subtle text-text-secondary">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingPolicyId) {
                  deleteMutation.mutate(
                    { id: deletingPolicyId },
                    { onSuccess: () => setDeletingPolicyId(null) }
                  );
                }
              }}
              className="bg-status-danger text-white hover:bg-status-danger/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================
// Policy Card
// ============================================

function PolicyCard({
  policy,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  policy: EscalationPolicy;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-border-subtle bg-bg-surface overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            <Shield className="h-5 w-5 text-data-purple" />
            <div>
              <h3 className="text-sm font-medium text-text-primary">
                {policy.name}
              </h3>
              {policy.description && (
                <p className="text-xs text-text-muted mt-0.5">
                  {policy.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="border-data-purple/30 text-data-purple"
            >
              {policy.levels.length} level
              {policy.levels.length > 1 ? "s" : ""}
            </Badge>
            <div className="flex items-center gap-2">
              <SignalDot
                status={policy.isActive ? "ok" : "info"}
                pulse={policy.isActive}
              />
              <span className="text-xs text-text-muted">
                {policy.isActive ? "Active" : "Inactive"}
              </span>
              <Switch
                checked={policy.isActive}
                onCheckedChange={onToggleActive}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="text-text-muted hover:text-signal"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-text-muted hover:text-status-danger"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Expanded Levels */}
        {expanded && (
          <div className="mt-4 ml-7 space-y-2">
            {policy.levels
              .sort((a, b) => a.level - b.level)
              .map((level, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-md bg-bg-base border border-border-subtle"
                >
                  <Badge
                    variant="outline"
                    className="border-signal/30 text-signal font-mono text-xs shrink-0"
                  >
                    L{level.level}
                  </Badge>
                  <div className="flex-1 text-sm">
                    <span className="text-text-secondary">
                      After{" "}
                      <span className="text-text-primary font-medium">
                        {level.delayMinutes} min
                      </span>
                      , notify via{" "}
                    </span>
                    <span className="text-text-primary">
                      {level.notifyChannels.join(", ")}
                    </span>
                  </div>
                  {level.recipients.length > 0 && (
                    <span className="text-xs text-text-muted">
                      {level.recipients.length} recipient
                      {level.recipients.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================
// Policy Form Dialog
// ============================================

function PolicyFormDialog({
  open,
  onOpenChange,
  policy,
  projectId,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: EscalationPolicy | null;
  projectId: string;
  onSubmit: (data: any) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(policy?.name || "");
  const [description, setDescription] = useState(
    policy?.description || ""
  );
  const [isActive, setIsActive] = useState(policy?.isActive ?? true);
  const [levels, setLevels] = useState<EscalationLevel[]>(
    policy?.levels?.length ? [...policy.levels] : [{ ...DEFAULT_LEVEL }]
  );

  const addLevel = () => {
    setLevels((prev) => [
      ...prev,
      {
        level: prev.length + 1,
        delayMinutes:
          (prev[prev.length - 1]?.delayMinutes || 15) * 2,
        notifyChannels: ["email"],
        recipients: [],
      },
    ]);
  };

  const removeLevel = (index: number) => {
    if (levels.length <= 1) return;
    setLevels((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((l, i) => ({ ...l, level: i + 1 }))
    );
  };

  const updateLevel = (
    index: number,
    updates: Partial<EscalationLevel>
  ) => {
    setLevels((prev) =>
      prev.map((l, i) => (i === index ? { ...l, ...updates } : l))
    );
  };

  const toggleLevelChannel = (
    index: number,
    channel: "email" | "slack" | "webhook"
  ) => {
    setLevels((prev) =>
      prev.map((l, i) => {
        if (i !== index) return l;
        const channels = l.notifyChannels.includes(channel)
          ? l.notifyChannels.filter((c) => c !== channel)
          : [...l.notifyChannels, channel];
        return { ...l, notifyChannels: channels };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data: any = {
      name: name.trim(),
      projectId,
      levels: levels.map((l, i) => ({ ...l, level: i + 1 })),
      isActive,
      createdBy: "",
    };
    if (description.trim()) data.description = description.trim();

    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto bg-bg-surface border-border-subtle text-text-primary">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Shield className="h-5 w-5 text-data-purple" />
            {policy ? "Edit" : "Create"} Escalation Policy
          </DialogTitle>
          <DialogDescription className="text-text-muted">
            Define escalation levels that activate when alerts go
            unacknowledged
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name and Description */}
          <div className="space-y-3 p-4 rounded-lg bg-bg-base border border-border-subtle">
            <div className="space-y-2">
              <Label className="text-text-secondary">Policy Name</Label>
              <Input
                placeholder="e.g., Critical Alert Escalation"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-bg-void border-border-subtle text-text-primary"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-text-secondary">Description</Label>
              <Textarea
                placeholder="Describe when this policy should be used..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="bg-bg-void border-border-subtle text-text-primary resize-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label className="text-text-secondary">
                {isActive ? "Active" : "Inactive"}
              </Label>
            </div>
          </div>

          {/* Levels */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-text-secondary font-medium">
                Escalation Levels
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLevel}
                className="border-dashed border-border-subtle text-text-muted hover:text-signal hover:border-signal"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Level
              </Button>
            </div>

            {levels.map((level, i) => (
              <div
                key={i}
                className="p-4 rounded-lg bg-bg-base border border-border-subtle space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="border-signal/30 text-signal text-xs"
                  >
                    Level {i + 1}
                  </Badge>
                  {levels.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLevel(i)}
                      className="text-text-muted hover:text-status-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-text-muted">
                      Delay (minutes)
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={level.delayMinutes}
                      onChange={(e) =>
                        updateLevel(i, {
                          delayMinutes:
                            parseInt(e.target.value) || 1,
                        })
                      }
                      className="bg-bg-void border-border-subtle h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-text-muted">
                      Webhook URL
                    </Label>
                    <Input
                      placeholder="Optional"
                      value={level.webhookUrl || ""}
                      onChange={(e) =>
                        updateLevel(i, {
                          webhookUrl:
                            e.target.value || undefined,
                        })
                      }
                      className="bg-bg-void border-border-subtle h-8 text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Channels */}
                <div className="space-y-1">
                  <Label className="text-xs text-text-muted">
                    Notify Channels
                  </Label>
                  <div className="flex gap-2">
                    {(
                      [
                        { id: "email", icon: Mail, label: "Email" },
                        { id: "slack", icon: Zap, label: "Slack" },
                        {
                          id: "webhook",
                          icon: Globe,
                          label: "Webhook",
                        },
                      ] as const
                    ).map(({ id, icon: Icon, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleLevelChannel(i, id)}
                        className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 border transition-colors ${
                          level.notifyChannels.includes(id)
                            ? "bg-signal/10 border-signal text-signal"
                            : "bg-bg-void border-border-subtle text-text-muted hover:border-signal"
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recipients */}
                <div className="space-y-1">
                  <Label className="text-xs text-text-muted">
                    Recipients (comma-separated emails)
                  </Label>
                  <Input
                    placeholder="team-lead@example.com, oncall@example.com"
                    value={level.recipients.join(", ")}
                    onChange={(e) =>
                      updateLevel(i, {
                        recipients: e.target.value
                          .split(",")
                          .map((r) => r.trim())
                          .filter(Boolean),
                      })
                    }
                    className="bg-bg-void border-border-subtle h-8 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border-subtle text-text-secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !name.trim()}
              className="bg-signal text-bg-void hover:bg-signal/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : policy ? (
                "Update Policy"
              ) : (
                "Create Policy"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
