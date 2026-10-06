// ============================================
// TANSTACK QUERY HOOKS
// ============================================

import { queryClient } from "@/lib/query/client";
import { logService } from "@/services/log.service";
import { LogEntry, LogFilters, LogTrendsGroupBy } from "@/types/analytics";
import { useMutation, useQuery } from "@tanstack/react-query";

// Centralized query keys for logs (mirrors projects hook architecture)
export const logQueryKeys = {
  all: ["logs"] as const,
  list: (projectId: string, filters: LogFilters) =>
    [...logQueryKeys.all, "list", projectId, filters] as const,
  byId: (projectId: string, logId: string) =>
    [...logQueryKeys.all, "detail", projectId, logId] as const,
  summary: (projectId: string, timeRange?: string) =>
    [...logQueryKeys.all, "summary", projectId, timeRange] as const,
  trends: (projectId: string, startDate: string, endDate: string, groupBy: string) =>
    [...logQueryKeys.all, "trends", projectId, startDate, endDate, groupBy] as const,
  distinct: (projectId: string, field: string) =>
    [...logQueryKeys.all, "distinct", projectId, field] as const,
  uniqueErrors: (projectId: string, timeRange?: string) =>
    [...logQueryKeys.all, "unique-errors", projectId, timeRange] as const,
  savedSearches: (projectId: string) =>
    [...logQueryKeys.all, "saved-searches", projectId] as const,
};


// Hook to get all logs with filters
export const useLogs = (projectId: string, filters: LogFilters = {}) => {
  return useQuery({
    queryKey: logQueryKeys.list(projectId, filters),
    queryFn: () => logService.getAllLogs(projectId, filters),
    enabled: !!projectId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

// Hook to get logs from every project the user can access
export const useLogsAcrossProjects = (
  filters: LogFilters = {},
  options: { enabled?: boolean } = {}
) => {
  return useQuery({
    queryKey: logQueryKeys.list("all", filters),
    queryFn: () => logService.getLogsAcrossProjects(filters),
    enabled: options.enabled ?? true,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

// Hook to get a specific log by ID
export const useLog =(projectId: string, logId: string) => {
  return useQuery({
    queryKey: logQueryKeys.byId(projectId, logId),
    queryFn: () => logService.getLogById(projectId, logId),
    enabled: !!projectId && !!logId,
    staleTime: 5 * 60 * 1000, // 5 minutes (individual logs don't change)
  });
};

// Hook to get log summary
export const useLogSummary = (projectId: string, timeRange?: string) => {
  return useQuery({
    queryKey: logQueryKeys.summary(projectId, timeRange),
    queryFn: () => logService.getLogsSummary(projectId, timeRange),
    enabled: !!projectId,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
};

// Hook to get log trends (volume over time, bucketed server-side in UTC)
export const useLogTrends = (
  projectId: string,
  opts: { startDate: Date; endDate: Date; groupBy: LogTrendsGroupBy }
) => {
  return useQuery({
    queryKey: logQueryKeys.trends(
      projectId,
      opts.startDate.toISOString(),
      opts.endDate.toISOString(),
      opts.groupBy
    ),
    queryFn: () => logService.getLogTrends(projectId, opts),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

// Hook to get distinct values for a field
export const useDistinctValues = (projectId: string, field: string) => {
  return useQuery({
    queryKey: logQueryKeys.distinct(projectId, field),
    queryFn: () => logService.getDistinctValues(projectId, field),
    enabled: !!projectId && !!field,
    staleTime: 10 * 60 * 1000, // 10 minutes (distinct values change slowly)
  });
};

// Hook to get unique errors
export const useUniqueErrors = (projectId: string, timeRange?: string) => {
  return useQuery({
    queryKey: logQueryKeys.uniqueErrors(projectId, timeRange),
    queryFn: () => logService.getUniqueErrors(projectId, timeRange),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 3 * 60 * 1000, // Refetch every 3 minutes
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

// Hook to create a new log (typically used by SDKs)
export const useCreateLog = () => {
  return useMutation({
    mutationFn: ({
      projectId,
      logData,
    }: {
      projectId: string;
      logData: Omit<LogEntry, "id" | "projectId">;
    }) => logService.createLog(projectId, logData),
    onSuccess: (newLog, { projectId }) => {
      // Invalidate and refetch logs
      queryClient.invalidateQueries({ queryKey: logQueryKeys.all });

      // Optimistically add new log to cache if it's an error level
      if (newLog && newLog.level === "error") {
        queryClient.setQueryData(logQueryKeys.list(projectId, {} as LogFilters), (old: any) => {
          if (old?.logs) {
            return {
              ...old,
              logs: [newLog, ...old.logs.slice(0, 99)], // Keep latest 100
            };
          }
          return old;
        });
      }
    },
  });
};

// Hook to delete logs
export const useDeleteLogs = () => {
  return useMutation({
    mutationFn: ({
      projectId,
      filters,
    }: {
      projectId: string;
      filters: LogFilters;
    }) => logService.deleteLogs(projectId, filters),
    onSuccess: (_, { projectId }) => {
      // Invalidate all log-related queries
      queryClient.invalidateQueries({ queryKey: logQueryKeys.all });
    },
  });
};

// ============================================
// SAVED SEARCHES HOOKS
// ============================================

// Hook to get saved searches for a project
export const useSavedSearches = (projectId: string) => {
  return useQuery({
    queryKey: logQueryKeys.savedSearches(projectId),
    queryFn: () => logService.getSavedSearches(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get default saved search
export const useDefaultSavedSearch = (projectId: string) => {
  return useQuery({
    queryKey: [...logQueryKeys.savedSearches(projectId), "default"],
    queryFn: () => logService.getDefaultSavedSearch(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook to create a saved search
export const useCreateSavedSearch = () => {
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: any }) =>
      logService.createSavedSearch(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: logQueryKeys.savedSearches(projectId) });
    },
  });
};

// Hook to update a saved search
export const useUpdateSavedSearch = () => {
  return useMutation({
    mutationFn: ({ projectId, searchId, data }: { projectId: string; searchId: string; data: any }) =>
      logService.updateSavedSearch(projectId, searchId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: logQueryKeys.savedSearches(projectId) });
    },
  });
};

// Hook to delete a saved search
export const useDeleteSavedSearch = () => {
  return useMutation({
    mutationFn: ({ projectId, searchId }: { projectId: string; searchId: string }) =>
      logService.deleteSavedSearch(projectId, searchId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: logQueryKeys.savedSearches(projectId) });
    },
  });
};
