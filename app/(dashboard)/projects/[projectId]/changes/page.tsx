"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format, formatDistanceToNow, isSameDay } from "date-fns";
import {
  GitCommitHorizontal,
  Rocket,
  Tag,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Github,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SignalDot } from "@/components/shared/SignalDot";
import { Button } from "@/components/ui/button";
import {
  useBackfillChanges,
  useChangesFeed,
  useExplainChange,
  useRetrySummaries,
} from "@/hooks/changes.hooks";
import type {
  ChangeCommit,
  ChangeDeployment,
  ChangeFeedItem,
} from "@/services/changes.service";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Filter tabs
// ---------------------------------------------------------------------------

const TYPE_TABS = [
  { id: "all", label: "All activity" },
  { id: "commit", label: "Commits" },
  { id: "deployment", label: "Deploys" },
  { id: "release", label: "Releases" },
] as const;

type TypeTab = (typeof TYPE_TABS)[number]["id"];

// ---------------------------------------------------------------------------
// Commit card
// ---------------------------------------------------------------------------

function CommitCard({
  commit,
  projectId,
}: {
  commit: ChangeCommit;
  projectId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(
    commit.aiExplanation || null,
  );
  const explain = useExplainChange(projectId);
  const retry = useRetrySummaries(projectId);

  const headline =
    commit.aiSummary || commit.message.split("\n")[0].slice(0, 120);
  const shortSha = commit.sha.slice(0, 7);

  const handleExplain = () => {
    if (explanation) {
      setExpanded((v) => !v);
      return;
    }
    setExpanded(true);
    explain.mutate(commit.sha, {
      onSuccess: (result) => setExplanation(result.explanation),
    });
  };

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface p-4 space-y-3">
      <div className="flex items-start gap-3">
        {commit.authorAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={commit.authorAvatarUrl}
            alt={commit.authorLogin || commit.authorName}
            className="w-8 h-8 rounded-full shrink-0 mt-0.5"
          />
        ) : (
          <div className="w-8 h-8 rounded-full shrink-0 mt-0.5 bg-bg-elevated flex items-center justify-center text-xs font-semibold text-text-secondary uppercase">
            {(commit.authorLogin || commit.authorName || "?").charAt(0)}
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-text-primary font-medium leading-snug">
              {commit.aiSummary && (
                <Sparkles className="inline w-3.5 h-3.5 text-signal mr-1.5 -mt-0.5" />
              )}
              {headline}
            </p>
            <span className="shrink-0 text-xs text-text-muted font-mono">
              {formatDistanceToNow(new Date(commit.committedAt), {
                addSuffix: true,
              })}
            </span>
          </div>

          {commit.aiSummary && commit.aiTechnicalSummary && (
            <p className="text-xs text-text-muted leading-relaxed">
              {commit.aiTechnicalSummary}
            </p>
          )}

          {commit.aiSummaryStatus === "pending" && (
            <p className="text-xs text-text-muted flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              Writing summary…
            </p>
          )}

          {commit.aiSummaryStatus === "failed" && (
            <button
              onClick={() => retry.mutate([commit.sha])}
              disabled={retry.isPending}
              className="text-xs text-text-muted hover:text-signal transition-colors"
            >
              Summary failed — retry
            </button>
          )}

          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-text-muted font-mono">
            <span>{commit.authorLogin || commit.authorName}</span>
            {commit.htmlUrl ? (
              <a
                href={commit.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-signal transition-colors"
              >
                {shortSha}
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span>{shortSha}</span>
            )}
            {typeof commit.filesChanged === "number" && (
              <span>
                {commit.filesChanged} file{commit.filesChanged === 1 ? "" : "s"}
              </span>
            )}
            {(commit.additions !== undefined || commit.deletions !== undefined) && (
              <span>
                <span className="text-status-ok">+{commit.additions ?? 0}</span>{" "}
                <span className="text-status-danger">-{commit.deletions ?? 0}</span>
              </span>
            )}
            <button
              onClick={handleExplain}
              className="inline-flex items-center gap-1 text-text-secondary hover:text-signal transition-colors"
            >
              Explain this change
              {expanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="ml-11 rounded-md bg-bg-base border border-border-subtle p-3">
          {explain.isPending && !explanation ? (
            <p className="text-xs text-text-muted flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              Reading the code changes…
            </p>
          ) : (
            <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">
              {explanation || "No explanation available."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Deploy / release card
// ---------------------------------------------------------------------------

const VERDICT_STYLES: Record<
  string,
  { label: string; className: string; dot: "ok" | "warn" | "danger" | "info" }
> = {
  healthy: { label: "Healthy", className: "bg-status-ok/10 text-status-ok", dot: "ok" },
  improved: { label: "Improved", className: "bg-status-ok/10 text-status-ok", dot: "ok" },
  degraded: { label: "Degraded", className: "bg-status-danger/10 text-status-danger", dot: "danger" },
  unknown: { label: "No verdict yet", className: "bg-bg-elevated text-text-muted", dot: "info" },
};

function DeploymentCard({ deployment }: { deployment: ChangeDeployment }) {
  const isRelease = deployment.kind === "release";
  const verdict = deployment.impact?.verdict
    ? VERDICT_STYLES[deployment.impact.verdict]
    : null;
  const failed =
    deployment.status === "failure" || deployment.status === "error";

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface p-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-full shrink-0 mt-0.5 flex items-center justify-center",
            isRelease ? "bg-data-info/10 text-data-info" : "bg-signal/10 text-signal",
          )}
        >
          {isRelease ? <Tag className="w-4 h-4" /> : <Rocket className="w-4 h-4" />}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-text-primary font-medium">
              {isRelease
                ? `Release ${deployment.release || ""}`
                : `Deployed to ${deployment.environment}`}
              {failed && (
                <span className="ml-2 text-status-danger text-xs font-semibold uppercase">
                  failed
                </span>
              )}
            </p>
            <span className="shrink-0 text-xs text-text-muted font-mono">
              {formatDistanceToNow(new Date(deployment.startedAt), {
                addSuffix: true,
              })}
            </span>
          </div>

          {deployment.description && (
            <p className="text-xs text-text-muted truncate">{deployment.description}</p>
          )}

          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-text-muted font-mono">
            {deployment.release && !isRelease && <span>{deployment.release}</span>}
            {deployment.sha && <span>{deployment.sha.slice(0, 7)}</span>}
            {deployment.deployedBy && <span>{deployment.deployedBy}</span>}
            {deployment.url && (
              <a
                href={deployment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-signal transition-colors"
              >
                View
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {verdict && deployment.impact && (
            <div className="flex items-center gap-3 pt-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs",
                  verdict.className,
                )}
              >
                <SignalDot status={verdict.dot} size="sm" pulse={false} />
                {verdict.label}
              </span>
              {deployment.impact.errorRateChangePct !== null && (
                <span className="text-xs text-text-muted">
                  Error rate{" "}
                  <span
                    className={
                      deployment.impact.errorRateChangePct > 0
                        ? "text-status-danger"
                        : "text-status-ok"
                    }
                  >
                    {deployment.impact.errorRateChangePct > 0 ? "+" : ""}
                    {deployment.impact.errorRateChangePct.toFixed(1)}%
                  </span>{" "}
                  in the hour after
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ChangesPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const [typeTab, setTypeTab] = useState<TypeTab>("all");
  const [page, setPage] = useState(1);

  const feedQuery = useChangesFeed(projectId, {
    page,
    limit: 20,
    type: typeTab === "all" ? undefined : typeTab,
  });
  const backfill = useBackfillChanges(projectId);

  const items = feedQuery.data?.items ?? [];
  const meta = feedQuery.data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  // Group feed items by calendar day for the timeline
  const dayGroups = useMemo(() => {
    const groups: Array<{ day: Date; items: ChangeFeedItem[] }> = [];
    for (const item of items) {
      const date = new Date(item.date);
      const last = groups[groups.length - 1];
      if (last && isSameDay(last.day, date)) {
        last.items.push(item);
      } else {
        groups.push({ day: date, items: [item] });
      }
    }
    return groups;
  }, [items]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Changes"
        description="Every commit, deploy, and release — explained in plain English."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => backfill.mutate()}
            disabled={backfill.isPending}
          >
            <RefreshCw
              className={cn("w-4 h-4 mr-2", backfill.isPending && "animate-spin")}
            />
            Sync from GitHub
          </Button>
        }
      />

      <div className="px-4 space-y-6">
        {/* Type filter */}
        <div className="flex items-center gap-1 border-b border-border-subtle">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setTypeTab(tab.id);
                setPage(1);
              }}
              className={cn(
                "px-3 py-2 text-sm transition-colors border-b-2 -mb-px",
                typeTab === tab.id
                  ? "border-signal text-text-primary font-medium"
                  : "border-transparent text-text-muted hover:text-text-secondary",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Feed */}
        {feedQuery.isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border-subtle bg-bg-surface h-24 animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-border-subtle bg-bg-surface p-12 text-center space-y-3">
            <Github className="w-8 h-8 text-text-muted mx-auto" />
            <p className="text-sm text-text-primary font-medium">
              No changes tracked yet
            </p>
            <p className="text-sm text-text-muted max-w-md mx-auto">
              Link a GitHub repository to this project and Apperio will keep a
              running, plain-English history of everything that ships.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href={`/projects/${projectId}/settings/integrations`}>
                Connect GitHub
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {dayGroups.map((group) => (
              <div key={group.day.toISOString()} className="space-y-3">
                <div className="flex items-center gap-3">
                  <GitCommitHorizontal className="w-4 h-4 text-text-muted" />
                  <h2 className="text-xs font-body text-text-muted uppercase tracking-wider">
                    {format(group.day, "EEEE, MMMM d, yyyy")}
                  </h2>
                  <div className="flex-1 h-px bg-border-subtle" />
                </div>
                <div className="space-y-3">
                  {group.items.map((item) =>
                    item.itemType === "commit" ? (
                      <CommitCard
                        key={`c-${(item as ChangeCommit).sha}`}
                        commit={item as ChangeCommit}
                        projectId={projectId}
                      />
                    ) : (
                      <DeploymentCard
                        key={`d-${item._id}`}
                        deployment={item as ChangeDeployment}
                      />
                    ),
                  )}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-text-muted">
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
