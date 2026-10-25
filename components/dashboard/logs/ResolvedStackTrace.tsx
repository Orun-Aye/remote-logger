"use client";

import { useState } from "react";
import { Code2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TerminalBlock } from "@/components/shared/TerminalBlock";
import { useResolveStackTrace } from "@/hooks/sourceMap.hook";
import { cn } from "@/lib/utils";

interface ResolvedStackTraceProps {
  projectId: string;
  release: string;
  stackTrace: string;
}

interface ResolvedFrame {
  name: string;
  source?: string;
  line?: number;
  column?: number;
  resolved: boolean;
}

export function ResolvedStackTrace({
  projectId,
  release,
  stackTrace,
}: ResolvedStackTraceProps) {
  const [view, setView] = useState<"minified" | "resolved">("minified");
  const { mutate: resolveStack, data, isPending, isError, error } = useResolveStackTrace(projectId);

  const handleResolve = () => {
    resolveStack({ release, stackTrace });
  };

  const resolvedFrames = data?.data?.resolvedFrames as ResolvedFrame[] | undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-text-primary">Stack Trace</h4>
          {resolvedFrames && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setView("minified")}
                className={cn(
                  "px-2 py-1 text-xs rounded-md transition-colors",
                  view === "minified"
                    ? "bg-signal/10 text-signal"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                Minified
              </button>
              <button
                onClick={() => setView("resolved")}
                className={cn(
                  "px-2 py-1 text-xs rounded-md transition-colors",
                  view === "resolved"
                    ? "bg-signal/10 text-signal"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                Resolved
              </button>
            </div>
          )}
        </div>
        {!resolvedFrames && (
          <Button
            variant="signal"
            size="sm"
            onClick={handleResolve}
            disabled={isPending}
            className="h-8"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                Resolving...
              </>
            ) : (
              <>
                <Code2 className="h-3.5 w-3.5 mr-2" />
                De-minify
              </>
            )}
          </Button>
        )}
      </div>

      {view === "minified" && (
        <TerminalBlock
          code={stackTrace}
          filename="minified-stack.txt"
          language="text"
        />
      )}

      {view === "resolved" && resolvedFrames && (
        <div className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden">
          <div className="flex items-center justify-between h-10 px-4 bg-bg-void border-b border-border-faint">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gs-300" />
              <span className="w-3 h-3 rounded-full bg-gs-300" />
              <span className="w-3 h-3 rounded-full bg-gs-300" />
              <span className="ml-3 text-xs text-text-muted font-code">
                resolved-stack.txt
              </span>
            </div>
          </div>
          <div className="p-4 space-y-1">
            {resolvedFrames.map((frame, index) => (
              <div
                key={index}
                className={cn(
                  "font-mono text-xs",
                  frame.resolved ? "text-signal" : "text-text-muted"
                )}
              >
                at {frame.name}
                {frame.source && frame.line && frame.column
                  ? ` (${frame.source}:${frame.line}:${frame.column})`
                  : ""}
              </div>
            ))}
          </div>
        </div>
      )}

      {isError && (
        <div className="text-xs text-text-muted bg-bg-surface border border-border-subtle rounded-md px-3 py-2">
          No source maps available for release {release}
        </div>
      )}
    </div>
  );
}
