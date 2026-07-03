"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LogExplorerSplitPaneProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  hasSelection?: boolean;
  defaultSplitPercentage?: number;
  minSplitPercentage?: number;
  maxSplitPercentage?: number;
}

export function LogExplorerSplitPane({
  leftPanel,
  rightPanel,
  hasSelection = false,
  defaultSplitPercentage = 62,
  minSplitPercentage = 28,
  maxSplitPercentage = 78,
}: LogExplorerSplitPaneProps) {
  const [splitPercentage, setSplitPercentage] = useState(defaultSplitPercentage);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasSelection && splitPercentage > 70) {
      setSplitPercentage(62);
    }
  }, [hasSelection, splitPercentage]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newPercentage = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      const clampedPercentage = Math.min(
        Math.max(newPercentage, minSplitPercentage),
        maxSplitPercentage
      );

      setSplitPercentage(clampedPercentage);
    },
    [isDragging, minSplitPercentage, maxSplitPercentage]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex h-full w-full overflow-hidden",
        isDragging && "select-none cursor-col-resize"
      )}
    >
      {/* Left panel */}
      <div
        className="h-full overflow-hidden bg-bg-base min-w-0"
        style={{ width: `${splitPercentage}%` }}
      >
        {leftPanel}
      </div>

      {/* Resizer */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          "relative h-full w-1 shrink-0 cursor-col-resize border-l border-border-subtle transition-colors duration-150",
          isDragging ? "bg-signal/20" : "hover:bg-signal/10"
        )}
      >
        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-0.5 rounded-full transition-all duration-150",
            isDragging
              ? "bg-signal shadow-[0_0_8px_var(--signal-glow)]"
              : "bg-border-accent"
          )}
        />
      </div>

      {/* Right panel — empty state is self-affording, no extra dim */}
      <div className="h-full overflow-hidden bg-bg-surface min-w-0 flex-1">
        {rightPanel}
      </div>
    </div>
  );
}
