"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSubscription, useUsage } from "@/hooks/billing.hooks";
import {
  CreditCard,
  Calendar,
  ArrowUpRight,
  ExternalLink,
  Loader2,
  Zap,
  Database,
  FolderKanban,
  Users,
  Bell,
  Key,
} from "lucide-react";
import Link from "next/link";

/**
 * Format cents to a dollar display string.
 */
function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  if (cents < 0) return "Custom";
  return `$${(cents / 100).toFixed(0)}`;
}

/**
 * Format a large number with K/M suffix.
 */
function formatNumber(n: number): string {
  if (n === -1) return "Unlimited";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

/**
 * Get the color class for a usage percentage.
 */
function getUsageColor(percentage: number): string {
  if (percentage >= 100) return "text-status-danger";
  if (percentage >= 90) return "text-status-warn";
  if (percentage >= 80) return "text-level-warn";
  return "text-signal";
}

/**
 * Get the progress bar color class.
 */
function getProgressColor(percentage: number): string {
  if (percentage >= 100) return "[&>[data-slot=progress-indicator]]:bg-status-danger";
  if (percentage >= 90) return "[&>[data-slot=progress-indicator]]:bg-status-warn";
  if (percentage >= 80) return "[&>[data-slot=progress-indicator]]:bg-level-warn";
  return "[&>[data-slot=progress-indicator]]:bg-signal";
}

const usageMetrics = [
  { key: "logsIngested" as const, label: "Logs Ingested", limitKey: "maxLogs" as const, icon: Database },
  { key: "projects" as const, label: "Projects", limitKey: "maxProjects" as const, icon: FolderKanban },
  { key: "teamMembers" as const, label: "Team Members", limitKey: "maxTeamMembers" as const, icon: Users },
  { key: "alertRules" as const, label: "Alert Rules", limitKey: "maxAlertRules" as const, icon: Bell },
  { key: "apiTokens" as const, label: "API Tokens", limitKey: "maxApiTokens" as const, icon: Key },
];

export default function BillingPage() {
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: usage, isLoading: usageLoading } = useUsage();

  const isLoading = subLoading || usageLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Billing"
          description="Manage your subscription and usage"
        />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
        </div>
      </div>
    );
  }

  const statusVariant =
    subscription?.status === "active"
      ? "status-ok"
      : subscription?.status === "canceled"
      ? "status-warn"
      : "status-danger";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Manage your subscription and usage"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/billing/invoices">
                <CreditCard className="w-4 h-4" />
                Invoices
              </Link>
            </Button>
            <Button variant="signal" asChild>
              <Link href="/billing/plans">
                <Zap className="w-4 h-4" />
                Change Plan
              </Link>
            </Button>
          </div>
        }
      />

      {/* Current Plan Card */}
      <Card className="border-border-subtle bg-bg-surface">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-text-primary font-display text-lg">
                Current Plan
              </CardTitle>
              <CardDescription className="text-text-muted">
                Your active subscription details
              </CardDescription>
            </div>
            <Badge variant={statusVariant} className="capitalize">
              {subscription?.status || "active"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Plan info */}
            <div className="space-y-2">
              <p className="text-sm text-text-muted">Plan</p>
              <p className="text-2xl font-display font-bold text-text-primary capitalize">
                {usage?.planName || subscription?.plan || "Developer"}
              </p>
              {usage && (
                <p className="text-sm text-text-secondary">
                  {usage.limits.maxLogs === -1
                    ? "Unlimited logs"
                    : `${formatNumber(usage.limits.maxLogs)} logs/month`}
                </p>
              )}
            </div>

            {/* Billing cycle */}
            <div className="space-y-2">
              <p className="text-sm text-text-muted">Billing Cycle</p>
              <p className="text-lg font-medium text-text-primary capitalize">
                {subscription?.billingCycle || "Monthly"}
              </p>
              <p className="text-sm text-text-secondary">
                {subscription?.plan === "developer"
                  ? "Free forever"
                  : `Billed ${subscription?.billingCycle || "monthly"}`}
              </p>
            </div>

            {/* Next renewal */}
            <div className="space-y-2">
              <p className="text-sm text-text-muted flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Next Renewal
              </p>
              <p className="text-lg font-medium text-text-primary">
                {subscription?.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString(
                      "en-US",
                      { month: "long", day: "numeric", year: "numeric" }
                    )
                  : "N/A"}
              </p>
              {subscription?.cancelAt && (
                <p className="text-sm text-status-warn">
                  Cancels on{" "}
                  {new Date(subscription.cancelAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-border-faint">
            <Button variant="outline" size="sm" asChild>
              <Link href="/billing/plans">
                <ArrowUpRight className="w-3.5 h-3.5" />
                Change Plan
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Portal session is stubbed for now
                window.open(
                  "#billing-portal",
                  "_blank"
                );
              }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Manage Billing
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Meters */}
      <Card className="border-border-subtle bg-bg-surface">
        <CardHeader>
          <CardTitle className="text-text-primary font-display text-lg">
            Usage This Period
          </CardTitle>
          <CardDescription className="text-text-muted">
            Resource consumption for the current billing period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {usage &&
              usageMetrics.map((metric) => {
                const current = usage.usage[metric.key];
                const limit =
                  usage.limits[metric.limitKey];
                const percentage = usage.percentages[metric.key];
                const isUnlimited = limit === -1;
                const Icon = metric.icon;

                return (
                  <div
                    key={metric.key}
                    className="space-y-2 p-4 rounded-lg bg-bg-base border border-border-faint"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-text-muted" />
                        <span className="text-sm font-medium text-text-primary">
                          {metric.label}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          isUnlimited
                            ? "text-signal"
                            : getUsageColor(percentage)
                        }`}
                      >
                        {isUnlimited
                          ? "Unlimited"
                          : `${percentage}%`}
                      </span>
                    </div>
                    <Progress
                      value={isUnlimited ? 0 : Math.min(percentage, 100)}
                      className={`h-2 bg-bg-elevated ${
                        isUnlimited
                          ? ""
                          : getProgressColor(percentage)
                      }`}
                    />
                    <div className="flex justify-between text-xs text-text-muted">
                      <span>{formatNumber(current)} used</span>
                      <span>
                        {isUnlimited
                          ? "No limit"
                          : `${formatNumber(limit)} limit`}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
