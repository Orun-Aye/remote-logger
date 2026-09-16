"use client";

import { SectionHeading } from "@/components/shared/SectionHeading";
import { useScrollReveal } from "@/hooks/useGsapAnimations";
import { cn } from "@/lib/utils";
import { Check, Minus, X } from "lucide-react";

type Cell = { state: "yes" | "partial" | "no" | "na"; note?: string };

interface Row {
  capability: string;
  apperio: Cell;
  tracker: Cell;
  apm: Cell;
  platform: Cell;
}

// Columns are product categories rather than named vendors on purpose: the
// claims hold for the category, and no specific product is misrepresented.
const COLUMNS = [
  { key: "apperio", label: "Apperio", accent: true },
  { key: "tracker", label: "Error trackers", accent: false },
  { key: "apm", label: "APM suites", accent: false },
  { key: "platform", label: "Platform logs", accent: false },
] as const;

const ROWS: Row[] = [
  {
    capability: "Errors grouped and deduplicated",
    apperio: { state: "yes" },
    tracker: { state: "yes" },
    apm: { state: "yes" },
    platform: { state: "no" },
  },
  {
    capability: "Commits and deploys on the same timeline",
    apperio: { state: "yes", note: "Built in" },
    tracker: { state: "partial", note: "Release tags" },
    apm: { state: "partial", note: "Deploy markers" },
    platform: { state: "no" },
  },
  {
    capability: "Ranked suspect commit for each error",
    apperio: { state: "yes", note: "AI-ranked" },
    tracker: { state: "no" },
    apm: { state: "no" },
    platform: { state: "no" },
  },
  {
    capability: "Plain-English explanations",
    apperio: { state: "yes", note: "Commits and errors" },
    tracker: { state: "partial", note: "Error summaries" },
    apm: { state: "partial", note: "Incident summaries" },
    platform: { state: "no" },
  },
  {
    capability: "Verdict on whether a deploy helped",
    apperio: { state: "yes", note: "Automatic" },
    tracker: { state: "partial" },
    apm: { state: "partial", note: "Manual comparison" },
    platform: { state: "no" },
  },
  {
    capability: "Issue drafted with full context",
    apperio: { state: "yes", note: "One click, synced" },
    tracker: { state: "partial", note: "Link only" },
    apm: { state: "partial" },
    platform: { state: "no" },
  },
  {
    capability: "PII stripped before it leaves the browser",
    apperio: { state: "yes", note: "10+ patterns, audited" },
    tracker: { state: "partial", note: "Server-side scrubbing" },
    apm: { state: "partial" },
    platform: { state: "no" },
  },
  {
    capability: "Usable by a non-engineer on your team",
    apperio: { state: "yes" },
    tracker: { state: "no" },
    apm: { state: "no" },
    platform: { state: "no" },
  },
  {
    capability: "Time from install to first insight",
    apperio: { state: "yes", note: "Under 5 minutes" },
    tracker: { state: "partial", note: "An afternoon" },
    apm: { state: "no", note: "Days" },
    platform: { state: "na", note: "Already on" },
  },
  {
    capability: "Affordable for one person",
    apperio: { state: "yes", note: "Free tier, forever" },
    tracker: { state: "partial", note: "Free tier with caps" },
    apm: { state: "no", note: "Team pricing" },
    platform: { state: "partial" },
  },
];

function StateIcon({ state, accent }: { state: Cell["state"]; accent: boolean }) {
  if (state === "yes") {
    return (
      <Check
        className={cn("h-4 w-4", accent ? "text-signal" : "text-text-secondary")}
        aria-label="Yes"
      />
    );
  }
  if (state === "partial") {
    return <Minus className="h-4 w-4 text-status-warn" aria-label="Partial" />;
  }
  if (state === "na") {
    return <Minus className="h-4 w-4 text-text-muted" aria-label="Not applicable" />;
  }
  return <X className="h-4 w-4 text-text-muted/50" aria-label="No" />;
}

function CellContent({ cell, accent }: { cell: Cell; accent: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <StateIcon state={cell.state} accent={accent} />
      {cell.note && (
        <span
          className={cn(
            "text-center text-[10px] leading-tight",
            accent && cell.state === "yes" ? "text-signal" : "text-text-muted"
          )}
        >
          {cell.note}
        </span>
      )}
    </div>
  );
}

export function ComparisonTable() {
  const containerRef = useScrollReveal();

  return (
    <section
      id="comparison"
      ref={containerRef}
      className="border-t border-border-faint py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <SectionHeading
          eyebrow="Where it sits"
          headline="Not a better log viewer."
          headlineAccent="A different question."
          sub="Everything in this table can tell you what broke. Apperio is built to answer the next two: what did we ship that broke it, and what do I do now."
        />

        <div
          data-reveal
          className="mt-16 overflow-x-auto rounded-xl border border-border-subtle bg-bg-surface/40 backdrop-blur-sm"
        >
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <caption className="sr-only">
              Capability comparison between Apperio and other categories of
              monitoring tool
            </caption>
            <thead>
              <tr className="border-b border-border-subtle">
                <th
                  scope="col"
                  className="w-[34%] px-5 py-4 text-left font-display text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
                >
                  Capability
                </th>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(
                      "px-4 py-4 text-center font-display text-xs font-bold",
                      col.accent
                        ? "bg-signal/5 text-signal"
                        : "text-text-secondary"
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr
                  key={row.capability}
                  className={cn(
                    "border-b border-border-faint transition-colors duration-150 last:border-b-0 hover:bg-bg-elevated/30",
                    i % 2 === 1 && "bg-bg-void/20"
                  )}
                >
                  <th
                    scope="row"
                    className="px-5 py-4 text-left text-sm font-medium text-text-primary"
                  >
                    {row.capability}
                  </th>
                  {COLUMNS.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-4 align-middle",
                        col.accent && "bg-signal/5"
                      )}
                    >
                      <CellContent cell={row[col.key]} accent={col.accent} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p
          data-reveal
          className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-text-muted"
        >
          Compared by category rather than by brand, because the answer varies
          within each one. If your current tool does something on this list, keep
          it. Apperio installs alongside anything.
        </p>
      </div>
    </section>
  );
}
