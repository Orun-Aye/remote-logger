"use client";

import { useState, useMemo } from "react";
import { useProjects } from "@/hooks/project.hooks";
import { useFavorites, useAddFavorite, useRemoveFavorite } from "@/hooks/userPreference.hook";
import { PageHeader } from "@/components/shared/PageHeader";
import { SignalDot } from "@/components/shared/SignalDot";
import { SkeletonDashboard } from "@/components/shared/SkeletonDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Star,
  FolderOpen,
  Activity,
  AlertTriangle,
  Clock,
} from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number | undefined | null): string {
  if (n === undefined || n === null) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function deriveHealth(project: any): "ok" | "warn" | "danger" {
  const healthScore = project?.metrics?.healthScore ?? 100;
  if (healthScore < 50) return "danger";
  if (healthScore < 75) return "warn";
  return "ok";
}

function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) return "never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: projectsResponse, isLoading: projectsLoading } = useProjects();
  const { data: favoritesResponse } = useFavorites();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const projects: any[] = projectsResponse?.data ?? [];
  const favoriteIds: string[] = useMemo(() => {
    if (!favoritesResponse?.data) return [];
    const favData = favoritesResponse.data;
    if (Array.isArray(favData)) {
      return favData.map((f: any) => (typeof f === "string" ? f : f.projectId ?? f._id ?? ""));
    }
    return [];
  }, [favoritesResponse]);

  const isFavorite = (pid: string) => favoriteIds.includes(pid);

  const toggleFavorite = (pid: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFavorite(pid)) {
      removeFavorite.mutate(pid);
    } else {
      addFavorite.mutate(pid);
    }
  };

  // Filter and sort
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    // Sort: favorites first, then by name
    result.sort((a: any, b: any) => {
      const aFav = isFavorite(a._id) ? 0 : 1;
      const bFav = isFavorite(b._id) ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;
      return (a.name ?? "").localeCompare(b.name ?? "");
    });

    return result;
  }, [projects, search, favoriteIds]);

  if (projectsLoading) {
    return (
      <div className="p-6 md:px-8 lg:p-10">
        <SkeletonDashboard />
      </div>
    );
  }

  return (
    <div className="p-6 md:px-8 lg:p-10 space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Projects"
        description="Manage and monitor all your logging projects"
        actions={
          <Button variant="signal" asChild>
            <Link href="/projects/new">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Link>
          </Button>
        }
      />

      {/* Search + View Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-bg-base border-border-subtle"
          />
        </div>
        <div className="flex items-center border border-border-subtle rounded-md overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 transition-colors ${
              viewMode === "grid"
                ? "bg-bg-elevated text-signal"
                : "text-text-muted hover:text-text-secondary"
            }`}
            aria-label="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 transition-colors ${
              viewMode === "list"
                ? "bg-bg-elevated text-signal"
                : "text-text-muted hover:text-text-secondary"
            }`}
            aria-label="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-signal/10 flex items-center justify-center mb-6">
            <FolderOpen className="w-8 h-8 text-signal" />
          </div>
          <h2 className="text-2xl font-display font-bold text-text-primary mb-2">
            No projects yet
          </h2>
          <p className="text-text-secondary max-w-md mb-6">
            Create your first project to start logging and monitoring your applications.
          </p>
          <Button variant="signal" asChild>
            <Link href="/projects/new">
              <Plus className="w-4 h-4 mr-2" />
              Create First Project
            </Link>
          </Button>
        </div>
      )}

      {/* Grid View */}
      {projects.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project: any) => {
            const health = deriveHealth(project);
            const totalLogs = project.metrics?.totalLogs ?? project.logCount ?? 0;
            const logs24h = project.metrics?.recentActivity?.logsLast24h ?? 0;
            const errors24h = project.metrics?.recentActivity?.errorsLast24h ?? 0;
            const errorRate =
              logs24h > 0 ? ((errors24h / logs24h) * 100).toFixed(1) : "0.0";

            return (
              <Link key={project._id} href={`/projects/${project._id}`}>
                <Card className="bg-bg-surface border-border-subtle hover:border-signal/30 cursor-pointer group h-full">
                  <CardContent className="p-5 space-y-4">
                    {/* Top row: status + name + favorite */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <SignalDot status={health} size="md" />
                        <h3 className="font-display font-semibold text-text-primary truncate group-hover:text-signal transition-colors">
                          {project.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {project.isActive !== false && (
                          <Badge variant="outline" className="text-[10px] border-border-subtle">
                            {project.environment ?? "production"}
                          </Badge>
                        )}
                        <button
                          onClick={(e) => toggleFavorite(project._id, e)}
                          className="text-text-muted hover:text-status-warn transition-colors"
                          aria-label={isFavorite(project._id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              isFavorite(project._id)
                                ? "fill-status-warn text-status-warn"
                                : ""
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-3 h-3 text-text-muted" />
                          <span className="text-xs text-text-muted">Logs</span>
                        </div>
                        <p className="text-sm font-semibold text-text-primary font-mono">
                          {formatNumber(totalLogs)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3 text-text-muted" />
                          <span className="text-xs text-text-muted">Error Rate 24h</span>
                        </div>
                        <p className="text-sm font-semibold text-text-primary font-mono">
                          {errorRate}%
                        </p>
                      </div>
                    </div>

                    {/* Description or created date */}
                    <p className="text-xs text-text-muted truncate">
                      {project.description || `Created ${new Date(project.createdAt).toLocaleDateString()}`}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* List View */}
      {projects.length > 0 && viewMode === "list" && (
        <div className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_100px_100px_120px_120px_40px] gap-4 px-4 py-3 border-b border-border-subtle text-xs text-text-muted uppercase tracking-wider font-body">
            <span>Name</span>
            <span className="text-right">Environment</span>
            <span className="text-right">Logs</span>
            <span className="text-right">Error Rate 24h</span>
            <span className="text-right">Last Activity</span>
            <span />
          </div>
          {/* Rows */}
          {filteredProjects.map((project: any) => {
            const health = deriveHealth(project);
            const totalLogs = project.metrics?.totalLogs ?? project.logCount ?? 0;
            const logs24h = project.metrics?.recentActivity?.logsLast24h ?? 0;
            const errors24h = project.metrics?.recentActivity?.errorsLast24h ?? 0;
            const errorRate =
              logs24h > 0 ? ((errors24h / logs24h) * 100).toFixed(1) : "0.0";

            return (
              <Link
                key={project._id}
                href={`/projects/${project._id}`}
                className="grid grid-cols-[1fr_100px_100px_120px_120px_40px] gap-4 px-4 py-3 border-b border-border-subtle last:border-b-0 hover:bg-bg-elevated transition-colors items-center group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <SignalDot status={health} size="sm" />
                  <span className="text-sm font-display font-semibold text-text-primary truncate group-hover:text-signal transition-colors">
                    {project.name}
                  </span>
                </div>
                <span className="text-xs text-text-muted text-right">
                  {project.environment ?? "production"}
                </span>
                <span className="text-sm text-text-primary font-mono text-right">
                  {formatNumber(totalLogs)}
                </span>
                <span className="text-sm text-text-primary font-mono text-right">
                  {errorRate}%
                </span>
                <span className="text-xs text-text-muted text-right flex items-center justify-end gap-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo(project.metrics?.lastActivity ?? project.lastIngestedAt)}
                </span>
                <button
                  onClick={(e) => toggleFavorite(project._id, e)}
                  className="text-text-muted hover:text-status-warn transition-colors justify-self-center"
                  aria-label={isFavorite(project._id) ? "Remove from favorites" : "Add to favorites"}
                >
                  <Star
                    className={`w-4 h-4 ${
                      isFavorite(project._id) ? "fill-status-warn text-status-warn" : ""
                    }`}
                  />
                </button>
              </Link>
            );
          })}
        </div>
      )}

      {/* No results from search */}
      {projects.length > 0 && filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-10 h-10 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
            No projects found
          </h3>
          <p className="text-text-secondary text-sm">
            Try adjusting your search query.
          </p>
        </div>
      )}
    </div>
  );
}
