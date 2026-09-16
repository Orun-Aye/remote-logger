"use client";

import { SectionHeading } from "@/components/shared/SectionHeading";
import { useScrollReveal } from "@/hooks/useGsapAnimations";
import { cn } from "@/lib/utils";
import { Check, CircleDashed, Loader } from "lucide-react";

type State = "shipped" | "building" | "next";

const ENTRIES: { state: State; title: string; body: string }[] = [
  {
    state: "shipped",
    title: "GitHub App, webhooks and the change feed",
    body: "Installation tokens, signed webhook receiver with delivery-ID idempotency, and stored commits, deploys and releases per project.",
  },
  {
    state: "shipped",
    title: "AI commit summaries, both registers",
    body: "Plain English and technical, cached per SHA, with lockfiles and generated files filtered out of the diff.",
  },
  {
    state: "shipped",
    title: "Deploy markers and release health",
    body: "Deployments from GitHub, your CI, or a single API call, drawn onto the charts with an automatic better-or-worse verdict.",
  },
  {
    state: "shipped",
    title: "Error fingerprinting and zero-config alerts",
    body: "Errors grouped at ingestion, counted by users affected, and routed to the owner in-app and by email without an alert rule.",
  },
  {
    state: "shipped",
    title: "AI-drafted issues with two-way sync",
    body: "Editable preview, full context attached, opened on GitHub in one click. Close it there and the error group resolves here.",
  },
  {
    state: "shipped",
    title: "Suspect commits",
    body: "Stack-file overlap plus AI ranking, computed on demand and surfaced as Likely caused by on the error group.",
  },
  {
    state: "building",
    title: "Session replay v1",
    body: "Recorder in the SDK, player on the session page, all text inputs masked by default, opt-in per project, seven-day retention.",
  },
  {
    state: "next",
    title: "Pulse feed and digests",
    body: "One chronological feed per project, and a weekly or daily email that reads like a person wrote it.",
  },
  {
    state: "next",
    title: "Guided onboarding",
    body: "First-run flow that gets you from signup to first captured error without reading documentation.",
  },
];

const STATE_META: Record<
  State,
  { label: string; icon: typeof Check; ring: string; text: string }
> = {
  shipped: {
    label: "Shipped",
    icon: Check,
    ring: "border-signal/40 bg-signal/10 text-signal",
    text: "text-signal",
  },
  building: {
    label: "Building now",
    icon: Loader,
    ring: "border-data/40 bg-data/10 text-data",
    text: "text-data",
  },
  next: {
    label: "Next",
    icon: CircleDashed,
    ring: "border-border-subtle bg-bg-elevated/50 text-text-muted",
    text: "text-text-muted",
  },
};

export function BuildLog() {
  const containerRef = useScrollReveal({ stagger: 0.06 });
  const shipped = ENTRIES.filter((e) => e.state === "shipped").length;

  return (
    <section
      id="build-log"
      ref={containerRef}
      className="border-t border-border-faint py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <SectionHeading
          eyebrow="Built in the open"
          headline="We are not asking you"
          headlineAccent="to imagine it."
          sub="Most of what this page describes is already running. Here is the honest state of the build, kept current as things land. No screenshots of features that do not exist."
        />

        <div className="mx-auto mt-16 max-w-3xl">
          <div
            data-reveal
            className="mb-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-text-muted"
          >
            <span>
              <span className="font-mono font-bold text-signal">{shipped}</span>{" "}
              shipped
            </span>
            <span className="hidden h-3 w-px bg-border-subtle sm:block" />
            <span>
              <span className="font-mono font-bold text-data">1</span> in
              progress
            </span>
            <span className="hidden h-3 w-px bg-border-subtle sm:block" />
            <span>
              <span className="font-mono font-bold text-text-secondary">2</span>{" "}
              queued for the beta
            </span>
          </div>

          <ol className="space-y-2.5">
            {ENTRIES.map((entry) => {
              const meta = STATE_META[entry.state];
              const Icon = meta.icon;
              return (
                <li
                  key={entry.title}
                  data-reveal
                  className={cn(
                    "flex gap-4 rounded-xl border border-border-subtle bg-bg-surface/40 p-4 backdrop-blur-sm transition-colors duration-300 sm:p-5",
                    entry.state === "shipped" && "hover:border-signal/25",
                    entry.state === "building" && "border-data/20"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                      meta.ring
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5",
                        entry.state === "building" && "animate-spin [animation-duration:3s]"
                      )}
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="font-display text-sm font-bold text-text-primary">
                        {entry.title}
                      </h3>
                      <span
                        className={cn(
                          "font-mono text-[10px] uppercase tracking-[0.1em]",
                          meta.text
                        )}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                      {entry.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          <p
            data-reveal
            className="mt-8 text-center text-sm text-text-secondary"
          >
            The beta is small on purpose. Every account added is one more app
            whose real traffic shapes what ships next.
          </p>
        </div>
      </div>
    </section>
  );
}
