"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { IntegrationIcon } from "@/components/integrations/IntegrationIcon";
import { IntegrationSetupWizard } from "@/components/integrations/IntegrationSetupWizard";
import {
  fallbackMarketplaceItems,
  buildMarketplaceItems,
  getFieldsForType,
} from "@/components/integrations/integration-data";
import {
  useAvailableIntegrations,
  useConnectedIntegrations,
  useDisconnectIntegration,
  useTestIntegration,
} from "@/hooks/integration.hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SignalDot } from "@/components/shared/SignalDot";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import type {
  IntegrationTypeSlug,
  IntegrationMarketplaceItem,
  Integration,
} from "@/types/integration.types";
import { toast } from "sonner";
import {
  ArrowLeft,
  Zap,
  Trash2,
  Loader2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function IntegrationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as IntegrationTypeSlug;

  const { data: availableTypes } = useAvailableIntegrations();
  const { data: connectedIntegrations } = useConnectedIntegrations();
  const disconnectMutation = useDisconnectIntegration();
  const testMutation = useTestIntegration();

  const [showWizard, setShowWizard] = useState(false);

  // Build marketplace item for this slug
  const item: IntegrationMarketplaceItem | undefined = useMemo(() => {
    if (availableTypes && availableTypes.length > 0) {
      const items = buildMarketplaceItems(availableTypes);
      return items.find((i) => i.slug === slug);
    }
    return fallbackMarketplaceItems.find((i) => i.slug === slug);
  }, [availableTypes, slug]);

  // Find connected integration for this type
  const connectedIntegration: Integration | undefined = useMemo(() => {
    if (!connectedIntegrations) return undefined;
    return connectedIntegrations.find(
      (i) => i.type === slug && i.status === "connected"
    ) || connectedIntegrations.find((i) => i.type === slug);
  }, [connectedIntegrations, slug]);

  const isConnected = connectedIntegration?.status === "connected";
  const isError = connectedIntegration?.status === "error";

  const handleDisconnect = async () => {
    if (!connectedIntegration?._id) return;

    if (
      !window.confirm(
        `Are you sure you want to disconnect ${item?.displayName || slug}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await disconnectMutation.mutateAsync(connectedIntegration._id);
      toast.success(`${item?.displayName || slug} disconnected`);
      setShowWizard(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to disconnect");
    }
  };

  const handleTest = async () => {
    if (!connectedIntegration?._id) return;
    try {
      const result = await testMutation.mutateAsync(connectedIntegration._id);
      if (result?.success) {
        toast.success("Connection test passed");
      } else {
        toast.error(`Test failed: ${result?.message || "Unknown error"}`);
      }
    } catch (error: any) {
      toast.error(error?.message || "Connection test failed");
    }
  };

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center p-6">
        <p className="text-text-secondary font-medium text-lg">
          Integration not found
        </p>
        <p className="text-text-muted text-sm mt-2">
          The integration type &quot;{slug}&quot; does not exist.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/integrations">
            <ArrowLeft className="w-4 h-4" />
            Back to Integrations
          </Link>
        </Button>
      </div>
    );
  }

  const fields = getFieldsForType(slug);

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Back link */}
      <Button asChild variant="ghost" size="sm" className="w-fit -mb-2">
        <Link href="/integrations">
          <ArrowLeft className="w-4 h-4" />
          All Integrations
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-bg-elevated border border-border-subtle">
          <IntegrationIcon
            iconName={item.iconName}
            size="lg"
            className="text-text-secondary"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-text-primary tracking-tight">
              {item.displayName}
            </h1>
            {isConnected && <Badge variant="status-ok">Connected</Badge>}
            {isError && <Badge variant="status-danger">Error</Badge>}
            {!connectedIntegration && (
              <Badge variant="outline">Not connected</Badge>
            )}
          </div>
          <p className="text-sm text-text-secondary mt-1">
            {item.description}
          </p>
        </div>
      </div>

      {/* Connected State: Show status + actions */}
      {connectedIntegration && !showWizard && (
        <div className="space-y-4">
          {/* Status Card */}
          <Card className="hover:translate-y-0 hover:bg-card">
            <CardHeader>
              <CardTitle className="text-base font-display">
                Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <SignalDot
                  status={isConnected ? "ok" : isError ? "danger" : "info"}
                  size="md"
                  pulse={isConnected}
                />
                <span
                  className={cn(
                    "text-sm font-medium capitalize",
                    isConnected
                      ? "text-status-ok"
                      : isError
                        ? "text-status-danger"
                        : "text-text-muted"
                  )}
                >
                  {connectedIntegration.status}
                </span>
              </div>

              {connectedIntegration.metadata?.lastSyncAt && (
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Clock className="w-3.5 h-3.5" />
                  Last synced:{" "}
                  {new Date(
                    connectedIntegration.metadata.lastSyncAt
                  ).toLocaleString()}
                </div>
              )}

              {/* Sync Errors */}
              {connectedIntegration.metadata?.syncErrors &&
                connectedIntegration.metadata.syncErrors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-status-danger flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Recent Errors
                    </p>
                    {connectedIntegration.metadata.syncErrors
                      .slice(-3)
                      .map((err, idx) => (
                        <p
                          key={idx}
                          className="text-xs text-text-muted bg-bg-elevated rounded px-2 py-1"
                        >
                          {err}
                        </p>
                      ))}
                  </div>
                )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTest}
                  disabled={testMutation.isPending}
                >
                  {testMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Test Connection
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowWizard(true)}
                >
                  Reconfigure
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Supported Actions */}
          <Card className="hover:translate-y-0 hover:bg-card">
            <CardHeader>
              <CardTitle className="text-base font-display">
                Supported Actions
              </CardTitle>
              <CardDescription>
                Actions this integration can perform when triggered.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {item.supportedActions.map((action) => (
                  <Badge key={action} variant="secondary" className="font-mono text-xs">
                    {action}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-status-danger/20 hover:translate-y-0 hover:bg-card">
            <CardHeader>
              <CardTitle className="text-base font-display text-status-danger">
                Danger Zone
              </CardTitle>
              <CardDescription>
                Disconnecting this integration will remove all stored
                credentials and stop automated actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
              >
                {disconnectMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Disconnect {item.displayName}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Setup Wizard: shown when not connected OR when reconfiguring */}
      {(!connectedIntegration || showWizard) && (
        <div>
          {showWizard && connectedIntegration && (
            <div className="mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWizard(false)}
              >
                <ArrowLeft className="w-4 h-4" />
                Cancel Reconfiguration
              </Button>
            </div>
          )}
          <IntegrationSetupWizard
            type={slug}
            displayName={item.displayName}
            fields={fields}
            existingIntegration={
              showWizard ? connectedIntegration : null
            }
            onComplete={() => {
              setShowWizard(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
