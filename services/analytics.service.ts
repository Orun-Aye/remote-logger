import { ApiResponse } from "@/types/api";
import { apiClient } from "./config";
import { ApiError, handleApiError } from "./auth.service";

// ============================================
// ANALYTICS SERVICE
// ============================================

export const analyticsService = {
  // -----------------------------------------------
  // ERROR ANALYTICS
  // -----------------------------------------------

  /**
   * Get error timeline with hourly or daily granularity.
   */
  getErrorTimeline: async (
    projectId: string,
    params?: { timeRange?: string; granularity?: string }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      if (params?.granularity)
        searchParams.append("granularity", params.granularity);

      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/errors/timeline?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch error timeline",
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
   * Get top errors with details.
   */
  getTopErrors: async (
    projectId: string,
    params?: { timeRange?: string; limit?: number }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      if (params?.limit !== undefined)
        searchParams.append("limit", params.limit.toString());

      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/errors/top?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch top errors",
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
   * Get error distribution by type.
   */
  getErrorDistribution: async (
    projectId: string,
    params?: { timeRange?: string }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);

      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/errors/distribution?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch error distribution",
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
   * Get error stats (total, rate, affected users, MTTR).
   */
  getErrorStats: async (
    projectId: string,
    params?: { timeRange?: string }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);

      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/errors/stats?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch error stats",
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
   * Get error details by ID.
   */
  getErrorDetails: async (projectId: string, errorId: string) => {
    try {
      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/errors/${encodeURIComponent(errorId)}/details`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch error details",
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
   * Get error occurrence trends over time.
   */
  getErrorTrends: async (
    projectId: string,
    params?: { timeRange?: string; granularity?: string }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      if (params?.granularity)
        searchParams.append("granularity", params.granularity);

      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/errors/trends?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch error trends",
          response.status,
          response.data.errors
        );
      }
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // -----------------------------------------------
  // PERFORMANCE ANALYTICS
  // -----------------------------------------------

  /**
   * Get performance metrics timeline.
   */
  getPerformanceTimeline: async (
    projectId: string,
    params?: { timeRange?: string; granularity?: string }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      if (params?.granularity)
        searchParams.append("granularity", params.granularity);

      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/performance/timeline?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch performance timeline",
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
   * Get Core Web Vitals summary.
   */
  getWebVitals: async (
    projectId: string,
    params?: { timeRange?: string }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);

      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/performance/web-vitals?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch web vitals",
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
   * Get resource performance data.
   */
  getResourcePerformance: async (
    projectId: string,
    params?: { timeRange?: string; limit?: number }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      if (params?.limit !== undefined)
        searchParams.append("limit", params.limit.toString());

      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/performance/resources?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch resource performance",
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
   * Get page performance metrics.
   */
  getPagePerformance: async (
    projectId: string,
    params?: { timeRange?: string; limit?: number }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      if (params?.limit !== undefined)
        searchParams.append("limit", params.limit.toString());

      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/performance/pages?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch page performance",
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
   * Get performance score breakdown.
   */
  getPerformanceScore: async (
    projectId: string,
    params?: { timeRange?: string }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);

      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/performance/score?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch performance score",
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
   * Get slowest endpoints.
   */
  getSlowestEndpoints: async (
    projectId: string,
    params?: { timeRange?: string; limit?: number }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      if (params?.limit !== undefined)
        searchParams.append("limit", params.limit.toString());

      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/performance/slowest?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch slowest endpoints",
          response.status,
          response.data.errors
        );
      }
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // -----------------------------------------------
  // ACTIVITY ANALYTICS
  // -----------------------------------------------

  /**
   * Get recent activity feed (paginated, filterable).
   */
  getActivityFeed: async (
    projectId: string,
    params?: {
      page?: number;
      limit?: number;
      level?: string;
      eventType?: string;
      service?: string;
      environment?: string;
      search?: string;
      timeRange?: string;
    }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.page !== undefined)
        searchParams.append("page", params.page.toString());
      if (params?.limit !== undefined)
        searchParams.append("limit", params.limit.toString());
      if (params?.level) searchParams.append("level", params.level);
      if (params?.eventType)
        searchParams.append("eventType", params.eventType);
      if (params?.service) searchParams.append("service", params.service);
      if (params?.environment)
        searchParams.append("environment", params.environment);
      if (params?.search) searchParams.append("search", params.search);
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);

      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/activity/feed?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch activity feed",
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
   * Get activity stats by log level.
   */
  getActivityStats: async (
    projectId: string,
    params?: { timeRange?: string }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);

      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/activity/stats?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch activity stats",
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
   * Get distinct filter values for activity logs.
   */
  getActivityFilterValues: async (projectId: string) => {
    try {
      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/activity/filters/values`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch activity filter values",
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
   * Stream real-time activity logs.
   */
  getActivityStream: async (
    projectId: string,
    params?: { since?: string; limit?: number }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.since) searchParams.append("since", params.since);
      if (params?.limit !== undefined)
        searchParams.append("limit", params.limit.toString());

      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/activity/stream?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch activity stream",
          response.status,
          response.data.errors
        );
      }
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // -----------------------------------------------
  // SESSION ANALYTICS
  // -----------------------------------------------

  /**
   * Get session statistics.
   */
  getSessionStats: async (
    projectId: string,
    params?: { timeRange?: string }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);

      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/sessions/stats?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch session stats",
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
   * Get aggregated user journey flow.
   */
  getSessionJourneys: async (
    projectId: string,
    params?: { timeRange?: string; limit?: number }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      if (params?.limit !== undefined)
        searchParams.append("limit", params.limit.toString());

      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/sessions/journeys?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch session journeys",
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
   * Get recent sessions list.
   */
  getSessions: async (
    projectId: string,
    params?: { page?: number; limit?: number; timeRange?: string }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.page !== undefined)
        searchParams.append("page", params.page.toString());
      if (params?.limit !== undefined)
        searchParams.append("limit", params.limit.toString());
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);

      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/sessions?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch sessions",
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
   * Get session details with timeline.
   */
  getSessionDetails: async (projectId: string, sessionId: string) => {
    try {
      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/sessions/${sessionId}`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch session details",
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
   * Get session timeline events.
   */
  getSessionTimeline: async (projectId: string, sessionId: string) => {
    try {
      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/sessions/${sessionId}/timeline`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch session timeline",
          response.status,
          response.data.errors
        );
      }
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // -----------------------------------------------
  // ENVIRONMENT ANALYTICS
  // -----------------------------------------------

  /**
   * Get per-environment statistics.
   */
  getEnvironmentStats: async (
    projectId: string,
    params?: { timeRange?: string }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);

      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/environments/stats?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch environment stats",
          response.status,
          response.data.errors
        );
      }
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // -----------------------------------------------
  // OVERVIEW, EXPORT & ALERTS
  // -----------------------------------------------

  /**
   * Get dashboard overview for a project.
   */
  getOverview: async (
    projectId: string,
    params?: { timeRange?: string }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);

      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/overview?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch analytics overview",
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
   * Export analytics data.
   */
  exportData: async (
    projectId: string,
    exportOptions: {
      format?: string;
      timeRange?: string;
      sections?: string[];
      [key: string]: unknown;
    }
  ) => {
    try {
      const response = await apiClient.post<ApiResponse>(
        `/analytics/${projectId}/export`,
        exportOptions
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to export analytics data",
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
   * Get alerts and anomalies for a project.
   */
  getAlerts: async (
    projectId: string,
    params?: { timeRange?: string; status?: string; limit?: number }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      if (params?.status) searchParams.append("status", params.status);
      if (params?.limit !== undefined)
        searchParams.append("limit", params.limit.toString());

      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/alerts?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch analytics alerts",
          response.status,
          response.data.errors
        );
      }
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // -----------------------------------------------
  // NETWORK ANALYTICS
  // -----------------------------------------------

  getNetworkOverview: async (
    projectId: string,
    params?: { timeRange?: string }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/network/overview?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(response.data.message || "Failed to fetch network overview", response.status, response.data.errors);
      }
      return response.data.data;
    } catch (error) { handleApiError(error); }
  },

  getNetworkRequests: async (
    projectId: string,
    params?: { timeRange?: string; page?: number; limit?: number; status?: string; method?: string; search?: string }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      if (params?.page !== undefined) searchParams.append("page", params.page.toString());
      if (params?.limit !== undefined) searchParams.append("limit", params.limit.toString());
      if (params?.status) searchParams.append("status", params.status);
      if (params?.method) searchParams.append("method", params.method);
      if (params?.search) searchParams.append("search", params.search);
      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/network/requests?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(response.data.message || "Failed to fetch network requests", response.status, response.data.errors);
      }
      return response.data;
    } catch (error) { handleApiError(error); }
  },

  getNetworkTimeline: async (
    projectId: string,
    params?: { timeRange?: string; granularity?: string }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      if (params?.granularity) searchParams.append("granularity", params.granularity);
      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/network/timeline?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(response.data.message || "Failed to fetch network timeline", response.status, response.data.errors);
      }
      return response.data.data;
    } catch (error) { handleApiError(error); }
  },

  getNetworkTopEndpoints: async (
    projectId: string,
    params?: { timeRange?: string; limit?: number }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      if (params?.limit !== undefined) searchParams.append("limit", params.limit.toString());
      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/network/top-endpoints?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(response.data.message || "Failed to fetch network top endpoints", response.status, response.data.errors);
      }
      return response.data.data;
    } catch (error) { handleApiError(error); }
  },

  getNetworkSlowest: async (
    projectId: string,
    params?: { timeRange?: string; limit?: number }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      if (params?.limit !== undefined) searchParams.append("limit", params.limit.toString());
      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/network/slowest?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(response.data.message || "Failed to fetch slowest network requests", response.status, response.data.errors);
      }
      return response.data.data;
    } catch (error) { handleApiError(error); }
  },

  // -----------------------------------------------
  // INTERACTION ANALYTICS
  // -----------------------------------------------

  getInteractionOverview: async (
    projectId: string,
    params?: { timeRange?: string }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/interactions/overview?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(response.data.message || "Failed to fetch interaction overview", response.status, response.data.errors);
      }
      return response.data.data;
    } catch (error) { handleApiError(error); }
  },

  getInteractionTimeline: async (
    projectId: string,
    params?: { timeRange?: string; granularity?: string }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      if (params?.granularity) searchParams.append("granularity", params.granularity);
      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/interactions/timeline?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(response.data.message || "Failed to fetch interaction timeline", response.status, response.data.errors);
      }
      return response.data.data;
    } catch (error) { handleApiError(error); }
  },

  getInteractionTopElements: async (
    projectId: string,
    params?: { timeRange?: string; limit?: number }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      if (params?.limit !== undefined) searchParams.append("limit", params.limit.toString());
      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/interactions/top-elements?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(response.data.message || "Failed to fetch top elements", response.status, response.data.errors);
      }
      return response.data.data;
    } catch (error) { handleApiError(error); }
  },

  getInteractionMostClicked: async (
    projectId: string,
    params?: { timeRange?: string; limit?: number }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      if (params?.limit !== undefined) searchParams.append("limit", params.limit.toString());
      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/interactions/most-clicked?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(response.data.message || "Failed to fetch most clicked", response.status, response.data.errors);
      }
      return response.data.data;
    } catch (error) { handleApiError(error); }
  },

  // -----------------------------------------------
  // CONSOLE ANALYTICS
  // -----------------------------------------------

  getConsoleOverview: async (
    projectId: string,
    params?: { timeRange?: string }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/console/overview?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(response.data.message || "Failed to fetch console overview", response.status, response.data.errors);
      }
      return response.data.data;
    } catch (error) { handleApiError(error); }
  },

  getConsoleMessages: async (
    projectId: string,
    params?: { timeRange?: string; page?: number; limit?: number; level?: string; search?: string }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      if (params?.page !== undefined) searchParams.append("page", params.page.toString());
      if (params?.limit !== undefined) searchParams.append("limit", params.limit.toString());
      if (params?.level) searchParams.append("level", params.level);
      if (params?.search) searchParams.append("search", params.search);
      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/console/messages?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(response.data.message || "Failed to fetch console messages", response.status, response.data.errors);
      }
      return response.data;
    } catch (error) { handleApiError(error); }
  },

  getConsoleTimeline: async (
    projectId: string,
    params?: { timeRange?: string; granularity?: string }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      if (params?.granularity) searchParams.append("granularity", params.granularity);
      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/console/timeline?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(response.data.message || "Failed to fetch console timeline", response.status, response.data.errors);
      }
      return response.data.data;
    } catch (error) { handleApiError(error); }
  },

  // -----------------------------------------------
  // PAGEVIEW ANALYTICS
  // -----------------------------------------------

  getPageviewOverview: async (
    projectId: string,
    params?: { timeRange?: string }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/pageviews/overview?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(response.data.message || "Failed to fetch pageview overview", response.status, response.data.errors);
      }
      return response.data.data;
    } catch (error) { handleApiError(error); }
  },

  getPageviewTimeline: async (
    projectId: string,
    params?: { timeRange?: string; granularity?: string }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      if (params?.granularity) searchParams.append("granularity", params.granularity);
      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/pageviews/timeline?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(response.data.message || "Failed to fetch pageview timeline", response.status, response.data.errors);
      }
      return response.data.data;
    } catch (error) { handleApiError(error); }
  },

  getPageviewTopPages: async (
    projectId: string,
    params?: { timeRange?: string; limit?: number }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      if (params?.limit !== undefined) searchParams.append("limit", params.limit.toString());
      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/pageviews/top-pages?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(response.data.message || "Failed to fetch top pages", response.status, response.data.errors);
      }
      return response.data.data;
    } catch (error) { handleApiError(error); }
  },

  getPageviewReferrers: async (
    projectId: string,
    params?: { timeRange?: string; limit?: number }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      if (params?.limit !== undefined) searchParams.append("limit", params.limit.toString());
      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/pageviews/referrers?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(response.data.message || "Failed to fetch pageview referrers", response.status, response.data.errors);
      }
      return response.data.data;
    } catch (error) { handleApiError(error); }
  },

  getPageviewNavigationFlow: async (
    projectId: string,
    params?: { timeRange?: string; limit?: number }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeRange) searchParams.append("timeRange", params.timeRange);
      if (params?.limit !== undefined) searchParams.append("limit", params.limit.toString());
      const response = await apiClient.get<ApiResponse>(
        `/analytics/${projectId}/pageviews/navigation-flow?${searchParams.toString()}`
      );
      if (response.data.status === "error") {
        throw new ApiError(response.data.message || "Failed to fetch navigation flow", response.status, response.data.errors);
      }
      return response.data.data;
    } catch (error) { handleApiError(error); }
  },
};
