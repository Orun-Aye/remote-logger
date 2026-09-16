import { apiClient, getAuthToken } from "./config";
import { ApiError, handleApiError } from "./auth.service";

export interface ApiResponse<T = any> {
  status: "success" | "error";
  message?: string;
  data?: T;
  errors?: string[];
}

export interface GithubConnectionStatus {
  connected: boolean;
  githubLogin?: string;
  githubUserId?: number;
  connectedAt?: string;
}

export interface GithubRepoSummary {
  owner: string;
  repo: string;
  fullName: string;
  defaultBranch: string;
  private: boolean;
}

export interface GithubRepoLink {
  owner: string;
  repo: string;
  branch: string;
  linkedAt: string;
}

export interface RecentCommit {
  sha: string;
  message: string;
  url: string;
  branch: string;
  committedAt: string;
  author: {
    login: string;
    name: string;
    avatar?: string;
  };
}

export const integrationsService = {
  /** Returns current user's GitHub connection state. */
  getGithubConnection: async (): Promise<GithubConnectionStatus> => {
    try {
      const response = await apiClient.get<ApiResponse<GithubConnectionStatus>>(
        "/integrations/github/status",
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to fetch GitHub connection",
          response.status,
          response.data.errors,
        );
      }
      return response.data.data || { connected: false };
    } catch (error) {
      handleApiError(error);
      return { connected: false };
    }
  },

  /** Returns the absolute redirect URL the user should open to start the OAuth flow. */
  getConnectUrl: (returnTo?: string): string => {
    const base = apiClient.defaults.baseURL || "";
    const params = new URLSearchParams();
    if (returnTo) params.set("returnTo", returnTo);
    return `${base}/integrations/github/connect?${params.toString()}`;
  },

  /**
   * Absolute URL that starts a GitHub App installation. Opened as a top-level
   * navigation, so the JWT rides along as `?token=` — the install route uses
   * optionalAuth precisely because no Authorization header can be set here.
   */
  getAppInstallUrl: (returnTo?: string): string => {
    const base = apiClient.defaults.baseURL || "";
    const params = new URLSearchParams();
    if (returnTo) params.set("returnTo", returnTo);
    const token = getAuthToken();
    if (token) params.set("token", token);
    return `${base}/integrations/github/install?${params.toString()}`;
  },

  disconnectGithub: async (): Promise<void> => {
    try {
      const response = await apiClient.delete<ApiResponse>(
        "/integrations/github/disconnect",
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to disconnect GitHub",
          response.status,
          response.data.errors,
        );
      }
    } catch (error) {
      handleApiError(error);
    }
  },

  listRepos: async (search?: string): Promise<GithubRepoSummary[]> => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const response = await apiClient.get<ApiResponse<GithubRepoSummary[]>>(
        `/integrations/github/repos?${params.toString()}`,
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to list GitHub repos",
          response.status,
          response.data.errors,
        );
      }
      return response.data.data || [];
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  linkRepo: async (
    projectId: string,
    body: { owner: string; repo: string; branch?: string },
  ): Promise<GithubRepoLink> => {
    try {
      const response = await apiClient.post<ApiResponse<GithubRepoLink>>(
        `/projects/${projectId}/github-link`,
        body,
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to link repo",
          response.status,
          response.data.errors,
        );
      }
      return response.data.data!;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  unlinkRepo: async (projectId: string): Promise<void> => {
    try {
      const response = await apiClient.delete<ApiResponse>(
        `/projects/${projectId}/github-link`,
      );
      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to unlink repo",
          response.status,
          response.data.errors,
        );
      }
    } catch (error) {
      handleApiError(error);
    }
  },

  getRecentCommits: async (
    projectId: string,
    limit = 5,
  ): Promise<RecentCommit[]> => {
    try {
      const response = await apiClient.get<ApiResponse<RecentCommit[]>>(
        `/projects/${projectId}/recent-commits?limit=${limit}`,
      );
      if (response.data.status === "error") {
        // 404 = repo not linked → return empty rather than throw
        if (response.status === 404) return [];
        throw new ApiError(
          response.data.message || "Failed to load commits",
          response.status,
          response.data.errors,
        );
      }
      return response.data.data || [];
    } catch (error: any) {
      // Treat "no linked repo" as a non-error so the timeline can render
      if (error?.response?.status === 404) return [];
      handleApiError(error);
      return [];
    }
  },
};
