"use client";

import { useCallback, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Landing section heading. Mono eyebrow, a two-tone headline (the second line
 * in the secondary text colour, so lime stays reserved for live states).
 */
export function LandingHeading({
  eyebrow,
  headline,
  headlineAccent,
  sub,
  align = "left",
  className,
}: {
  eyebrow?: string;
  headline: ReactNode;
  headlineAccent?: ReactNode;
  sub?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      data-reveal
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && (
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
          {eyebrow}
        </p>
      )}
      <h2 className="text-balance font-display text-[clamp(28px,4.2vw,46px)] font-semibold leading-[1.08] tracking-[-0.03em] text-text-primary">
        {headline}
        {headlineAccent && (
          <>
            {" "}
            <span className="text-text-muted">{headlineAccent}</span>
          </>
        )}
      </h2>
      {sub && (
        <p
          className={cn(
            "mt-5 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg",
            align === "center" && "mx-auto"
          )}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

/** Small mono status label: Shipped, Beta, Next. */
export function StatusTag({
  tone,
  children,
  className,
}: {
  tone: "live" | "beta" | "next";
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
        tone === "live" && "border-signal/30 text-signal",
        tone === "beta" && "border-border-accent text-text-secondary",
        tone === "next" && "border-border-subtle text-text-muted",
        className
      )}
    >
      {tone === "live" && (
        <span className="h-1.5 w-1.5 rounded-full bg-signal" aria-hidden="true" />
      )}
      {children}
    </span>
  );
}

/** Code block with a mono label and a copy button. No fake window chrome. */
export function CodeBlock({
  code,
  label,
  className,
}: {
  code: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[10px] border border-border-subtle bg-bg-elevated",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border-subtle px-3.5 py-2">
        <span className="font-mono text-[11px] text-text-muted">{label}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : `Copy ${label ?? "code"}`}
          className="inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 font-mono text-[11px] text-text-muted transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-signal"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-signal" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-3.5 py-3 font-mono text-[12.5px] leading-relaxed text-text-primary">
        <code>{code}</code>
      </pre>
    </div>
  );
}
