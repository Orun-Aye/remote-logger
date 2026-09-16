"use client";

import { SignalDot } from "@/components/shared/SignalDot";

// Everything the SDK drops into, and everywhere Apperio can push a signal back
// out to. These are supported surfaces, not customer logos.
const RUNS_IN = [
  "React",
  "Next.js",
  "Vue",
  "Svelte",
  "Angular",
  "Node.js",
  "Express",
  "Remix",
  "Astro",
  "Vanilla JS",
];

const PUSHES_TO = [
  "GitHub",
  "Slack",
  "Discord",
  "Linear",
  "Jira",
  "PagerDuty",
  "Microsoft Teams",
  "Email",
  "Webhooks",
];

function Marquee({
  label,
  items,
  reverse = false,
}: {
  label: string;
  items: string[];
  reverse?: boolean;
}) {
  return (
    <div className="flex items-center gap-6">
      <span className="hidden sm:flex items-center gap-2 shrink-0 text-[10px] font-display font-semibold uppercase tracking-[0.14em] text-text-muted">
        <SignalDot status="ok" size="sm" pulse={false} />
        {label}
      </span>

      <div className="marquee-mask flex-1 overflow-hidden">
        <div
          className="animate-marquee flex w-max items-center gap-3"
          style={reverse ? { animationDirection: "reverse" } : undefined}
        >
          {/* Rendered twice so the -50% loop lands on the duplicate seamlessly */}
          {[...items, ...items].map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="whitespace-nowrap rounded-full border border-border-faint bg-bg-surface/50 px-3.5 py-1.5 text-xs text-text-secondary backdrop-blur-sm"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StackStrip() {
  return (
    <section
      aria-label="Supported frameworks and integrations"
      className="relative border-y border-border-faint bg-bg-surface/25 py-7 backdrop-blur-md"
    >
      <div className="mx-auto max-w-[1280px] space-y-3 px-4 sm:px-6">
        <Marquee label="Runs in" items={RUNS_IN} />
        <Marquee label="Pushes to" items={PUSHES_TO} reverse />
      </div>
    </section>
  );
}
