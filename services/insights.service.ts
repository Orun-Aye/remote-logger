import { ApiResponse } from "@/types/api";
import { AI_REQUEST_TIMEOUT_MS, apiClient } from "./config";
import { ApiError, handleApiError } from "./auth.service";
import {
  ProjectInsights,
  InsightsFilters,
  RootCauseAnalysis,
  AskQuestionResponse,
  OptimizationSuggestion,
  EnrichedInsights,
} from "@/types/insights.types";

// ============================================
// INSIGHTS SERVICE
// ============================================

export const insightsService = {
  /**
   * Get statistical insights for a project
   */
  getProjectInsights: async (
    projectId: string,
    filters: InsightsFilters = {}
  ) => {
    try {
      const params = new URLSearchParams();
      if (filters.range) {
        params.append("range", filters.range);
      }

      const response = await apiClient.get<ApiResponse<ProjectInsights>>(
        `/insights/${projectId}?${params.toString()}`
      );

      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch project insights",
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
   * Invalidate the insights cache for a project
   */
  invalidateCache: async (projectId: string) => {
    try {
      const response = await apiClient.get<ApiResponse>(
        `/insights/${projectId}/invalidate`
      );

      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to invalidate cache",
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
   * Get AI root cause analysis for an error
   */
  getRootCause: async (
    projectId: string,
    errorId: string
  ): Promise<RootCauseAnalysis | undefined> => {
    try {
      const response = await apiClient.get<ApiResponse<RootCauseAnalysis>>(
        `/insights/${projectId}/root-cause/${errorId}`,
        { timeout: AI_REQUEST_TIMEOUT_MS }
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch root cause",
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
   * Ask a natural language question about the project
   */
  askQuestion: async (
    projectId: string,
    question: string
  ): Promise<AskQuestionResponse | undefined> => {
    try {
      const response = await apiClient.post<ApiResponse<AskQuestionResponse>>(
        `/insights/${projectId}/ask`,
        { question },
        { timeout: AI_REQUEST_TIMEOUT_MS }
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to ask question",
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
   * Get optimization suggestions (heuristic + AI)
   */
  getOptimizationSuggestions: async (
    projectId: string
  ): Promise<{ suggestions: OptimizationSuggestion[] } | undefined> => {
    try {
      const response = await apiClient.get<
        ApiResponse<OptimizationSuggestion[] | { suggestions: OptimizationSuggestion[] }>
      >(`/insights/${projectId}/suggestions`, { timeout: AI_REQUEST_TIMEOUT_MS });
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch suggestions",
          response.status,
          response.data.errors
        );
      }
      // The backend sends the array itself as `data`
      const data = response.data.data;
      return { suggestions: Array.isArray(data) ? data : data?.suggestions ?? [] };
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Get enriched insights (statistical + AI summary + anomalies)
   */
  getEnrichedInsights: async (
    projectId: string,
    options: { timeRange?: number } = {}
  ): Promise<EnrichedInsights | undefined> => {
    try {
      const params = new URLSearchParams();
      if (options.timeRange) {
        params.append("timeRange", options.timeRange.toString());
      }
      const response = await apiClient.get<ApiResponse<EnrichedInsights>>(
        `/insights/${projectId}/enriched?${params.toString()}`,
        { timeout: AI_REQUEST_TIMEOUT_MS }
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch enriched insights",
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

// Export individual functions for convenience
export const getProjectInsights = insightsService.getProjectInsights;
export const invalidateInsightsCache = insightsService.invalidateCache;
export const getRootCause = insightsService.getRootCause;
export const askQuestion = insightsService.askQuestion;
export const getOptimizationSuggestions = insightsService.getOptimizationSuggestions;
export const getEnrichedInsights = insightsService.getEnrichedInsights;
