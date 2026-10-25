"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Trash2,
  Loader2,
  UserPlus,
  Mail,
} from "lucide-react";
import { useProject } from "@/hooks/project.hooks";
import { projectService } from "@/services/project.service";
import { toast } from "sonner";
import { SignalDot } from "@/components/shared/SignalDot";
import { queryClient } from "@/lib/query/client";
import { queryKeys } from "@/hooks/project.hooks";

export default function TeamSettingsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId =
    typeof params?.projectId === "string" ? params.projectId : "";
  const { data: projectData, isLoading } = useProject(projectId);

  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<string>("viewer");
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

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
            <p className="text-text-muted">Project not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { project } = projectData;

  const handleAddMember = async () => {
    if (!newEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsAdding(true);
    try {
      await projectService.updateProject(projectId, {} as any);
      // Use the direct API call for adding team members
      const { apiClient } = await import("@/services/config");
      await apiClient.post(`/projects/${projectId}/team-members`, {
        email: newEmail.trim(),
        role: newRole,
      });
      toast.success(`Invited ${newEmail} as ${newRole}`);
      setNewEmail("");
      setNewRole("viewer");
      queryClient.invalidateQueries({ queryKey: queryKeys.details(projectId) });
    } catch (err: any) {
      toast.error(err?.message || "Failed to add team member");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    const confirmed = window.confirm(
      `Remove ${memberEmail} from this project?`
    );
    if (!confirmed) return;

    setRemovingId(memberId);
    try {
      const { apiClient } = await import("@/services/config");
      await apiClient.delete(`/projects/${projectId}/team-members`, {
        data: { userId: memberId },
      });
      toast.success(`Removed ${memberEmail} from project`);
      queryClient.invalidateQueries({ queryKey: queryKeys.details(projectId) });
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove team member");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight text-text-primary flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-signal/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-signal" />
          </div>
          Team Members
        </h1>
        <p className="text-text-secondary mt-1 ml-[46px]">
          Manage who has access to this project
        </p>
      </div>

      {/* Add member form */}
      <Card className="bg-bg-surface border-border-subtle">
        <CardHeader>
          <CardTitle className="font-display text-text-primary flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-signal" />
            Invite Member
          </CardTitle>
          <CardDescription className="text-text-muted">
            Add a team member by their email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="memberEmail" className="text-text-secondary text-sm">
                <Mail className="w-3.5 h-3.5 inline mr-1" />
                Email Address
              </Label>
              <Input
                id="memberEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="teammate@example.com"
                className="bg-background border-input text-text-primary placeholder:text-text-muted focus:border-gs-900 focus:ring-0"
                onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
              />
            </div>
            <div className="w-36 space-y-2">
              <Label htmlFor="memberRole" className="text-text-secondary text-sm">
                Role
              </Label>
              <select
                id="memberRole"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full h-9 px-3 rounded-md border bg-background border-input text-text-primary text-sm focus:border-gs-900 focus:ring-0 focus:outline-none"
              >
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>
          <Button
            variant="signal"
            size="sm"
            onClick={handleAddMember}
            disabled={isAdding}
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4 mr-2" />
            )}
            Add Member
          </Button>
        </CardContent>
      </Card>

      {/* Members list */}
      <Card className="bg-bg-surface border-border-subtle">
        <CardHeader>
          <CardTitle className="font-display text-text-primary">
            Current Members
          </CardTitle>
          <CardDescription className="text-text-muted">
            {1 + (project.teamMembers?.length || 0)} member
            {1 + (project.teamMembers?.length || 0) !== 1 ? "s" : ""} in this
            project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Owner */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-bg-elevated border-l-2 border-signal/30 border border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-signal/10 flex items-center justify-center ring-1 ring-signal/20">
                <span className="font-semibold text-sm text-signal">
                  {project.ownerId?.firstName?.[0]}
                  {project.ownerId?.lastName?.[0]}
                </span>
              </div>
              <div>
                <p className="font-medium text-text-primary">
                  {project.ownerId?.firstName} {project.ownerId?.lastName}
                </p>
                <p className="text-sm text-text-muted">
                  {project.ownerId?.email}
                </p>
              </div>
            </div>
            <Badge className="bg-signal/15 text-signal border-signal/20 hover:bg-signal/15">
              Owner
            </Badge>
          </div>

          {/* Team Members */}
          {project.teamMembers?.map((member: any) => (
            <div
              key={member._id}
              className="flex items-center justify-between p-4 rounded-lg bg-bg-surface border border-border-subtle hover:border-border-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-bg-elevated flex items-center justify-center ring-1 ring-border-subtle">
                  <span className="font-semibold text-sm text-text-secondary">
                    {member.user?.firstName?.[0]}
                    {member.user?.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-text-primary">
                    {member.user?.firstName} {member.user?.lastName}
                  </p>
                  <p className="text-sm text-text-muted">
                    {member.user?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {member.role === "admin" ? (
                  <Badge className="bg-data/15 text-data border-data/20 capitalize hover:bg-data/15">
                    {member.role}
                  </Badge>
                ) : (
                  <Badge className="bg-bg-elevated text-text-muted border-border-subtle capitalize hover:bg-bg-elevated">
                    {member.role}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleRemoveMember(
                      member.user?._id,
                      member.user?.email
                    )
                  }
                  disabled={removingId === member.user?._id}
                  className="text-text-muted hover:text-status-danger hover:bg-status-danger/10"
                >
                  {removingId === member.user?._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}

          {(!project.teamMembers || project.teamMembers.length === 0) && (
            <div className="text-center py-8 text-text-muted">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                No team members yet. Invite someone to collaborate.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
