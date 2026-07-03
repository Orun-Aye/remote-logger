import { useMemo } from "react";
import { useAlerts } from "@/hooks/alerts.hook";
import { useRecentCommits } from "@/hooks/integrations.hooks";
import type { Alert } from "@/services/alert.service";

export type TimelineEvent = {
  id: string;
  type: "deploy" | "alert" | "team" | "config";
  label: string;
  meta: string;
  timestamp: string;
  href?: string;
};

/**
 * Merges multiple project event sources into a single timestamp-sorted list.
 *
 * Sources:
 *  - Recent alert lifecycle events (triggered + resolved)
 *  - Recent commits from a linked GitHub repo (if connected)
 *
 * Sorted newest-first, capped at `limit`.
 */
export function useRecentEvents(
  projectId: string,
  limit = 8,
): { events: TimelineEvent[]; isLoading: boolean } {
  const alertsQuery = useAlerts(projectId, { limit: 5 });
  const commitsQuery = useRecentCommits(projectId, 5);

  const events = useMemo<TimelineEvent[]>(() => {
    const alerts: Alert[] = (alertsQuery.data?.data as Alert[] | undefined) ?? [];
    const commits = commitsQuery.data ?? [];

    const alertEvents: TimelineEvent[] = alerts.flatMap((a) => {
      const out: TimelineEvent[] = [];
      // The triggered event
      if (a.triggeredAt) {
        out.push({
          id: `alert-trigger-${a._id}`,
          type: "alert",
          label: `Alert triggered: ${a.title}`,
          meta: a.environment || a.severity || "alert",
          timestamp: a.triggeredAt,
          href: `/alerts`,
        });
      }
      // If resolved, also show the resolution as a separate timeline entry
      if (a.status === "resolved") {
        const resolvedAt =
          a.metadata?.statusHistory?.find((h) => h.status === "resolved")
            ?.timestamp || a.updatedAt;
        if (resolvedAt) {
          out.push({
            id: `alert-resolve-${a._id}`,
            type: "alert",
            label: `${a.title} resolved`,
            meta: a.environment || "alert",
            timestamp: resolvedAt,
            href: `/alerts`,
          });
        }
      }
      return out;
    });

    const commitEvents: TimelineEvent[] = commits.map((c) => ({
      id: `commit-${c.sha}`,
      type: "deploy",
      label: c.message.split("\n")[0].slice(0, 80),
      meta: `${c.branch} · ${c.author.login}`,
      timestamp: c.committedAt,
      href: c.url,
    }));

    return [...alertEvents, ...commitEvents]
      .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
      .slice(0, limit);
  }, [alertsQuery.data, commitsQuery.data, limit]);

  return {
    events,
    isLoading: alertsQuery.isLoading || commitsQuery.isLoading,
  };
}
