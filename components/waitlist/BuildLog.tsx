"use client";

import { LandingHeading, StatusTag } from "@/components/landing/primitives";
import { useScrollReveal } from "@/hooks/useGsapAnimations";
import { manifest } from "@/lib/screenshots";
import { cn } from "@/lib/utils";

type State = "shipped" | "beta" | "next";

/**
 * Dates are when each item first ran in production, not when it was
 * committed. Production served stale code until late September 2026, so the
 * Change Intelligence items all reached it that month.
 * TODO(changelog): replace the month-only dates with exact days, and link each
 * entry to its /changelog page, once the backend serves real changelog entries
 * instead of the invented seed history.
 */
const ENTRIES: { state: State; date?: string; title: string; body: string }[] = [
  {
    state: "beta",
    date: "2026-09-29",
    title: "Session replay",
    body: "Recorder in the SDK (apperio 1.5.0), player on the session page, Watch replay from an error group. Every input masked by default, off until you turn it on per project, seven-day retention.",
  },
  {
    state: "shipped",
    date: "Sep 2026",
    title: "Suspect commits",
    body: "Stack-file overlap plus AI ranking, computed when the error group is first opened and shown as Likely caused by.",
  },
  {
    state: "shipped",
    date: "Sep 2026",
    title: "AI-drafted issues with two-way sync",
    body: "Editable preview, full context attached, opened on GitHub in one click. Close it there and the error group resolves here.",
  },
  {
    state: "shipped",
    date: "Sep 2026",
    title: "Error fingerprinting and zero-config alerts",
    body: "Errors grouped at ingestion, counted by sessions affected, and routed to the project owner without an alert rule.",
  },
  {
    state: "shipped",
    date: "Sep 2026",
    title: "Deploy markers and release health",
    body: "Deployments from GitHub, your CI, or a single API call, drawn onto the charts, with a verdict an hour later: Improved, Healthy, Degraded or Not enough traffic.",
  },
  {
    state: "shipped",
    date: "Sep 2026",
    title: "AI commit summaries",
    body: "A plain-English summary and a technical one for every commit, cached per SHA, with lockfiles and generated files filtered out of the diff.",
  },
  {
    state: "shipped",
    date: "Sep 2026",
    title: "GitHub App, webhooks and the change feed",
    body: "Installation tokens, a signed webhook receiver with delivery-ID idempotency, and stored commits, deploys and releases per project.",
  },
  {
    state: "next",
    title: "Pulse feed and digests",
    body: "One chronological feed per project, and a weekly email that reads like a person wrote it.",
  },
  {
    state: "next",
    title: "Guided onboarding",
    body: "A first-run flow that gets you from signup to first captured error without reading documentation.",
  },
];

const STATE_LABEL: Record<State, string> = {
  shipped: "Shipped",
  beta: "Shipped, beta",
  next: "Next",
};

export function BuildLog() {
  const containerRef = useScrollReveal({ stagger: 0.05 });
  const shipped = ENTRIES.filter((e) => e.state !== "next").length;
  const next = ENTRIES.length - shipped;

  return (
    <section
      id="build-log"
      ref={containerRef}
      className="scroll-mt-16 border-t border-border-subtle py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <LandingHeading
          eyebrow="Built in the open"
          headline="We are not asking you"
          headlineAccent="to imagine it."
          sub={`Most of what this page describes is already running${manifest.shots.length > 0 ? ", and every product image on it is a capture of the real thing" : ""}. Here is the honest state of the build, kept current as things land.`}
        />

        <div className="mt-14 max-w-[880px]">
          <p
            data-reveal
            className="mb-4 font-mono text-[12px] text-text-muted"
          >
            <span className="tabular-nums text-text-primary">{shipped}</span> shipped
            {" · "}
            <span className="tabular-nums text-text-primary">{next}</span> next
          </p>

          <ol className="divide-y divide-border-subtle border-y border-border-subtle">
            {ENTRIES.map((entry) => (
              <li
                key={entry.title}
                data-reveal
                className="grid gap-x-6 gap-y-1 py-5 sm:grid-cols-[96px_minmax(0,1fr)]"
              >
                <span className="pt-[2px] font-mono text-[12px] tabular-nums text-text-muted">
                  {entry.date ?? "Planned"}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <h3
                      className={cn(
                        "font-display text-base font-semibold tracking-[-0.01em]",
                        entry.state === "next" ? "text-text-secondary" : "text-text-primary"
                      )}
                    >
                      {entry.title}
                    </h3>
                    <StatusTag
                      tone={
                        entry.state === "shipped"
                          ? "live"
                          : entry.state === "beta"
                            ? "beta"
                            : "next"
                      }
                    >
                      {STATE_LABEL[entry.state]}
                    </StatusTag>
                  </div>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-text-secondary">
                    {entry.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <p data-reveal className="mt-8 text-sm text-text-secondary">
            The beta is small on purpose. Every account added is one more app
            whose real traffic shapes what ships next.
          </p>
        </div>
      </div>
    </section>
  );
}
