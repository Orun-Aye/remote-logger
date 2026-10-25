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
  Wrench,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Calendar,
  Clock,
  StopCircle,
} from "lucide-react";
import { useProjects } from "@/hooks/project.hooks";
import {
  useMaintenanceWindows,
  useCreateMaintenanceWindow,
  useUpdateMaintenanceWindow,
  useDeleteMaintenanceWindow,
  useEndMaintenanceWindowEarly,
} from "@/hooks/alerts.hook";
import { MaintenanceWindow } from "@/services/alert.service";

function isWindowActive(window: MaintenanceWindow): boolean {
  const now = new Date();
  return (
    window.isActive &&
    new Date(window.startTime) <= now &&
    new Date(window.endTime) > now
  );
}

function isWindowUpcoming(window: MaintenanceWindow): boolean {
  return window.isActive && new Date(window.startTime) > new Date();
}

function isWindowExpired(window: MaintenanceWindow): boolean {
  return new Date(window.endTime) <= new Date();
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(start: string, end: string): string {
  const ms =
    new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor(
    (ms % (1000 * 60 * 60)) / (1000 * 60)
  );
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export default function MaintenanceWindowsPage() {
  const { data: projectsData, isLoading: projectsLoading } =
    useProjects();
  const projects = useMemo(
    () => (projectsData as any)?.data || [],
    [projectsData]
  );
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const effectiveProjectId =
    selectedProjectId || projects[0]?._id || "";

  const { data: windowsData, isLoading: windowsLoading } =
    useMaintenanceWindows(effectiveProjectId, undefined, true);
  const windows: MaintenanceWindow[] = useMemo(
    () => windowsData?.data || [],
    [windowsData]
  );

  const createMutation = useCreateMaintenanceWindow();
  const updateMutation = useUpdateMaintenanceWindow();
  const deleteMutation = useDeleteMaintenanceWindow();
  const endEarlyMutation = useEndMaintenanceWindowEarly();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingWindow, setEditingWindow] =
    useState<MaintenanceWindow | null>(null);
  const [deletingWindowId, setDeletingWindowId] = useState<
    string | null
  >(null);

  const isLoading = projectsLoading || windowsLoading;

  // Sort: active first, then upcoming, then expired
  const sortedWindows = useMemo(() => {
    return [...windows].sort((a, b) => {
      const aActive = isWindowActive(a);
      const bActive = isWindowActive(b);
      const aUpcoming = isWindowUpcoming(a);
      const bUpcoming = isWindowUpcoming(b);

      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      if (aUpcoming && !bUpcoming) return -1;
      if (!aUpcoming && bUpcoming) return 1;
      return (
        new Date(b.startTime).getTime() -
        new Date(a.startTime).getTime()
      );
    });
  }, [windows]);

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
            Schedule Window
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-signal" />
        </div>
      ) : sortedWindows.length === 0 ? (
        <Card className="border-border-subtle bg-bg-surface p-12 text-center">
          <Wrench className="h-12 w-12 mx-auto mb-4 text-text-muted" />
          <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
            No maintenance windows
          </h3>
          <p className="text-sm text-text-muted mb-6 max-w-md mx-auto">
            Schedule maintenance windows to suppress alerts during
            deployments, infrastructure changes, or planned downtime.
          </p>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-signal text-bg-void hover:bg-signal/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule Window
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedWindows.map((window) => (
            <WindowCard
              key={window._id}
              window={window}
              onEdit={() => setEditingWindow(window)}
              onDelete={() => setDeletingWindowId(window._id)}
              onEndEarly={() =>
                endEarlyMutation.mutate(window._id)
              }
              isEndingEarly={endEarlyMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      {(showCreateDialog || editingWindow) && (
        <WindowFormDialog
          open={showCreateDialog || !!editingWindow}
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateDialog(false);
              setEditingWindow(null);
            }
          }}
          editWindow={editingWindow}
          projectId={effectiveProjectId}
          onSubmit={(data) => {
            if (editingWindow) {
              updateMutation.mutate(
                { id: editingWindow._id, data },
                {
                  onSuccess: () =>
                    setEditingWindow(null),
                }
              );
            } else {
              createMutation.mutate(data as any, {
                onSuccess: () =>
                  setShowCreateDialog(false),
              });
            }
          }}
          isPending={
            createMutation.isPending ||
            updateMutation.isPending
          }
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingWindowId}
        onOpenChange={(open) =>
          !open && setDeletingWindowId(null)
        }
      >
        <AlertDialogContent className="bg-bg-surface border-border-subtle">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text-primary font-display">
              Delete Maintenance Window
            </AlertDialogTitle>
            <AlertDialogDescription className="text-text-muted">
              This will permanently delete this maintenance window.
              If it&apos;s currently active, alerts will resume
              immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border-subtle text-text-secondary">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingWindowId) {
                  deleteMutation.mutate(
                    { id: deletingWindowId },
                    {
                      onSuccess: () =>
                        setDeletingWindowId(null),
                    }
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
// Window Card
// ============================================

function WindowCard({
  window,
  onEdit,
  onDelete,
  onEndEarly,
  isEndingEarly,
}: {
  window: MaintenanceWindow;
  onEdit: () => void;
  onDelete: () => void;
  onEndEarly: () => void;
  isEndingEarly: boolean;
}) {
  const active = isWindowActive(window);
  const upcoming = isWindowUpcoming(window);
  const expired = isWindowExpired(window);

  return (
    <Card
      className={`border-border-subtle bg-bg-surface overflow-hidden ${
        active ? "border-signal ring-1 ring-signal/20" : ""
      }`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Wrench
                className={`h-5 w-5 ${
                  active
                    ? "text-signal"
                    : expired
                    ? "text-text-muted"
                    : "text-data-info"
                }`}
              />
              {active && (
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-signal animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-text-primary">
                  {window.name}
                </h3>
                {active && (
                  <Badge className="bg-signal/10 text-signal border-signal/30 text-xs">
                    Active Now
                  </Badge>
                )}
                {upcoming && (
                  <Badge
                    variant="outline"
                    className="border-data-info/30 text-data-info text-xs"
                  >
                    Upcoming
                  </Badge>
                )}
                {expired && (
                  <Badge
                    variant="outline"
                    className="border-text-muted/30 text-text-muted text-xs"
                  >
                    Expired
                  </Badge>
                )}
                {window.suppressAllAlerts && (
                  <Badge
                    variant="outline"
                    className="border-status-warn/30 text-status-warn text-xs"
                  >
                    Suppress All
                  </Badge>
                )}
              </div>
              {window.description && (
                <p className="text-xs text-text-muted mt-0.5">
                  {window.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {active && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEndEarly}
                disabled={isEndingEarly}
                className="border-status-warn text-status-warn hover:bg-status-warn/10"
              >
                {isEndingEarly ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <StopCircle className="h-3.5 w-3.5 mr-1" />
                )}
                End Early
              </Button>
            )}
            {!expired && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="text-text-muted hover:text-signal"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            )}
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

        {/* Details Row */}
        <div className="mt-3 ml-8 flex flex-wrap items-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDateTime(window.startTime)} -{" "}
            {formatDateTime(window.endTime)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(window.startTime, window.endTime)}
          </span>
          {window.reason && (
            <span className="text-text-secondary">
              Reason: {window.reason}
            </span>
          )}
        </div>

        {/* Affected Services/Environments */}
        {((window.affectedServices &&
          window.affectedServices.length > 0) ||
          (window.affectedEnvironments &&
            window.affectedEnvironments.length > 0)) && (
          <div className="mt-2 ml-8 flex flex-wrap gap-1.5">
            {window.affectedServices?.map((service) => (
              <Badge
                key={service}
                variant="outline"
                className="text-xs border-border-subtle text-text-secondary"
              >
                {service}
              </Badge>
            ))}
            {window.affectedEnvironments?.map((env) => (
              <Badge
                key={env}
                variant="outline"
                className="text-xs border-data-info/30 text-data-info"
              >
                {env}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================
// Window Form Dialog
// ============================================

function WindowFormDialog({
  open,
  onOpenChange,
  editWindow,
  projectId,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editWindow: MaintenanceWindow | null;
  projectId: string;
  onSubmit: (data: any) => void;
  isPending: boolean;
}) {
  const now = new Date();
  const defaultStart = new Date(now.getTime() + 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
  const defaultEnd = new Date(
    now.getTime() + 3 * 60 * 60 * 1000
  )
    .toISOString()
    .slice(0, 16);

  const [name, setName] = useState(editWindow?.name || "");
  const [description, setDescription] = useState(
    editWindow?.description || ""
  );
  const [reason, setReason] = useState(editWindow?.reason || "");
  const [startTime, setStartTime] = useState(
    editWindow?.startTime
      ? new Date(editWindow.startTime)
          .toISOString()
          .slice(0, 16)
      : defaultStart
  );
  const [endTime, setEndTime] = useState(
    editWindow?.endTime
      ? new Date(editWindow.endTime)
          .toISOString()
          .slice(0, 16)
      : defaultEnd
  );
  const [suppressAllAlerts, setSuppressAllAlerts] = useState(
    editWindow?.suppressAllAlerts ?? true
  );
  const [affectedServices, setAffectedServices] = useState(
    editWindow?.affectedServices?.join(", ") || ""
  );
  const [affectedEnvironments, setAffectedEnvironments] =
    useState<string[]>(editWindow?.affectedEnvironments || []);
  const [isActive, setIsActive] = useState(
    editWindow?.isActive ?? true
  );

  const toggleEnvironment = (env: string) => {
    setAffectedEnvironments((prev) =>
      prev.includes(env)
        ? prev.filter((e) => e !== env)
        : [...prev, env]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startTime || !endTime) return;

    const data: any = {
      name: name.trim(),
      projectId,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      suppressAllAlerts,
      isActive,
      createdBy: "",
    };
    if (description.trim())
      data.description = description.trim();
    if (reason.trim()) data.reason = reason.trim();
    if (affectedServices.trim()) {
      data.affectedServices = affectedServices
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (affectedEnvironments.length > 0) {
      data.affectedEnvironments = affectedEnvironments;
    }

    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto bg-bg-surface border-border-subtle text-text-primary">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Wrench className="h-5 w-5 text-data-info" />
            {editWindow ? "Edit" : "Schedule"} Maintenance
            Window
          </DialogTitle>
          <DialogDescription className="text-text-muted">
            Alerts will be suppressed during the maintenance
            period
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-3 p-4 rounded-lg bg-bg-base border border-border-subtle">
            <div className="space-y-2">
              <Label className="text-text-secondary">
                Window Name
              </Label>
              <Input
                placeholder="e.g., Database Migration"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-bg-void border-border-subtle text-text-primary"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-text-secondary">
                Description
              </Label>
              <Textarea
                placeholder="Details about the maintenance..."
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                rows={2}
                className="bg-bg-void border-border-subtle text-text-primary resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-text-secondary">
                Reason
              </Label>
              <Input
                placeholder="e.g., Scheduled deployment, infrastructure upgrade"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="bg-bg-void border-border-subtle text-text-primary"
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-3 p-4 rounded-lg bg-bg-base border border-border-subtle">
            <Label className="text-text-secondary font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-signal" />
              Schedule
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-text-muted">
                  Start Time
                </Label>
                <Input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) =>
                    setStartTime(e.target.value)
                  }
                  className="bg-bg-void border-border-subtle text-text-primary h-9 text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-text-muted">
                  End Time
                </Label>
                <Input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) =>
                    setEndTime(e.target.value)
                  }
                  min={startTime}
                  className="bg-bg-void border-border-subtle text-text-primary h-9 text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Scope */}
          <div className="space-y-3 p-4 rounded-lg bg-bg-base border border-border-subtle">
            <Label className="text-text-secondary font-medium">
              Scope
            </Label>

            <div className="flex items-center gap-3">
              <Switch
                checked={suppressAllAlerts}
                onCheckedChange={setSuppressAllAlerts}
              />
              <Label className="text-sm text-text-secondary">
                Suppress all alerts during this window
              </Label>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-text-muted">
                Affected Services (comma-separated)
              </Label>
              <Input
                placeholder="api, database, auth-service"
                value={affectedServices}
                onChange={(e) =>
                  setAffectedServices(e.target.value)
                }
                className="bg-bg-void border-border-subtle text-text-primary h-8 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-text-muted">
                Affected Environments
              </Label>
              <div className="flex gap-2">
                {["production", "staging", "development"].map(
                  (env) => (
                    <button
                      key={env}
                      type="button"
                      onClick={() => toggleEnvironment(env)}
                      className={`px-3 py-1 rounded text-xs font-medium capitalize border transition-colors ${
                        affectedEnvironments.includes(env)
                          ? "bg-signal/10 border-signal text-signal"
                          : "bg-bg-void border-border-subtle text-text-muted hover:border-signal"
                      }`}
                    >
                      {env}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-border-subtle">
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label className="text-sm text-text-secondary">
                {isActive ? "Enabled" : "Disabled (draft)"}
              </Label>
            </div>
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
              disabled={
                isPending ||
                !name.trim() ||
                !startTime ||
                !endTime
              }
              className="bg-signal text-bg-void hover:bg-signal/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editWindow ? (
                "Update Window"
              ) : (
                "Schedule Window"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
