"use client";

import { useState } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UsersRound,
  Plus,
  MoreHorizontal,
  Users,
  Folder,
  ChevronDown,
  ChevronRight,
  Trash2,
  UserPlus,
  Loader2,
  AlertTriangle,
  Shield,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import {
  useOrgTeams,
  useOrgTeam,
  useOrgMembers,
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
  useAddTeamMember,
  useRemoveTeamMember,
  useSetProjectAccess,
} from "@/hooks/organization.hooks";
import { useProjects } from "@/hooks/project.hooks";
import { useOrganizationStore } from "@/store/organization-store";
import type {
  Team,
  TeamMember,
  ProjectAccess,
  ProjectPermission,
} from "@/types/organization.types";

const PERMISSION_OPTIONS: { value: ProjectPermission; label: string }[] = [
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
  { value: "admin", label: "Admin" },
];

function getTeamMemberName(member: TeamMember): string {
  if (typeof member.user === "string") return member.user;
  const u = member.user;
  if (u.firstName || u.lastName) {
    return `${u.firstName || ""} ${u.lastName || ""}`.trim();
  }
  return u.email;
}

function getTeamMemberUserId(member: TeamMember): string {
  if (typeof member.user === "string") return member.user;
  return member.user._id;
}

function getProjectName(pa: ProjectAccess): string {
  if (typeof pa.project === "string") return pa.project;
  return pa.project.name;
}

function getProjectId(pa: ProjectAccess): string {
  if (typeof pa.project === "string") return pa.project;
  return pa.project._id;
}

// ============================================
// Team Card with expandable details
// ============================================

function TeamCard({
  team,
  orgId,
  orgMembersList,
}: {
  team: Team;
  orgId: string;
  orgMembersList: Array<{ _id: string; email: string; firstName?: string; lastName?: string }>;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: teamDetail } = useOrgTeam(orgId, expanded ? team._id : "");
  const { data: projectsResponse } = useProjects({});
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const addTeamMember = useAddTeamMember();
  const removeTeamMember = useRemoveTeamMember();
  const setProjectAccess = useSetProjectAccess();

  // Edit team name
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState(team.name);

  // Add member
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  // Project access
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [accessEntries, setAccessEntries] = useState<
    { project: string; permission: ProjectPermission }[]
  >([]);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const currentTeam = teamDetail || team;
  const projects = projectsResponse?.data || [];

  const handleEditSave = () => {
    if (!editName.trim()) {
      toast.error("Team name is required");
      return;
    }
    updateTeam.mutate(
      { orgId, teamId: team._id, data: { name: editName.trim() } },
      {
        onSuccess: () => {
          toast.success("Team updated");
          setEditDialogOpen(false);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || err?.message || "Failed to update team");
        },
      }
    );
  };

  const handleDelete = () => {
    deleteTeam.mutate(
      { orgId, teamId: team._id },
      {
        onSuccess: () => {
          toast.success(`Team "${team.name}" deleted`);
          setDeleteDialogOpen(false);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || err?.message || "Failed to delete team");
        },
      }
    );
  };

  const handleAddMember = () => {
    if (!selectedUserId) {
      toast.error("Select a member");
      return;
    }
    addTeamMember.mutate(
      { orgId, teamId: team._id, data: { userId: selectedUserId } },
      {
        onSuccess: () => {
          toast.success("Member added to team");
          setAddMemberDialogOpen(false);
          setSelectedUserId("");
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || err?.message || "Failed to add member");
        },
      }
    );
  };

  const handleRemoveMember = (userId: string) => {
    removeTeamMember.mutate(
      { orgId, teamId: team._id, userId },
      {
        onSuccess: () => toast.success("Member removed from team"),
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || err?.message || "Failed to remove member");
        },
      }
    );
  };

  const handleOpenAccessDialog = () => {
    const existing = (currentTeam.projectAccess || []).map((pa) => ({
      project: getProjectId(pa),
      permission: pa.permission,
    }));
    setAccessEntries(existing);
    setAccessDialogOpen(true);
  };

  const handleSaveAccess = () => {
    setProjectAccess.mutate(
      {
        orgId,
        teamId: team._id,
        data: { projectAccess: accessEntries.filter((e) => e.project) },
      },
      {
        onSuccess: () => {
          toast.success("Project access updated");
          setAccessDialogOpen(false);
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message || err?.message || "Failed to update project access"
          );
        },
      }
    );
  };

  const addAccessEntry = () => {
    setAccessEntries((prev) => [...prev, { project: "", permission: "read" }]);
  };

  const removeAccessEntry = (idx: number) => {
    setAccessEntries((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateAccessEntry = (
    idx: number,
    field: "project" | "permission",
    value: string
  ) => {
    setAccessEntries((prev) =>
      prev.map((entry, i) =>
        i === idx ? { ...entry, [field]: value } : entry
      )
    );
  };

  return (
    <>
      <Card className="bg-bg-surface border-border-subtle">
        <CardContent className="p-0">
          {/* Team header row */}
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-bg-elevated/30 transition-colors rounded-t-lg"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center gap-3">
              {expanded ? (
                <ChevronDown className="w-4 h-4 text-text-muted" />
              ) : (
                <ChevronRight className="w-4 h-4 text-text-muted" />
              )}
              <div className="w-9 h-9 rounded-lg bg-data-info/10 flex items-center justify-center">
                <UsersRound className="w-5 h-5 text-data-info" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {currentTeam.name}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {currentTeam.members?.length || 0} members
                  </span>
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Folder className="w-3 h-3" />
                    {currentTeam.projectAccess?.length || 0} projects
                  </span>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-text-muted hover:text-text-primary"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditName(currentTeam.name);
                    setEditDialogOpen(true);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                  Rename Team
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddMemberDialogOpen(true);
                  }}
                >
                  <UserPlus className="w-4 h-4" />
                  Add Member
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenAccessDialog();
                  }}
                >
                  <Shield className="w-4 h-4" />
                  Configure Access
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Team
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Expanded details */}
          {expanded && (
            <div className="border-t border-border-subtle p-4 space-y-4">
              {/* Members */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                  Team Members
                </h4>
                {(currentTeam.members || []).length === 0 ? (
                  <p className="text-sm text-text-muted">No members yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {(currentTeam.members || []).map((member) => {
                      const userId = getTeamMemberUserId(member);
                      return (
                        <div
                          key={userId}
                          className="flex items-center justify-between py-2 px-3 rounded-md bg-bg-elevated/50"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-bg-surface flex items-center justify-center text-[10px] font-medium text-text-muted border border-border-subtle">
                              {getTeamMemberName(member)[0]?.toUpperCase() || "?"}
                            </div>
                            <span className="text-sm text-text-primary">
                              {getTeamMemberName(member)}
                            </span>
                            <Badge variant="secondary" className="text-[10px]">
                              {member.role}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-text-muted hover:text-status-danger"
                            onClick={() => handleRemoveMember(userId)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Project Access */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                  Project Access
                </h4>
                {(currentTeam.projectAccess || []).length === 0 ? (
                  <p className="text-sm text-text-muted">
                    No project access configured.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {(currentTeam.projectAccess || []).map((pa, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 px-3 rounded-md bg-bg-elevated/50"
                      >
                        <div className="flex items-center gap-2">
                          <Folder className="w-3.5 h-3.5 text-text-muted" />
                          <span className="text-sm text-text-primary">
                            {getProjectName(pa)}
                          </span>
                        </div>
                        <Badge
                          variant={
                            pa.permission === "admin"
                              ? "signal"
                              : pa.permission === "write"
                              ? "status-ok"
                              : "level-info"
                          }
                          className="text-[10px]"
                        >
                          {pa.permission}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Team Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Team</DialogTitle>
            <DialogDescription>
              Change the name of this team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-text-secondary text-sm">Team Name</Label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="bg-background border-input text-text-primary focus:border-gs-900 focus:ring-0"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditDialogOpen(false)} className="text-text-secondary">
              Cancel
            </Button>
            <Button variant="signal" onClick={handleEditSave} disabled={updateTeam.isPending}>
              {updateTeam.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-signal" />
              Add Team Member
            </DialogTitle>
            <DialogDescription>
              Add an existing organization member to this team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-text-secondary text-sm">Select Member</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-full bg-bg-elevated border-border-subtle text-text-primary">
                <SelectValue placeholder="Choose a member..." />
              </SelectTrigger>
              <SelectContent>
                {orgMembersList.map((m) => {
                  const existing = (currentTeam.members || []).some(
                    (tm) => getTeamMemberUserId(tm) === m._id
                  );
                  if (existing) return null;
                  return (
                    <SelectItem key={m._id} value={m._id}>
                      {m.firstName
                        ? `${m.firstName} ${m.lastName || ""}`.trim()
                        : m.email}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddMemberDialogOpen(false)} className="text-text-secondary">
              Cancel
            </Button>
            <Button
              variant="signal"
              onClick={handleAddMember}
              disabled={addTeamMember.isPending || !selectedUserId}
            >
              {addTeamMember.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Access Dialog */}
      <Dialog open={accessDialogOpen} onOpenChange={setAccessDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-signal" />
              Configure Project Access
            </DialogTitle>
            <DialogDescription>
              Set which projects this team can access and their permission level.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[300px] overflow-y-auto">
            {accessEntries.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Select
                  value={entry.project}
                  onValueChange={(val) => updateAccessEntry(idx, "project", val)}
                >
                  <SelectTrigger className="flex-1 bg-bg-elevated border-border-subtle text-text-primary">
                    <SelectValue placeholder="Select project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p: any) => {
                      const pid = p._id ?? p.project?._id;
                      const pname = p.name ?? p.project?.name ?? "Unknown";
                      return (
                        <SelectItem key={pid} value={pid}>
                          {pname}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Select
                  value={entry.permission}
                  onValueChange={(val) =>
                    updateAccessEntry(idx, "permission", val)
                  }
                >
                  <SelectTrigger className="w-28 bg-bg-elevated border-border-subtle text-text-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERMISSION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-text-muted hover:text-status-danger shrink-0"
                  onClick={() => removeAccessEntry(idx)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={addAccessEntry}
              className="w-full border-border-subtle text-text-secondary hover:text-text-primary border-dashed"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Project
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAccessDialogOpen(false)} className="text-text-secondary">
              Cancel
            </Button>
            <Button
              variant="signal"
              onClick={handleSaveAccess}
              disabled={setProjectAccess.isPending}
            >
              {setProjectAccess.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-status-danger">
              <AlertTriangle className="w-5 h-5" />
              Delete Team
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-text-primary">{team.name}</span>?
              This will remove all team members and project access configurations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
              className="text-text-secondary"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTeam.isPending}
            >
              {deleteTeam.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function OrgTeamsPage() {
  const currentOrgId = useOrganizationStore((s) => s.currentOrgId);
  const { data: teams, isLoading } = useOrgTeams(currentOrgId || "");
  const { data: members } = useOrgMembers(currentOrgId || "");
  const createTeam = useCreateTeam();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  // Build a flat list of org member users for the "add team member" selects
  const orgMembersList = (members || []).map((m) => ({
    _id: m.user._id,
    email: m.user.email,
    firstName: m.user.firstName,
    lastName: m.user.lastName,
  }));

  const handleCreate = () => {
    if (!currentOrgId) return;
    if (!newTeamName.trim()) {
      toast.error("Team name is required");
      return;
    }
    createTeam.mutate(
      { orgId: currentOrgId, data: { name: newTeamName.trim() } },
      {
        onSuccess: () => {
          toast.success("Team created");
          setCreateDialogOpen(false);
          setNewTeamName("");
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message || err?.message || "Failed to create team"
          );
        },
      }
    );
  };

  if (!currentOrgId) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-full bg-bg-elevated flex items-center justify-center mx-auto mb-4">
            <UsersRound className="w-7 h-7 text-text-muted" />
          </div>
          <h2 className="text-lg font-display font-semibold text-text-primary mb-2">
            No Organization Selected
          </h2>
          <p className="text-sm text-text-muted">
            Select an organization to manage its teams.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="h-8 w-48 bg-bg-surface rounded animate-pulse" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-bg-surface rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-text-primary flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-signal/10 flex items-center justify-center">
              <UsersRound className="w-5 h-5 text-signal" />
            </div>
            Teams
          </h1>
          <p className="text-text-secondary mt-1 ml-[46px]">
            Organize members into teams and manage project access
          </p>
        </div>
        <Button variant="signal" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Create Team
        </Button>
      </div>

      {/* Team list */}
      {(!teams || teams.length === 0) ? (
        <Card className="bg-bg-surface border-border-subtle">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center mx-auto mb-3">
                <UsersRound className="w-6 h-6 text-text-muted" />
              </div>
              <p className="text-sm text-text-muted">
                No teams yet. Create one to start organizing your members.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <TeamCard
              key={team._id}
              team={team}
              orgId={currentOrgId}
              orgMembersList={orgMembersList}
            />
          ))}
        </div>
      )}

      {/* Create Team Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UsersRound className="w-5 h-5 text-signal" />
              Create Team
            </DialogTitle>
            <DialogDescription>
              Create a new team within your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-text-secondary text-sm">Team Name</Label>
            <Input
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="e.g. Engineering, Design, Platform"
              className="bg-background border-input text-text-primary placeholder:text-text-muted focus:border-gs-900 focus:ring-0"
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCreateDialogOpen(false)}
              className="text-text-secondary"
            >
              Cancel
            </Button>
            <Button
              variant="signal"
              onClick={handleCreate}
              disabled={createTeam.isPending}
            >
              {createTeam.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
