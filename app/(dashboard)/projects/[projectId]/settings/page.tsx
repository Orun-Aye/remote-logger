"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Settings,
  Loader2,
  Hash,
  Archive,
  ArrowRightLeft,
  Trash2,
  UserCheck,
} from "lucide-react";
import {
  useProject,
  useUpdateProject,
  useDeleteProject,
  useArchiveProject,
  useRestoreProject,
  useTransferOwnership,
} from "@/hooks/project.hooks";
import { SignalDot } from "@/components/shared/SignalDot";
import { toast } from "sonner";

export default function ProjectGeneralSettingsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId =
    typeof params?.projectId === "string" ? params.projectId : "";
  const router = useRouter();
  const { data: projectData, isLoading } = useProject(projectId);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="h-8 w-48 bg-bg-surface rounded animate-pulse" />
        <div className="h-64 bg-bg-surface rounded animate-pulse" />
      </div>
    );
  }

  if (!projectData || !projectData.project) {
    return (
      <div className="max-w-2xl">
        <Card className="bg-bg-surface border-border-subtle">
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
              Project not found
            </h3>
            <p className="text-text-muted mb-4">
              The project you are looking for does not exist or has been removed.
            </p>
            <Button variant="signal" asChild className="mt-4">
              <Link href="/projects">Back to Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight text-text-primary flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-signal/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-signal" />
          </div>
          General Settings
        </h1>
        <p className="text-text-secondary mt-1 ml-[46px]">
          Basic project configuration
        </p>
      </div>

      <GeneralForm project={projectData.project} />
      <DangerZone project={projectData.project} router={router} />
    </div>
  );
}

function GeneralForm({ project }: { project: any }) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [isActive, setIsActive] = useState(project.isActive);
  const [newTag, setNewTag] = useState("");

  const updateProject = useUpdateProject();

  const handleSave = () => {
    updateProject.mutate(
      {
        projectId: project._id,
        projectData: { name, description, isActive },
      },
      {
        onSuccess: () => toast.success("Project settings saved"),
        onError: () => toast.error("Failed to save project settings"),
      }
    );
  };

  return (
    <Card className="bg-bg-surface border-border-subtle">
      <CardHeader>
        <CardTitle className="font-display text-text-primary">
          General Information
        </CardTitle>
        <CardDescription className="text-text-muted">
          Update your project&apos;s basic information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-text-secondary text-sm">
            Project Name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Project"
            className="bg-background border-input text-text-primary placeholder:text-text-muted focus:border-gs-900 focus:ring-0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-text-secondary text-sm">
            Description
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this project monitors..."
            rows={3}
            className="bg-background border-input text-text-primary placeholder:text-text-muted focus:border-gs-900 focus:ring-0"
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-bg-elevated border border-border-subtle">
          <div>
            <Label
              htmlFor="active"
              className="text-text-primary text-sm font-medium"
            >
              Project Status
            </Label>
            <p className="text-sm text-text-muted mt-0.5">
              {isActive ? (
                <span className="flex items-center gap-1.5">
                  <SignalDot status="ok" size="sm" />
                  Project is active and receiving logs
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <SignalDot status="warn" size="sm" pulse={false} />
                  Project is inactive
                </span>
              )}
            </p>
          </div>
          <Switch
            id="active"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-text-secondary text-sm">Tags</Label>
          <div className="flex flex-wrap gap-2">
            {project.tags?.map((tag: string) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-bg-elevated text-text-secondary border-border-subtle"
              >
                <Hash className="w-3 h-3 mr-1 text-text-muted" />
                {tag}
              </Badge>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="border-border-subtle text-text-muted hover:text-signal hover:border-signal/30"
            >
              Add Tag
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-border-subtle">
          <Button
            variant="signal"
            onClick={handleSave}
            disabled={updateProject.isPending}
          >
            {updateProject.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DangerZone({ project, router }: { project: any; router: any }) {
  const archiveProject = useArchiveProject();
  const restoreProject = useRestoreProject();
  const deleteProject = useDeleteProject();
  const transferOwnership = useTransferOwnership();
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");

  const handleArchiveToggle = () => {
    const confirmed = window.confirm(
      project.isActive
        ? `Archive "${project.name}"? This will stop log ingestion until restored.`
        : `Restore "${project.name}"? This will resume log ingestion.`
    );
    if (!confirmed) return;

    if (project.isActive) {
      archiveProject.mutate(project._id, {
        onSuccess: () => toast.success("Project archived successfully"),
        onError: () => toast.error("Failed to archive project"),
      });
    } else {
      restoreProject.mutate(project._id, {
        onSuccess: () => toast.success("Project restored successfully"),
        onError: () => toast.error("Failed to restore project"),
      });
    }
  };

  const handleTransfer = () => {
    if (!selectedMemberId) return;
    const currentOwnerId =
      typeof project.ownerId === "object"
        ? project.ownerId._id
        : project.ownerId;

    transferOwnership.mutate(
      {
        projectId: project._id,
        newOwnerId: selectedMemberId,
        currentOwnerId,
      },
      {
        onSuccess: () => {
          toast.success("Ownership transferred successfully");
          setTransferOpen(false);
          setSelectedMemberId("");
        },
        onError: () => toast.error("Failed to transfer ownership"),
      }
    );
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${project.name}"? This action cannot be undone and all logs will be lost.`
    );
    if (!confirmed) return;

    deleteProject.mutate(
      { projectId: project._id, hardDelete: true },
      {
        onSuccess: () => {
          toast.success("Project deleted permanently");
          router.push("/projects");
        },
        onError: () => toast.error("Failed to delete project"),
      }
    );
  };

  const teamMembers: any[] = project.teamMembers ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-display font-semibold text-text-primary">
        Danger Zone
      </h2>

      {/* Archive / Restore */}
      <Card className="bg-bg-surface border-border-subtle">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-status-warn/10 flex items-center justify-center">
                <Archive className="w-4.5 h-4.5 text-status-warn" />
              </div>
              <div>
                <p className="font-medium text-text-primary">
                  {project.isActive ? "Archive Project" : "Restore Project"}
                </p>
                <p className="text-sm text-text-muted">
                  {project.isActive
                    ? "Temporarily disable this project and stop log ingestion"
                    : "Restore this project and resume log ingestion"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchiveToggle}
              disabled={archiveProject.isPending || restoreProject.isPending}
              className="border-status-warn/30 text-status-warn hover:bg-status-warn/10 hover:border-status-warn/50"
            >
              {(archiveProject.isPending || restoreProject.isPending) && (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              )}
              {project.isActive ? "Archive" : "Restore"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Ownership */}
      <Card className="bg-bg-surface border-border-subtle">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-data/10 flex items-center justify-center">
                <ArrowRightLeft className="w-4.5 h-4.5 text-data" />
              </div>
              <div>
                <p className="font-medium text-text-primary">
                  Transfer Ownership
                </p>
                <p className="text-sm text-text-muted">
                  Transfer this project to another team member
                </p>
              </div>
            </div>
            <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={teamMembers.length === 0}
                  className="border-data/30 text-data hover:bg-data/10 hover:border-data/50"
                >
                  Transfer
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-bg-surface border-border-subtle">
                <DialogHeader>
                  <DialogTitle className="font-display text-text-primary">
                    Transfer Ownership
                  </DialogTitle>
                  <DialogDescription className="text-text-muted">
                    Select a team member to become the new owner of &quot;{project.name}&quot;.
                    You will remain as an admin team member.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-4">
                  {teamMembers.length === 0 ? (
                    <p className="text-sm text-text-muted text-center py-4">
                      No team members to transfer to. Add a team member first.
                    </p>
                  ) : (
                    teamMembers.map((member: any) => {
                      const user = member.user;
                      const userId =
                        typeof user === "object" ? user._id : user;
                      const name =
                        typeof user === "object"
                          ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email
                          : userId;
                      const email =
                        typeof user === "object" ? user.email : "";

                      return (
                        <button
                          key={userId}
                          onClick={() => setSelectedMemberId(userId)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                            selectedMemberId === userId
                              ? "border-data bg-data/10"
                              : "border-border-subtle hover:bg-bg-elevated"
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center text-xs font-medium text-text-secondary">
                            {typeof user === "object"
                              ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`
                              : "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">
                              {name}
                            </p>
                            {email && (
                              <p className="text-xs text-text-muted truncate">
                                {email}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-bg-elevated text-text-muted"
                          >
                            {member.role}
                          </Badge>
                          {selectedMemberId === userId && (
                            <UserCheck className="w-4 h-4 text-data shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTransferOpen(false);
                      setSelectedMemberId("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="signal"
                    size="sm"
                    onClick={handleTransfer}
                    disabled={!selectedMemberId || transferOwnership.isPending}
                  >
                    {transferOwnership.isPending && (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    )}
                    Confirm Transfer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Delete */}
      <Card className="bg-status-danger/5 border-status-danger/30">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-status-danger/10 flex items-center justify-center">
                <Trash2 className="w-4.5 h-4.5 text-status-danger" />
              </div>
              <div>
                <p className="font-medium text-status-danger">Delete Project</p>
                <p className="text-sm text-text-muted">
                  Permanently delete this project and all associated data
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteProject.isPending}
            >
              {deleteProject.isPending && (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              )}
              Delete Project
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
