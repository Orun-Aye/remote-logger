"use client";

import { SectionHeading } from "@/components/shared/SectionHeading";
import { SignalDot } from "@/components/shared/SignalDot";
import { useScrubSequence } from "@/hooks/useGsapAnimations";
import { cn } from "@/lib/utils";
import {
  BellRing,
  CircleCheck,
  GitPullRequestArrow,
  Layers,
  Rocket,
  Search,
  TriangleAlert,
  Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Tone = "neutral" | "danger" | "signal";

interface Step {
  time: string;
  icon: LucideIcon;
  tone: Tone;
  actor: string;
  title: string;
  body: string;
  /** Monospace detail card under the copy. */
  detail?: { label: string; lines: { text: string; tone?: Tone }[] };
}

const STEPS: Step[] = [
  {
    time: "14:02",
    icon: Upload,
    tone: "neutral",
    actor: "You",
    title: "You push three files and go make coffee.",
    body: "The webhook reaches Apperio before your terminal has finished printing. The commit is stored, the diff is read, and a summary is written in the register a non-engineer can follow.",
    detail: {
      label: "a7f3c21 on main",
      lines: [
        { text: "fix: use cached user profile on checkout" },
        { text: "3 files changed  +41  -12" },
        {
          text: "Summary: speeds up checkout by reusing the profile the page already loaded instead of fetching it a second time.",
          tone: "signal",
        },
      ],
    },
  },
  {
    time: "14:09",
    icon: Rocket,
    tone: "neutral",
    actor: "Your host",
    title: "The deploy lands, and every chart gets a marker.",
    body: "Vercel, GitHub Deployments, your CI, or one API call from a shell script. However the release happens, Apperio draws the line on your error, performance and activity charts so every number after it is attributable.",
    detail: {
      label: "Deployment",
      lines: [
        { text: "v2.4.1 -> production  (github)" },
        { text: "Baseline captured. Watching for 60 minutes." },
      ],
    },
  },
  {
    time: "14:11",
    icon: TriangleAlert,
    tone: "danger",
    actor: "A real user",
    title: "Someone in Manchester cannot pay you.",
    body: "The SDK catches the throw with the breadcrumbs that led to it: the route, the clicks, the network calls, the release tag, the session. No try/catch of yours involved.",
    detail: {
      label: "Captured",
      lines: [
        {
          text: "TypeError: Cannot read properties of undefined (reading 'email')",
          tone: "danger",
        },
        { text: "at renderCheckoutSummary (checkout.ts:142)" },
        { text: "release v2.4.1  ·  session 8f2k4n  ·  Chrome 122" },
      ],
    },
  },
  {
    time: "14:11",
    icon: Layers,
    tone: "danger",
    actor: "Apperio",
    title: "It is fingerprinted, grouped and counted.",
    body: "Not a wall of 14 identical rows. One group, deduplicated by the shape of the failure, with how many people it has reached, when it first appeared, and which release it appeared on.",
    detail: {
      label: "Error group",
      lines: [
        { text: "14 users affected  ·  first seen 2 min ago" },
        { text: "100% on v2.4.1  ·  0% on v2.4.0", tone: "danger" },
      ],
    },
  },
  {
    time: "14:11",
    icon: BellRing,
    tone: "danger",
    actor: "Apperio",
    title: "You are told, without having written an alert rule.",
    body: "In-app and by email. Nobody configures a threshold for an error that has never existed before. A new kind of failure is worth interrupting you for, and that is the default.",
  },
  {
    time: "14:12",
    icon: Search,
    tone: "signal",
    actor: "Apperio",
    title: "Likely caused by: the commit from nine minutes ago.",
    body: "The failing stack points at checkout.ts. One commit in this release touched checkout.ts. Apperio ranks the candidates, puts that one at the top, and shows you the exact lines it changed.",
    detail: {
      label: "Suspect",
      lines: [
        { text: "a7f3c21  fix: use cached user profile  ·  92%", tone: "signal" },
        { text: "- const profile = await fetchProfile(userId)", tone: "danger" },
        { text: "+ const profile = cache.get(userId)", tone: "signal" },
      ],
    },
  },
  {
    time: "14:13",
    icon: GitPullRequestArrow,
    tone: "signal",
    actor: "You",
    title: "The issue is already written. You press the button.",
    body: "Title, plain-English summary, stack trace, breadcrumbs, affected users, suspect commit and a link back. Edit anything you like in the preview, then open it on your repo.",
    detail: {
      label: "github.com/you/shop",
      lines: [
        { text: "#142  Checkout fails for accounts with no email set" },
        { text: "opened by apperio[bot]  ·  labels: bug", tone: "signal" },
      ],
    },
  },
  {
    time: "14:33",
    icon: CircleCheck,
    tone: "signal",
    actor: "Both",
    title: "You close it on GitHub. Apperio marks it resolved.",
    body: "The status flows back on the webhook. The group goes quiet, the release health verdict updates, and if the same fingerprint ever returns, it reopens itself and tells you.",
    detail: {
      label: "Resolved",
      lines: [
        { text: "v2.4.2 deployed  ·  error rate -100% vs v2.4.1", tone: "signal" },
        { text: "Verdict: this deploy made things better.", tone: "signal" },
      ],
    },
  },
];

const toneText: Record<Tone, string> = {
  neutral: "text-text-secondary",
  danger: "text-status-danger",
  signal: "text-signal",
};

const toneRing: Record<Tone, string> = {
  neutral: "border-border-subtle bg-bg-surface text-text-muted",
  danger: "border-status-danger/40 bg-status-danger/10 text-status-danger",
  signal: "border-signal/40 bg-signal/10 text-signal",
};

export function IncidentTimeline() {
  const containerRef = useScrubSequence();

  return (
    <section
      id="how-it-works"
      className="relative border-t border-border-faint py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <SectionHeading
          eyebrow="Anatomy of an incident"
          headline="Thirty-one minutes, start to finish."
          headlineAccent="You opened one page."
          sub="This is not a highlight reel of separate features. It is one Tuesday afternoon, in order, with nothing configured in advance."
        />

        <div ref={containerRef} className="relative mx-auto mt-16 max-w-3xl">
          {/* Rail: a faint full-height track with a signal line drawn over it
              as the reader scrolls. */}
          <div
            className="absolute bottom-6 left-[19px] top-6 w-px bg-border-faint sm:left-[27px]"
            aria-hidden="true"
          >
            <div
              data-scrub-line
              className="h-full w-full bg-gradient-to-b from-text-muted via-status-danger to-signal"
            />
          </div>

          <ol className="space-y-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <li
                  key={`${step.time}-${i}`}
                  data-scrub-step
                  className="relative flex gap-4 sm:gap-6"
                >
                  {/* Node */}
                  <span
                    className={cn(
                      "relative z-10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border backdrop-blur-sm sm:h-[54px] sm:w-[54px]",
                      toneRing[step.tone]
                    )}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>

                  {/* Card */}
                  <div className="min-w-0 flex-1 rounded-xl border border-border-subtle bg-bg-surface/50 p-5 backdrop-blur-sm transition-colors duration-300 hover:border-signal/25">
                    <div className="mb-2 flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-semibold tabular-nums text-text-primary">
                        {step.time}
                      </span>
                      <span className="h-3 w-px bg-border-subtle" />
                      <span
                        className={cn(
                          "font-display text-[10px] font-semibold uppercase tracking-[0.12em]",
                          toneText[step.tone]
                        )}
                      >
                        {step.actor}
                      </span>
                    </div>

                    <h3 className="font-display text-base font-bold leading-snug text-text-primary sm:text-lg">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                      {step.body}
                    </p>

                    {step.detail && (
                      <div className="mt-4 overflow-hidden rounded-lg border border-border-faint bg-bg-void/70">
                        <div className="flex items-center gap-2 border-b border-border-faint px-3 py-1.5">
                          <SignalDot
                            status={
                              step.tone === "danger"
                                ? "danger"
                                : step.tone === "signal"
                                  ? "ok"
                                  : "info"
                            }
                            size="sm"
                            pulse={false}
                          />
                          <span className="truncate font-mono text-[10px] uppercase tracking-[0.1em] text-text-muted">
                            {step.detail.label}
                          </span>
                        </div>
                        <div className="space-y-1 overflow-x-auto p-3">
                          {step.detail.lines.map((line, j) => (
                            <p
                              key={j}
                              className={cn(
                                "font-mono text-[11px] leading-relaxed",
                                toneText[line.tone ?? "neutral"]
                              )}
                            >
                              {line.text}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <p className="mx-auto mt-12 max-w-xl text-center text-sm text-text-secondary">
          The only thing you did in those thirty-one minutes was read, click
          once, and ship the fix. Everything above it happened because the SDK
          was installed and the repo was connected.
        </p>
      </div>
    </section>
  );
}
