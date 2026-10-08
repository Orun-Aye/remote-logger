"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { useScrollReveal } from "@/hooks/useGsapAnimations";
import { shotRenders } from "@/lib/screenshots";
import { cn } from "@/lib/utils";
import { LandingHeading, StatusTag } from "./primitives";
import { ProductClip } from "./ProductClip";
import { ProductShot } from "./ProductShot";

interface Tab {
  value: string;
  label: string;
  beta?: boolean;
  title: string;
  points: string[];
  shots: { name: string; caption: string }[];
}

// Every point here was checked against the code on 2026-10-08. If the product
// changes, change the copy with it.
const TABS: Tab[] = [
  {
    value: "change-intelligence",
    label: "Change Intelligence",
    title: "Every error, traced back to a commit.",
    points: [
      "The GitHub App streams your pushes, deploys and releases into the project as they happen, and backfills the last 50 commits when you connect a repo.",
      "When an error group appears, recent commits are scored by whether their changed files show up in the failing stack and by how recent they are. The AI then orders the shortlist.",
      "The top candidate shows as Likely caused by: the commit message, a link to the commit, and one sentence on why.",
    ],
    shots: [
      { name: "error-group-header", caption: "Error group" },
      { name: "suspect-commit", caption: "Likely caused by" },
    ],
  },
  {
    value: "plain-english",
    label: "Plain English",
    title: "Written for whoever is reading it.",
    points: [
      "Every commit gets a plain-English summary as its headline, with the technical summary right under it. Both at once, nothing to toggle.",
      "Explain this change opens a longer walkthrough of what the diff does. Lockfiles and generated files are filtered out first.",
      "Every deploy gets a verdict an hour after it lands: Improved, Healthy, Degraded, or Not enough traffic.",
    ],
    shots: [
      { name: "commit-card", caption: "Change feed" },
      { name: "commit-explained", caption: "Explain this change" },
    ],
  },
  {
    value: "session-replay",
    label: "Session replay",
    beta: true,
    title: "Watch the session that broke.",
    points: [
      "Watch replay on an error group opens the recording of a session that hit it, with the clicks, scrolls and route changes that led there.",
      "Every input is masked in the browser by default, before anything is sent.",
      "Off until you switch it on, per project, with a sample rate you choose. Recordings are kept for seven days.",
    ],
    shots: [{ name: "session-replay", caption: "Session replay" }],
  },
];

export function ProductTour() {
  const containerRef = useScrollReveal({ stagger: 0.1 });

  return (
    <section
      id="product"
      ref={containerRef}
      className="scroll-mt-16 border-t border-border-subtle py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <LandingHeading
          eyebrow="The product"
          headline="What if the fix arrived"
          headlineAccent="with the alert?"
          sub="Apperio connects what changed on your site with what went wrong on it, then does the reading for you."
        />

        <TabsPrimitive.Root defaultValue={TABS[0].value} className="mt-12" data-reveal>
          <TabsPrimitive.List
            aria-label="Product areas"
            className="grid w-full grid-cols-3 gap-1 rounded-[12px] border border-border-subtle bg-bg-surface p-1 sm:inline-flex sm:w-auto"
          >
            {TABS.map((tab) => (
              <TabsPrimitive.Trigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "inline-flex min-h-10 items-center justify-center gap-2 rounded-[9px] px-2 py-2 text-center text-[13px] font-medium leading-tight text-text-secondary transition-colors sm:px-4 sm:text-sm",
                  "hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal",
                  "data-[state=active]:bg-bg-elevated data-[state=active]:text-text-primary"
                )}
              >
                {tab.label}
                {tab.beta && (
                  <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted sm:inline">
                    Beta
                  </span>
                )}
              </TabsPrimitive.Trigger>
            ))}
          </TabsPrimitive.List>

          {TABS.map((tab) => {
            const shots = tab.shots.filter((shot) => shotRenders(shot.name));
            // With no capture the points spread across the width instead of
            // sitting in a narrow column beside an empty one.
            const textOnly = shots.length === 0;

            return (
              <TabsPrimitive.Content
                key={tab.value}
                value={tab.value}
                className={cn(
                  "mt-10 grid gap-10 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-signal",
                  !textOnly &&
                    "lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-14"
                )}
              >
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <StatusTag tone={tab.beta ? "beta" : "live"}>
                      {tab.beta ? "Shipped, beta" : "Shipped"}
                    </StatusTag>
                  </div>
                  <h3 className="text-balance font-display text-2xl font-semibold leading-tight tracking-[-0.02em] text-text-primary sm:text-[28px]">
                    {tab.title}
                  </h3>
                  <ol
                    className={cn(
                      "mt-6 space-y-4",
                      textOnly &&
                        "md:grid md:grid-cols-3 md:gap-8 md:space-y-0"
                    )}
                  >
                    {tab.points.map((point, i) => (
                      <li key={i} className="flex gap-3.5">
                        <span className="mt-[3px] font-mono text-[11px] tabular-nums text-text-muted">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p className="text-[15px] leading-relaxed text-text-secondary">
                          {point}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>

                {!textOnly && (
                  <div className="min-w-0 space-y-8">
                    {shots.map((shot) => (
                      <ProductShot
                        key={shot.name}
                        name={shot.name}
                        caption={shot.caption}
                        className="lg:mx-0"
                      />
                    ))}
                  </div>
                )}
              </TabsPrimitive.Content>
            );
          })}
        </TabsPrimitive.Root>

        {/* Optional loop; renders nothing until the clip is captured. */}
        <ProductClip
          name="core-flow"
          caption="From the issues list to a drafted GitHub issue"
          className="mt-20 max-w-[1040px]"
        />
      </div>
    </section>
  );
}
