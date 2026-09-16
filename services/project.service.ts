import { ApiResponse } from "@/types/api";
import { apiClient } from "./config";
import { ApiError, handleApiError } from "./auth.service";
import {
  BulkDeletePayload,
  Project,
  ProjectCreateData,
  ProjectFilters,
  ProjectsAnalytics,
  ProjectsSummary,
  ProjectStats,
  ProjectUpdateData,
} from "@/types/project.types";
import { SDKConfig } from "@/types/sdk-config.types";

// ============================================
// PROJECTS SERVICE
// ============================================

export const projectService = {
  /**
   * Get all projects for the current user with optional filters.
   * @param filters - An object containing filters like `isActive` or `tag`.
   */
  getAllProjects: async (filters: ProjectFilters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await apiClient.get<ApiResponse>(
        `/projects?${params.toString()}`
      );

      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch projects",
          response.status,
          response.data.errors
        );
      }
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Get a specific project by its ID.
   * @param projectId - The ID of the project to fetch.
   */
  getProjectById: async (
    projectId: string,
    options: { timeRange?: number } = {}
  ) => {
    try {
      const params = new URLSearchParams({
        populateRefs: "true",
        includeAnalytics: "true",
        includeRecommendations: "true",
      });
      if (options.timeRange !== undefined) {
        params.set("timeRange", String(options.timeRange));
      }
      const response = await apiClient.get<ApiResponse<Project>>(
        `/projects/${projectId}?${params.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch project",
          response.status,
          response.data.errors
        );
      }
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Get a project by its API key.
   * @param apiKey - The API key for the project.
   */
  getProjectByApiKey: async (apiKey: string) => {
    try {
      const response = await apiClient.get<ApiResponse<Project>>(
        `/projects/by-api-key`,
        { headers: { "x-api-key": apiKey } }
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch project by API key",
          response.status,
          response.data.errors
        );
      }
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Get summary statistics for all projects.
   */
  getProjectsSummary: async () => {
    try {
      const response = await apiClient.get<ApiResponse<ProjectsSummary>>(
        `/projects/summary`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch project summary",
          response.status,
          response.data.errors
        );
      }
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Get analytics data for all projects.
   */
  getProjectsAnalytics: async () => {
    try {
      const response = await apiClient.get<ApiResponse<ProjectsAnalytics>>(
        `/projects/analytics`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch project analytics",
          response.status,
          response.data.errors
        );
      }
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Get usage statistics for a single project.
   * @param projectId - The ID of the project.
   */
  getProjectStats: async (projectId: string) => {
    try {
      const response = await apiClient.get<ApiResponse<ProjectStats>>(
        `/projects/${projectId}/stats`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch project stats",
          response.status,
          response.data.errors
        );
      }
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Create a new project.
   * @param projectData - The data for the new project.
   */
  createProject: async (projectData: ProjectCreateData) => {
    try {
      const response = await apiClient.post<ApiResponse>(
        "/projects",
        projectData
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to create project",
          response.status,
          response.data.errors
        );
      }
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Update an existing project.
   * @param projectId - The ID of the project to update.
   * @param projectData - The data to update.
   */
  updateProject: async (projectId: string, projectData: ProjectUpdateData) => {
    try {
      const response = await apiClient.put<ApiResponse>(
        `/projects/${projectId}`,
        projectData
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to update project",
          response.status,
          response.data.errors
        );
      }
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Archive a project.
   * @param projectId - The ID of the project to archive.
   */
  archiveProject: async (projectId: string) => {
    try {
      const response = await apiClient.put<ApiResponse>(
        `/projects/${projectId}/archive`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to archive project",
          response.status,
          response.data.errors
        );
      }
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Restore an archived project.
   * @param projectId - The ID of the project to restore.
   */
  restoreProject: async (projectId: string) => {
    try {
      const response = await apiClient.put<ApiResponse>(
        `/projects/${projectId}/restore`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to restore project",
          response.status,
          response.data.errors
        );
      }
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Delete a project.
   * @param projectId - The ID of the project to delete.
   * @param hardDelete - Optional flag to perform a hard delete.
   */
  deleteProject: async (projectId: string, hardDelete = false) => {
    try {
      const params = hardDelete ? "?hard=true" : "";
      const response = await apiClient.delete<ApiResponse>(
        `/projects/${projectId}${params}`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to delete project",
          response.status,
          response.data.errors
        );
      }
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Bulk delete projects.
   * @param projectIds - An array of project IDs to delete.
   */
  bulkDeleteProjects: async (projectIds: string[]) => {
    try {
      const payload: BulkDeletePayload = { projectIds };
      const response = await apiClient.delete<ApiResponse>("/projects", {
        data: payload,
      });
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to bulk delete projects",
          response.status,
          response.data.errors
        );
      }
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Regenerate a project's API key.
   * @param projectId - The ID of the project.
   */
  regenerateApiKey: async (projectId: string) => {
    try {
      const response = await apiClient.post<ApiResponse>(
        `/projects/${projectId}/regenerate-api-key`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to regenerate API key",
          response.status,
          response.data.errors
        );
      }
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Update a project's rate limit configuration.
   * @param projectId - The ID of the project.
   * @param rateLimit - The new rate limit configuration.
   */
  updateRateLimit: async (
    projectId: string,
    rateLimit: { maxRequestsPerMinute: number; burstLimit: number }
  ) => {
    try {
      const response = await apiClient.put<ApiResponse>(
        `/projects/${projectId}/rate-limit`,
        rateLimit
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to update rate limit",
          response.status,
          response.data.errors
        );
      }
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Update a project's sampling configuration.
   * @param projectId - The ID of the project.
   * @param samplingConfig - The new sampling configuration.
   */
  updateSamplingConfig: async (
    projectId: string,
    samplingConfig: { enabled: boolean; mode: "rate" | "percentage"; value: number; alwaysKeepLevels?: string[] }
  ) => {
    try {
      const response = await apiClient.put<ApiResponse>(
        `/projects/${projectId}/sampling-config`,
        samplingConfig
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to update sampling config",
          response.status,
          response.data.errors
        );
      }
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Apply retention policy to a project.
   * @param projectId - The ID of the project.
   * @param retentionConfig - The retention configuration.
   */
  applyRetention: async (
    projectId: string,
    retentionConfig: { retentionDays: number }
  ) => {
    try {
      const response = await apiClient.post<ApiResponse>(
        `/retention/${projectId}/apply`,
        retentionConfig
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to update retention settings",
          response.status,
          response.data.errors
        );
      }
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Get SDK configuration for a project.
   * @param projectId - The ID of the project.
   */
  getSDKConfig: async (projectId: string) => {
    try {
      const response = await apiClient.get<ApiResponse<SDKConfig>>(
        `/projects/${projectId}/config`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch SDK configuration",
          response.status,
        );
      }
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Update SDK configuration for a project.
   * @param projectId - The ID of the project.
   * @param config - The SDK configuration to update.
   */
  updateSDKConfig: async (projectId: string, config: SDKConfig) => {
    try {
      const response = await apiClient.put<ApiResponse<SDKConfig>>(
        `/projects/${projectId}/config`,
        config
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to update SDK configuration",
          response.status,
          response.data.errors
        );
      }
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Transfer project ownership to another user.
   * @param projectId - The ID of the project.
   * @param newOwnerId - The ID of the new owner.
   */
  transferOwnership: async (projectId: string, newOwnerId: string, currentOwnerId: string) => {
    try {
      const response = await apiClient.put<ApiResponse>(
        `/projects/${projectId}/transfer-ownership`,
        { newOwnerId, currentOwnerId }
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to transfer ownership",
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
