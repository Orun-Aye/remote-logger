"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQueries } from "@tanstack/react-query";
import { useProjects } from "@/hooks/project.hooks";
import {
  logQueryKeys,
  useLogs,
  useLogsAcrossProjects,
} from "@/hooks/log.hooks";
import { LogEntry } from "@/types/analytics";
import { LogExplorerSplitPane } from "./LogExplorerSplitPane";
import { EnhancedLogListItem } from "./EnhancedLogListItem";
import { EnhancedLogDetailPanel } from "./EnhancedLogDetailPanel";
import {
  ObservatoryFilterBar,
  LogFilters as FilterBarFilters,
} from "./ObservatoryFilterBar";
import { TerminalBlock } from "@/components/shared/TerminalBlock";
import { RefreshCw, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { logService } from "@/services/log.service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// Radix Select cannot use "" as an item value
const ALL_PROJECTS = "all";

interface ToolbarProps {
  logCount: number;
  shownCount: number;
  projects: Array<{ _id: string; name: string }>;
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
  isLoading: boolean;
  isLiveTail: boolean;
  search: string;
  onRefresh: () => void;
  onExport: (format: "csv" | "json") => void;
}

function Toolbar({
  logCount,
  shownCount,
  projects,
  selectedProjectId,
  onProjectChange,
  isLoading,
  isLiveTail,
  search,
  onRefresh,
  onExport,
}: ToolbarProps) {
  return (
    <div
      className="flex items-center gap-2.5 px-3.5 border-b border-border-subtle shrink-0"
      style={{ height: 46 }}
    >
      {/* Title */}
      <span
        className="font-display text-text-primary shrink-0"
        style={{
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: "-0.01em",
        }}
      >
        Log Explorer
      </span>

      {/* Project scope */}
      <Select
        value={selectedProjectId || ALL_PROJECTS}
        onValueChange={(v) => onProjectChange(v === ALL_PROJECTS ? "" : v)}
      >
        <SelectTrigger
          size="sm"
          className="h-7 w-[180px] bg-bg-surface border-border-subtle text-xs"
          aria-label="Project"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-bg-elevated border-border-subtle">
          <SelectItem value={ALL_PROJECTS}>All projects</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project._id} value={project._id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Divider */}
      <span className="w-px h-4 bg-border-subtle" />

      {/* Log count */}
      <span
        className="font-mono text-text-muted"
        style={{ fontSize: 11.5, fontVariantNumeric: "tabular-nums" }}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin text-signal" />
            loading
          </span>
        ) : (
          <>
            <span className="text-signal" style={{ fontWeight: 600 }}>
              {logCount.toLocaleString()}
            </span>{" "}
            log{logCount === 1 ? "" : "s"}
            {shownCount < logCount && (
              <span className="ml-1.5">· newest {shownCount.toLocaleString()} shown</span>
            )}
          </>
        )}
        {search && (
          <span className="ml-1.5">
            matching{" "}
            <span className="text-text-secondary font-mono">"{search}"</span>
          </span>
        )}
      </span>

      {/* Live indicator */}
      {isLiveTail && (
        <span
          className="inline-flex items-center gap-1.5 font-mono text-signal"
          style={{ fontSize: 11 }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-signal animate-live-badge" />
          LIVE
        </span>
      )}

      <span className="flex-1" />

      {/* Keyboard hints — hide on small screens */}
      <div
        className="hidden lg:flex items-center gap-2.5 font-mono text-text-muted"
        style={{ fontSize: 10.5 }}
      >
        <span>
          <kbd className="px-1.5 py-0.5 bg-bg-elevated border border-border-subtle rounded text-[10px] font-mono">
            j
          </kbd>
          /
          <kbd className="px-1.5 py-0.5 bg-bg-elevated border border-border-subtle rounded text-[10px] font-mono">
            k
          </kbd>
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-bg-elevated border border-border-subtle rounded text-[10px] font-mono">
            Esc
          </kbd>{" "}
          close
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-bg-elevated border border-border-subtle rounded text-[10px] font-mono">
            ⌘R
          </kbd>{" "}
          refresh
        </span>
      </div>

      {/* Divider */}
      <span className="hidden lg:inline-block w-px h-4 bg-border-subtle" />

      {/* Refresh */}
      <button
        onClick={onRefresh}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-border-faint bg-transparent text-text-muted",
          "hover:border-border-subtle hover:text-text-primary transition-colors duration-150"
        )}
        style={{ padding: "4px 10px", fontSize: 12 }}
      >
        <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
        Refresh
      </button>

      {/* Export */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border border-border-faint bg-transparent text-text-muted",
              "hover:border-border-subtle hover:text-text-primary transition-colors duration-150"
            )}
            style={{ padding: "4px 10px", fontSize: 12 }}
          >
            <Download className="w-3 h-3" />
            Export
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onExport("csv")}>
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport("json")}>
            Export as JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function EnhancedLogExplorer() {
  const searchParams = useSearchParams();
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Project selection
  const { data: projectsResponse } = useProjects();
  const projects = useMemo(() => projectsResponse?.data ?? [], [projectsResponse?.data]);

  // "" means every project the user can access. A ?projectId= link narrows to one.
  const paramProjectId = searchParams.get("projectId") || "";
  const [selectedProjectId, setSelectedProjectId] = useState<string>(paramProjectId);
  const isAllProjects = !selectedProjectId;

  useEffect(() => {
    if (paramProjectId) setSelectedProjectId(paramProjectId);
  }, [paramProjectId]);

  const projectNames = useMemo(
    () => new Map<string, string>(projects.map((p: any) => [p._id, p.name])),
    [projects]
  );

  // Filters
  const [filters, setFilters] = useState<FilterBarFilters>({
    search: "",
    levels: [],
    services: [],
    environments: [],
    eventTypes: [],
    timeRange: "24h",
    release: "",
  });

  // Live tail mode
  const [isLiveTail, setIsLiveTail] = useState(false);

  // Selected log for detail panel
  const [selectedLogIndex, setSelectedLogIndex] = useState<number>(-1);

  // Filter options: the union of distinct values across the projects in scope
  const scopeProjectIds: string[] = useMemo(
    () => (selectedProjectId ? [selectedProjectId] : projects.map((p: any) => p._id)),
    [selectedProjectId, projects]
  );
  const { availableServices, availableEnvironments } = useQueries({
    queries: scopeProjectIds.flatMap((id) =>
      (["service", "environment"] as const).map((field) => ({
        queryKey: logQueryKeys.distinct(id, field),
        queryFn: () => logService.getDistinctValues(id, field),
        staleTime: 10 * 60 * 1000,
      }))
    ),
    combine: (results) => {
      // Results alternate service, environment for each project
      const union = (offset: number) =>
        Array.from(
          new Set(
            results
              .filter((_, i) => i % 2 === offset)
              .flatMap((r) => (r.data as string[] | undefined) ?? [])
          )
        ).sort();
      return { availableServices: union(0), availableEnvironments: union(1) };
    },
  });

  // Build API filters
  const apiFilters = useMemo(() => {
    const timeRangeMap: Record<string, Date> = {
      "1h": new Date(Date.now() - 60 * 60 * 1000),
      "6h": new Date(Date.now() - 6 * 60 * 60 * 1000),
      "24h": new Date(Date.now() - 24 * 60 * 60 * 1000),
      "7d": new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      "30d": new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    };

    return {
      levels: filters.levels.length > 0 ? (filters.levels as LogEntry["level"][]) : undefined,
      services: filters.services.length > 0 ? filters.services : undefined,
      environments: filters.environments.length > 0 ? filters.environments : undefined,
      eventTypes: filters.eventTypes.length > 0 ? filters.eventTypes : undefined,
      search: filters.search || undefined,
      release: filters.release || undefined,
      startDate:
        filters.timeRange && filters.timeRange !== "custom" && timeRangeMap[filters.timeRange]
          ? timeRangeMap[filters.timeRange].toISOString()
          : filters.customFrom,
      endDate: filters.timeRange === "custom" ? filters.customTo : undefined,
      limit: 500,
    };
  }, [filters]);

  // Fetch logs. useLogs is disabled while selectedProjectId is "".
  const projectLogs = useLogs(selectedProjectId, apiFilters);
  const allProjectLogs = useLogsAcrossProjects(apiFilters, { enabled: isAllProjects });
  const {
    data: logsData,
    isLoading,
    refetch,
  } = isAllProjects ? allProjectLogs : projectLogs;

  const logs: LogEntry[] = useMemo(() => logsData?.logs ?? [], [logsData]);
  const totalLogCount: number =
    logsData?.meta?.pagination?.totalRecords ?? logs.length;

  // Auto-refresh for live tail
  useEffect(() => {
    if (!isLiveTail) return;
    const interval = setInterval(() => {
      refetch();
    }, 3000);
    return () => clearInterval(interval);
  }, [isLiveTail, refetch]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "j":
          e.preventDefault();
          setSelectedLogIndex((prev) =>
            Math.min(prev < 0 ? 0 : prev + 1, logs.length - 1)
          );
          break;
        case "k":
          e.preventDefault();
          setSelectedLogIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          break;
        case "Escape":
          e.preventDefault();
          setSelectedLogIndex(-1);
          break;
        case "r":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            refetch();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [logs.length, refetch]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (selectedLogIndex >= 0 && listContainerRef.current) {
      const selectedElement = listContainerRef.current.querySelector(
        `[data-log-index="${selectedLogIndex}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedLogIndex]);

  const handleLogSelect = useCallback(
    (log: LogEntry) => {
      const index = logs.findIndex((l) => l._id === log._id);
      setSelectedLogIndex((prev) => (prev === index ? -1 : index));
    },
    [logs]
  );

  const handleExport = useCallback(
    async (format: "csv" | "json") => {
      if (!selectedProjectId) {
        toast.info("Choose a project to export its logs");
        return;
      }

      const loadingToast = toast.loading(
        `Exporting logs as ${format.toUpperCase()}...`
      );

      try {
        await logService.exportLogs(selectedProjectId, format, apiFilters);
        toast.success(`Logs exported successfully as ${format.toUpperCase()}`, {
          id: loadingToast,
        });
      } catch (error) {
        console.error("Export failed:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to export logs",
          { id: loadingToast }
        );
      }
    },
    [selectedProjectId, apiFilters]
  );

  const handleSaveSearch = useCallback(() => {
    toast.info("Save search functionality coming soon!");
  }, []);

  const selectedLog = selectedLogIndex >= 0 ? logs[selectedLogIndex] : null;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-bg-base overflow-hidden">
      {/* Single-row toolbar replaces previous header + results strip */}
      <Toolbar
        logCount={totalLogCount}
        shownCount={logs.length}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onProjectChange={(projectId) => {
          setSelectedProjectId(projectId);
          setSelectedLogIndex(-1);
        }}
        isLoading={isLoading}
        isLiveTail={isLiveTail}
        search={filters.search}
        onRefresh={() => refetch()}
        onExport={handleExport}
      />

      {/* Compact filter bar */}
      <ObservatoryFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        onSaveSearch={handleSaveSearch}
        availableServices={availableServices}
        availableEnvironments={availableEnvironments}
        isLiveTail={isLiveTail}
        onToggleLiveTail={() => setIsLiveTail(!isLiveTail)}
      />

      {/* Split pane */}
      <div className="flex-1 overflow-hidden">
        <LogExplorerSplitPane
          hasSelection={!!selectedLog}
          defaultSplitPercentage={62}
          leftPanel={
            <div ref={listContainerRef} className="h-full overflow-y-auto bg-bg-base">
              {isLoading && logs.length === 0 ? (
                <div className="flex items-center justify-center h-64 gap-2.5 text-text-muted text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-signal" />
                  Loading logs...
                </div>
              ) : logs.length === 0 ? (
                <div className="px-5 py-6">
                  <TerminalBlock
                    filename="log-stream"
                    code={`$ apperio logs --filter "${filters.search || "..."}"

# No logs matched your query.
# Suggestions:
#   - Widen the time range
#   - Clear level filters
#   - Check your search syntax
#
# Try: apperio logs --last 7d --level error`}
                  />
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={log._id} data-log-index={index}>
                    <EnhancedLogListItem
                      log={log}
                      isSelected={index === selectedLogIndex}
                      onSelect={handleLogSelect}
                      density="comfortable"
                      projectName={
                        isAllProjects ? projectNames.get(log.projectId) : undefined
                      }
                    />
                  </div>
                ))
              )}
            </div>
          }
          rightPanel={
            <EnhancedLogDetailPanel
              log={selectedLog}
              onClose={() => setSelectedLogIndex(-1)}
            />
          }
        />
      </div>
    </div>
  );
}
