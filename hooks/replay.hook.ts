import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { replayService, type ReplaySettings } from "@/services/replay.service";

export const replayQueryKeys = {
  all: ["replay"] as const,
  settings: (projectId: string) => [...replayQueryKeys.all, "settings", projectId] as const,
  session: (projectId: string, sessionId: string) =>
    [...replayQueryKeys.all, "session", projectId, sessionId] as const,
  available: (projectId: string, sessionIds: string[]) =>
    [...replayQueryKeys.all, "available", projectId, sessionIds] as const,
};

/**
 * Replay segments for a session. Pass `enabled: false` to hold off until the
 * replay is actually wanted: the payload is large.
 */
export const useSessionReplay = (
  projectId: string,
  sessionId: string,
  { enabled = true }: { enabled?: boolean } = {}
) => {
  return useQuery({
    queryKey: replayQueryKeys.session(projectId, sessionId),
    queryFn: () => replayService.getSessionReplay(projectId, sessionId),
    enabled: enabled && !!projectId && !!sessionId,
    // A finished recording never changes; a live one grows every 10s
    staleTime: 30_000,
  });
};

/**
 * The subset of `sessionIds` that have a playable replay, as a Set.
 */
export const useAvailableReplays = (projectId: string, sessionIds: string[]) => {
  // Sorted so the same sessions in a different order share a cache entry
  const ids = [...new Set(sessionIds.filter(Boolean))].sort();
  return useQuery({
    queryKey: replayQueryKeys.available(projectId, ids),
    queryFn: () => replayService.getAvailableReplays(projectId, ids),
    enabled: !!projectId && ids.length > 0,
    // New segments land every 10s while a session is still being recorded
    staleTime: 30_000,
    select: (available) => new Set(available),
  });
};

export const useReplaySettings = (projectId: string) => {
  return useQuery({
    queryKey: replayQueryKeys.settings(projectId),
    queryFn: () => replayService.getSettings(projectId),
    enabled: !!projectId,
  });
};

export const useUpdateReplaySettings = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: Partial<ReplaySettings>) =>
      replayService.updateSettings(projectId, settings),
    onSuccess: (saved) => {
      queryClient.setQueryData(replayQueryKeys.settings(projectId), saved);
    },
  });
};
