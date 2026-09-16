import { useMutation, useQuery } from "@tanstack/react-query";
import { projectService } from "@/services/project.service";
import {
  Project,
  ProjectCreateData,
  ProjectFilters,
  ProjectUpdateData,
} from "@/types/project.types";
import { queryClient } from "@/lib/query/client";

// ============================================
// PROJECTS QUERY HOOKS
// ============================================

export const queryKeys = {
  all: ["projects"] as const,
  lists: (filters: ProjectFilters) =>
    [...queryKeys.all, "list", filters] as const,
  details: (id: string) => [...queryKeys.all, "detail", id] as const,
  byApiKey: (apiKey: string) =>
    [...queryKeys.all, "by-api-key", apiKey] as const,
  summary: () => [...queryKeys.all, "summary"] as const,
  analytics: () => [...queryKeys.all, "analytics"] as const,
  stats: (id: string) => [...queryKeys.all, "stats", id] as const,
};

/**
 * Hook to get all projects for the current user.
 * @param filters Optional filters for the project list.
 */
export const useProjects = (filters: ProjectFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.lists(filters),
    queryFn: () => projectService.getAllProjects(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get a specific project by its ID.
 * @param projectId The ID of the project.
 */
export const useProject = (
  projectId: string,
  options: { timeRange?: number } = {}
) => {
  return useQuery({
    queryKey: [...queryKeys.details(projectId), options.timeRange ?? "default"],
    queryFn: () => projectService.getProjectById(projectId, options),
    enabled: !!projectId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to get project summary statistics.
 */
export const useProjectSummary = () => {
  return useQuery({
    queryKey: queryKeys.summary(),
    queryFn: () => projectService.getProjectsSummary(),
    staleTime: 60 * 1000, // 1 minute
  });
};

/**
 * Hook to get project analytics data.
 */
export const useProjectAnalytics = () => {
  return useQuery({
    queryKey: queryKeys.analytics(),
    queryFn: () => projectService.getProjectsAnalytics(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to get a single project's usage stats.
 * @param projectId The ID of the project.
 */
export const useProjectStats = (projectId: string) => {
  return useQuery({
    queryKey: queryKeys.stats(projectId),
    queryFn: () => projectService.getProjectStats(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};





// ============================================
// PROJECTS MUTATION HOOKS
// ============================================

/**
 * Hook to create a new project.
 */
export const useCreateProject = () => {
  return useMutation({
    mutationFn: (projectData: ProjectCreateData) =>
      projectService.createProject(projectData),
    onSuccess: (newProject) => {
      // Invalidate the main projects list and summary
      queryClient.invalidateQueries({ queryKey: queryKeys.lists({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics() });

      
    },
  });
};

/**
 * Hook to update an existing project.
 */
export const useUpdateProject = () => {
  return useMutation({
    mutationFn: ({
      projectId,
      projectData,
    }: {
      projectId: string;
      projectData: ProjectUpdateData;
    }) => projectService.updateProject(projectId, projectData),
    onSuccess: (updatedProject) => {
      if (updatedProject) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.details(updatedProject._id),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.lists({}) });
      }
    },
  });
};

/**
 * Hook to delete a single project.
 */
export const useDeleteProject = () => {
  return useMutation({
    mutationFn: ({
      projectId,
      hardDelete,
    }: {
      projectId: string;
      hardDelete?: boolean;
    }) => projectService.deleteProject(projectId, hardDelete),
    onSuccess: (_, { projectId }) => {
      // Invalidate the main project list and the specific project detail
      queryClient.invalidateQueries({ queryKey: queryKeys.lists({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.details(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.summary() });
    },
  });
};

/**
 * Hook to bulk delete multiple projects.
 */
export const useBulkDeleteProjects = () => {
  return useMutation({
    mutationFn: (projectIds: string[]) =>
      projectService.bulkDeleteProjects(projectIds),
    onSuccess: () => {
      // Invalidate all project-related lists and summaries
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
};

/**
 * Hook to archive a project.
 */
export const useArchiveProject = () => {
  return useMutation({
    mutationFn: (projectId: string) => projectService.archiveProject(projectId),
    onSuccess: (_data, projectId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.details(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.summary() });
    },
  });
};

/**
 * Hook to restore an archived project.
 */
export const useRestoreProject = () => {
  return useMutation({
    mutationFn: (projectId: string) => projectService.restoreProject(projectId),
    onSuccess: (_data, projectId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.details(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.summary() });
    },
  });
};

/**
 * Hook to regenerate a project's API key.
 */
export const useRegenerateApiKey = () => {
  return useMutation({
    mutationFn: (projectId: string) =>
      projectService.regenerateApiKey(projectId),
    onSuccess: (projectWithNewKey) => {
      if (projectWithNewKey) {
        // Invalidate the specific project's detail and its API key query
        queryClient.invalidateQueries({
          queryKey: queryKeys.details(projectWithNewKey.id),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.byApiKey(projectWithNewKey.apiKey),
        });
      }
    },
  });
};

/**
 * Hook to transfer project ownership to another team member.
 */
export const useTransferOwnership = () => {
  return useMutation({
    mutationFn: ({
      projectId,
      newOwnerId,
      currentOwnerId,
    }: {
      projectId: string;
      newOwnerId: string;
      currentOwnerId: string;
    }) => projectService.transferOwnership(projectId, newOwnerId, currentOwnerId),
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.details(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lists({}) });
    },
  });
};

/**
 * Hook to update a project's sampling configuration.
 */
export const useUpdateSamplingConfig = () => {
  return useMutation({
    mutationFn: ({
      projectId,
      samplingConfig,
    }: {
      projectId: string;
      samplingConfig: { enabled: boolean; mode: "rate" | "percentage"; value: number; alwaysKeepLevels?: string[] };
    }) => projectService.updateSamplingConfig(projectId, samplingConfig),
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.details(projectId) });
    },
  });
};

/**
 * Hook to apply retention policy to a project.
 */
export const useApplyRetention = () => {
  return useMutation({
    mutationFn: ({
      projectId,
      retentionConfig,
    }: {
      projectId: string;
      retentionConfig: { retentionDays: number };
    }) => projectService.applyRetention(projectId, retentionConfig),
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.details(projectId) });
    },
  });
};

/**
 * Hook to update a project's rate limit.
 */
export const useUpdateRateLimit = () => {
  return useMutation({
    mutationFn: ({
      projectId,
      rateLimit,
    }: {
      projectId: string;
      rateLimit: { maxRequestsPerMinute: number; burstLimit: number };
    }) => projectService.updateRateLimit(projectId, rateLimit),
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.details(projectId),
      });
    },
  });
};
