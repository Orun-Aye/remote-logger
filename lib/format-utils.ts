/**
 * Shared formatting utilities for the Apperio dashboard.
 *
 * Centralizes number, duration, percentage, and time formatting
 * that was previously duplicated across 6-8 page files.
 */

// ---------------------------------------------------------------------------
// Number formatting
// ---------------------------------------------------------------------------

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

/**
 * Format a number in compact notation: 0, 847, 1.2K, 3.4M, 1.5B
 */
export function formatCompact(n: number | undefined | null): string {
  if (n === undefined || n === null) return "0";
  if (n === 0) return "0";
  if (Math.abs(n) < 1000) {
    return n % 1 === 0
      ? n.toLocaleString("en-US")
      : n.toLocaleString("en-US", { maximumFractionDigits: 1 });
  }
  return compactFormatter.format(n);
}

/**
 * Format a raw number with locale separators: 1,234,567
 */
export function formatNumber(n: number | undefined | null): string {
  if (n === undefined || n === null) return "0";
  return n.toLocaleString("en-US");
}

// ---------------------------------------------------------------------------
// Percentage / change formatting
// ---------------------------------------------------------------------------

export type ChangeDirection = "up" | "down" | "neutral";

export interface ChangeInfo {
  formatted: string;
  direction: ChangeDirection;
  value: number;
}

/**
 * Calculate and format the percentage change between two values.
 *
 * Returns { formatted: "+12.3%", direction: "up", value: 12.3 }
 */
export function computeChange(
  current: number,
  previous: number
): ChangeInfo {
  if (previous === 0) {
    if (current === 0) return { formatted: "0%", direction: "neutral", value: 0 };
    return { formatted: "+100%", direction: "up", value: 100 };
  }

  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? "+" : "";
  const direction: ChangeDirection =
    change > 0 ? "up" : change < 0 ? "down" : "neutral";

  return {
    formatted: `${sign}${change.toFixed(1)}%`,
    direction,
    value: change,
  };
}

/**
 * Format a pre-computed percentage change value.
 */
export function formatPercentChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

/**
 * Format a value as a percentage: "12.3%"
 */
export function formatPercent(
  n: number | undefined | null,
  decimals = 1
): string {
  if (n === undefined || n === null) return "0%";
  return `${n.toFixed(decimals)}%`;
}

// ---------------------------------------------------------------------------
// Duration formatting
// ---------------------------------------------------------------------------

/**
 * Format milliseconds into a human-readable duration.
 *
 * 0.5 → "500µs", 45 → "45ms", 1234 → "1.2s", 65000 → "1.1m"
 */
export function formatDuration(ms: number | undefined | null): string {
  if (ms === undefined || ms === null) return "0ms";
  if (ms < 1) return `${Math.round(ms * 1000)}µs`;
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

// ---------------------------------------------------------------------------
// Byte formatting
// ---------------------------------------------------------------------------

/**
 * Format bytes into a human-readable size: "1.2 KB", "3.4 MB"
 */
export function formatBytes(bytes: number | undefined | null): string {
  if (bytes === undefined || bytes === null || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// ---------------------------------------------------------------------------
// Time ago
// ---------------------------------------------------------------------------

/**
 * Format a date string or Date into a relative time string.
 *
 * "just now", "5m ago", "2h ago", "3d ago"
 */
export function timeAgo(date: string | Date | undefined | null): string {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// ---------------------------------------------------------------------------
// Granularity auto-selection
// ---------------------------------------------------------------------------

export type Granularity = "1m" | "5m" | "15m" | "1h" | "3h" | "6h" | "1d" | "1w";

/**
 * Auto-select time bucket granularity targeting 60-120 data points.
 *
 * @param timeRange - preset string like "1h", "6h", "24h", "7d", "30d"
 * @returns MongoDB-friendly granularity string
 */
export function getGranularity(timeRange: string): Granularity {
  switch (timeRange) {
    case "1h":
      return "1m";
    case "6h":
      return "5m";
    case "24h":
      return "15m";
    case "3d":
      return "1h";
    case "7d":
      return "3h";
    case "14d":
      return "6h";
    case "30d":
      return "1d";
    case "90d":
      return "1d";
    default:
      return "1h";
  }
}

/**
 * Get a human-readable label for the comparison period.
 */
export function getPreviousPeriodLabel(timeRange: string): string {
  switch (timeRange) {
    case "1h":
      return "vs previous hour";
    case "6h":
      return "vs previous 6h";
    case "24h":
      return "vs previous 24h";
    case "7d":
      return "vs previous 7d";
    case "30d":
      return "vs previous 30d";
    case "90d":
      return "vs previous 90d";
    default:
      return "vs previous period";
  }
}

// ---------------------------------------------------------------------------
// URL truncation
// ---------------------------------------------------------------------------

/**
 * Truncate a URL for display, keeping the path readable.
 */
export function truncateUrl(url: string, maxLength = 60): string {
  if (!url) return "";
  if (url.length <= maxLength) return url;
  // Try to keep the last segment visible
  const lastSlash = url.lastIndexOf("/");
  if (lastSlash > 0 && url.length - lastSlash < maxLength - 3) {
    return "..." + url.slice(-(maxLength - 3));
  }
  return url.slice(0, maxLength - 3) + "...";
}

// ---------------------------------------------------------------------------
// Release labels
// ---------------------------------------------------------------------------

/**
 * Show a release as `v2.4.1` whether the SDK sent `2.4.1` or `v2.4.1`.
 */
export function formatRelease(release: string): string {
  return /^v\d/i.test(release) ? release : `v${release}`;
}

// ---------------------------------------------------------------------------
// Axis tick formatter (for Recharts)
// ---------------------------------------------------------------------------

/**
 * Format axis tick values using compact notation.
 * Suitable for Recharts `tickFormatter` prop.
 */
export function formatAxisTick(value: number): string {
  if (value === 0) return "0";
  if (Math.abs(value) < 1) return value.toFixed(2);
  return formatCompact(value);
}

// ---------------------------------------------------------------------------
// Time range resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the app's time range state into API query params.
 *
 * For preset ranges ("1h", "24h", "7d", etc.) returns `{ timeRange: "24h" }`.
 * For custom ranges, encodes the dates into the timeRange param as
 * `"custom:ISO_START,ISO_END"` which the backend's parseTimeRange understands.
 */
export function resolveTimeRangeParams(
  selectedTimeRange: string,
  customTimeRange?: { start: Date; end: Date } | null
): { timeRange: string } {
  if (selectedTimeRange === "custom" && customTimeRange) {
    return {
      timeRange: `custom:${customTimeRange.start.toISOString()},${customTimeRange.end.toISOString()}`,
    };
  }
  // For presets, pass through as-is
  return { timeRange: selectedTimeRange === "custom" ? "24h" : selectedTimeRange };
}
