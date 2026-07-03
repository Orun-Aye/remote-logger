import { apiClient } from "./config";
import { ApiError, handleApiError } from "./auth.service";

export interface ApiResponse<T = any> {
  status: "success" | "error";
  message?: string;
  data?: T;
  meta?: any;
  errors?: string[];
}

// ---------------------------------------------------------------------------
// Types (mirror logger_backend Phase 7 models)
// ---------------------------------------------------------------------------

export interface ChangeCommit {
  _id: string;
  itemType: "commit";
  date: string;
  projectId: string;
  sha: string;
  message: string;
  authorName: string;
  authorLogin?: string;
  authorAvatarUrl?: string;
  committedAt: string;
  branch?: string;
  htmlUrl?: string;
  additions?: number;
  deletions?: number;
  filesChanged?: number;
  pushId?: string;
  aiSummary?: string;
  aiTechnicalSummary?: string;
  aiExplanation?: string;
  aiSummaryStatus: "pending" | "complete" | "skipped" | "failed";
  source: "webhook" | "backfill";
}

export interface DeploymentImpactWindow {
  logCount: number;
  errorCount: number;
  errorRate: number;
  avgResponseTime: number | null;
}

export interface DeploymentImpact {
  verdict: "healthy" | "improved" | "degraded" | "unknown";
  computedAt: string;
  windowMinutes: number;
  before: DeploymentImpactWindow;
  after: DeploymentImpactWindow;
  errorRateChangePct: number | null;
  responseTimeChangePct: number | null;
}

export interface ChangeDeployment {
  _id: string;
  itemType: "deployment" | "release";
  date: string;
  projectId: string;
  kind: "deployment" | "release";
  environment: string;
  release?: string;
  sha?: string;
  status: "pending" | "in_progress" | "success" | "failure" | "error" | "inactive";
  provider: "github" | "api";
  url?: string;
  description?: string;
  deployedBy?: string;
  startedAt: string;
  finishedAt?: string;
  impact?: DeploymentImpact;
}

export type ChangeFeedItem = ChangeCommit | ChangeDeployment;

export interface DeployMarker {
  date: string;
  kind: string;
  environment: string;
  release?: string;
  status: string;
  verdict?: string;
}

export interface ReleaseHealth {
  release: string;
  logCount: number;
  errorCount: number;
  errorRate: number;
  sessionCount: number;
  newErrorGroups: number;
  deployments: Array<{ startedAt: string; environment: string; status: string }>;
}

export interface LinkedIssue {
  provider: "github";
  repo: string;
  number: number;
  url: string;
  state: "open" | "closed";
  linkedAt: string;
}

export interface SuspectCommit {
  sha: string;
  score: number;
  rationale?: string;
  message?: string;
  htmlUrl?: string;
  authorLogin?: string;
}

export interface ErrorGroup {
  _id: string;
  projectId: string;
  fingerprint: string;
  title: string;
  errorName?: string;
  sampleMessage: string;
  sampleStack?: string;
  sampleLogId?: string;
  firstSeen: string;
  lastSeen: string;
  count: number;
  sessionCount: number;
  environments: string[];
  services: string[];
  releaseFirstSeen?: string;
  releaseLastSeen?: string;
  status: "unresolved" | "resolved" | "ignored";
  resolvedAt?: string;
  resolvedBy?: string;
  regressed: boolean;
  regressedAt?: string;
  linkedIssue?: LinkedIssue;
  suspectCommits?: SuspectCommit[];
  suspectCommitsComputedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ErrorGroupListMeta {
  page: number;
  limit: number;
  total: number;
  stats: { unresolved: number; resolved: number; ignored: number };
}

export interface IssueDraft {
  title: string;
  body: string;
  source: "ai" | "template";
}

export interface GithubAppStatus {
  enabled: boolean;
  installUrl: string | null;
  coversRepo?: boolean;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

function assertSuccess<T>(response: { status: number; data: ApiResponse<T> }, fallbackMessage: string): void {
  if (response.data.status === "error") {
    throw new ApiError(
      response.data.message || fallbackMessage,
      response.status,
      response.data.errors,
    );
  }
}

export const changesService = {
  // --- Change feed ---

  getChanges: async (
    projectId: string,
    opts: {
      page?: number;
      limit?: number;
      type?: "commit" | "deployment" | "release";
      author?: string;
    } = {},
  ): Promise<{ items: ChangeFeedItem[]; meta: { page: number; limit: number; total: number } }> => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(opts.page ?? 1));
      params.set("limit", String(opts.limit ?? 20));
      if (opts.type) params.set("type", opts.type);
      if (opts.author) params.set("author", opts.author);

      const response = await apiClient.get<ApiResponse<ChangeFeedItem[]>>(
        `/projects/${projectId}/changes?${params.toString()}`,
      );
      assertSuccess(response, "Failed to load changes");
      return {
        items: response.data.data || [],
        meta: response.data.meta || { page: 1, limit: 20, total: 0 },
      };
    } catch (error) {
      handleApiError(error);
      return { items: [], meta: { page: 1, limit: 20, total: 0 } };
    }
  },

  explainChange: async (
    projectId: string,
    sha: string,
  ): Promise<{ explanation: string; source: "ai" | "cache" | "unavailable" }> => {
    const response = await apiClient.post<
      ApiResponse<{ explanation: string; source: "ai" | "cache" | "unavailable" }>
    >(`/projects/${projectId}/changes/${sha}/explain`);
    assertSuccess(response, "Failed to explain change");
    return response.data.data!;
  },

  retrySummaries: async (projectId: string, shas: string[]): Promise<void> => {
    const response = await apiClient.post<ApiResponse>(
      `/projects/${projectId}/changes/retry-summaries`,
      { shas },
    );
    assertSuccess(response, "Failed to retry summaries");
  },

  backfill: async (projectId: string): Promise<void> => {
    const response = await apiClient.post<ApiResponse>(
      `/projects/${projectId}/changes/backfill`,
    );
    assertSuccess(response, "Failed to start backfill");
  },

  // --- Deployments & releases ---

  getDeployments: async (
    projectId: string,
    opts: { page?: number; limit?: number; environment?: string; kind?: string } = {},
  ): Promise<{ items: ChangeDeployment[]; meta: { page: number; limit: number; total: number } }> => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(opts.page ?? 1));
      params.set("limit", String(opts.limit ?? 20));
      if (opts.environment) params.set("environment", opts.environment);
      if (opts.kind) params.set("kind", opts.kind);

      const response = await apiClient.get<ApiResponse<ChangeDeployment[]>>(
        `/projects/${projectId}/deployments?${params.toString()}`,
      );
      assertSuccess(response, "Failed to load deployments");
      return {
        items: response.data.data || [],
        meta: response.data.meta || { page: 1, limit: 20, total: 0 },
      };
    } catch (error) {
      handleApiError(error);
      return { items: [], meta: { page: 1, limit: 20, total: 0 } };
    }
  },

  getDeployMarkers: async (
    projectId: string,
    from: Date,
    to: Date,
  ): Promise<DeployMarker[]> => {
    try {
      const params = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
      });
      const response = await apiClient.get<ApiResponse<DeployMarker[]>>(
        `/projects/${projectId}/deploy-markers?${params.toString()}`,
      );
      assertSuccess(response, "Failed to load deploy markers");
      return response.data.data || [];
    } catch (error) {
      // Markers are decorative — never break a chart over them
      return [];
    }
  },

  getReleaseHealth: async (
    projectId: string,
    release: string,
  ): Promise<ReleaseHealth | null> => {
    try {
      const response = await apiClient.get<ApiResponse<ReleaseHealth>>(
        `/projects/${projectId}/releases/${encodeURIComponent(release)}/health`,
      );
      assertSuccess(response, "Failed to load release health");
      return response.data.data || null;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  },

  // --- Error groups ---

  getErrorGroups: async (
    projectId: string,
    opts: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
      sort?: string;
    } = {},
  ): Promise<{ items: ErrorGroup[]; meta: ErrorGroupListMeta }> => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(opts.page ?? 1));
      params.set("limit", String(opts.limit ?? 20));
      if (opts.status) params.set("status", opts.status);
      if (opts.search) params.set("search", opts.search);
      if (opts.sort) params.set("sort", opts.sort);

      const response = await apiClient.get<ApiResponse<ErrorGroup[]>>(
        `/projects/${projectId}/error-groups?${params.toString()}`,
      );
      assertSuccess(response, "Failed to load error groups");
      return {
        items: response.data.data || [],
        meta: response.data.meta || {
          page: 1,
          limit: 20,
          total: 0,
          stats: { unresolved: 0, resolved: 0, ignored: 0 },
        },
      };
    } catch (error) {
      handleApiError(error);
      return {
        items: [],
        meta: { page: 1, limit: 20, total: 0, stats: { unresolved: 0, resolved: 0, ignored: 0 } },
      };
    }
  },

  getErrorGroupDetail: async (
    projectId: string,
    groupId: string,
  ): Promise<{ group: ErrorGroup; recentEvents: any[] } | null> => {
    try {
      const response = await apiClient.get<
        ApiResponse<{ group: ErrorGroup; recentEvents: any[] }>
      >(`/projects/${projectId}/error-groups/${groupId}`);
      assertSuccess(response, "Failed to load error group");
      return response.data.data || null;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  },

  updateErrorGroupStatus: async (
    projectId: string,
    groupId: string,
    status: "unresolved" | "resolved" | "ignored",
  ): Promise<ErrorGroup> => {
    const response = await apiClient.patch<ApiResponse<ErrorGroup>>(
      `/projects/${projectId}/error-groups/${groupId}`,
      { status },
    );
    assertSuccess(response, "Failed to update status");
    return response.data.data!;
  },

  getIssueDraft: async (
    projectId: string,
    groupId: string,
  ): Promise<IssueDraft> => {
    const response = await apiClient.get<ApiResponse<IssueDraft>>(
      `/projects/${projectId}/error-groups/${groupId}/issue-draft`,
    );
    assertSuccess(response, "Failed to build issue draft");
    return response.data.data!;
  },

  createIssue: async (
    projectId: string,
    groupId: string,
    body: { title?: string; body?: string; labels?: string[] },
  ): Promise<{ issue: { number: number; url: string }; alreadyLinked: boolean }> => {
    const response = await apiClient.post<
      ApiResponse<{ issue: { number: number; url: string }; alreadyLinked: boolean }>
    >(`/projects/${projectId}/error-groups/${groupId}/create-issue`, body);
    assertSuccess(response, "Failed to create GitHub issue");
    return response.data.data!;
  },

  // --- GitHub App ---

  getGithubAppStatus: async (
    owner?: string,
    repo?: string,
  ): Promise<GithubAppStatus> => {
    try {
      const params = new URLSearchParams();
      if (owner) params.set("owner", owner);
      if (repo) params.set("repo", repo);
      const response = await apiClient.get<ApiResponse<GithubAppStatus>>(
        `/integrations/github/app-status?${params.toString()}`,
      );
      assertSuccess(response, "Failed to load GitHub App status");
      return response.data.data || { enabled: false, installUrl: null };
    } catch (error) {
      return { enabled: false, installUrl: null };
    }
  },
};
