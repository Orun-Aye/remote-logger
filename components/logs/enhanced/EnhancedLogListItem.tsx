"use client";

import { useState } from "react";
import { LogEntry } from "@/types/analytics";
import { cn } from "@/lib/utils";
import { Code, Copy, Check } from "lucide-react";
import { SignalDot } from "@/components/shared/SignalDot";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EnhancedLogListItemProps {
  log: LogEntry;
  isSelected: boolean;
  onSelect: (log: LogEntry) => void;
  density?: "compact" | "comfortable";
}

const LEVEL_META: Record<
  string,
  {
    color: string;
    label: string;
    dot: "ok" | "warn" | "danger" | "fatal" | "info";
  }
> = {
  trace: { color: "var(--level-trace)", label: "TRC", dot: "info" },
  debug: { color: "var(--level-debug)", label: "DBG", dot: "info" },
  info: { color: "var(--level-info)", label: "INF", dot: "ok" },
  warn: { color: "var(--level-warn)", label: "WRN", dot: "warn" },
  error: { color: "var(--level-error)", label: "ERR", dot: "danger" },
  fatal: { color: "var(--level-fatal)", label: "FTL", dot: "fatal" },
};

function fmtTimestamp(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  const s = d.getSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function EnhancedLogListItem({
  log,
  isSelected,
  onSelect,
  density = "comfortable",
}: EnhancedLogListItemProps) {
  const [jsonDialogOpen, setJsonDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const meta = LEVEL_META[log.level] || LEVEL_META.info;
  const isError = log.level === "error" || log.level === "fatal";
  const compactRow = density === "compact";

  const jsonString = JSON.stringify(log, null, 2);

  const handleCopyJson = async () => {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isNew = (log as LogEntry & { isNew?: boolean }).isNew;

  return (
    <>
      <Dialog open={jsonDialogOpen} onOpenChange={setJsonDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] bg-bg-surface border-border-subtle">
          <DialogHeader>
            <DialogTitle className="text-text-primary font-display">
              Raw Log Entry
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            <button
              onClick={handleCopyJson}
              className={cn(
                "absolute top-2 right-2 p-1.5 rounded transition-colors",
                "bg-bg-elevated hover:bg-bg-elevated/80 border border-border-subtle",
                copied ? "text-status-ok" : "text-text-muted hover:text-text-primary"
              )}
              title="Copy JSON"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
            <pre className="overflow-auto max-h-[60vh] rounded-lg bg-bg-base border border-border-subtle p-4 text-sm">
              <code className="text-text-primary font-mono whitespace-pre">
                {jsonString}
              </code>
            </pre>
          </div>
        </DialogContent>
      </Dialog>

      <div
        data-log-id={log._id}
        onClick={() => onSelect(log)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "group relative cursor-pointer select-none transition-[background,border-color] duration-150",
          "border-b border-border-faint",
          compactRow ? "px-3.5 py-1.5" : "px-3.5 py-2.5",
          isNew && "animate-row-flash"
        )}
        style={{
          borderLeft: `2px solid ${isSelected ? meta.color : "transparent"}`,
          background: isSelected
            ? `color-mix(in srgb, ${meta.color} 8%, transparent)`
            : hovered
              ? "rgba(255,255,255,0.025)"
              : "transparent",
        }}
      >
        {/* Selection gradient */}
        {isSelected && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to right, color-mix(in srgb, ${meta.color} 8%, transparent), transparent)`,
            }}
          />
        )}

        <div className="relative">
          {/* Main row — message is the typographic anchor */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Level badge */}
            <span
              className="inline-flex items-center gap-1 rounded shrink-0 font-mono uppercase"
              style={{
                padding: compactRow ? "1px 5px" : "2px 6px",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.06em",
                lineHeight: 1.5,
                border: `1px solid color-mix(in srgb, ${meta.color} 30%, transparent)`,
                background: `color-mix(in srgb, ${meta.color} 6%, transparent)`,
                color: meta.color,
              }}
            >
              <SignalDot status={meta.dot} size="sm" pulse={isError} />
              {meta.label}
            </span>

            {/* Timestamp — tabular */}
            <span
              className="font-mono text-text-muted shrink-0"
              style={{
                fontSize: 11,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "0.01em",
              }}
            >
              {fmtTimestamp(log.timestamp)}
            </span>

            {/* Service tag */}
            {log.service && (
              <span
                className="font-mono shrink-0 rounded"
                style={{
                  fontSize: 11,
                  padding: "1px 6px",
                  background: "var(--data-muted)",
                  color: "var(--data)",
                  border: "1px solid color-mix(in srgb, var(--data) 15%, transparent)",
                }}
              >
                {log.service}
              </span>
            )}

            {/* Message — visual anchor */}
            <span
              className="flex-1 truncate font-body"
              style={{
                fontSize: compactRow ? 12.5 : 13,
                color: isError ? "rgba(237,237,237,0.95)" : "var(--text-primary)",
                fontWeight: isError ? 500 : 400,
              }}
            >
              {log.message}
            </span>

            {/* Response time — read from SDK-emitted network/performance duration */}
            {(() => {
              const duration =
                (log.data as any)?.network?.duration ??
                (log.data as any)?.performance?.duration;
              if (typeof duration !== "number") return null;
              return (
                <span
                  className="font-mono text-text-muted shrink-0"
                  style={{
                    fontSize: 10,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {Math.round(duration)}ms
                </span>
              );
            })()}

            {/* Offline queue badge */}
            {(log.data?.offlineQueued || log.metadata?.offlineQueued) && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-status-warn/10 text-status-warn border-status-warn/30 shrink-0"
              >
                Offline
              </Badge>
            )}
          </div>

          {/* Error inline preview — only in comfortable density */}
          {!compactRow && log.error?.message && (
            <div
              className="mt-1.5 truncate font-mono rounded"
              style={{
                maxWidth: "75%",
                fontSize: 11,
                padding: "2px 7px",
                color: "rgba(229,72,77,0.75)",
                background: "rgba(229,72,77,0.05)",
                border: "1px solid rgba(229,72,77,0.12)",
              }}
            >
              {log.error.name}: {log.error.message}
            </div>
          )}

          {/* Footer metadata — single muted row */}
          {!compactRow &&
            (log.environment || log.release || log.correlationId) && (
              <div
                className="mt-1 flex items-center gap-2.5 font-mono text-text-muted"
                style={{ fontSize: 10.5 }}
              >
                {log.environment && (
                  <span
                    className="rounded"
                    style={{
                      padding: "1px 5px",
                      border: "1px solid var(--border-faint)",
                      background: "var(--bg-elevated)",
                    }}
                  >
                    {log.environment}
                  </span>
                )}
                {log.release && (
                  <span style={{ opacity: 0.7 }}>v{log.release}</span>
                )}
                {log.correlationId && (
                  <span
                    className="truncate"
                    style={{ opacity: 0.5, maxWidth: 130 }}
                  >
                    {log.correlationId}
                  </span>
                )}
              </div>
            )}
        </div>

        {/* Selection enter glyph */}
        {isSelected && (
          <span
            className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono pointer-events-none"
            style={{ fontSize: 10, color: `color-mix(in srgb, ${meta.color} 80%, transparent)` }}
          >
            ⏎
          </span>
        )}

        {/* JSON button — appears on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setJsonDialogOpen(true);
          }}
          className={cn(
            "absolute top-1.5 p-1.5 rounded transition-all duration-200",
            "bg-bg-elevated/80 hover:bg-bg-elevated border border-border-subtle hover:border-signal/40",
            "text-text-muted hover:text-signal",
            "opacity-0 group-hover:opacity-100",
            isSelected ? "right-7" : "right-2"
          )}
          title="View JSON"
        >
          <Code className="h-3 w-3" />
        </button>
      </div>
    </>
  );
}
