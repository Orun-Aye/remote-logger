import { SignUpType } from "@/lib/schemas/auth";
import axios, { AxiosError } from "axios";
import { apiClient } from "./config";
import { ApiResponse } from "@/types/api";
import { ApiError, handleApiError } from "./auth.service";
import {
  LogEntry,
  LogFilters,
  LogSummary,
  LogTrends,
  LogTrendsGroupBy,
  UniqueError,
} from "@/types/analytics";
import { queryClient } from "@/lib/query/client";
import { useMutation } from "@tanstack/react-query";

export const logService = {
  // Create a new log entry (typically from SDK)
  createLog: async (
    projectId: string,
    logData: Omit<LogEntry, "id" | "projectId">
  ) => {
    try {
      const response = await apiClient.post<ApiResponse<LogEntry>>(
        `/${projectId}/logs`,
        logData
      );

      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to create log",
          response.status,
          response.data.errors
        );
      }

      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Get all logs for a project with filters
  getAllLogs: async (projectId: string, filters: LogFilters = {}) => {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await apiClient.get<ApiResponse>(
        `/${projectId}/logs?${params.toString()}`
      );

      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch logs",
          response.status,
          response.data.errors
        );
      }

      return {
        logs: response.data.data || [],
        meta: response.data.meta,
      };
    } catch (error) {
      handleApiError(error);
    }
  },

  // Get a specific log by ID
  getLogById: async (projectId: string, logId: string) => {
    try {
      const response = await apiClient.get<ApiResponse<LogEntry>>(
        `/${projectId}/logs/${logId}`
      );

      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch log",
          response.status,
          response.data.errors
        );
      }

      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Get log summary for a project
  getLogsSummary: async (projectId: string, timeRange?: string) => {
    try {
      const params = timeRange ? `?timeRange=${timeRange}` : "";
      const response = await apiClient.get<ApiResponse<LogSummary>>(
        `/${projectId}/logs/summary${params}`
      );

      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch log summary",
          response.status,
          response.data.errors
        );
      }

      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Get log trends (volume over time)
  getLogTrends: async (
    projectId: string,
    opts: { startDate?: Date; endDate?: Date; groupBy?: LogTrendsGroupBy } = {}
  ) => {
    try {
      // The backend reads startDate/endDate/groupBy (not timeRange/interval)
      const params = new URLSearchParams();
      if (opts.startDate) params.set("startDate", opts.startDate.toISOString());
      if (opts.endDate) params.set("endDate", opts.endDate.toISOString());
      if (opts.groupBy) params.set("groupBy", opts.groupBy);
      const response = await apiClient.get<ApiResponse<LogTrends>>(
        `/${projectId}/logs/trends?${params.toString()}`
      );

      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch log trends",
          response.status,
          response.data.errors
        );
      }

      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Get distinct values for a specific field
  getDistinctValues: async (projectId: string, field: string) => {
    try {
      const response = await apiClient.get<ApiResponse<string[]>>(
        `/${projectId}/logs/distinct-values/${field}`
      );

      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || `Failed to fetch distinct ${field} values`,
          response.status,
          response.data.errors
        );
      }

      return response.data.data || [];
    } catch (error) {
      handleApiError(error);
    }
  },

  // Get unique error messages
  getUniqueErrors: async (projectId: string, timeRange?: string) => {
    try {
      const params = timeRange ? `?timeRange=${timeRange}` : "";
      const response = await apiClient.get<ApiResponse<UniqueError[]>>(
        `/${projectId}/logs/unique-errors${params}`
      );

      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch unique errors",
          response.status,
          response.data.errors
        );
      }

      return response.data.data || [];
    } catch (error) {
      handleApiError(error);
    }
  },

  // Delete logs based on filters
  deleteLogs: async (projectId: string, filters: LogFilters) => {
    try {
      const response = await apiClient.delete<ApiResponse>(
        `/${projectId}/logs`,
        { data: filters }
      );

      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to delete logs",
          response.status,
          response.data.errors
        );
      }

      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Export logs to CSV or JSON
  exportLogs: async (
    projectId: string,
    format: "csv" | "json",
    filters: LogFilters = {}
  ) => {
    try {
      // Build export body: pick only fields the ExportLogsQueryDTO expects
      // and override limit to allow up to 10000 entries for export
      const exportBody: Record<string, any> = { format };
      if (filters.levels && filters.levels.length > 0) exportBody.levels = filters.levels;
      if (filters.services && filters.services.length > 0) exportBody.services = filters.services;
      if ((filters as any).environments && (filters as any).environments.length > 0) {
        exportBody.environments = (filters as any).environments;
      }
      if (filters.search) exportBody.search = filters.search;
      if (filters.startDate) exportBody.startDate = filters.startDate;
      // endDate defaults to now on the backend if not provided
      exportBody.limit = 10000;

      const response = await apiClient.post(
        `/${projectId}/logs/export`,
        exportBody,
        {
          responseType: "blob",
        }
      );

      // Determine filename from Content-Disposition header or generate a fallback
      let filename = `apperio-logs-${projectId}.${format}`;
      const disposition = response.headers["content-disposition"];
      if (disposition) {
        const match = disposition.match(/filename="?([^";\n]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      // Create download link
      const blob = new Blob([response.data], {
        type: format === "csv" ? "text/csv" : "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Batch create logs
  batchCreateLogs: async (projectId: string, logs: any[]) => {
    try {
      const response = await apiClient.post<ApiResponse>(
        `/${projectId}/logs/batch`,
        { logs }
      );

      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to batch create logs",
          response.status,
          response.data.errors
        );
      }

      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Structured query search
  structuredSearch: async (
    projectId: string,
    query: string,
    page: number = 1,
    limit: number = 100
  ) => {
    try {
      const response = await apiClient.post<ApiResponse>(
        `/${projectId}/logs/search`,
        { query, page, limit }
      );

      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to execute structured search",
          response.status,
          response.data.errors
        );
      }

      return {
        logs: response.data.data || [],
        meta: response.data.meta,
      };
    } catch (error) {
      handleApiError(error);
    }
  },

  // Saved Searches
  getSavedSearches: async (projectId: string) => {
    try {
      const response = await apiClient.get<ApiResponse>(
        `/projects/${projectId}/saved-searches`
      );

      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch saved searches",
          response.status,
          response.data.errors
        );
      }

      return response.data.data || [];
    } catch (error) {
      handleApiError(error);
    }
  },

  getDefaultSavedSearch: async (projectId: string) => {
    try {
      const response = await apiClient.get<ApiResponse>(
        `/projects/${projectId}/saved-searches/default`
      );

      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch default saved search",
          response.status,
          response.data.errors
        );
      }

      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  createSavedSearch: async (projectId: string, data: any) => {
    try {
      const response = await apiClient.post<ApiResponse>(
        `/projects/${projectId}/saved-searches`,
        data
      );

      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to create saved search",
          response.status,
          response.data.errors
        );
      }

      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  updateSavedSearch: async (projectId: string, searchId: string, data: any) => {
    try {
      const response = await apiClient.put<ApiResponse>(
        `/projects/${projectId}/saved-searches/${searchId}`,
        data
      );

      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to update saved search",
          response.status,
          response.data.errors
        );
      }

      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  deleteSavedSearch: async (projectId: string, searchId: string) => {
    try {
      const response = await apiClient.delete<ApiResponse>(
        `/projects/${projectId}/saved-searches/${searchId}`
      );

      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to delete saved search",
          response.status,
          response.data.errors
        );
      }

      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};



export const getAllLogs = logService.getAllLogs;
export const getLogById = logService.getLogById;
export const createLog = logService.createLog;
export const getLogSummary = logService.getLogsSummary;
export const getLogTrends = logService.getLogTrends;
export const getDistinctValues = logService.getDistinctValues;
export const getUniqueErrors = logService.getUniqueErrors;
export const deleteLogs = logService.deleteLogs;
export const exportLogs = logService.exportLogs;
export const batchCreateLogs = logService.batchCreateLogs;
export const structuredSearch = logService.structuredSearch;
export const getSavedSearches = logService.getSavedSearches;
export const getDefaultSavedSearch = logService.getDefaultSavedSearch;
export const createSavedSearch = logService.createSavedSearch;
export const updateSavedSearch = logService.updateSavedSearch;
export const deleteSavedSearch = logService.deleteSavedSearch;
