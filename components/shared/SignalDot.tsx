"use client";

import { cn } from "@/lib/utils";

type SignalStatus = "ok" | "warn" | "danger" | "fatal" | "info";

interface SignalDotProps {
  status?: SignalStatus;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  className?: string;
  label?: string;
}

const statusColors: Record<SignalStatus, string> = {
  ok: "bg-status-ok",
  warn: "bg-status-warn",
  danger: "bg-status-danger",
  fatal: "bg-status-fatal",
  info: "bg-data-info",
};

const pulseColors: Record<SignalStatus, string> = {
  ok: "bg-status-ok",
  warn: "bg-status-warn",
  danger: "bg-status-danger",
  fatal: "bg-status-fatal",
  info: "bg-data",
};

const sizes = {
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
  lg: "w-3 h-3",
};

export function SignalDot({
  status = "ok",
  size = "md",
  pulse = false,
  className,
  label,
}: SignalDotProps) {
  const ariaLabel =
    label ||
    `Status: ${status === "ok" ? "healthy" : status === "warn" ? "warning" : status === "danger" ? "critical" : status === "fatal" ? "fatal" : "info"}`;

  return (
    <span
      className={cn("relative inline-flex", className)}
      role="status"
      aria-label={ariaLabel}
    >
      <span
        className={cn(
          "rounded-full",
          sizes[size],
          statusColors[status]
        )}
      />
      {pulse && (
        <span
          className={cn(
            "absolute inset-0 rounded-full animate-signal-pulse",
            pulseColors[status]
          )}
          aria-hidden="true"
        />
      )}
    </span>
  );
}
