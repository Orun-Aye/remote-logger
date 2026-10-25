"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2,
  ChevronDown,
  Plus,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useOrganizations, useCreateOrg } from "@/hooks/organization.hooks";
import { useOrganizationStore } from "@/store/organization-store";
import type { Organization } from "@/types/organization.types";

export function OrgSwitcher() {
  const { data: orgs, isLoading } = useOrganizations();
  const createOrg = useCreateOrg();
  const currentOrgId = useOrganizationStore((s) => s.currentOrgId);
  const setCurrentOrgId = useOrganizationStore((s) => s.setCurrentOrgId);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newBillingEmail, setNewBillingEmail] = useState("");

  const currentOrg = (orgs || []).find((o: Organization) => o._id === currentOrgId);

  const handleSwitch = (orgId: string) => {
    setCurrentOrgId(orgId);
  };

  const handleCreate = () => {
    if (!newOrgName.trim()) {
      toast.error("Organization name is required");
      return;
    }
    createOrg.mutate(
      {
        name: newOrgName.trim(),
        billingEmail: newBillingEmail.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          if (data) {
            setCurrentOrgId(data._id);
          }
          toast.success("Organization created");
          setCreateDialogOpen(false);
          setNewOrgName("");
          setNewBillingEmail("");
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to create organization"
          );
        },
      }
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 w-full px-3 py-1.5 rounded-sm hover:bg-gs-50 transition-colors text-left">
            <span className="text-sm text-text-primary truncate flex-1 font-medium">
              {isLoading
                ? "Loading..."
                : currentOrg
                ? currentOrg.name
                : "Select Organization"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          {(orgs || []).length === 0 && !isLoading ? (
            <div className="px-3 py-2 text-xs text-text-muted">
              No organizations yet.
            </div>
          ) : (
            (orgs || []).map((org: Organization) => (
              <DropdownMenuItem
                key={org._id}
                onClick={() => handleSwitch(org._id)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span className="truncate">{org.name}</span>
                </div>
                {org._id === currentOrgId && (
                  <Check className="w-3.5 h-3.5 text-signal shrink-0" />
                )}
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            Create Organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Organization Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-signal" />
              Create Organization
            </DialogTitle>
            <DialogDescription>
              Create a new organization to collaborate with your team.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="orgCreateName" className="text-text-secondary text-sm">
                Organization Name
              </Label>
              <Input
                id="orgCreateName"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="My Company"
                className="bg-background border-input text-text-primary placeholder:text-text-muted focus:border-gs-900 focus:ring-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgCreateEmail" className="text-text-secondary text-sm">
                Billing Email (optional)
              </Label>
              <Input
                id="orgCreateEmail"
                type="email"
                value={newBillingEmail}
                onChange={(e) => setNewBillingEmail(e.target.value)}
                placeholder="billing@company.com"
                className="bg-background border-input text-text-primary placeholder:text-text-muted focus:border-gs-900 focus:ring-0"
              />
            </div>
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
              disabled={createOrg.isPending}
            >
              {createOrg.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
