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
import { Checkbox } from "@/components/ui/checkbox";
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
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  Loader2,
  AlertTriangle,
  Shield,
  Clock,
} from "lucide-react";
import { useApiTokens, useCreateToken, useRevokeToken } from "@/hooks/apiToken.hook";
import { toast } from "sonner";

const AVAILABLE_SCOPES = [
  { value: "read:logs", label: "Read Logs", description: "View log entries" },
  { value: "write:logs", label: "Write Logs", description: "Create log entries" },
  { value: "read:projects", label: "Read Projects", description: "View projects" },
  { value: "write:projects", label: "Write Projects", description: "Create and update projects" },
  { value: "read:alerts", label: "Read Alerts", description: "View alerts and rules" },
  { value: "write:alerts", label: "Write Alerts", description: "Manage alert rules" },
  { value: "admin", label: "Admin", description: "Full access to all resources" },
] as const;

const EXPIRY_OPTIONS = [
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "1y", label: "1 year" },
  { value: "never", label: "Never" },
] as const;

function getExpiryDate(value: string): string | null {
  const now = new Date();
  switch (value) {
    case "30d":
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    case "90d":
      return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
    case "1y":
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
    case "never":
    default:
      return null;
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

export default function TokensSettingsPage() {
  const { data: tokens, isLoading } = useApiTokens();
  const createToken = useCreateToken();
  const revokeToken = useRevokeToken();

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [expiryOption, setExpiryOption] = useState("90d");

  // One-time reveal state
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Revoke confirmation state
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [tokenToRevoke, setTokenToRevoke] = useState<{ id: string; name: string } | null>(null);

  const handleToggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope]
    );
  };

  const handleCreate = () => {
    if (!tokenName.trim()) {
      toast.error("Token name is required");
      return;
    }
    if (selectedScopes.length === 0) {
      toast.error("Select at least one scope");
      return;
    }

    createToken.mutate(
      {
        name: tokenName.trim(),
        scopes: selectedScopes,
        expiresAt: getExpiryDate(expiryOption),
      },
      {
        onSuccess: (data) => {
          setRevealedToken(data.rawToken);
          setCreateDialogOpen(false);
          // Reset form
          setTokenName("");
          setSelectedScopes([]);
          setExpiryOption("90d");
          toast.success("API token created successfully");
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to create token"
          );
        },
      }
    );
  };

  const handleCopy = async () => {
    if (!revealedToken) return;
    try {
      await navigator.clipboard.writeText(revealedToken);
      setCopied(true);
      toast.success("Token copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy token");
    }
  };

  const handleCloseReveal = () => {
    setRevealedToken(null);
    setCopied(false);
  };

  const handleRevokeClick = (id: string, name: string) => {
    setTokenToRevoke({ id, name });
    setRevokeDialogOpen(true);
  };

  const handleConfirmRevoke = () => {
    if (!tokenToRevoke) return;
    revokeToken.mutate(tokenToRevoke.id, {
      onSuccess: () => {
        toast.success(`Token "${tokenToRevoke.name}" has been revoked`);
        setRevokeDialogOpen(false);
        setTokenToRevoke(null);
      },
      onError: (err: any) => {
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to revoke token"
        );
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="h-8 w-48 bg-bg-surface rounded animate-pulse" />
        <div className="h-64 bg-bg-surface rounded animate-pulse" />
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
              <Key className="w-5 h-5 text-signal" />
            </div>
            API Tokens
          </h1>
          <p className="text-text-secondary mt-1 ml-[46px]">
            Create personal access tokens for programmatic API access
          </p>
        </div>
        <Button variant="signal" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Create Token
        </Button>
      </div>

      {/* One-time token reveal */}
      {revealedToken && (
        <Card className="bg-bg-surface border-signal/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-status-warn/10 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-status-warn" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Your new API token
                </p>
                <p className="text-xs text-status-warn mt-0.5">
                  This token will only be shown once. Copy it now and store it
                  securely.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-bg-void rounded-lg p-3 border border-border-subtle">
              <code className="flex-1 text-sm font-mono text-signal break-all select-all">
                {revealedToken}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="shrink-0 border-border-subtle text-text-secondary hover:text-text-primary"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-status-ok" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseReveal}
                className="text-text-muted hover:text-text-primary"
              >
                I have copied the token
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Token list */}
      <Card className="bg-bg-surface border-border-subtle">
        <CardHeader>
          <CardTitle className="font-display text-text-primary flex items-center gap-2">
            <Shield className="w-4 h-4 text-text-muted" />
            Active Tokens
          </CardTitle>
          <CardDescription className="text-text-muted">
            Tokens you have created for API access. Revoke any token you no
            longer need.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!tokens || tokens.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center mx-auto mb-3">
                <Key className="w-6 h-6 text-text-muted" />
              </div>
              <p className="text-sm text-text-muted">
                No API tokens yet. Create one to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tokens.map((token) => (
                <div
                  key={token._id}
                  className="flex items-center justify-between p-4 rounded-lg bg-bg-elevated border border-border-subtle hover:border-border-subtle/80 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {token.name}
                      </p>
                      <code className="text-xs font-mono text-text-muted bg-bg-void px-2 py-0.5 rounded">
                        {token.tokenPrefix}...
                      </code>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {token.scopes.map((scope) => (
                          <Badge key={scope} variant="signal" className="text-[10px] px-1.5 py-0">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Created {formatRelativeDate(token.createdAt)}
                      </span>
                      {token.lastUsedAt && (
                        <span className="text-xs text-text-muted">
                          Last used {formatRelativeDate(token.lastUsedAt)}
                        </span>
                      )}
                      {token.expiresAt && (
                        <span className="text-xs text-text-muted">
                          Expires {formatDate(token.expiresAt)}
                        </span>
                      )}
                      {!token.expiresAt && (
                        <span className="text-xs text-text-muted">
                          No expiration
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevokeClick(token._id, token.name)}
                    className="text-status-danger hover:text-status-danger hover:bg-status-danger/10 ml-4 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Token Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-signal" />
              Create API Token
            </DialogTitle>
            <DialogDescription>
              Create a personal access token for programmatic API access. The
              token will only be shown once after creation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Token Name */}
            <div className="space-y-2">
              <Label htmlFor="tokenName" className="text-text-secondary text-sm">
                Token Name
              </Label>
              <Input
                id="tokenName"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder="e.g. CI/CD Pipeline, Local Development"
                className="bg-background border-input text-text-primary placeholder:text-text-muted focus:border-gs-900 focus:ring-0"
              />
              <p className="text-xs text-text-muted">
                A descriptive name to identify this token
              </p>
            </div>

            {/* Scopes */}
            <div className="space-y-3">
              <Label className="text-text-secondary text-sm">Scopes</Label>
              <div className="grid gap-2">
                {AVAILABLE_SCOPES.map((scope) => (
                  <label
                    key={scope.value}
                    className="flex items-start gap-3 p-3 rounded-lg bg-bg-elevated border border-border-subtle hover:border-signal/30 transition-colors cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedScopes.includes(scope.value)}
                      onCheckedChange={() => handleToggleScope(scope.value)}
                      className="mt-0.5 data-[state=checked]:bg-signal data-[state=checked]:border-signal"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">
                        {scope.label}
                      </p>
                      <p className="text-xs text-text-muted">
                        {scope.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Expiration */}
            <div className="space-y-2">
              <Label className="text-text-secondary text-sm">Expiration</Label>
              <Select value={expiryOption} onValueChange={setExpiryOption}>
                <SelectTrigger className="w-full bg-bg-elevated border-border-subtle text-text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              disabled={createToken.isPending}
            >
              {createToken.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Create Token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-status-danger">
              <AlertTriangle className="w-5 h-5" />
              Revoke Token
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke{" "}
              <span className="font-semibold text-text-primary">
                {tokenToRevoke?.name}
              </span>
              ? Any applications using this token will lose access immediately.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setRevokeDialogOpen(false);
                setTokenToRevoke(null);
              }}
              className="text-text-secondary"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRevoke}
              disabled={revokeToken.isPending}
            >
              {revokeToken.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Revoke Token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
