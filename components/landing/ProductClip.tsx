"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { getClip, type ClipEntry } from "@/lib/screenshots";

interface ProductClipProps {
  /** Clip name from lib/screenshots/manifest.json, e.g. "core-flow". */
  name: string;
  caption?: string;
  className?: string;
}

/**
 * A muted, looping product clip. Nothing downloads until it scrolls near the
 * viewport (poster first, then the video). Under prefers-reduced-motion the
 * poster stays and the video never loads. Renders nothing when the clip has
 * not been captured, because the loop is optional.
 */
function ThemedClip({ clip, className }: { clip: ClipEntry; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{ aspectRatio: `${clip.width} / ${clip.height}` }}
    >
      {near &&
        (reduced ? (
          // eslint-disable-next-line @next/next/no-img-element -- poster is a static frame of the clip
          <img
            src={clip.poster}
            alt={clip.alt}
            width={clip.width}
            height={clip.height}
            className="block h-full w-full object-cover"
          />
        ) : (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={clip.poster}
            aria-label={clip.alt}
            width={clip.width}
            height={clip.height}
            className="block h-full w-full object-cover"
          >
            {clip.webm && <source src={clip.webm} type="video/webm" />}
            <source src={clip.mp4} type="video/mp4" />
          </video>
        ))}
    </div>
  );
}

export function ProductClip({ name, caption, className }: ProductClipProps) {
  const clip = getClip(name);
  if (!clip) return null;

  return (
    <figure className={cn("mx-auto w-full", className)}>
      <div
        className="overflow-hidden rounded-[12px] border border-border-subtle bg-bg-surface"
        style={{ boxShadow: "var(--shot-shadow)" }}
      >
        {/* Only the visible theme's wrapper has a box, so only it intersects. */}
        <ThemedClip clip={clip.dark} className="hidden dark:block" />
        <ThemedClip clip={clip.light} className="block dark:hidden" />
      </div>
      <figcaption className="mt-3 font-mono text-[11px] text-text-muted">
        {caption ? `${caption} · ` : ""}Demo shop · screen recording
        {clip.dark.capturedAt ? `, ${clip.dark.capturedAt.slice(0, 10)}` : ""}
      </figcaption>
    </figure>
  );
}
