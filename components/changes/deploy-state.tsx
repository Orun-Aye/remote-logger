"use client";

import { Clock, XCircle } from "lucide-react";
import { SignalDot } from "@/components/shared/SignalDot";
import type { ChangeDeployment } from "@/services/changes.service";
import { cn } from "@/lib/utils";

/** Mirrors IMPACT_WINDOW_MINUTES in logger_backend deployment.service.ts. */
export const VERDICT_DELAY_MINUTES = 60;

/** A verdict when one exists, otherwise why there isn't one yet. */
export type DeployState =
  | "healthy"
  | "improved"
  | "degraded"
  | "unknown"
  | "measuring"
  | "deploying"
  | "failed"
  | "inactive"
  | "tagged";

export const DEPLOY_STATE_STYLES: Record<
  DeployState,
  { label: string; className: string; dot: "ok" | "warn" | "danger" | "info" }
> = {
  healthy: { label: "Healthy", className: "bg-status-ok/10 text-status-ok", dot: "ok" },
  improved: { label: "Improved", className: "bg-status-ok/10 text-status-ok", dot: "ok" },
  degraded: { label: "Degraded", className: "bg-status-danger/10 text-status-danger", dot: "danger" },
  unknown: { label: "Not enough traffic", className: "bg-bg-elevated text-text-muted", dot: "info" },
  measuring: { label: "Measuring", className: "bg-data-info/10 text-data-info", dot: "info" },
  deploying: { label: "Deploying", className: "bg-status-warn/10 text-status-warn", dot: "warn" },
  failed: { label: "Deploy failed", className: "bg-status-danger/10 text-status-danger", dot: "danger" },
  inactive: { label: "Inactive", className: "bg-bg-elevated text-text-muted", dot: "info" },
  tagged: { label: "Tagged", className: "bg-data-info/10 text-data-info", dot: "info" },
};

export function deployState(dep: ChangeDeployment): DeployState {
  if (dep.impact?.verdict) return dep.impact.verdict;
  // Releases are tags, not rollouts; the backend never computes impact for them
  if (dep.kind === "release") return "tagged";
  if (dep.status === "failure" || dep.status === "error") return "failed";
  if (dep.status === "pending" || dep.status === "in_progress") return "deploying";
  if (dep.status === "inactive") return "inactive";
  // Successful deploy, verdict lands once the post-deploy window has elapsed
  return "measuring";
}

/** When a measuring deploy's verdict becomes available. */
export function verdictDueAt(dep: ChangeDeployment): Date {
  return new Date(new Date(dep.startedAt).getTime() + VERDICT_DELAY_MINUTES * 60 * 1000);
}

export function DeployStateBadge({ state }: { state: DeployState }) {
  const style = DEPLOY_STATE_STYLES[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs whitespace-nowrap",
        style.className,
      )}
    >
      {state === "measuring" ? (
        <Clock className="w-3 h-3" />
      ) : state === "failed" ? (
        <XCircle className="w-3 h-3" />
      ) : (
        <SignalDot status={style.dot} size="sm" pulse={false} />
      )}
      {style.label}
    </span>
  );
}

export function ChangePct({ value }: { value: number | null }) {
  if (value === null) return <span className="text-text-muted">n/a</span>;
  // For error rate and latency, going up is bad
  return (
    <span
      className={cn(
        value === 0 ? "text-text-muted" : value > 0 ? "text-status-danger" : "text-status-ok",
      )}
    >
      {value > 0 ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}
