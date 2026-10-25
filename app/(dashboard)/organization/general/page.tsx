"use client";

import { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  Save,
  Trash2,
  Loader2,
  AlertTriangle,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { useOrganization, useUpdateOrg, useDeleteOrg } from "@/hooks/organization.hooks";
import { useOrganizationStore } from "@/store/organization-store";
import { useRouter } from "next/navigation";
import type { OrgPlan } from "@/types/organization.types";

const PLAN_BADGE_VARIANT: Record<OrgPlan, "signal" | "status-ok" | "status-warn" | "level-info"> = {
  free: "level-info",
  starter: "status-ok",
  pro: "signal",
  enterprise: "status-warn",
};

export default function OrgGeneralPage() {
  const router = useRouter();
  const currentOrgId = useOrganizationStore((s) => s.currentOrgId);
  const { data: org, isLoading } = useOrganization(currentOrgId || "");
  const updateOrg = useUpdateOrg();
  const deleteOrg = useDeleteOrg();

  const [name, setName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [retentionDays, setRetentionDays] = useState(30);
  const [enforcesMfa, setEnforcesMfa] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Sync form when org data loads
  useEffect(() => {
    if (org) {
      setName(org.name || "");
      setBillingEmail(org.billingEmail || "");
      setRetentionDays(org.settings?.defaultRetentionDays ?? 30);
      setEnforcesMfa(org.settings?.enforcesMfa ?? false);
    }
  }, [org]);

  const handleSave = () => {
    if (!currentOrgId) return;
    if (!name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    updateOrg.mutate(
      {
        orgId: currentOrgId,
        data: {
          name: name.trim(),
          billingEmail: billingEmail.trim() || undefined,
          settings: {
            defaultRetentionDays: retentionDays,
            enforcesMfa,
          },
        },
      },
      {
        onSuccess: () => {
          toast.success("Organization updated successfully");
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message || err?.message || "Failed to update organization"
          );
        },
      }
    );
  };

  const handleDelete = () => {
    if (!currentOrgId || deleteConfirmText !== org?.name) return;

    deleteOrg.mutate(currentOrgId, {
      onSuccess: () => {
        toast.success("Organization deleted");
        useOrganizationStore.getState().setCurrentOrgId(null);
        setDeleteDialogOpen(false);
        router.push("/dashboard");
      },
      onError: (err: any) => {
        toast.error(
          err?.response?.data?.message || err?.message || "Failed to delete organization"
        );
      },
    });
  };

  if (!currentOrgId) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-full bg-bg-elevated flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-text-muted" />
          </div>
          <h2 className="text-lg font-display font-semibold text-text-primary mb-2">
            No Organization Selected
          </h2>
          <p className="text-sm text-text-muted max-w-md mx-auto">
            Select an organization from the sidebar switcher, or create a new one to get started.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="h-8 w-48 bg-bg-surface rounded animate-pulse" />
        <div className="h-64 bg-bg-surface rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight text-text-primary flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-signal/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-signal" />
          </div>
          General Settings
        </h1>
        <p className="text-text-secondary mt-1 ml-[46px]">
          Manage your organization profile and configuration
        </p>
      </div>

      {/* Organization Info */}
      <Card className="bg-bg-surface border-border-subtle">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-text-primary">
                Organization Profile
              </CardTitle>
              <CardDescription className="text-text-muted">
                Basic information about your organization
              </CardDescription>
            </div>
            {org?.plan && (
              <Badge variant={PLAN_BADGE_VARIANT[org.plan]} className="flex items-center gap-1.5">
                <Crown className="w-3 h-3" />
                {org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="orgName" className="text-text-secondary text-sm">
              Organization Name
            </Label>
            <Input
              id="orgName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Organization"
              className="bg-background border-input text-text-primary placeholder:text-text-muted focus:border-gs-900 focus:ring-0"
            />
          </div>

          {/* Slug (read-only) */}
          <div className="space-y-2">
            <Label className="text-text-secondary text-sm">Slug</Label>
            <Input
              value={org?.slug || ""}
              readOnly
              disabled
              className="bg-bg-void border-border-subtle text-text-muted cursor-not-allowed font-mono text-sm"
            />
            <p className="text-xs text-text-muted">
              Unique identifier for your organization. Cannot be changed.
            </p>
          </div>

          {/* Billing Email */}
          <div className="space-y-2">
            <Label htmlFor="billingEmail" className="text-text-secondary text-sm">
              Billing Email
            </Label>
            <Input
              id="billingEmail"
              type="email"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              placeholder="billing@company.com"
              className="bg-background border-input text-text-primary placeholder:text-text-muted focus:border-gs-900 focus:ring-0"
            />
            <p className="text-xs text-text-muted">
              Used for billing notifications and invoices
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="bg-bg-surface border-border-subtle">
        <CardHeader>
          <CardTitle className="font-display text-text-primary">
            Settings
          </CardTitle>
          <CardDescription className="text-text-muted">
            Organization-wide configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Default Retention Days */}
          <div className="space-y-2">
            <Label htmlFor="retentionDays" className="text-text-secondary text-sm">
              Default Retention Days
            </Label>
            <Input
              id="retentionDays"
              type="number"
              min={1}
              max={365}
              value={retentionDays}
              onChange={(e) => setRetentionDays(parseInt(e.target.value) || 30)}
              className="bg-background border-input text-text-primary focus:border-gs-900 focus:ring-0 w-32"
            />
            <p className="text-xs text-text-muted">
              How long to retain log data by default (1-365 days)
            </p>
          </div>

          {/* Enforce MFA */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-bg-elevated border border-border-subtle">
            <div>
              <p className="text-sm font-medium text-text-primary">
                Enforce Multi-Factor Authentication
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                Require all members to enable MFA for their accounts
              </p>
            </div>
            <Switch
              checked={enforcesMfa}
              onCheckedChange={setEnforcesMfa}
              className="data-[state=checked]:bg-signal"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="signal"
              onClick={handleSave}
              disabled={updateOrg.isPending}
            >
              {updateOrg.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-bg-surface border-status-danger/30">
        <CardHeader>
          <CardTitle className="font-display text-status-danger flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-text-muted">
            Irreversible actions that affect your entire organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-status-danger/5 border border-status-danger/20">
            <div>
              <p className="text-sm font-medium text-text-primary">
                Delete Organization
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                Permanently remove this organization and all associated data.
                This cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-status-danger">
              <AlertTriangle className="w-5 h-5" />
              Delete Organization
            </DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold text-text-primary">{org?.name}</span>{" "}
              and all associated teams, members, and audit logs. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="text-text-secondary text-sm">
              Type <span className="font-mono text-text-primary">{org?.name}</span> to confirm
            </Label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={org?.name || ""}
              className="bg-bg-elevated border-border-subtle text-text-primary placeholder:text-text-muted focus:border-status-danger focus:ring-status-danger/20"
            />
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteConfirmText("");
              }}
              className="text-text-secondary"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirmText !== org?.name || deleteOrg.isPending}
            >
              {deleteOrg.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete Organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
