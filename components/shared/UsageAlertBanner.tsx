"use client";

import { useState, useEffect } from "react";
import { useUsage } from "@/hooks/billing.hooks";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle, TrendingUp } from "lucide-react";
import Link from "next/link";

/**
 * Resource labels for display in the banner.
 */
const resourceLabels: Record<string, string> = {
  logsIngested: "Logs",
  projects: "Projects",
  teamMembers: "Team Members",
  alertRules: "Alert Rules",
  apiTokens: "API Tokens",
};

/**
 * UsageAlertBanner - Shows a dismissible banner when any resource is at 80%+ usage.
 * Yellow at 80%, orange at 90%, red at 100%+.
 */
export function UsageAlertBanner() {
  const { data: usage } = useUsage();
  const [dismissed, setDismissed] = useState(false);

  // Check localStorage for dismissal state on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissedAt = localStorage.getItem("usage-banner-dismissed-at");
      if (dismissedAt) {
        // Re-show after 24 hours
        const dismissedTime = parseInt(dismissedAt, 10);
        if (Date.now() - dismissedTime < 24 * 60 * 60 * 1000) {
          setDismissed(true);
        }
      }
    }
  }, []);

  if (dismissed || !usage) return null;

  // Find resources near or over limit
  const warnings: Array<{
    resource: string;
    percentage: number;
    current: number;
    limit: number;
  }> = [];

  const percentageEntries = Object.entries(usage.percentages) as Array<
    [string, number]
  >;
  const usageEntries = usage.usage as Record<string, number>;
  const limitsMap: Record<string, number> = {
    logsIngested: usage.limits.maxLogs,
    projects: usage.limits.maxProjects,
    teamMembers: usage.limits.maxTeamMembers,
    alertRules: usage.limits.maxAlertRules,
    apiTokens: usage.limits.maxApiTokens,
  };

  for (const [key, percentage] of percentageEntries) {
    if (key === "apiCalls") continue; // Skip apiCalls since it's not limited
    const limit = limitsMap[key];
    if (limit === -1 || limit === undefined) continue; // Skip unlimited
    if (percentage >= 80) {
      warnings.push({
        resource: key,
        percentage,
        current: usageEntries[key] || 0,
        limit,
      });
    }
  }

  if (warnings.length === 0) return null;

  // Sort by percentage descending
  warnings.sort((a, b) => b.percentage - a.percentage);

  // Determine severity based on highest percentage
  const maxPercentage = warnings[0].percentage;

  let bgClass: string;
  let borderClass: string;
  let textClass: string;
  let iconClass: string;

  if (maxPercentage >= 100) {
    bgClass = "bg-status-danger/10";
    borderClass = "border-status-danger/30";
    textClass = "text-status-danger";
    iconClass = "text-status-danger";
  } else if (maxPercentage >= 90) {
    bgClass = "bg-status-warn/10";
    borderClass = "border-status-warn/30";
    textClass = "text-status-warn";
    iconClass = "text-status-warn";
  } else {
    bgClass = "bg-level-warn/10";
    borderClass = "border-level-warn/30";
    textClass = "text-level-warn";
    iconClass = "text-level-warn";
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "usage-banner-dismissed-at",
        Date.now().toString()
      );
    }
  };

  // Build message
  const topWarnings = warnings.slice(0, 3);
  const warningText = topWarnings
    .map(
      (w) =>
        `${resourceLabels[w.resource] || w.resource} (${w.percentage}%)`
    )
    .join(", ");

  return (
    <div
      className={`${bgClass} border ${borderClass} rounded-lg px-4 py-3 flex items-center gap-3`}
    >
      <AlertTriangle className={`w-4 h-4 shrink-0 ${iconClass}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${textClass}`}>
          {maxPercentage >= 100 ? "Usage limit exceeded" : "Approaching usage limit"}
        </p>
        <p className="text-xs text-text-muted mt-0.5 truncate">
          {warningText}
          {warnings.length > 3 && ` and ${warnings.length - 3} more`}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 h-7 text-xs"
        asChild
      >
        <Link href="/billing/plans">
          <TrendingUp className="w-3 h-3" />
          Upgrade
        </Link>
      </Button>
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 rounded hover:bg-bg-elevated/50 text-text-muted hover:text-text-primary transition-colors"
        aria-label="Dismiss usage warning"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
