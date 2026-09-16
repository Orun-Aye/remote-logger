import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { integrationsService } from "@/services/integrations.service";

const integrationsKeys = {
  github: ["integrations", "github"] as const,
  repos: (search?: string) =>
    ["integrations", "github", "repos", search ?? ""] as const,
  commits: (projectId: string, limit: number) =>
    ["integrations", "github", "commits", projectId, limit] as const,
};

export function useGithubConnection() {
  return useQuery({
    queryKey: integrationsKeys.github,
    queryFn: () => integrationsService.getGithubConnection(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGithubRepos(search?: string, enabled = true) {
  return useQuery({
    queryKey: integrationsKeys.repos(search),
    queryFn: () => integrationsService.listRepos(search),
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useDisconnectGithub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => integrationsService.disconnectGithub(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: integrationsKeys.github });
    },
  });
}

export function useLinkGithubRepo(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { owner: string; repo: string; branch?: string }) =>
      integrationsService.linkRepo(projectId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", "details", projectId] });
      qc.invalidateQueries({
        queryKey: ["integrations", "github", "commits", projectId],
      });
    },
  });
}

export function useUnlinkGithubRepo(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => integrationsService.unlinkRepo(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", "details", projectId] });
      qc.invalidateQueries({
        queryKey: ["integrations", "github", "commits", projectId],
      });
    },
  });
}

export function useRecentCommits(projectId: string, limit = 5) {
  return useQuery({
    queryKey: integrationsKeys.commits(projectId, limit),
    queryFn: () => integrationsService.getRecentCommits(projectId, limit),
    enabled: !!projectId,
    // Refresh every 2 minutes — commits aren't real-time critical
    staleTime: 2 * 60 * 1000,
    // Don't retry on 404 (no linked repo) which is handled inside the service
    retry: false,
  });
}
