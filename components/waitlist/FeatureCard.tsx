"use client";

import { cn } from "@/lib/utils";
import { type ReactNode } from "react";
import { StatusTag } from "@/components/landing/primitives";

interface FeatureCardProps {
  pain: string;
  title: string;
  description: string;
  /** A ProductShot, a code block, or nothing for a text-only card. */
  visual?: ReactNode;
  span?: 1 | 2 | 3;
  /** Honest build state. Omit for anything already running. */
  status?: "beta" | "next";
  className?: string;
}

const STATUS_LABEL: Record<"beta" | "next", string> = {
  beta: "Beta",
  next: "Next",
};

export function FeatureCard({
  pain,
  title,
  description,
  visual,
  span = 1,
  status,
  className,
}: FeatureCardProps) {
  return (
    <div
      data-stagger
      className={cn(
        "flex flex-col rounded-[14px] border border-border-subtle bg-bg-surface p-5 sm:p-6",
        span === 2 && "md:col-span-2",
        span === 3 && "md:col-span-2 lg:col-span-3",
        className
      )}
    >
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
        {pain}
      </p>
      <div className="mb-2 flex items-center gap-3">
        <h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-text-primary">
          {title}
        </h3>
        {status && (
          <StatusTag tone={status} className="ml-auto shrink-0">
            {STATUS_LABEL[status]}
          </StatusTag>
        )}
      </div>
      {/* Capped so a wide card with no capture keeps a readable line length. */}
      <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
        {description}
      </p>
      {visual && <div className="mt-5 flex-1">{visual}</div>}
    </div>
  );
}
