"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useApperioStore } from "@/store/apperio-store";
import { useProjects } from "@/hooks/project.hooks";

const RANGE_LABELS: Record<string, string> = {
  "1h": "last hour",
  "6h": "last 6 hours",
  "24h": "last 24 hours",
  "7d": "last 7 days",
  "30d": "last 30 days",
  custom: "custom range",
};

/**
 * The mono strip along the bottom of the workspace: which project is in
 * focus on the left, the active query scope on the right.
 */
export function StatusBar() {
  const pathname = usePathname();
  const selectedTimeRange = useApperioStore((s) => s.selectedTimeRange);
  const selectedEnvironment = useApperioStore((s) => s.selectedEnvironment);
  const autoRefreshEnabled = useApperioStore((s) => s.autoRefreshEnabled);
  const { data: projectsResponse } = useProjects();

  const projectName = useMemo(() => {
    const id = pathname.match(/\/projects\/([a-f\d]{24})/i)?.[1];
    if (!id) return null;
    const project = projectsResponse?.data?.find((p: any) => p._id === id);
    return project?.name ?? "…";
  }, [pathname, projectsResponse?.data]);

  return (
    <footer className="sticky bottom-0 z-10 hidden h-7 shrink-0 items-center gap-4 border-t border-border-subtle bg-gs-50 px-4 font-mono text-[11px] text-text-muted md:flex lg:px-6">
      <span className="truncate">
        {projectName ? (
          <>
            Project <span className="text-text-secondary">{projectName}</span>
          </>
        ) : (
          "No project in focus"
        )}
      </span>
      <span className="ml-auto flex items-center gap-4">
        <span>
          {selectedEnvironment === "all" ? "all environments" : selectedEnvironment}
          {" · "}
          {RANGE_LABELS[selectedTimeRange] ?? selectedTimeRange}
        </span>
        <span className={autoRefreshEnabled ? "text-status-ok" : undefined}>
          {autoRefreshEnabled ? "● Live" : "○ Paused"}
        </span>
      </span>
    </footer>
  );
}
