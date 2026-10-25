"use client";

import { useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { useApperioStore } from "@/store/apperio-store";
import { resolveTimeRangeParams } from "@/lib/format-utils";
import { useAnalyzeFunnel, usePopularPaths } from "@/hooks/funnel.hook";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { SkeletonDashboard } from "@/components/shared/SkeletonDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Filter,
  Plus,
  Trash2,
  ArrowRight,
  BarChart3,
  TrendingDown,
  Users,
  Clock,
  Route,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FunnelStepInput {
  id: string;
  eventType: string;
}

interface FunnelStepResult {
  step: string;
  eventType?: string;
  count: number;
  percentage: number;
  dropOff?: number;
  dropOffRate?: number;
  avgTimeBetweenSteps?: number;
}

interface FunnelResult {
  steps: FunnelStepResult[];
  totalSessions?: number;
  overallConversionRate?: number;
}

interface PopularPath {
  path: string | string[];
  count: number;
  percentage?: number;
}

/** Normalize path from backend (string with " → " separator) to array */
function normalizePath(p: string | string[]): string[] {
  if (Array.isArray(p)) return p;
  if (typeof p === "string") return p.split(" → ").filter(Boolean);
  return [];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function formatDuration(ms: number | undefined | null): string {
  if (ms == null || isNaN(ms)) return "--";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatPercent(val: number | undefined | null): string {
  if (val == null || isNaN(val)) return "--";
  return `${val.toFixed(1)}%`;
}

function getFunnelBarColor(percentage: number): string {
  if (percentage >= 70) return "var(--status-ok)";
  if (percentage >= 40) return "var(--status-warn)";
  return "var(--status-danger)";
}

// ---------------------------------------------------------------------------
// Step Builder Component
// ---------------------------------------------------------------------------

function StepBuilder({
  steps,
  onAdd,
  onRemove,
  onChange,
}: {
  steps: FunnelStepInput[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, value: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
      <h3 className="text-sm font-display font-semibold text-text-primary mb-4">
        Define Funnel Steps
      </h3>
      <p className="text-xs text-text-muted mb-5">
        Add URL patterns or event types in the order users should flow through.
        Each step filters sessions that visited that page or triggered that event.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-2">
            {index > 0 && (
              <ArrowRight className="w-4 h-4 text-text-muted shrink-0" />
            )}
            <div className="relative group">
              <div className="absolute -top-5 left-0 text-[10px] text-text-muted uppercase tracking-wider font-medium">
                Step {index + 1}
              </div>
              <div className="flex items-center gap-1">
                <Input
                  value={step.eventType}
                  onChange={(e) => onChange(step.id, e.target.value)}
                  placeholder="/page-url or event"
                  className="w-44 h-9 text-xs font-mono bg-bg-elevated border-border-subtle focus:border-gs-900"
                />
                {steps.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-text-muted hover:text-status-danger opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemove(step.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="h-9 gap-1.5 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Step
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Funnel Visualization Component
// ---------------------------------------------------------------------------

function FunnelVisualization({ result }: { result: FunnelResult }) {
  const steps = result.steps ?? [];
  if (steps.length === 0) return null;

  const maxCount = Math.max(...steps.map((s) => s.count), 1);

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
      <h3 className="text-sm font-display font-semibold text-text-primary mb-6">
        Funnel Visualization
      </h3>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const widthPercent = Math.max((step.count / maxCount) * 100, 4);
          const color = getFunnelBarColor(step.percentage);

          return (
            <div key={index} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-text-secondary font-mono">
                  {step.step || step.eventType || `Step ${index + 1}`}
                </span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-text-primary font-semibold font-mono">
                    {step.count.toLocaleString()}
                  </span>
                  <span
                    className="font-mono font-medium"
                    style={{ color }}
                  >
                    {formatPercent(step.percentage)}
                  </span>
                </div>
              </div>
              <div className="h-8 bg-bg-elevated rounded overflow-hidden relative">
                <div
                  className="h-full rounded transition-all duration-500 ease-out"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: color,
                    opacity: 0.85,
                  }}
                />
              </div>
              {index < steps.length - 1 && step.dropOffRate != null && step.dropOffRate > 0 && (
                <div className="flex items-center gap-1.5 mt-1 ml-2 text-[10px] text-text-muted">
                  <TrendingDown className="w-3 h-3 text-status-danger" />
                  <span>
                    {step.dropOff?.toLocaleString() ?? "--"} dropped ({formatPercent(step.dropOffRate)})
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drop-off Analysis Table
// ---------------------------------------------------------------------------

function DropOffTable({ steps }: { steps: FunnelStepResult[] }) {
  if (steps.length === 0) return null;

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
      <h3 className="text-sm font-display font-semibold text-text-primary mb-4">
        Drop-off Analysis
      </h3>
      <div className="rounded-lg border border-border-subtle overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-bg-surface">
              <th className="text-left text-text-muted text-xs uppercase tracking-wider font-medium px-4 py-3">
                Step
              </th>
              <th className="text-right text-text-muted text-xs uppercase tracking-wider font-medium px-4 py-3">
                Entered
              </th>
              <th className="text-right text-text-muted text-xs uppercase tracking-wider font-medium px-4 py-3">
                Dropped
              </th>
              <th className="text-right text-text-muted text-xs uppercase tracking-wider font-medium px-4 py-3">
                Drop Rate
              </th>
              <th className="text-right text-text-muted text-xs uppercase tracking-wider font-medium px-4 py-3">
                Avg Time
              </th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step, i) => (
              <tr
                key={i}
                className="border-t border-border-subtle even:bg-bg-elevated/30 hover:bg-bg-elevated/50 transition-colors"
              >
                <td className="px-4 py-3 text-text-primary text-xs font-mono">
                  {step.step || step.eventType || `Step ${i + 1}`}
                </td>
                <td className="px-4 py-3 text-right text-text-primary text-xs font-mono">
                  {step.count.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-text-primary text-xs font-mono">
                  {step.dropOff != null ? step.dropOff.toLocaleString() : "--"}
                </td>
                <td className="px-4 py-3 text-right text-xs font-mono">
                  <span
                    className={
                      (step.dropOffRate ?? 0) > 50
                        ? "text-status-danger"
                        : (step.dropOffRate ?? 0) > 25
                        ? "text-status-warn"
                        : "text-status-ok"
                    }
                  >
                    {formatPercent(step.dropOffRate)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-text-muted text-xs font-mono">
                  {formatDuration(step.avgTimeBetweenSteps)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Popular Paths Component
// ---------------------------------------------------------------------------

function PopularPathsSection({ paths }: { paths: PopularPath[] }) {
  if (!paths || paths.length === 0) {
    return (
      <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
        <h3 className="text-sm font-display font-semibold text-text-primary mb-4">
          Popular Paths
        </h3>
        <div className="text-center py-8">
          <Route className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-text-muted text-sm">
            No popular paths found for this period.
          </p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...paths.map((p) => p.count), 1);

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
      <h3 className="text-sm font-display font-semibold text-text-primary mb-4">
        Popular Paths
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {paths.map((pathItem, index) => {
          const barWidth = Math.max((pathItem.count / maxCount) * 100, 8);
          const segments = normalizePath(pathItem.path);

          return (
            <div
              key={index}
              className="rounded-lg border border-border-subtle bg-bg-elevated/30 p-4 hover:bg-bg-elevated/60 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-muted font-medium">
                  Path #{index + 1}
                </span>
                <span className="text-xs text-text-primary font-mono font-semibold">
                  {pathItem.count.toLocaleString()} visits
                </span>
              </div>
              <div className="flex items-center flex-wrap gap-1 mb-3">
                {segments.map((segment, si) => (
                  <span key={si} className="flex items-center gap-1">
                    {si > 0 && (
                      <ArrowRight className="w-3 h-3 text-text-muted shrink-0" />
                    )}
                    <span className="inline-block px-2 py-0.5 rounded bg-bg-surface text-text-primary font-mono text-[11px] border border-border-subtle">
                      {segment}
                    </span>
                  </span>
                ))}
              </div>
              <div className="h-1.5 bg-bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-data-info"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function FunnelAnalysisPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = typeof params?.projectId === "string" ? params.projectId : "";

  const selectedTimeRange = useApperioStore((s) => s.selectedTimeRange);
  const customTimeRange = useApperioStore((s) => s.customTimeRange);
  const timeRangeParams = useMemo(
    () => resolveTimeRangeParams(selectedTimeRange, customTimeRange),
    [selectedTimeRange, customTimeRange]
  );

  // Step builder state
  const [steps, setSteps] = useState<FunnelStepInput[]>([
    { id: generateId(), eventType: "" },
    { id: generateId(), eventType: "" },
  ]);

  // Funnel analysis mutation
  const analyzeMutation = useAnalyzeFunnel(projectId);
  const funnelResult = analyzeMutation.data as FunnelResult | undefined;

  // Popular paths query
  const {
    data: popularPathsRaw,
    isLoading: pathsLoading,
  } = usePopularPaths(projectId, { limit: 10, ...timeRangeParams });

  const popularPaths: PopularPath[] = Array.isArray(popularPathsRaw) ? popularPathsRaw : [];

  // Step builder handlers
  const handleAddStep = useCallback(() => {
    setSteps((prev) => [...prev, { id: generateId(), eventType: "" }]);
  }, []);

  const handleRemoveStep = useCallback((id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleChangeStep = useCallback((id: string, value: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, eventType: value } : s))
    );
  }, []);

  // Analyze handler
  const handleAnalyze = useCallback(() => {
    const validSteps = steps.filter((s) => s.eventType.trim() !== "");
    if (validSteps.length < 2) return;

    analyzeMutation.mutate({
      steps: validSteps.map((s) => ({ eventType: s.eventType.trim() })),
      ...timeRangeParams,
    });
  }, [steps, timeRangeParams, analyzeMutation]);

  const hasValidSteps = steps.filter((s) => s.eventType.trim() !== "").length >= 2;
  const resultSteps: FunnelStepResult[] = funnelResult?.steps ?? [];

  // Derive metric card values
  const totalEntered = resultSteps.length > 0 ? resultSteps[0].count : 0;
  const totalConverted = resultSteps.length > 0 ? resultSteps[resultSteps.length - 1].count : 0;
  const conversionRate =
    funnelResult?.overallConversionRate ??
    (totalEntered > 0 ? (totalConverted / totalEntered) * 100 : 0);
  const biggestDropStep = resultSteps.reduce<FunnelStepResult | null>(
    (max, step) =>
      (step.dropOffRate ?? 0) > (max?.dropOffRate ?? 0) ? step : max,
    null
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6 bg-bg-base min-h-screen">
      <PageHeader
        title="Funnel Analysis"
        description="Build conversion funnels to understand how users move through your application"
        actions={
          <Button
            variant="signal"
            size="sm"
            onClick={handleAnalyze}
            disabled={!hasValidSteps || analyzeMutation.isPending}
            className="gap-1.5"
          >
            <Filter className="w-4 h-4" />
            {analyzeMutation.isPending ? "Analyzing..." : "Analyze Funnel"}
          </Button>
        }
      />

      {/* Step Builder */}
      <StepBuilder
        steps={steps}
        onAdd={handleAddStep}
        onRemove={handleRemoveStep}
        onChange={handleChangeStep}
      />

      {/* Error state */}
      {analyzeMutation.isError && (
        <div className="rounded-lg border border-status-danger/30 bg-status-danger/5 p-4">
          <p className="text-status-danger text-sm">
            Failed to analyze funnel. Please check your step definitions and try again.
          </p>
        </div>
      )}

      {/* Metric cards after analysis */}
      {funnelResult && resultSteps.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Sessions"
            value={
              funnelResult.totalSessions?.toLocaleString() ??
              totalEntered.toLocaleString()
            }
            icon={<Users className="w-4 h-4" />}
          />
          <MetricCard
            label="Conversion Rate"
            value={formatPercent(conversionRate)}
            icon={<BarChart3 className="w-4 h-4" />}
            variant={
              conversionRate >= 50 ? "success" : conversionRate >= 20 ? "warning" : "danger"
            }
          />
          <MetricCard
            label="Total Converted"
            value={totalConverted.toLocaleString()}
            icon={<TrendingDown className="w-4 h-4" />}
            subtitle={`of ${totalEntered.toLocaleString()} entered`}
          />
          <MetricCard
            label="Biggest Drop-off"
            value={
              biggestDropStep
                ? formatPercent(biggestDropStep.dropOffRate)
                : "--"
            }
            icon={<Clock className="w-4 h-4" />}
            subtitle={
              biggestDropStep
                ? biggestDropStep.step || biggestDropStep.eventType || "Unknown step"
                : undefined
            }
            variant={
              (biggestDropStep?.dropOffRate ?? 0) > 50
                ? "danger"
                : (biggestDropStep?.dropOffRate ?? 0) > 25
                ? "warning"
                : "default"
            }
          />
        </div>
      )}

      {/* Funnel Visualization */}
      {funnelResult && resultSteps.length > 0 && (
        <FunnelVisualization result={funnelResult} />
      )}

      {/* Drop-off Table */}
      {funnelResult && resultSteps.length > 0 && (
        <DropOffTable steps={resultSteps} />
      )}

      {/* Empty state when no analysis has been run */}
      {!funnelResult && !analyzeMutation.isPending && (
        <div className="bg-bg-surface border border-border-subtle rounded-lg p-12 text-center">
          <BarChart3 className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
            Build your first funnel
          </h3>
          <p className="text-text-muted text-sm max-w-md mx-auto">
            Define at least two steps above using URL patterns or event types,
            then click "Analyze Funnel" to visualize conversion and drop-off
            rates across your user flow.
          </p>
        </div>
      )}

      {/* Loading state for analysis */}
      {analyzeMutation.isPending && <SkeletonDashboard />}

      {/* Popular Paths */}
      {pathsLoading ? (
        <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-32 bg-bg-elevated rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-bg-elevated rounded" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <PopularPathsSection paths={popularPaths} />
      )}
    </div>
  );
}
