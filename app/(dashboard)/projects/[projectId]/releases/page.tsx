"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  Rocket,
  Tag,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  HeartPulse,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SignalDot } from "@/components/shared/SignalDot";
import {
  ChangePct,
  DeployStateBadge,
  deployState,
  verdictDueAt,
} from "@/components/changes/deploy-state";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDeployments, useReleaseHealth } from "@/hooks/changes.hooks";
import type {
  ChangeDeployment,
  DeploymentImpact,
  DeploymentImpactWindow,
} from "@/services/changes.service";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

const KIND_TABS = [
  { id: "all", label: "Everything" },
  { id: "deployment", label: "Deploys" },
  { id: "release", label: "Releases" },
] as const;

type KindTab = (typeof KIND_TABS)[number]["id"];

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const pct = (rate: number) => `${(rate * 100).toFixed(rate > 0 && rate < 0.001 ? 3 : 2)}%`;
const ms = (value: number | null) => (value === null ? "n/a" : `${value} ms`);

// ---------------------------------------------------------------------------
// Before / after comparison
// ---------------------------------------------------------------------------

function ImpactComparison({ impact }: { impact: DeploymentImpact }) {
  const rows: Array<{
    label: string;
    value: (w: DeploymentImpactWindow) => string;
  }> = [
    { label: "Error rate", value: (w) => pct(w.errorRate) },
    { label: "Errors", value: (w) => w.errorCount.toLocaleString() },
    { label: "Logs", value: (w) => w.logCount.toLocaleString() },
    { label: "Avg response", value: (w) => ms(w.avgResponseTime) },
  ];

  return (
    <div className="rounded-md border border-border-subtle bg-bg-base overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-text-muted border-b border-border-subtle">
            <th className="text-left font-normal px-3 py-2" />
            <th className="text-right font-normal px-3 py-2">
              {impact.windowMinutes} min before
            </th>
            <th className="text-right font-normal px-3 py-2">
              {impact.windowMinutes} min after
            </th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-border-subtle last:border-0">
              <td className="px-3 py-2 font-body text-text-secondary">{row.label}</td>
              <td className="px-3 py-2 text-right text-text-secondary">
                {row.value(impact.before)}
              </td>
              <td className="px-3 py-2 text-right text-text-primary">
                {row.value(impact.after)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-3 py-2 text-[11px] text-text-muted border-t border-border-subtle">
        Measured {formatDistanceToNow(new Date(impact.computedAt), { addSuffix: true })}.
        {impact.verdict === "unknown" &&
          " Both windows need at least 10 logs for a confident verdict."}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Deployment row
// ---------------------------------------------------------------------------

function DeploymentRow({
  deployment,
  onOpenRelease,
}: {
  deployment: ChangeDeployment;
  onOpenRelease: (release: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isRelease = deployment.kind === "release";
  const state = deployState(deployment);
  const impact = deployment.impact;

  return (
    <div
      className={cn(
        "rounded-lg border bg-bg-surface p-4 space-y-3",
        state === "degraded" ? "border-status-danger/40" : "border-border-subtle",
      )}
    >
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
            <div className="min-w-0 flex items-center flex-wrap gap-2">
              <p className="text-sm text-text-primary font-medium">
                {isRelease
                  ? `Release ${deployment.release || ""}`
                  : deployment.release
                    ? `${deployment.release} to ${deployment.environment}`
                    : `Deployed to ${deployment.environment}`}
              </p>
              <DeployStateBadge state={state} />
            </div>
            <span
              className="shrink-0 text-xs text-text-muted font-mono"
              title={format(new Date(deployment.startedAt), "PPpp")}
            >
              {formatDistanceToNow(new Date(deployment.startedAt), { addSuffix: true })}
            </span>
          </div>

          {deployment.description && (
            <p className="text-xs text-text-muted truncate">{deployment.description}</p>
          )}

          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-text-muted font-mono">
            {isRelease && <span>{deployment.environment}</span>}
            {deployment.sha && <span>{deployment.sha.slice(0, 7)}</span>}
            {deployment.deployedBy && <span>{deployment.deployedBy}</span>}
            <span>{deployment.provider === "github" ? "GitHub" : "API"}</span>
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

          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 pt-2">
            {impact && (
              <span className="text-xs text-text-muted">
                Error rate <ChangePct value={impact.errorRateChangePct} />
                {impact.responseTimeChangePct !== null && (
                  <>
                    {", "}response time <ChangePct value={impact.responseTimeChangePct} />
                  </>
                )}{" "}
                in the hour after
              </span>
            )}
            {state === "measuring" && (
              <span className="text-xs text-text-muted">
                Verdict available{" "}
                {formatDistanceToNow(verdictDueAt(deployment), { addSuffix: true })}
              </span>
            )}

            <div className="flex items-center gap-3 ml-auto">
              {impact && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-signal transition-colors"
                >
                  {expanded ? "Hide details" : "Before and after"}
                  {expanded ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              )}
              {deployment.release && (
                <button
                  onClick={() => onOpenRelease(deployment.release!)}
                  className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-signal transition-colors"
                >
                  <HeartPulse className="w-3 h-3" />
                  Release health
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {expanded && impact && (
        <div className="pl-11">
          <ImpactComparison impact={impact} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Release health panel
// ---------------------------------------------------------------------------

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "danger" | "ok";
}) {
  return (
    <div className="rounded-md border border-border-subtle bg-bg-base p-3">
      <p className="text-[11px] uppercase tracking-wider text-text-muted">{label}</p>
      <p
        className={cn(
          "text-lg font-mono mt-1",
          tone === "danger"
            ? "text-status-danger"
            : tone === "ok"
              ? "text-status-ok"
              : "text-text-primary",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ReleaseHealthPanel({
  projectId,
  release,
  onClose,
}: {
  projectId: string;
  release: string | null;
  onClose: () => void;
}) {
  const healthQuery = useReleaseHealth(projectId, release ?? undefined);
  const health = healthQuery.data;

  return (
    <Sheet open={!!release} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-bg-surface overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display flex items-center gap-2">
            <Tag className="w-4 h-4 text-data-info" />
            {release}
          </SheetTitle>
          <SheetDescription>
            Everything logged with this release tag, across all deploys.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-6">
          {healthQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-text-muted py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading release health
            </div>
          ) : !health ? (
            <p className="text-sm text-text-muted py-8 text-center">
              Could not load health for this release.
            </p>
          ) : health.logCount === 0 ? (
            <div className="rounded-md border border-border-subtle bg-bg-base p-4 space-y-2">
              <p className="text-sm text-text-primary font-medium">
                No logs carry this release yet
              </p>
              <p className="text-xs text-text-muted leading-relaxed">
                Release health is built from logs tagged with a matching{" "}
                <code className="font-mono text-text-secondary">release</code> value. Set it in
                your SDK config so every event is attributed to the version that sent it.
              </p>
              <Link
                href={`/projects/${projectId}/settings/sdk-config`}
                className="inline-block text-xs text-signal hover:underline"
              >
                SDK configuration
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Stat
                  label="Error rate"
                  value={pct(health.errorRate)}
                  tone={health.errorRate > 0.05 ? "danger" : "ok"}
                />
                <Stat label="Errors" value={health.errorCount.toLocaleString()} />
                <Stat label="Logs" value={health.logCount.toLocaleString()} />
                <Stat label="Sessions" value={health.sessionCount.toLocaleString()} />
              </div>

              <div className="rounded-md border border-border-subtle bg-bg-base p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-text-primary">
                    {health.newErrorGroups === 0
                      ? "No new issues"
                      : `${health.newErrorGroups} new issue${health.newErrorGroups === 1 ? "" : "s"}`}
                  </p>
                  <p className="text-xs text-text-muted">First seen in this release</p>
                </div>
                {health.newErrorGroups > 0 && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/projects/${projectId}/issues`}>View issues</Link>
                  </Button>
                )}
              </div>
            </>
          )}

          {health && health.deployments.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs uppercase tracking-wider text-text-muted">
                Rollouts
              </h3>
              <ul className="space-y-1.5">
                {health.deployments.map((d, i) => (
                  <li
                    key={`${d.startedAt}-${i}`}
                    className="flex items-center justify-between gap-3 text-xs font-mono"
                  >
                    <span className="text-text-secondary">{d.environment}</span>
                    <span
                      className={cn(
                        d.status === "failure" || d.status === "error"
                          ? "text-status-danger"
                          : "text-text-muted",
                      )}
                    >
                      {d.status}
                    </span>
                    <span className="text-text-muted">
                      {format(new Date(d.startedAt), "MMM d, HH:mm")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReleasesPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [kindTab, setKindTab] = useState<KindTab>("all");
  const [page, setPage] = useState(1);
  const [selectedRelease, setSelectedRelease] = useState<string | null>(
    searchParams.get("release"),
  );

  const deploymentsQuery = useDeployments(projectId, {
    page,
    limit: 20,
    kind: kindTab === "all" ? undefined : kindTab,
  });

  const items = deploymentsQuery.data?.items ?? [];
  const meta = deploymentsQuery.data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  const counts = items.reduce(
    (acc, dep) => {
      const verdict = dep.impact?.verdict;
      if (verdict === "healthy" || verdict === "improved" || verdict === "degraded") {
        acc[verdict]++;
      }
      return acc;
    },
    { healthy: 0, improved: 0, degraded: 0 },
  );
  const verdictTotal = counts.healthy + counts.improved + counts.degraded;

  // Keep ?release= in sync so a release's health view can be linked to
  const openRelease = (release: string | null) => {
    setSelectedRelease(release);
    const next = new URLSearchParams(searchParams.toString());
    if (release) next.set("release", release);
    else next.delete("release");
    const qs = next.toString();
    router.replace(`/projects/${projectId}/releases${qs ? `?${qs}` : ""}`, {
      scroll: false,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Releases"
        description="Every deploy and release, with a verdict on whether it made things better or worse."
      />

      <div className="px-4 space-y-6">
        <div className="flex items-center gap-1 border-b border-border-subtle">
          {KIND_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setKindTab(tab.id);
                setPage(1);
              }}
              className={cn(
                "px-3 py-2 text-sm transition-colors border-b-2 -mb-px",
                kindTab === tab.id
                  ? "border-signal text-text-primary font-medium"
                  : "border-transparent text-text-muted hover:text-text-secondary",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {verdictTotal > 0 && (
          <div className="flex items-center flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="text-text-muted">On this page:</span>
            <span className="inline-flex items-center gap-2 text-text-secondary">
              <SignalDot status="ok" size="sm" pulse={false} />
              {counts.healthy} healthy
            </span>
            <span className="inline-flex items-center gap-2 text-text-secondary">
              <SignalDot status="ok" size="sm" pulse={false} />
              {counts.improved} improved
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-2",
                counts.degraded > 0 ? "text-status-danger" : "text-text-secondary",
              )}
            >
              <SignalDot status="danger" size="sm" pulse={false} />
              {counts.degraded} degraded
            </span>
          </div>
        )}

        {deploymentsQuery.isLoading ? (
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
            <Rocket className="w-8 h-8 text-text-muted mx-auto" />
            <p className="text-sm text-text-primary font-medium">No deploys tracked yet</p>
            <p className="text-sm text-text-muted max-w-md mx-auto">
              Apperio picks up GitHub Deployments and published releases from a linked
              repository. Deploying from another CI? Post to the deployments API with your
              project key and each deploy gets a verdict an hour later.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href={`/projects/${projectId}/settings/integrations`}>
                Connect GitHub
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((dep) => (
              <DeploymentRow
                key={dep._id}
                deployment={dep}
                onOpenRelease={(release) => openRelease(release)}
              />
            ))}

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

      <ReleaseHealthPanel
        projectId={projectId}
        release={selectedRelease}
        onClose={() => openRelease(null)}
      />
    </div>
  );
}
