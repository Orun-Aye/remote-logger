"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Activity, Clock, Zap } from "lucide-react";
import { useApperioStore } from "@/store/apperio-store";
import {
  useWebVitals,
  useWebVitalsHistory,
  useWebVitalsByPage,
} from "@/hooks/webVitals.hook";
import { resolveTimeRangeParams } from "@/lib/format-utils";
import { PageHeader } from "@/components/shared/PageHeader";
import { WebVitalGauge } from "@/components/shared/WebVitalGauge";
import { TimeSeriesChart } from "@/components/shared/TimeSeriesChart";
import { SkeletonDashboard } from "@/components/shared/SkeletonDashboard";
import { MetricCard } from "@/components/shared/MetricCard";
import type { WebVitalMetric, WebVitalHistoryPoint, WebVitalPageData } from "@/services/webVitals.service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract p75 value for a vital by name. Returns 0 if not found. */
function getVitalValue(vitals: WebVitalMetric[], name: string): number {
  return vitals.find((v) => v.name === name)?.p75 ?? 0;
}

/** Map time range to chart interval. */
function getInterval(timeRange: string): string {
  switch (timeRange) {
    case "1h":
    case "6h":
      return "hour";
    case "24h":
      return "hour";
    case "7d":
    case "30d":
      return "day";
    default:
      return "hour";
  }
}

/** Format a timestamp bucket for the chart x-axis. */
function formatTimestamp(bucket: string): string {
  const date = new Date(bucket);
  if (isNaN(date.getTime())) return bucket;
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const mins = date.getMinutes().toString().padStart(2, "0");
  return `${month}/${day} ${hours}:${mins}`;
}

/** Determine rating CSS class for a value against thresholds. */
function ratingClass(
  value: number,
  good: number,
  needsImprovement: number
): string {
  if (value <= good) return "text-rating-good";
  if (value <= needsImprovement) return "text-rating-needs-improvement";
  return "text-rating-poor";
}

/** Format a metric value for display. */
function formatMetric(value: number, decimals: number = 0): string {
  if (decimals > 0) return value.toFixed(decimals);
  return Math.round(value).toString();
}

// ---------------------------------------------------------------------------
// Thresholds (Google CWV standards)
// ---------------------------------------------------------------------------

const THRESHOLDS = {
  lcp: { good: 2500, needsImprovement: 4000 },
  inp: { good: 200, needsImprovement: 500 },
  cls: { good: 0.1, needsImprovement: 0.25 },
} as const;

// ---------------------------------------------------------------------------
// Transform history data into TimeSeriesChart format
// ---------------------------------------------------------------------------

/**
 * The API returns flat rows: { bucket, vital, avgValue, count }.
 * We pivot them into: { timestamp, LCP, INP, CLS } per unique bucket.
 */
function pivotHistory(
  points: WebVitalHistoryPoint[]
): Array<{ timestamp: string; LCP: number; INP: number; CLS: number }> {
  const bucketMap = new Map<
    string,
    { bucket: string; timestamp: string; LCP: number; INP: number; CLS: number }
  >();

  for (const pt of points) {
    const key = pt.bucket;
    if (!bucketMap.has(key)) {
      bucketMap.set(key, {
        bucket: key,
        timestamp: formatTimestamp(key),
        LCP: 0,
        INP: 0,
        CLS: 0,
      });
    }
    const row = bucketMap.get(key)!;
    const vitalUpper = pt.vital?.toUpperCase();
    if (vitalUpper === "LCP") row.LCP = pt.avgValue;
    else if (vitalUpper === "INP") row.INP = pt.avgValue;
    else if (vitalUpper === "CLS") row.CLS = pt.avgValue;
  }

  // Sort by original bucket string (ISO date order), then strip the bucket key
  return Array.from(bucketMap.values())
    .sort((a, b) => a.bucket.localeCompare(b.bucket))
    .map(({ timestamp, LCP, INP, CLS }) => ({ timestamp, LCP, INP, CLS }));
}

// ---------------------------------------------------------------------------
// Transform per-page data into a flat table-friendly array
// ---------------------------------------------------------------------------

interface PageRow {
  url: string;
  lcp: number;
  inp: number;
  cls: number;
  samples: number;
}

function flattenPages(pages: WebVitalPageData[]): PageRow[] {
  return pages
    .map((page) => {
      const getVal = (name: string) =>
        page.vitals?.find((v) => v.name === name)?.avgValue ?? 0;
      return {
        url: page.url,
        lcp: getVal("LCP"),
        inp: getVal("INP"),
        cls: getVal("CLS"),
        samples: page.totalSamples,
      };
    })
    .sort((a, b) => b.lcp - a.lcp); // worst LCP first
}

// ---------------------------------------------------------------------------
// Chart series configuration
// ---------------------------------------------------------------------------

const HISTORY_SERIES = [
  { key: "LCP", label: "LCP (ms)", color: "var(--chart-1)", type: "area" as const },
  { key: "INP", label: "INP (ms)", color: "var(--chart-2)", type: "area" as const },
  { key: "CLS", label: "CLS", color: "var(--chart-3)", type: "area" as const },
];

// ===========================================================================
// Page Component
// ===========================================================================

export default function WebVitalsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId =
    typeof params?.projectId === "string" ? params.projectId : "";

  const selectedTimeRange = useApperioStore((s) => s.selectedTimeRange);
  const customTimeRange = useApperioStore((s) => s.customTimeRange);
  const timeRangeParams = useMemo(
    () => resolveTimeRangeParams(selectedTimeRange, customTimeRange),
    [selectedTimeRange, customTimeRange]
  );
  const timeRange = timeRangeParams.timeRange;
  const interval = getInterval(selectedTimeRange === "custom" ? "24h" : selectedTimeRange);

  // ---- Data fetching ----
  const {
    data: vitalsResponse,
    isLoading: vitalsLoading,
  } = useWebVitals(projectId, timeRange);

  const {
    data: historyResponse,
    isLoading: historyLoading,
  } = useWebVitalsHistory(projectId, timeRange, interval);

  const {
    data: pagesResponse,
    isLoading: pagesLoading,
  } = useWebVitalsByPage(projectId, timeRange);

  // ---- Derived data ----
  const vitals: WebVitalMetric[] = vitalsResponse?.data ?? [];
  const historyPoints: WebVitalHistoryPoint[] = historyResponse?.data ?? [];
  const pagesRaw: WebVitalPageData[] = pagesResponse?.data ?? [];

  const lcpValue = getVitalValue(vitals, "LCP");
  const inpValue = getVitalValue(vitals, "INP");
  const clsValue = getVitalValue(vitals, "CLS");
  const fcpValue = getVitalValue(vitals, "FCP");
  const ttfbValue = getVitalValue(vitals, "TTFB");

  const historyData = useMemo(() => pivotHistory(historyPoints), [historyPoints]);
  const pageRows = useMemo(() => flattenPages(pagesRaw), [pagesRaw]);

  const isLoading = vitalsLoading;
  const hasData = vitals.length > 0;

  // ---- Loading state ----
  if (isLoading) {
    return (
      <div className="bg-bg-base min-h-full">
        <PageHeader
          title="Core Web Vitals"
          description="LCP, INP, CLS performance"
        />
        <SkeletonDashboard />
      </div>
    );
  }

  // ---- Empty state ----
  if (!hasData) {
    return (
      <div className="bg-bg-base min-h-full">
        <PageHeader
          title="Core Web Vitals"
          description="LCP, INP, CLS performance"
        />
        <div className="bg-bg-surface border border-border-subtle rounded-lg p-12 text-center">
          <Activity className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
            No Web Vitals data collected
          </h3>
          <p className="text-text-muted text-sm max-w-md mx-auto">
            No Web Vitals data collected. Ensure the SDK is configured with
            performance monitoring enabled.
          </p>
        </div>
      </div>
    );
  }

  // ---- Data state ----
  return (
    <div className="bg-bg-base min-h-full space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Core Web Vitals"
        description="LCP, INP, CLS performance"
      />

      {/* === Gauge Row === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-bg-surface border border-border-subtle rounded-lg p-6 flex items-center justify-center">
          <WebVitalGauge
            label="LCP"
            value={lcpValue}
            unit="ms"
            thresholds={THRESHOLDS.lcp}
            description="Largest Contentful Paint"
          />
        </div>
        <div className="bg-bg-surface border border-border-subtle rounded-lg p-6 flex items-center justify-center">
          <WebVitalGauge
            label="INP"
            value={inpValue}
            unit="ms"
            thresholds={THRESHOLDS.inp}
            description="Interaction to Next Paint"
          />
        </div>
        <div className="bg-bg-surface border border-border-subtle rounded-lg p-6 flex items-center justify-center">
          <WebVitalGauge
            label="CLS"
            value={clsValue}
            unit=""
            thresholds={THRESHOLDS.cls}
            description="Cumulative Layout Shift"
          />
        </div>
      </div>

      {/* === FCP & TTFB secondary metrics === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard
          label="FCP"
          value={`${formatMetric(fcpValue)} ms`}
          icon={<Zap className="h-4 w-4" />}
          subtitle="First Contentful Paint"
        />
        <MetricCard
          label="TTFB"
          value={`${formatMetric(ttfbValue)} ms`}
          icon={<Clock className="h-4 w-4" />}
          subtitle="Time to First Byte"
        />
      </div>

      {/* === Web Vitals History Chart === */}
      <div className="bg-bg-surface border border-border-subtle rounded-lg p-6">
        <h2 className="font-display font-semibold text-text-primary text-base mb-4">
          Web Vitals History
        </h2>
        {historyLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <span className="text-text-muted text-sm">Loading chart...</span>
          </div>
        ) : historyData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <span className="text-text-muted text-sm">
              No history data available for this time range.
            </span>
          </div>
        ) : (
          <TimeSeriesChart
            data={historyData}
            series={HISTORY_SERIES}
            height={300}
            showLegend
            showGrid
            formatTooltip={(value, name) => {
              if (name.includes("CLS")) return value.toFixed(3);
              return `${Math.round(value)} ms`;
            }}
          />
        )}
      </div>

      {/* === Per-Page Breakdown Table === */}
      <div className="bg-bg-surface border border-border-subtle rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle">
          <h2 className="font-display font-semibold text-text-primary text-base">
            Per-Page Breakdown
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Sorted by LCP descending (worst pages first)
          </p>
        </div>

        {pagesLoading ? (
          <div className="p-6">
            <div className="h-32 flex items-center justify-center">
              <span className="text-text-muted text-sm">Loading table...</span>
            </div>
          </div>
        ) : pageRows.length === 0 ? (
          <div className="p-6">
            <div className="h-32 flex items-center justify-center">
              <span className="text-text-muted text-sm">
                No per-page data available.
              </span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-elevated/50">
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-3">
                    Page URL
                  </th>
                  <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-3">
                    LCP (ms)
                  </th>
                  <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-3">
                    INP (ms)
                  </th>
                  <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-3">
                    CLS
                  </th>
                  <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-3">
                    Samples
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, idx) => (
                  <tr
                    key={row.url + idx}
                    className="border-b border-border-subtle last:border-b-0 hover:bg-bg-elevated/30 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <span
                        className="text-text-secondary truncate max-w-[300px] block font-mono text-xs"
                        title={row.url}
                      >
                        {row.url}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span
                        className={`font-mono font-medium ${ratingClass(
                          row.lcp,
                          THRESHOLDS.lcp.good,
                          THRESHOLDS.lcp.needsImprovement
                        )}`}
                      >
                        {formatMetric(row.lcp)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span
                        className={`font-mono font-medium ${ratingClass(
                          row.inp,
                          THRESHOLDS.inp.good,
                          THRESHOLDS.inp.needsImprovement
                        )}`}
                      >
                        {formatMetric(row.inp)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span
                        className={`font-mono font-medium ${ratingClass(
                          row.cls,
                          THRESHOLDS.cls.good,
                          THRESHOLDS.cls.needsImprovement
                        )}`}
                      >
                        {row.cls.toFixed(3)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-text-muted font-mono">
                        {row.samples.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
