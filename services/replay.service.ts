import axios from "axios";
import type { eventWithTime } from "@rrweb/types";
import { apiClient } from "./config";
import { handleApiError } from "./auth.service";

export interface ReplaySegment {
  segmentIndex: number;
  events: eventWithTime[];
  startTimestamp: number;
  endTimestamp: number;
  eventCount: number;
}

export interface ReplaySettings {
  enabled: boolean;
  /** Fraction of sessions recorded, 0 to 1 */
  sampleRate: number;
}

export const replayService = {
  /**
   * All recorded segments for a session, in segment order. Resolves to an
   * empty array when the session has no replay (the API answers 404).
   */
  getSessionReplay: async (projectId: string, sessionId: string): Promise<ReplaySegment[]> => {
    try {
      const response = await apiClient.get(
        `/${projectId}/replay/${encodeURIComponent(sessionId)}`,
        // A minute of replay can be several MB; the default 10s is too tight
        { timeout: 60_000 }
      );
      const segments: ReplaySegment[] = response.data?.data ?? [];
      return [...segments].sort((a, b) => a.segmentIndex - b.segmentIndex);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return [];
      return handleApiError(error);
    }
  },

  /**
   * Which of these sessions have a playable replay. Cheap: no recordings are
   * downloaded, so it is safe to call wherever a "Watch replay" link might go.
   */
  getAvailableReplays: async (projectId: string, sessionIds: string[]): Promise<string[]> => {
    if (sessionIds.length === 0) return [];
    try {
      const response = await apiClient.get(`/${projectId}/replay/available`, {
        params: { sessionIds: sessionIds.join(",") },
      });
      return response.data?.data?.sessionIds ?? [];
    } catch (error) {
      return handleApiError(error);
    }
  },

  /** The project's session replay setting, as the SDK will see it */
  getSettings: async (projectId: string): Promise<ReplaySettings> => {
    try {
      const response = await apiClient.get(`/projects/${projectId}/config/replay`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /** Owner or admin only; the API answers 403 for anyone else */
  updateSettings: async (
    projectId: string,
    settings: Partial<ReplaySettings>
  ): Promise<ReplaySettings> => {
    try {
      const response = await apiClient.put(`/projects/${projectId}/config/replay`, settings);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};
