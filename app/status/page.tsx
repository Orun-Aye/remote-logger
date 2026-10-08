"use client";

import { useStatus } from "@/hooks/public.hooks";
import { SignalDot } from "@/components/shared/SignalDot";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Loader2,
} from "lucide-react";
import type { Metadata } from "next";

// Status-to-SignalDot mapping
function statusToDotStatus(
  status: "operational" | "degraded" | "outage"
): "ok" | "warn" | "danger" {
  switch (status) {
    case "operational":
      return "ok";
    case "degraded":
      return "warn";
    case "outage":
      return "danger";
  }
}

function OverallStatusBanner({
  status,
}: {
  status: "operational" | "degraded" | "outage";
}) {
  const config = {
    operational: {
      icon: CheckCircle2,
      label: "All Systems Operational",
      bgClass: "bg-status-ok/10 border-status-ok/20",
      textClass: "text-status-ok",
      iconClass: "text-status-ok",
    },
    degraded: {
      icon: AlertTriangle,
      label: "Degraded Performance",
      bgClass: "bg-status-warn/10 border-status-warn/20",
      textClass: "text-status-warn",
      iconClass: "text-status-warn",
    },
    outage: {
      icon: XCircle,
      label: "System Outage",
      bgClass: "bg-status-danger/10 border-status-danger/20",
      textClass: "text-status-danger",
      iconClass: "text-status-danger",
    },
  };

  const c = config[status];
  const Icon = c.icon;

  return (
    <div
      className={`rounded-xl border p-6 flex items-center gap-4 ${c.bgClass}`}
    >
      <Icon className={`w-8 h-8 ${c.iconClass}`} />
      <div>
        <h2 className={`text-xl font-display font-bold ${c.textClass}`}>
          {c.label}
        </h2>
        <p className="text-sm text-text-muted mt-0.5">
          Current system status across all components
        </p>
      </div>
    </div>
  );
}

function ComponentRow({
  name,
  status,
  description,
  responseTime,
}: {
  name: string;
  status: "operational" | "degraded" | "outage";
  description: string;
  responseTime?: number;
}) {
  const statusLabel =
    status === "operational"
      ? "Operational"
      : status === "degraded"
        ? "Degraded"
        : "Outage";

  return (
    <div className="flex items-center justify-between py-3.5 border-b border-border-subtle last:border-b-0">
      <div className="flex items-center gap-3">
        <SignalDot
          status={statusToDotStatus(status)}
          size="md"
          pulse={status !== "operational"}
        />
        <div>
          <span className="text-sm font-medium text-text-primary">{name}</span>
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm">
        {responseTime !== undefined && (
          <span className="text-xs text-text-muted font-mono">
            {responseTime}ms
          </span>
        )}
        <span
          className={`text-xs font-medium ${
            status === "operational"
              ? "text-status-ok"
              : status === "degraded"
                ? "text-status-warn"
                : "text-status-danger"
          }`}
        >
          {statusLabel}
        </span>
      </div>
    </div>
  );
}

function IncidentTimeline({
  incidents,
}: {
  incidents: Array<{
    id: string;
    title: string;
    status: string;
    severity: string;
    createdAt: string;
    updatedAt: string;
    updates: Array<{ message: string; status: string; timestamp: string }>;
  }>;
}) {
  if (incidents.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-surface p-6 text-center">
        <CheckCircle2 className="w-6 h-6 text-status-ok mx-auto mb-2" />
        <p className="text-sm text-text-muted">
          No incidents reported. All systems are running smoothly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {incidents.map((incident) => (
        <div
          key={incident.id}
          className="rounded-xl border border-border-subtle bg-bg-surface p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-text-primary">
              {incident.title}
            </h4>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                incident.severity === "critical"
                  ? "bg-status-danger/10 text-status-danger"
                  : incident.severity === "major"
                    ? "bg-status-warn/10 text-status-warn"
                    : "bg-data-info/10 text-data-info"
              }`}
            >
              {incident.severity}
            </span>
          </div>
          {incident.updates.map((update, i) => (
            <div key={i} className="text-xs text-text-muted mt-1">
              <span className="font-medium text-text-secondary">
                {update.status}
              </span>{" "}
              - {update.message}{" "}
              <span className="opacity-60">
                ({new Date(update.timestamp).toLocaleString()})
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function StatusPage() {
  const { data, isLoading, isError, dataUpdatedAt } = useStatus();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-6 h-6 text-signal animate-spin" />
        <p className="text-sm text-text-muted">Checking system status...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <XCircle className="w-8 h-8 text-status-danger" />
        <p className="text-sm text-text-muted">
          Unable to fetch system status. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary">
          System Status
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Real-time health of Apperio platform components
        </p>
      </div>

      {/* Overall status banner */}
      <OverallStatusBanner status={data.status} />

      {/* Component status grid */}
      <section>
        <h3 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">
          Components
        </h3>
        <div className="rounded-xl border border-border-subtle bg-bg-surface p-4">
          {data.components.map((component) => (
            <ComponentRow
              key={component.name}
              name={component.name}
              status={component.status}
              description={component.description}
              responseTime={component.responseTime}
            />
          ))}
        </div>
      </section>

      {/* Uptime is not shown: the backend returns hardcoded placeholder
          values (logger_backend/src/services/status.service.ts). Restore the
          section once uptime is measured for real. */}

      {/* Recent incidents */}
      <section>
        <h3 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">
          Recent Incidents
        </h3>
        <IncidentTimeline incidents={data.incidents} />
      </section>

      {/* Last checked */}
      <div className="flex items-center justify-center gap-2 text-xs text-text-muted pt-2">
        <Clock className="w-3.5 h-3.5" />
        <span>
          Last checked:{" "}
          {dataUpdatedAt
            ? new Date(dataUpdatedAt).toLocaleTimeString()
            : new Date(data.checkedAt).toLocaleTimeString()}
        </span>
        <span className="text-border-subtle">|</span>
        <span className="flex items-center gap-1">
          <RefreshCw className="w-3 h-3" />
          Auto-refreshes every 60s
        </span>
      </div>
    </div>
  );
}
