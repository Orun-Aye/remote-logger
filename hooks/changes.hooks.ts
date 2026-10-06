import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { changesService } from "@/services/changes.service";
import type { DeployMarkerLine } from "@/components/shared/TimeSeriesChart";

const changesKeys = {
  // limit is part of the key: the overview widgets and the full pages fetch
  // different page sizes and must not share a cache entry
  feed: (projectId: string, page: number, limit: number, type?: string) =>
    ["changes", "feed", projectId, page, limit, type ?? "all"] as const,
  deployments: (projectId: string, page: number, limit: number, kind?: string) =>
    ["changes", "deployments", projectId, page, limit, kind ?? "all"] as const,
  markers: (projectId: string, from: string, to: string) =>
    ["changes", "markers", projectId, from, to] as const,
  errorGroups: (projectId: string, page: number, status?: string, search?: string, sort?: string) =>
    ["error-groups", projectId, page, status ?? "all", search ?? "", sort ?? "lastSeen"] as const,
  errorGroupDetail: (projectId: string, groupId: string) =>
    ["error-groups", "detail", projectId, groupId] as const,
  appStatus: (owner?: string, repo?: string) =>
    ["integrations", "github", "app-status", owner ?? "", repo ?? ""] as const,
};

// ---------------------------------------------------------------------------
// Change feed
// ---------------------------------------------------------------------------

export function useChangesFeed(
  projectId: string,
  opts: { page?: number; limit?: number; type?: "commit" | "deployment" | "release" } = {},
) {
  const page = opts.page ?? 1;
  return useQuery({
    queryKey: changesKeys.feed(projectId, page, opts.limit ?? 20, opts.type),
    queryFn: () => changesService.getChanges(projectId, opts),
    enabled: !!projectId,
    // Pending AI summaries resolve within a couple of minutes of a push
    refetchInterval: (query) => {
      const items = query.state.data?.items;
      const hasPending = items?.some(
        (item: any) => item.itemType === "commit" && item.aiSummaryStatus === "pending",
      );
      return hasPending ? 15_000 : false;
    },
    staleTime: 60 * 1000,
  });
}

export function useExplainChange(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sha: string) => changesService.explainChange(projectId, sha),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["changes", "feed", projectId] });
    },
  });
}

export function useRetrySummaries(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (shas: string[]) => changesService.retrySummaries(projectId, shas),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["changes", "feed", projectId] });
    },
  });
}

export function useBackfillChanges(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => changesService.backfill(projectId),
    onSuccess: () => {
      toast.success("Syncing from GitHub");
      // The backfill runs async server-side; refresh shortly after
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["changes", "feed", projectId] });
      }, 4000);
    },
    onError: (err: any) => {
      // Most often a 409: no repo is linked, so there is nothing to import.
      // axios rejects before assertSuccess runs, so the server's message is
      // on the response, not on err.message.
      toast.error(
        err?.response?.data?.message || "Failed to sync from GitHub",
      );
    },
  });
}

// ---------------------------------------------------------------------------
// Deployments
// ---------------------------------------------------------------------------

export function useDeployments(
  projectId: string,
  opts: { page?: number; limit?: number; kind?: string } = {},
) {
  const page = opts.page ?? 1;
  return useQuery({
    queryKey: changesKeys.deployments(projectId, page, opts.limit ?? 20, opts.kind),
    queryFn: () => changesService.getDeployments(projectId, opts),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });
}

export function useDeployMarkers(
  projectId: string,
  from: Date,
  to: Date,
  enabled = true,
) {
  return useQuery({
    queryKey: changesKeys.markers(projectId, from.toISOString(), to.toISOString()),
    queryFn: () => changesService.getDeployMarkers(projectId, from, to),
    enabled: !!projectId && enabled,
    staleTime: 2 * 60 * 1000,
  });
}

const HOUR_MS = 60 * 60 * 1000;

/**
 * Deploy markers snapped onto a TimeSeriesChart's categorical x-axis.
 *
 * The fetch window is derived from the chart's own buckets (first bucket to
 * one bucket past the last), so every chart gets markers for exactly the span
 * it plots and the query key only changes when the data does.
 */
export function useChartDeployMarkers(
  projectId: string,
  bucketTimestamps: string[],
): DeployMarkerLine[] {
  // Callers often rebuild the array every render; key on its contents
  const bucketKey = bucketTimestamps.join("|");

  const buckets = useMemo(
    () =>
      bucketTimestamps
        .map((ts) => ({ ts, time: +new Date(ts) }))
        .filter((b) => Number.isFinite(b.time)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bucketKey],
  );

  const range = useMemo(() => {
    if (buckets.length === 0) return { from: new Date(0), to: new Date(0) };
    const first = buckets[0].time;
    const last = buckets[buckets.length - 1].time;
    const step = buckets.length > 1 ? last - buckets[buckets.length - 2].time : HOUR_MS;
    return { from: new Date(first), to: new Date(last + step) };
  }, [buckets]);

  const { data } = useDeployMarkers(projectId, range.from, range.to, buckets.length > 0);

  return useMemo(() => {
    if (!data?.length || buckets.length === 0) return [];
    return data.map((m) => {
      const target = +new Date(m.date);
      let nearest = buckets[0];
      for (const b of buckets) {
        if (Math.abs(b.time - target) < Math.abs(nearest.time - target)) {
          nearest = b;
        }
      }
      return {
        timestamp: nearest.ts,
        label: m.kind === "release" ? m.release || "Release" : "Deploy",
        verdict: m.verdict as DeployMarkerLine["verdict"],
      };
    });
  }, [data, buckets]);
}

// ---------------------------------------------------------------------------
// Error groups
// ---------------------------------------------------------------------------

export function useErrorGroups(
  projectId: string,
  opts: { page?: number; limit?: number; status?: string; search?: string; sort?: string } = {},
) {
  const page = opts.page ?? 1;
  return useQuery({
    queryKey: changesKeys.errorGroups(projectId, page, opts.status, opts.search, opts.sort),
    queryFn: () => changesService.getErrorGroups(projectId, opts),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });
}

export function useErrorGroupDetail(projectId: string, groupId: string | null) {
  return useQuery({
    queryKey: changesKeys.errorGroupDetail(projectId, groupId ?? ""),
    queryFn: () => changesService.getErrorGroupDetail(projectId, groupId!),
    enabled: !!projectId && !!groupId,
    // Suspect commits compute lazily server-side after first view
    refetchInterval: (query) => {
      const group = query.state.data?.group;
      return group && !group.suspectCommitsComputedAt ? 10_000 : false;
    },
  });
}

export function useUpdateErrorGroupStatus(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, status }: { groupId: string; status: "unresolved" | "resolved" | "ignored" }) =>
      changesService.updateErrorGroupStatus(projectId, groupId, status),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["error-groups", projectId] });
      qc.invalidateQueries({
        queryKey: changesKeys.errorGroupDetail(projectId, variables.groupId),
      });
    },
  });
}

export function useIssueDraft(projectId: string) {
  return useMutation({
    mutationFn: (groupId: string) => changesService.getIssueDraft(projectId, groupId),
  });
}

export function useCreateGithubIssue(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupId,
      title,
      body,
      labels,
    }: {
      groupId: string;
      title?: string;
      body?: string;
      labels?: string[];
    }) => changesService.createIssue(projectId, groupId, { title, body, labels }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["error-groups", projectId] });
      qc.invalidateQueries({
        queryKey: changesKeys.errorGroupDetail(projectId, variables.groupId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// GitHub App
// ---------------------------------------------------------------------------

export function useGithubAppStatus(owner?: string, repo?: string) {
  return useQuery({
    queryKey: changesKeys.appStatus(owner, repo),
    queryFn: () => changesService.getGithubAppStatus(owner, repo),
    staleTime: 5 * 60 * 1000,
  });
}
