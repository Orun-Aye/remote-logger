"use client";

import { useSessionReplay } from "@/hooks/replay.hook";
import { ReplayPlayer } from "./ReplayPlayer";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Video } from "lucide-react";

interface SessionReplayTabProps {
  projectId: string;
  sessionId: string;
  /** Epoch ms to start playback near, such as when an error happened */
  startAt?: number;
}

export function SessionReplayTab({ projectId, sessionId, startAt }: SessionReplayTabProps) {
  const { data: segments, isLoading, error } = useSessionReplay(projectId, sessionId);

  if (isLoading) {
    return <Skeleton className="w-full aspect-[16/10] rounded-lg" />;
  }

  if (error) {
    return (
      <Card className="border-border-subtle bg-bg-surface">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="h-10 w-10 text-status-danger mb-3" />
          <h3 className="text-sm font-display font-semibold text-text-primary mb-1">
            Could not load the replay
          </h3>
          <p className="text-xs text-text-secondary">{error.message}</p>
        </div>
      </Card>
    );
  }

  if (!segments || segments.length === 0) {
    return (
      <Card className="border-border-subtle bg-bg-surface">
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <Video className="h-10 w-10 text-text-muted mb-3" />
          <h3 className="text-sm font-display font-semibold text-text-primary mb-1">
            No replay for this session
          </h3>
          <p className="text-xs text-text-secondary max-w-md">
            Session replay is off by default. Turn it on in the SDK with{" "}
            <code className="font-mono text-text-code">replay: {"{ enabled: true }"}</code>.
            Only a sample of sessions is recorded (10% unless you change{" "}
            <code className="font-mono text-text-code">sampleRate</code>), and recordings
            are kept for 7 days.
          </p>
        </div>
      </Card>
    );
  }

  const events = segments.reduce((sum, s) => sum + s.eventCount, 0);

  return (
    <Card className="border-border-subtle bg-bg-surface overflow-hidden">
      <div className="px-5 py-3 border-b border-border-faint bg-bg-base/50 flex items-center justify-between gap-3">
        <h3 className="text-sm font-display font-semibold text-text-primary">Session replay</h3>
        <span className="text-xs text-text-muted font-mono">
          {segments.length} {segments.length === 1 ? "segment" : "segments"} · {events} events
        </span>
      </div>
      <div className="p-4">
        <ReplayPlayer segments={segments} startAt={startAt} />
        <p className="mt-3 text-xs text-text-muted">
          Inputs and anything marked <code className="font-mono">.apperio-mask</code> were masked
          in the visitor&apos;s browser before recording, so they play back as asterisks.
        </p>
      </div>
    </Card>
  );
}
