"use client";

import { LogEntry } from "@/types/analytics";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { SignalDot } from "@/components/shared/SignalDot";
import { TerminalBlock } from "@/components/shared/TerminalBlock";
import { X, Copy, Check, ExternalLink, WifiOff } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BreadcrumbTrail } from "./BreadcrumbTrail";
import { EnvironmentSnapshot } from "./EnvironmentSnapshot";
import { ResolvedStackTrace } from "@/components/dashboard/logs/ResolvedStackTrace";

interface EnhancedLogDetailPanelProps {
  log: LogEntry | null;
  onClose: () => void;
}

const LEVEL_COLORS = {
  trace: "var(--level-trace)",
  debug: "var(--level-debug)",
  info: "var(--level-info)",
  warn: "var(--level-warn)",
  error: "var(--level-error)",
  fatal: "var(--level-fatal)",
};

const LEVEL_DOT_STATUS: Record<string, "ok" | "warn" | "danger" | "fatal" | "info"> = {
  trace: "info",
  debug: "info",
  info: "ok",
  warn: "warn",
  error: "danger",
  fatal: "fatal",
};

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
        {title}
      </h4>
      <div className="text-sm text-text-primary">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: string | React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2 py-1">
      <span className="text-text-muted min-w-[120px] text-xs">{label}:</span>
      <span className={cn(
        "text-text-secondary flex-1",
        mono && "font-mono text-xs"
      )}>
        {value}
      </span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded hover:bg-bg-elevated transition-colors text-text-muted hover:text-signal"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function SyntaxHighlightedJSON({ data }: { data: any }) {
  const jsonString = JSON.stringify(data, null, 2);

  // Simple syntax highlighting using CSS custom properties
  const highlighted = jsonString
    .replace(/"([^"]+)":/g, '<span style="color: var(--syntax-property)">\"$1\"</span>:')
    .replace(/: "([^"]+)"/g, ': <span style="color: var(--syntax-string)">\"$1\"</span>')
    .replace(/: (\d+)/g, ': <span style="color: var(--syntax-number)">$1</span>')
    .replace(/: (true|false|null)/g, ': <span style="color: var(--syntax-keyword)">$1</span>');

  return (
    <pre
      className="font-mono text-xs leading-relaxed p-3 rounded bg-bg-base border border-border-faint overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

function EmptyDetailState() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-10 py-10">
      <div className="w-full max-w-sm rounded-lg border border-border-faint bg-bg-void overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border-faint bg-bg-surface">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 text-[11px] font-mono text-text-muted">
            apperio / log-detail
          </span>
        </div>
        <div
          className="px-3.5 py-4 font-mono text-text-muted"
          style={{ fontSize: 12, lineHeight: 1.9 }}
        >
          <div>
            <span className="text-signal">$</span>{" "}
            <span className="text-text-secondary">select-log</span>{" "}
            <span className="text-data">--interactive</span>
          </div>
          <div className="mt-1 opacity-60"># No log selected yet.</div>
          <div className="opacity-60">
            # Use <span className="text-text-primary">j/k</span> to navigate or click a row.
          </div>
          <div className="mt-2">
            <span className="text-signal">$</span>{" "}
            <span
              className="inline-block align-middle rounded-sm bg-signal animate-cursor-blink"
              style={{ width: 7, height: 13 }}
            />
          </div>
        </div>
      </div>
      <div className="mt-5 flex gap-4 text-[11px] font-mono text-text-muted">
        <span>
          <kbd className="px-1.5 py-0.5 bg-bg-elevated border border-border-subtle rounded">j</kbd>{" "}
          /{" "}
          <kbd className="px-1.5 py-0.5 bg-bg-elevated border border-border-subtle rounded">k</kbd>{" "}
          navigate
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-bg-elevated border border-border-subtle rounded">Esc</kbd>{" "}
          close
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-bg-elevated border border-border-subtle rounded">⌘R</kbd>{" "}
          refresh
        </span>
      </div>
    </div>
  );
}

export function EnhancedLogDetailPanel({ log, onClose }: EnhancedLogDetailPanelProps) {
  if (!log) {
    return <EmptyDetailState />;
  }

  const levelColor = LEVEL_COLORS[log.level as keyof typeof LEVEL_COLORS] || LEVEL_COLORS.info;
  const timestamp = new Date(log.timestamp);

  return (
    <div className="h-full flex flex-col bg-bg-surface animate-slide-in-right">
      {/* Header */}
      <div className="border-b border-border-subtle bg-bg-elevated px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <SignalDot status={LEVEL_DOT_STATUS[log.level] || "info"} size="sm" pulse={log.level === "error" || log.level === "fatal"} />
              <span className="text-sm font-semibold text-text-primary uppercase tracking-wide" style={{ color: levelColor }}>
                {log.level}
              </span>
              <span className="text-xs text-text-muted">•</span>
              <span className="text-xs text-text-muted font-mono">
                {format(timestamp, "MMM d, yyyy HH:mm:ss.SSS")}
              </span>
              {log.release && (
                <Badge variant="outline" className="font-mono text-xs bg-bg-elevated border-border-subtle">
                  v{log.release}
                </Badge>
              )}
            </div>
            <p className="text-sm text-text-primary font-body leading-relaxed">
              {log.message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-bg-base transition-colors text-text-muted hover:text-text-primary"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Offline Queue Notice */}
        {(log.data?.offlineQueued || log.metadata?.offlineQueued) && (
          <div className="flex items-center gap-2 text-xs text-status-warn bg-status-warn/5 border border-status-warn/20 rounded-md px-3 py-2">
            <WifiOff className="h-3 w-3" />
            This log was queued while offline and synced later
          </div>
        )}

        {/* Error Details */}
        {log.error && (
          <DetailSection title="Error Information">
            <div className="bg-status-danger/5 border border-status-danger/20 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-1">
                  <p className="text-status-danger font-semibold">{log.error.name}</p>
                  <p className="text-text-primary">{log.error.message}</p>
                </div>
                {log.error.message && <CopyButton text={log.error.message} />}
              </div>

              {log.error.stack && (
                <TerminalBlock code={log.error.stack} />
              )}

              {log.error.stack && log.release && (
                <ResolvedStackTrace
                  projectId={log.projectId}
                  release={log.release}
                  stackTrace={log.error.stack}
                />
              )}

              {(log.error.url || log.error.lineNumber || log.error.columnNumber) && (
                <div className="space-y-1 text-xs">
                  {log.error.url && <DetailRow label="URL" value={log.error.url} mono />}
                  {log.error.lineNumber && <DetailRow label="Line" value={String(log.error.lineNumber)} mono />}
                  {log.error.columnNumber && <DetailRow label="Column" value={String(log.error.columnNumber)} mono />}
                </div>
              )}
            </div>
          </DetailSection>
        )}

        {/* Breadcrumb Trail (from SDK data) */}
        {log.data?.breadcrumbs && (
          <DetailSection title="Event Trail">
            <BreadcrumbTrail breadcrumbs={log.data.breadcrumbs} />
          </DetailSection>
        )}

        {/* Environment Snapshot (from SDK data) */}
        {log.data?.environment && (
          <DetailSection title="Environment">
            <EnvironmentSnapshot environment={log.data.environment} />
          </DetailSection>
        )}

        {/* Trace Link */}
        {log.traceId && (
          <DetailSection title="Trace">
            <Link
              href={`/projects/${log.projectId}/traces/${log.traceId}`}
              className="inline-flex items-center gap-1.5 text-sm text-signal hover:text-signal/80 transition-colors font-mono"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Full Trace
            </Link>
          </DetailSection>
        )}

        {/* Metadata */}
        <DetailSection title="Metadata">
          <div className="bg-bg-base border border-border-faint rounded-lg p-4 space-y-1">
            <DetailRow label="Log ID" value={log._id} mono />
            <DetailRow label="Project ID" value={log.projectId} mono />
            {log.service && <DetailRow label="Service" value={log.service} />}
            {log.environment && <DetailRow label="Environment" value={log.environment} />}
            {log.eventType && <DetailRow label="Event Type" value={log.eventType} />}
            {log.correlationId && <DetailRow label="Correlation ID" value={log.correlationId} mono />}
            {log.sessionId && <DetailRow label="Session ID" value={log.sessionId} mono />}
          </div>
        </DetailSection>

        {/* Request Info */}
        {(log.url || log.userAgent || log.referrer) && (
          <DetailSection title="Request Information">
            <div className="bg-bg-base border border-border-faint rounded-lg p-4 space-y-1">
              {log.url && (
                <div className="flex items-start gap-2 py-1">
                  <span className="text-text-muted min-w-[120px] text-xs">URL:</span>
                  <span className="text-data font-mono text-xs flex-1 break-all">{log.url}</span>
                  <CopyButton text={log.url} />
                </div>
              )}
              {log.userAgent && <DetailRow label="User Agent" value={log.userAgent} mono />}
              {log.referrer && (
                <div className="flex items-start gap-2 py-1">
                  <span className="text-text-muted min-w-[120px] text-xs">Referrer:</span>
                  <span className="text-data font-mono text-xs flex-1 break-all">{log.referrer}</span>
                  <CopyButton text={log.referrer} />
                </div>
              )}
            </div>
          </DetailSection>
        )}

        {/* Custom Data */}
        {log.data && Object.keys(log.data).length > 0 && (
          <DetailSection title="Custom Data">
            <div className="relative">
              <div className="absolute top-2 right-2 z-10">
                <CopyButton text={JSON.stringify(log.data, null, 2)} />
              </div>
              <SyntaxHighlightedJSON data={log.data} />
            </div>
          </DetailSection>
        )}

        {/* Context */}
        {log.context && Object.keys(log.context).length > 0 && (
          <DetailSection title="Context">
            <div className="relative">
              <div className="absolute top-2 right-2 z-10">
                <CopyButton text={JSON.stringify(log.context, null, 2)} />
              </div>
              <SyntaxHighlightedJSON data={log.context} />
            </div>
          </DetailSection>
        )}

        {/* Additional Metadata */}
        {log.metadata && (
          <DetailSection title="Additional Metadata">
            <div className="relative">
              <div className="absolute top-2 right-2 z-10">
                <CopyButton text={JSON.stringify(log.metadata, null, 2)} />
              </div>
              <SyntaxHighlightedJSON data={log.metadata} />
            </div>
          </DetailSection>
        )}
      </div>
    </div>
  );
}
