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
  Users,
  UserPlus,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  Eye,
  Crown,
  Loader2,
  AlertTriangle,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import {
  useOrgMembers,
  useInviteMember,
  useRemoveMember,
  useUpdateMemberRole,
} from "@/hooks/organization.hooks";
import { useOrganizationStore } from "@/store/organization-store";
import type { OrgRole, OrgMember } from "@/types/organization.types";

const ROLE_OPTIONS: { value: OrgRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

const ROLE_CONFIG: Record<OrgRole, { icon: typeof Crown; label: string; variant: "signal" | "status-ok" | "status-warn" | "level-info" }> = {
  owner: { icon: Crown, label: "Owner", variant: "signal" },
  admin: { icon: ShieldCheck, label: "Admin", variant: "status-ok" },
  member: { icon: Shield, label: "Member", variant: "level-info" },
  viewer: { icon: Eye, label: "Viewer", variant: "status-warn" },
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getMemberName(member: OrgMember): string {
  const user = member.user;
  if (user.firstName || user.lastName) {
    return `${user.firstName || ""} ${user.lastName || ""}`.trim();
  }
  return user.email;
}

function getMemberInitials(member: OrgMember): string {
  const user = member.user;
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  return user.email[0].toUpperCase();
}

export default function OrgMembersPage() {
  const currentOrgId = useOrganizationStore((s) => s.currentOrgId);
  const { data: members, isLoading } = useOrgMembers(currentOrgId || "");
  const inviteMember = useInviteMember();
  const removeMember = useRemoveMember();
  const updateRole = useUpdateMemberRole();

  // Invite dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgRole>("member");

  // Remove confirmation dialog
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<OrgMember | null>(null);

  const handleInvite = () => {
    if (!currentOrgId) return;
    if (!inviteEmail.trim()) {
      toast.error("Email is required");
      return;
    }

    inviteMember.mutate(
      {
        orgId: currentOrgId,
        data: { email: inviteEmail.trim(), role: inviteRole },
      },
      {
        onSuccess: () => {
          toast.success(`Invitation sent to ${inviteEmail}`);
          setInviteDialogOpen(false);
          setInviteEmail("");
          setInviteRole("member");
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message || err?.message || "Failed to invite member"
          );
        },
      }
    );
  };

  const handleRemove = () => {
    if (!currentOrgId || !memberToRemove) return;

    removeMember.mutate(
      { orgId: currentOrgId, userId: memberToRemove.user._id },
      {
        onSuccess: () => {
          toast.success(`${getMemberName(memberToRemove)} has been removed`);
          setRemoveDialogOpen(false);
          setMemberToRemove(null);
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message || err?.message || "Failed to remove member"
          );
        },
      }
    );
  };

  const handleRoleChange = (userId: string, newRole: OrgRole) => {
    if (!currentOrgId) return;

    updateRole.mutate(
      { orgId: currentOrgId, userId, role: newRole },
      {
        onSuccess: () => {
          toast.success("Member role updated");
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message || err?.message || "Failed to update role"
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
            <Users className="w-7 h-7 text-text-muted" />
          </div>
          <h2 className="text-lg font-display font-semibold text-text-primary mb-2">
            No Organization Selected
          </h2>
          <p className="text-sm text-text-muted">
            Select an organization to manage its members.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="h-8 w-48 bg-bg-surface rounded animate-pulse" />
        <div className="h-64 bg-bg-surface rounded animate-pulse" />
      </div>
    );
  }

  // Separate joined and pending members
  const joinedMembers = (members || []).filter((m) => m.joinedAt);
  const pendingMembers = (members || []).filter((m) => !m.joinedAt);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-text-primary flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-signal/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-signal" />
            </div>
            Members
          </h1>
          <p className="text-text-secondary mt-1 ml-[46px]">
            Manage your organization members and their roles
          </p>
        </div>
        <Button variant="signal" onClick={() => setInviteDialogOpen(true)}>
          <UserPlus className="w-4 h-4" />
          Invite Member
        </Button>
      </div>

      {/* Active Members */}
      <Card className="bg-bg-surface border-border-subtle">
        <CardHeader>
          <CardTitle className="font-display text-text-primary flex items-center gap-2">
            <Users className="w-4 h-4 text-text-muted" />
            Active Members
            <Badge variant="secondary" className="ml-1">
              {joinedMembers.length}
            </Badge>
          </CardTitle>
          <CardDescription className="text-text-muted">
            Members who have joined your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {joinedMembers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-text-muted">No active members yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {joinedMembers.map((member) => {
                const roleConfig = ROLE_CONFIG[member.role];
                const RoleIcon = roleConfig.icon;
                const isOwner = member.role === "owner";

                return (
                  <div
                    key={member.user._id}
                    className="flex items-center justify-between p-4 rounded-lg bg-bg-elevated border border-border-subtle hover:border-border-subtle/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-bg-surface flex items-center justify-center text-sm font-medium text-text-muted border border-border-subtle shrink-0">
                        {getMemberInitials(member)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {getMemberName(member)}
                        </p>
                        <p className="text-xs text-text-muted truncate">
                          {member.user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-text-muted hidden sm:block">
                        Joined {formatDate(member.joinedAt)}
                      </span>
                      <Badge variant={roleConfig.variant} className="flex items-center gap-1">
                        <RoleIcon className="w-3 h-3" />
                        {roleConfig.label}
                      </Badge>

                      {!isOwner && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-text-muted hover:text-text-primary"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {ROLE_OPTIONS.filter((r) => r.value !== member.role).map(
                              (roleOpt) => (
                                <DropdownMenuItem
                                  key={roleOpt.value}
                                  onClick={() =>
                                    handleRoleChange(member.user._id, roleOpt.value)
                                  }
                                >
                                  Change to {roleOpt.label}
                                </DropdownMenuItem>
                              )
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => {
                                setMemberToRemove(member);
                                setRemoveDialogOpen(true);
                              }}
                            >
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {pendingMembers.length > 0 && (
        <Card className="bg-bg-surface border-border-subtle">
          <CardHeader>
            <CardTitle className="font-display text-text-primary flex items-center gap-2">
              <Mail className="w-4 h-4 text-text-muted" />
              Pending Invites
              <Badge variant="status-warn" className="ml-1">
                {pendingMembers.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-text-muted">
              Invitations that have not yet been accepted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingMembers.map((member) => {
                const roleConfig = ROLE_CONFIG[member.role];

                return (
                  <div
                    key={member.user._id}
                    className="flex items-center justify-between p-4 rounded-lg bg-bg-elevated border border-border-subtle/50 opacity-75"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-bg-surface flex items-center justify-center text-sm font-medium text-text-muted border border-border-subtle border-dashed shrink-0">
                        ?
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-text-secondary truncate">
                          {member.user.email}
                        </p>
                        <p className="text-xs text-text-muted">
                          Invited {formatDate(member.invitedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={roleConfig.variant} className="flex items-center gap-1">
                        {roleConfig.label}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
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
                            variant="destructive"
                            onClick={() => {
                              setMemberToRemove(member);
                              setRemoveDialogOpen(true);
                            }}
                          >
                            Revoke Invite
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Member Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-signal" />
              Invite Member
            </DialogTitle>
            <DialogDescription>
              Send an invitation to join your organization. They will receive an
              email notification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail" className="text-text-secondary text-sm">
                Email Address
              </Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="bg-background border-input text-text-primary placeholder:text-text-muted focus:border-gs-900 focus:ring-0"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-text-secondary text-sm">Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(val) => setInviteRole(val as OrgRole)}
              >
                <SelectTrigger className="w-full bg-bg-elevated border-border-subtle text-text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-text-muted">
                {inviteRole === "admin" && "Admins can manage members and settings."}
                {inviteRole === "member" && "Members can view and contribute to projects."}
                {inviteRole === "viewer" && "Viewers have read-only access."}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setInviteDialogOpen(false)}
              className="text-text-secondary"
            >
              Cancel
            </Button>
            <Button
              variant="signal"
              onClick={handleInvite}
              disabled={inviteMember.isPending}
            >
              {inviteMember.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-status-danger">
              <AlertTriangle className="w-5 h-5" />
              Remove Member
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-text-primary">
                {memberToRemove ? getMemberName(memberToRemove) : ""}
              </span>{" "}
              from the organization? They will lose access immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setRemoveDialogOpen(false);
                setMemberToRemove(null);
              }}
              className="text-text-secondary"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={removeMember.isPending}
            >
              {removeMember.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
