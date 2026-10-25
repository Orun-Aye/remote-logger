"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignalDot } from "@/components/shared/SignalDot";
import { Alert } from "@/services/alert.service";
import { Clock, AlertTriangle, CheckCircle, BellOff, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface EnhancedAlertListItemProps {
  alert: Alert;
  isSelected?: boolean;
  onClick?: () => void;
}

export function EnhancedAlertListItem({
  alert,
  isSelected = false,
  onClick,
}: EnhancedAlertListItemProps) {
  // Severity border colors
  const severityBorderColors = {
    critical: "border-l-[var(--status-danger)]",
    warning: "border-l-[var(--status-warn)]",
    info: "border-l-[var(--data-info)]",
  };

  // Severity background colors (subtle)
  const severityBgColors = {
    critical: "bg-[var(--status-danger)]/5",
    warning: "bg-[var(--status-warn)]/5",
    info: "bg-[var(--data-info)]/5",
  };

  // Status icons
  const statusIcons = {
    active: <AlertTriangle className="h-4 w-4 text-[var(--status-danger)]" />,
    acknowledged: <Clock className="h-4 w-4 text-[var(--status-warn)]" />,
    resolved: <CheckCircle className="h-4 w-4 text-[var(--status-ok)]" />,
    snoozed: <BellOff className="h-4 w-4 text-[var(--text-tertiary)]" />,
  };

  const relativeTime = formatDistanceToNow(new Date(alert.triggeredAt), {
    addSuffix: true,
  });

  return (
    <Card
      onClick={onClick}
      className={`
        group relative overflow-hidden transition-all duration-200 cursor-pointer
        border-l-4 ${severityBorderColors[alert.severity]}
        ${severityBgColors[alert.severity]}
        ${
          isSelected
            ? "border-[var(--signal)] bg-[var(--signal)]/10"
            : "border-[var(--border-subtle)] hover:border-[var(--signal)]/50"
        }
        hover:shadow-lg hover:shadow-[var(--signal)]/10
      `}
    >
      <div className="p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Status Icon + Severity Dot */}
            <div className="flex items-center gap-2 mt-0.5">
              {statusIcons[alert.status]}
              <SignalDot
                status={
                  alert.severity === "critical"
                    ? "danger"
                    : alert.severity === "warning"
                    ? "warn"
                    : "info"
                }
                pulse={alert.status === "active"}
              />
            </div>

            {/* Title and Message */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--signal)] transition-colors">
                {alert.title}
              </h4>
              <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mt-1 font-mono">
                {alert.message}
              </p>
            </div>
          </div>

          {/* Chevron Icon */}
          <ChevronRight className="h-5 w-5 text-[var(--text-tertiary)] group-hover:text-[var(--signal)] transition-colors flex-shrink-0" />
        </div>

        {/* Metadata Row */}
        <div className="flex items-center gap-3 flex-wrap mt-3 pt-3 border-t border-[var(--border-faint)]">
          {/* Time */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
            <Clock className="h-3.5 w-3.5" />
            <span>{relativeTime}</span>
          </div>

          {/* Severity Badge */}
          <Badge
            className={`
              text-xs
              ${
                alert.severity === "critical"
                  ? "bg-[var(--status-danger)]/20 text-[var(--status-danger)] border-[var(--status-danger)]/30"
                  : alert.severity === "warning"
                  ? "bg-[var(--status-warn)]/20 text-[var(--status-warn)] border-[var(--status-warn)]/30"
                  : "bg-[var(--data-info)]/20 text-[var(--data-info)] border-[var(--data-info)]/30"
              }
            `}
            variant="outline"
          >
            {alert.severity.toUpperCase()}
          </Badge>

          {/* Environment */}
          {alert.environment && (
            <Badge
              className="text-xs bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)]"
              variant="outline"
            >
              {alert.environment}
            </Badge>
          )}

          {/* Tags */}
          {alert.tags && alert.tags.length > 0 && (
            <>
              {alert.tags.slice(0, 2).map((tag) => (
                <Badge
                  key={tag}
                  className="text-xs bg-[var(--signal)]/10 text-[var(--signal)] border-[var(--signal)]/30"
                  variant="outline"
                >
                  {tag}
                </Badge>
              ))}
              {alert.tags.length > 2 && (
                <span className="text-xs text-[var(--text-tertiary)]">
                  +{alert.tags.length - 2}
                </span>
              )}
            </>
          )}

          {/* Occurrence Count (Phase 2.2) */}
          {alert.metadata?.statusHistory && alert.metadata.statusHistory.length > 1 && (
            <Badge
              className="text-xs bg-[var(--data-purple)]/20 text-[var(--data-purple)] border-[var(--data-purple)]/30"
              variant="outline"
            >
              {alert.metadata.statusHistory.length} occurrences
            </Badge>
          )}
        </div>

        {/* Acknowledged/Resolved Info (Phase 2.2) */}
        {(alert.acknowledgedAt || alert.metadata?.autoResolved) && (
          <div className="mt-2 pt-2 border-t border-[var(--border-faint)] text-xs text-[var(--text-tertiary)]">
            {alert.acknowledgedAt && (
              <span>
                Acknowledged {formatDistanceToNow(new Date(alert.acknowledgedAt), { addSuffix: true })}
              </span>
            )}
            {alert.metadata?.autoResolved && (
              <span className="ml-2 text-[var(--status-warn)]">
                (Auto-resolved: {alert.metadata.autoResolvedReason})
              </span>
            )}
          </div>
        )}
      </div>

    </Card>
  );
}
