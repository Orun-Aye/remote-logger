import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { changesService } from "@/services/changes.service";

const changesKeys = {
  feed: (projectId: string, page: number, type?: string) =>
    ["changes", "feed", projectId, page, type ?? "all"] as const,
  deployments: (projectId: string, page: number, kind?: string) =>
    ["changes", "deployments", projectId, page, kind ?? "all"] as const,
  markers: (projectId: string, from: string, to: string) =>
    ["changes", "markers", projectId, from, to] as const,
  releaseHealth: (projectId: string, release: string) =>
    ["changes", "release-health", projectId, release] as const,
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
    queryKey: changesKeys.feed(projectId, page, opts.type),
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
      // The backfill runs async server-side; refresh shortly after
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["changes", "feed", projectId] });
      }, 4000);
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
    queryKey: changesKeys.deployments(projectId, page, opts.kind),
    queryFn: () => changesService.getDeployments(projectId, opts),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });
}

export function useDeployMarkers(projectId: string, from: Date, to: Date) {
  return useQuery({
    queryKey: changesKeys.markers(projectId, from.toISOString(), to.toISOString()),
    queryFn: () => changesService.getDeployMarkers(projectId, from, to),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useReleaseHealth(projectId: string, release: string | undefined) {
  return useQuery({
    queryKey: changesKeys.releaseHealth(projectId, release ?? ""),
    queryFn: () => changesService.getReleaseHealth(projectId, release!),
    enabled: !!projectId && !!release,
    staleTime: 2 * 60 * 1000,
  });
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
