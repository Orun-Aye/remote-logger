"use client";

import { Project } from "@/types/project.types";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, XCircle, AlertCircle, Info, Target, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ErrorsTabContentProps {
  errors: Project["analytics"]["errors"];
  projectId: string;
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; icon: typeof XCircle }> = {
  error: {
    color: "text-status-danger",
    bg: "bg-status-danger/10 border-status-danger/30",
    icon: XCircle,
  },
  warn: {
    color: "text-status-warn",
    bg: "bg-status-warn/10 border-status-warn/30",
    icon: AlertCircle,
  },
  fatal: {
    color: "text-level-fatal",
    bg: "bg-status-danger/15 border-status-danger/40",
    icon: XCircle,
  },
};

const DEFAULT_CONFIG = {
  color: "text-text-muted",
  bg: "bg-bg-elevated border-border-faint",
  icon: Info,
};

export function ErrorsTabContent({ errors, projectId }: ErrorsTabContentProps) {
  const analysis = errors?.analysis ?? [];
  const topErrors = errors?.topErrors ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Error Analysis */}
      <div className="bg-bg-surface border border-border-subtle rounded-lg p-6">
        <div className="flex items-center gap-2 text-text-primary mb-1">
          <AlertTriangle className="w-5 h-5 text-status-warn" />
          <h3 className="font-display font-semibold">Error Analysis</h3>
        </div>
        <p className="text-sm text-text-muted mb-4">Breakdown by severity level</p>

        <div className="space-y-3">
          {analysis.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">No errors recorded</p>
          ) : (
            analysis.map((error, index) => {
              const config = SEVERITY_CONFIG[error._id.level] || DEFAULT_CONFIG;
              const SeverityIcon = config.icon;

              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${config.bg}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <SeverityIcon className="h-4 w-4" />
                      <span className="font-medium capitalize text-sm">
                        {error._id.level}
                      </span>
                    </div>
                    <Badge variant="outline" className={config.color}>
                      {error.count} occurrences
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
                    <div>Service: <span className="text-text-secondary">{error._id.service}</span></div>
                    <div>Env: <span className="text-text-secondary">{error._id.environment}</span></div>
                  </div>
                  <p className="text-xs text-text-muted mt-2">
                    Last: {new Date(error.lastOccurrence).toLocaleString()}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Top Errors */}
      <div className="bg-bg-surface border border-border-subtle rounded-lg p-6">
        <div className="flex items-center gap-2 text-text-primary mb-1">
          <Target className="w-5 h-5 text-status-danger" />
          <h3 className="font-display font-semibold">Critical Issues</h3>
        </div>
        <p className="text-sm text-text-muted mb-4">Most frequent error patterns</p>

        <div className="space-y-3">
          {topErrors.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">No critical issues found</p>
          ) : (
            topErrors.map((error) => (
              <div
                key={error._id}
                className="p-4 border rounded-lg bg-status-danger/5 border-status-danger/20"
              >
                <div className="flex items-start justify-between mb-3 gap-2">
                  <h4 className="font-medium text-sm text-status-danger break-all">
                    {error._id}
                  </h4>
                  <Badge variant="destructive" className="text-xs shrink-0">
                    {error.count}x
                  </Badge>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-text-muted">Services:</span>
                    {error.services.map((service) => (
                      <Badge
                        key={service}
                        variant="outline"
                        className="h-5 bg-bg-elevated text-text-secondary border-border-faint"
                      >
                        {service}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-text-muted">Envs:</span>
                    {error.environments.map((env) => (
                      <Badge
                        key={env}
                        variant="outline"
                        className="h-5 bg-bg-elevated text-text-secondary border-border-faint"
                      >
                        {env}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-text-muted">
                      Last seen: {new Date(error.lastSeen).toLocaleString()}
                    </span>
                    <Link
                      href={`/logs?projectId=${projectId}&search=${encodeURIComponent(error._id)}`}
                      className="flex items-center gap-1 text-text-primary underline underline-offset-4 decoration-border-accent hover:decoration-current transition-colors"
                    >
                      View in Logs
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
