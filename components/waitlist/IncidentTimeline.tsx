"use client";

import { useScrubSequence, useScrollReveal } from "@/hooks/useGsapAnimations";
import { cn } from "@/lib/utils";
import { LandingHeading } from "@/components/landing/primitives";
import { ProductShot } from "@/components/landing/ProductShot";
import { shotRenders } from "@/lib/screenshots";
import {
  RUN,
  capitalise,
  inWords,
  minutesBetween,
} from "@/components/landing/run-facts";

type Tone = "neutral" | "danger" | "signal";

interface Step {
  time: string;
  tone: Tone;
  actor: string;
  title: string;
  body: string;
  /** Real captures of this moment, from the Demo Shop run. */
  shots: { name: string; caption: string }[];
}

const sinceCommit = minutesBetween(RUN.commitTime, RUN.brokeTime);
const totalMinutes = minutesBetween(RUN.commitTime, RUN.resolvedTime);

const STEPS: Step[] = [
  {
    time: RUN.commitTime,
    tone: "neutral",
    actor: "You",
    title: "You push a small fix and go make coffee.",
    body: "The GitHub App's push webhook delivers the commit to Apperio. The diff is read and the commit gets a plain-English summary, with the technical one underneath.",
    shots: [{ name: "commit-card", caption: "Change feed" }],
  },
  {
    time: RUN.deployTime,
    tone: "neutral",
    actor: "Your host",
    title: "The deploy lands, and every chart gets a marker.",
    body: "Vercel, GitHub Deployments, your CI, or one API call from a shell script. However the release happens, Apperio draws the line on your error, performance and activity charts and starts measuring the hour after it.",
    shots: [{ name: "chart-deploy-markers", caption: "Errors chart" }],
  },
  {
    time: RUN.brokeTime,
    tone: "danger",
    actor: "A customer",
    title: "Someone cannot pay you.",
    body: "The SDK catches the throw with its stack, the page, the release tag and the session it happened in. No try/catch of yours involved.",
    shots: [{ name: "captured-error", caption: "Captured error" }],
  },
  {
    time: RUN.errorTime,
    tone: "danger",
    actor: "Apperio",
    title: "It is fingerprinted, grouped and counted.",
    body: `Not a wall of identical rows. One group, deduplicated by the shape of the failure, showing how many sessions it has reached, when it was first seen, and that it was first seen on ${RUN.badRelease}.`,
    shots: [{ name: "error-group-header", caption: "Error group" }],
  },
  {
    time: RUN.errorTime,
    tone: "danger",
    actor: "Apperio",
    // In-app only: the demo account has no mailbox, so the owner email could
    // not be verified in the run.
    title: "You are told, without having written an alert rule.",
    body: "In the app, as a new notification. Nobody configures a threshold for an error that has never existed before. A new kind of failure is worth interrupting you for, and that is the default.",
    shots: [{ name: "alert-in-app", caption: "Notifications" }],
  },
  {
    time: RUN.suspectTime,
    tone: "signal",
    actor: "Apperio",
    title: `Likely caused by: the commit pushed ${inWords(sinceCommit)} minutes before it broke.`,
    body: `The failing stack points at ${RUN.stackFile}. One commit in this release touched ${RUN.stackFile}. Apperio ranks the candidates, puts that one at the top, and says why in one sentence, with a link to the commit.`,
    shots: [{ name: "suspect-commit", caption: "Likely caused by" }],
  },
  {
    time: RUN.issueTime,
    tone: "signal",
    actor: "You",
    title: "The issue is already written. You press the button.",
    body: "A title, a summary, the sessions affected, the release it first appeared on, the stack trace, the suspect commit and a link back. Edit anything in the preview, then open it on your repo.",
    shots: [
      { name: "issue-draft", caption: "Drafted issue" },
      { name: "github-issue", caption: "The issue on GitHub" },
    ],
  },
  {
    time: RUN.resolvedTime,
    tone: "signal",
    actor: "Both",
    title: "You close it on GitHub. Apperio marks it resolved.",
    body: `The status flows back on the webhook and the group shows Resolved via GitHub. An hour after ${RUN.fixRelease} deploys, it gets its verdict. If the same fingerprint ever returns, the group reopens and tells you.`,
    shots: [
      { name: "resolved-via-github", caption: "Resolved issues" },
      { name: "deploy-verdicts", caption: "Deploy verdicts" },
    ],
  },
];

// A production build without captures reads as text only, so the line about
// the captures appears only when there is one to point at.
const anyShot = STEPS.some((step) =>
  step.shots.some((shot) => shotRenders(shot.name))
);

const toneText: Record<Tone, string> = {
  neutral: "text-text-muted",
  danger: "text-status-danger",
  signal: "text-signal",
};

const toneDot: Record<Tone, string> = {
  neutral: "border-border-accent bg-bg-void",
  danger: "border-status-danger bg-bg-void",
  signal: "border-signal bg-signal",
};

export function IncidentTimeline() {
  const headingRef = useScrollReveal();
  // Only the rail animates. Steps stay at full opacity and in place, so the
  // text keeps its contrast and the captures never slide sideways.
  const containerRef = useScrubSequence({ dim: 1, x: 0 });

  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-16 border-t border-border-subtle py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div ref={headingRef}>
          <LandingHeading
            eyebrow="Anatomy of an incident"
            headline={`${capitalise(inWords(totalMinutes))} minutes, start to finish.`}
            headlineAccent="You opened one page."
            sub={`Not a highlight reel of separate features. One ${RUN.weekday} ${RUN.dayPart} on a demo shop, in order, with no alert rules set up.${anyShot ? " Every capture below comes from that run." : ""}`}
          />
        </div>

        <div ref={containerRef} className="relative mt-16 max-w-[1000px]">
          {/* Rail: a faint track with a line drawn over it as the reader
              scrolls. Sits between the time column and the content. */}
          <div
            className="absolute bottom-3 left-[5px] top-3 w-px bg-border-subtle sm:left-[93px]"
            aria-hidden="true"
          >
            <div
              data-scrub-line
              className="h-full w-full bg-gradient-to-b from-text-muted via-status-danger to-signal"
            />
          </div>

          <ol className="space-y-14 sm:space-y-16">
            {STEPS.map((step, i) => (
              <li
                key={`${step.time}-${i}`}
                data-scrub-step
                className="relative grid grid-cols-[11px_minmax(0,1fr)] gap-x-5 sm:grid-cols-[64px_11px_minmax(0,1fr)] sm:gap-x-6"
              >
                <time className="hidden pt-[3px] text-right font-mono text-sm tabular-nums text-text-primary sm:block">
                  {step.time}
                </time>

                <span
                  className={cn(
                    "relative z-10 mt-[7px] h-[11px] w-[11px] rounded-full border-2",
                    toneDot[step.tone],
                  )}
                  aria-hidden="true"
                />

                <div className="min-w-0">
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em]">
                    <time className="mr-2 tabular-nums text-text-primary sm:hidden">
                      {step.time}
                    </time>
                    <span className={toneText[step.tone]}>{step.actor}</span>
                  </p>
                  <h3 className="text-balance font-display text-lg font-semibold leading-snug tracking-[-0.01em] text-text-primary sm:text-xl">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-text-secondary">
                    {step.body}
                  </p>

                  {step.shots.some((shot) => shotRenders(shot.name)) && (
                    <div className="mt-6 space-y-6">
                      {step.shots.map((shot) => (
                        <ProductShot
                          key={shot.name}
                          name={shot.name}
                          caption={shot.caption}
                          className="mx-0"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-16 max-w-xl text-[15px] leading-relaxed text-text-secondary sm:ml-[123px]">
          The only thing you did in those {inWords(totalMinutes)} minutes was
          read, click once, and ship the fix. Everything else happened because
          the SDK was installed and the repo was connected.
        </p>
      </div>
    </section>
  );
}
