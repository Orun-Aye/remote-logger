"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  useGithubConnection,
  useDisconnectGithub,
} from "@/hooks/integrations.hooks";
import { integrationsService } from "@/services/integrations.service";

export default function UserIntegrationsPage() {
  const search = useSearchParams();
  const router = useRouter();
  const { data: status, isLoading, refetch } = useGithubConnection();
  const disconnect = useDisconnectGithub();

  // Show toast on OAuth round-trip success/failure
  useEffect(() => {
    const flag = search.get("github");
    if (!flag) return;
    if (flag === "connected") {
      toast.success("GitHub connected");
      refetch();
    } else if (flag === "error") {
      toast.error(search.get("message") || "GitHub connection failed");
    }
    // Clean the query string so the toast doesn't fire again on re-render
    router.replace("/settings/integrations");
  }, [search, refetch, router]);

  const handleConnect = () => {
    const url = integrationsService.getConnectUrl(
      `${window.location.origin}/settings/integrations?github=connected`,
    );
    window.location.href = url;
  };

  const handleDisconnect = async () => {
    try {
      await disconnect.mutateAsync();
      toast.success("GitHub disconnected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Integrations
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Connect your developer tools to enrich your dashboards.
        </p>
      </div>

      <Card className="bg-bg-surface border-border-subtle">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-text-primary">
                GitHub
              </CardTitle>
              <CardDescription className="mt-1 text-text-secondary">
                Connect a GitHub account so projects can show recent commits as
                deploy events on the Recent Events timeline.
              </CardDescription>
            </div>
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {status?.connected ? (
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-text-primary">
                  <span className="h-2 w-2 rounded-full bg-signal" />
                  Connected as{" "}
                  <span className="font-mono">{status.githubLogin}</span>
                </div>
                {status.connectedAt && (
                  <div className="text-xs text-text-muted font-mono">
                    Linked {format(new Date(status.connectedAt), "MMM d, yyyy")}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnect.isPending}
                className="border-border-subtle"
              >
                {disconnect.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Disconnect"
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-text-secondary">
                Not connected. We&apos;ll request{" "}
                <span className="font-mono text-xs">repo</span> scope so we can
                read commits from repositories you select per-project.
              </div>
              <Button variant="signal" size="sm" onClick={handleConnect}>
                Connect GitHub
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
