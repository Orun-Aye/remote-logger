"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Github, Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { SignalDot } from "@/components/shared/SignalDot";
import { useGithubAppStatus } from "@/hooks/changes.hooks";
import { useGithubConnection } from "@/hooks/integrations.hooks";
import { integrationsService } from "@/services/integrations.service";
import type { GithubAppInstallation } from "@/services/changes.service";

type ConnectionKind = "app" | "app-elsewhere" | "token" | "none" | "disabled";

interface StatusCopy {
  dot: "ok" | "warn" | "danger" | "info";
  label: string;
  detail: string;
}

/**
 * Access to a repo comes from one of two places, in this order: a GitHub App
 * installation covering it, or the personal OAuth token of whoever linked it.
 * This card makes that precedence visible instead of leaving the user to guess
 * why commits do or do not show up.
 */
export function GithubAppCard({
  projectId,
  linkedRepo,
}: {
  projectId: string;
  linkedRepo?: { owner: string; repo: string; branch?: string } | null;
}) {
  const search = useSearchParams();
  const router = useRouter();

  const qc = useQueryClient();
  const {
    data: appStatus,
    isLoading,
    isFetching,
  } = useGithubAppStatus(linkedRepo?.owner, linkedRepo?.repo);
  const { data: ghConnection } = useGithubConnection();

  // The repo-link card below reads app-status under a different key (no
  // owner/repo), so refresh the whole prefix rather than just this query.
  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["integrations", "github", "app-status"] });
  }, [qc]);

  // GitHub bounces the browser back here via the App Setup URL with a result
  // code. Surface it, refetch, then scrub the query so a re-render is quiet.
  useEffect(() => {
    const flag = search.get("github_app");
    if (!flag) return;

    if (flag === "installed") {
      toast.success("GitHub App installed");
      refresh();
    } else if (flag === "pending") {
      toast.success(
        "GitHub App installed. Repository access is still syncing.",
      );
      refresh();
    } else if (flag === "requested") {
      toast.info(
        "Install requested. An organization owner needs to approve it.",
      );
    } else if (flag === "error") {
      toast.error("GitHub App installation did not complete");
    }

    router.replace(`/projects/${projectId}/settings/integrations`);
  }, [search, refresh, router, projectId]);

  const installations = appStatus?.installations ?? [];

  const kind: ConnectionKind = useMemo(() => {
    if (!appStatus?.enabled) return "disabled";
    if (appStatus.coversRepo) return "app";
    if (installations.length > 0) return "app-elsewhere";
    if (ghConnection?.connected) return "token";
    return "none";
  }, [appStatus, installations.length, ghConnection?.connected]);

  const status: StatusCopy = useMemo(() => {
    switch (kind) {
      case "app":
        return {
          dot: "ok",
          label: "Connected via GitHub App",
          detail: linkedRepo
            ? `An installation covers ${linkedRepo.owner}/${linkedRepo.repo}. Commits, deployments and issues use installation tokens, so they keep working when personal tokens are revoked.`
            : "The App is installed. Link a repository below to start the change feed.",
        };
      case "app-elsewhere":
        return {
          dot: "warn",
          label: "App installed, repo not covered",
          detail: linkedRepo
            ? `The App is installed, but no installation grants access to ${linkedRepo.owner}/${linkedRepo.repo}. Add that repo to an installation on GitHub.`
            : "The App is installed. Link a repository below to start the change feed.",
        };
      case "token":
        return {
          dot: "info",
          label: `Connected via personal token${
            ghConnection?.githubLogin ? ` (${ghConnection.githubLogin})` : ""
          }`,
          detail:
            "Falling back to your personal GitHub account. Installing the App gives the project its own access that survives you rotating tokens or leaving the org.",
        };
      case "disabled":
        return {
          dot: "warn",
          label: "GitHub App not configured",
          detail:
            "The App is not set up on this Apperio instance yet. Personal GitHub tokens still work for linking repositories.",
        };
      default:
        return {
          dot: "danger",
          label: "Not connected",
          detail:
            "Install the GitHub App to pull in commits, deployments and releases, and to open issues from error groups.",
        };
    }
  }, [kind, linkedRepo, ghConnection?.githubLogin]);

  const handleInstall = () => {
    const returnTo = `${window.location.origin}/projects/${projectId}/settings/integrations`;
    window.location.href = integrationsService.getAppInstallUrl(returnTo);
  };

  return (
    <Card className="bg-bg-surface border-border-subtle">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-signal/10 flex items-center justify-center text-signal">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium text-text-primary">
                GitHub App
              </CardTitle>
              <CardDescription className="text-xs text-text-muted mt-0.5">
                Org-wide, repo-scoped access for change tracking and issue
                creation.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-text-muted" />
            ) : (
              <SignalDot
                status={status.dot}
                size="sm"
                pulse={status.dot === "ok"}
              />
            )}
            <span className="text-xs text-text-muted">{status.label}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-text-secondary">{status.detail}</p>

        {installations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">
                Covered repositories
              </span>
              <button
                type="button"
                onClick={refresh}
                disabled={isFetching}
                className="flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-text-primary disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
            <div className="divide-y divide-border-faint rounded-md border border-border-subtle">
              {installations.map((installation) => (
                <InstallationRow
                  key={installation.installationId}
                  installation={installation}
                  linkedRepo={linkedRepo}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {appStatus?.enabled && (
            <Button variant="signal" size="sm" onClick={handleInstall}>
              <Github className="mr-1.5 h-3.5 w-3.5" />
              {installations.length > 0
                ? "Manage installation"
                : "Install GitHub App"}
            </Button>
          )}
          {!ghConnection?.connected && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-border-subtle"
            >
              <a href="/settings/integrations">Use a personal token instead</a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InstallationRow({
  installation,
  linkedRepo,
}: {
  installation: GithubAppInstallation;
  linkedRepo?: { owner: string; repo: string } | null;
}) {
  const linkedFullName = linkedRepo
    ? `${linkedRepo.owner}/${linkedRepo.repo}`
    : null;
  const coversAll = installation.repositorySelection === "all";

  return (
    <div className="space-y-2 px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <SignalDot
            status={installation.suspended ? "danger" : "ok"}
            size="sm"
            pulse={false}
          />
          <span className="truncate font-mono text-sm text-text-primary">
            {installation.accountLogin}
          </span>
          <span className="shrink-0 text-xs text-text-muted">
            {installation.accountType === "Organization" ? "org" : "user"}
            {installation.suspended && " · suspended"}
          </span>
        </div>
        <a
          href={installation.manageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1 text-xs text-signal hover:underline"
        >
          Manage
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {coversAll ? (
        <p className="text-xs text-text-muted">
          All repositories on{" "}
          <span className="font-mono">{installation.accountLogin}</span>
        </p>
      ) : installation.repositories.length === 0 ? (
        <p className="text-xs text-text-muted">
          No repositories selected yet. Add some from the Manage link.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {installation.repositories.map((fullName) => (
            <span
              key={fullName}
              className={`rounded px-1.5 py-0.5 font-mono text-xs ${
                fullName === linkedFullName
                  ? "bg-signal/10 text-signal"
                  : "bg-bg-elevated text-text-secondary"
              }`}
            >
              {fullName}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
