"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { eventWithTime } from "@rrweb/types";
import type { ReplaySegment } from "@/services/replay.service";
import { AlertTriangle, Crosshair } from "lucide-react";
import { format } from "date-fns";
import "rrweb-player/dist/style.css";
import "./replay-player.css";

// rrweb event types (EventType enum in @rrweb/types)
const FULL_SNAPSHOT = 2;
const META = 4;

/** Height of rrweb-player's controller bar, below the frame */
const CONTROLLER_HEIGHT = 80;
const FALLBACK_ASPECT = 16 / 10;
/** Lead-in before a startAt moment, so you see what led up to it */
const START_AT_LEAD_MS = 3_000;

type PlayerInstance = {
  $set: (props: Record<string, unknown>) => void;
  $destroy: () => void;
  triggerResize: () => void;
  goto: (timeOffset: number, play?: boolean) => void;
};

interface ReplayPlayerProps {
  segments: ReplaySegment[];
  /** Epoch ms to start playing from (minus a short lead-in) */
  startAt?: number;
}

/** Segment indexes that should be there but are not (upload lost) */
function findMissingSegments(segments: ReplaySegment[]): number[] {
  const present = new Set(segments.map((s) => s.segmentIndex));
  const last = segments.at(-1)?.segmentIndex ?? -1;
  const missing: number[] = [];
  for (let i = 0; i <= last; i++) if (!present.has(i)) missing.push(i);
  return missing;
}

export function ReplayPlayer({ segments, startAt }: ReplayPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Segments arrive in index order; their events are already in recording order
  const events = useMemo<eventWithTime[]>(
    () => segments.flatMap((s) => s.events),
    [segments]
  );
  const missing = useMemo(() => findMissingSegments(segments), [segments]);
  const hasSnapshot = events.some((e) => e.type === FULL_SNAPSHOT);

  // Recorded viewport, so the frame keeps the visitor's proportions
  const aspect = useMemo(() => {
    const meta = events.find((e) => e.type === META) as
      | { data?: { width?: number; height?: number } }
      | undefined;
    const w = meta?.data?.width;
    const h = meta?.data?.height;
    return w && h ? w / h : FALLBACK_ASPECT;
  }, [events]);

  const playable = hasSnapshot && events.length >= 2;

  // Where startAt falls in the recording, as an offset from its first event.
  // null when there is no startAt or it is outside what was recorded.
  const startOffset = useMemo(() => {
    if (!startAt || events.length === 0) return null;
    const first = events[0].timestamp;
    const last = events[events.length - 1].timestamp;
    if (startAt < first || startAt > last) return null;
    return Math.max(startAt - first - START_AT_LEAD_MS, 0);
  }, [startAt, events]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !playable) return;

    let player: PlayerInstance | null = null;
    let observer: ResizeObserver | null = null;
    let cancelled = false;

    const size = () => {
      const width = Math.max(el.clientWidth, 320);
      // Never taller than most of the viewport
      const height = Math.min(width / aspect, window.innerHeight * 0.7);
      return { width, height };
    };

    // rrweb-player touches the DOM on import, so load it on the client only
    import("rrweb-player")
      .then(({ default: Player }) => {
        if (cancelled) return;
        player = new Player({
          target: el,
          props: {
            events,
            ...size(),
            autoPlay: false,
            skipInactive: true,
            showController: true,
            speedOption: [1, 2, 4, 8],
            // The cursor trail is drawn on a canvas, so CSS can't reach it:
            // read the Observatory signal colour for the current theme
            mouseTail: {
              strokeStyle:
                getComputedStyle(el).getPropertyValue("--signal").trim() || "#AEF78E",
              lineWidth: 2,
            },
          },
        }) as unknown as PlayerInstance;

        if (startOffset !== null) player.goto(startOffset, true);

        observer = new ResizeObserver(() => {
          player?.$set(size());
          player?.triggerResize();
        });
        observer.observe(el);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : String(error));
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
      player?.$destroy();
      el.innerHTML = "";
    };
  }, [events, aspect, playable, startOffset]);

  if (!playable) {
    return (
      <Notice
        title="This recording can't be played"
        body={
          hasSnapshot
            ? "It has too few events to play back."
            : "The start of the recording (the first page snapshot) never arrived, so there is nothing to play the rest of it against."
        }
      />
    );
  }

  if (loadError) {
    return <Notice title="The player failed to load" body={loadError} />;
  }

  return (
    <div className="space-y-3">
      {startAt && (
        <div className="flex items-center gap-2 rounded-md border border-signal/20 bg-signal/5 px-3 py-2 text-xs text-text-secondary">
          <Crosshair className="h-4 w-4 shrink-0 text-signal" />
          {startOffset !== null ? (
            <span>
              Playing from {START_AT_LEAD_MS / 1000}s before the error at{" "}
              <span className="font-mono text-text-primary">{format(startAt, "HH:mm:ss")}</span>.
            </span>
          ) : (
            <span>
              The error at <span className="font-mono">{format(startAt, "HH:mm:ss")}</span> falls
              outside this recording, so it plays from the start.
            </span>
          )}
        </div>
      )}
      {missing.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-status-warn/20 bg-status-warn/5 px-3 py-2 text-xs text-status-warn">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Part of this recording is missing ({missing.length} of {missing.length + segments.length} segments
            never arrived). Playback may jump at those points.
          </span>
        </div>
      )}
      <div
        ref={containerRef}
        className="apperio-replay w-full"
        style={{ minHeight: CONTROLLER_HEIGHT }}
      />
    </div>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertTriangle className="h-10 w-10 text-status-warn mb-3" />
      <h3 className="text-sm font-display font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-xs text-text-secondary max-w-md">{body}</p>
    </div>
  );
}
