"use client";

import { useEffect, useRef, useState } from "react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { SignalDot } from "@/components/shared/SignalDot";
import { useScrollReveal } from "@/hooks/useGsapAnimations";
import { cn } from "@/lib/utils";
import {
  GitCommitHorizontal,
  Lock,
  MousePointer2,
  Pause,
  Play,
  Sparkles,
  Video,
} from "lucide-react";

type Status = "live" | "beta" | "next";

const STATUS_LABEL: Record<Status, string> = {
  live: "Running now",
  beta: "In the beta",
  next: "Next up",
};

function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-display font-semibold uppercase tracking-[0.1em]",
        status === "live" && "border-signal/30 bg-signal/10 text-signal",
        status === "beta" && "border-data/30 bg-data/10 text-data",
        status === "next" && "border-border-subtle bg-bg-elevated/60 text-text-muted"
      )}
    >
      <SignalDot
        status={status === "live" ? "ok" : status === "beta" ? "info" : "warn"}
        size="sm"
        pulse={status === "live"}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

// ─── Visual 1: suspect commit ranking ────────────────────────────────────────

const SUSPECTS = [
  {
    sha: "a7f3c21",
    message: "fix: use cached user profile on checkout",
    confidence: 92,
    reason: "Touched checkout.ts, the top frame in the stack",
  },
  {
    sha: "3b91e04",
    message: "chore: bump dependencies",
    confidence: 21,
    reason: "No overlap with the failing path",
  },
];

function SuspectCommits() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-void/70 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
          Likely caused by
        </span>
      </div>

      <div className="space-y-2.5">
        {SUSPECTS.map((s) => (
          <div
            key={s.sha}
            className={cn(
              "rounded-lg border p-3 transition-colors duration-300",
              s.confidence > 50
                ? "border-signal/30 bg-signal/5"
                : "border-border-faint bg-bg-surface/40"
            )}
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate font-mono text-[11px]">
                <span
                  className={cn(
                    s.confidence > 50 ? "text-signal" : "text-text-muted"
                  )}
                >
                  {s.sha}
                </span>{" "}
                <span className="text-text-secondary">{s.message}</span>
              </p>
              <span
                className={cn(
                  "shrink-0 font-mono text-[11px] font-semibold tabular-nums",
                  s.confidence > 50 ? "text-signal" : "text-text-muted"
                )}
              >
                {s.confidence}%
              </span>
            </div>

            {/* Confidence bar */}
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-bg-elevated">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-[1200ms] ease-out",
                  s.confidence > 50 ? "bg-signal" : "bg-text-muted/40"
                )}
                style={{ width: visible ? `${s.confidence}%` : "0%" }}
              />
            </div>

            <p className="mt-2 text-[10px] text-text-muted">{s.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Visual 2: plain English / technical register toggle ─────────────────────

const REGISTERS = {
  plain:
    "Checkout started failing right after the change that reuses the already-loaded profile. On accounts that have never set an email, that profile comes back empty, so the page stops before the pay button renders. 14 people have hit it since 14:11.",
  technical:
    "TypeError: Cannot read properties of undefined (reading 'email') at renderCheckoutSummary (checkout.ts:142). Introduced in a7f3c21, which replaced the fetchProfile() await with a cache read that resolves to undefined for accounts lacking a profile document.",
};

function RegisterToggle() {
  const [register, setRegister] = useState<keyof typeof REGISTERS>("plain");
  const [typed, setTyped] = useState("");
  const cursor = useRef(0);

  // Retype from scratch whenever the register flips, so the toggle reads as the
  // model rewriting its answer rather than a string swap.
  useEffect(() => {
    const full = REGISTERS[register];
    cursor.current = 0;
    setTyped("");
    const id = setInterval(() => {
      cursor.current += 3;
      if (cursor.current >= full.length) {
        setTyped(full);
        clearInterval(id);
        return;
      }
      setTyped(full.slice(0, cursor.current));
    }, 16);
    return () => clearInterval(id);
  }, [register]);

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-void/70 p-4">
      <div className="mb-3 flex items-center gap-1 rounded-lg border border-border-faint bg-bg-surface/50 p-1">
        {(["plain", "technical"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRegister(r)}
            aria-pressed={register === r}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-[11px] font-display font-semibold transition-all duration-200",
              register === r
                ? "bg-signal/15 text-signal"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            {r === "plain" ? "Plain English" : "Technical"}
          </button>
        ))}
      </div>

      <div className="min-h-[140px] font-mono text-[11px] leading-relaxed text-text-secondary sm:min-h-[120px]">
        <span className="font-semibold text-signal">Apperio: </span>
        {typed}
        <span className="ml-0.5 inline-block h-3 w-[2px] translate-y-0.5 bg-signal animate-cursor-blink" />
      </div>
    </div>
  );
}

// ─── Visual 3: session replay scrubber ───────────────────────────────────────

const REPLAY_EVENTS = [
  { at: 8, label: "Clicked Add to cart" },
  { at: 34, label: "Typed into card field" },
  { at: 61, label: "Clicked Pay now" },
  { at: 78, label: "TypeError thrown" },
];

function ReplayScrubber() {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : p + 0.6));
    }, 40);
    return () => clearInterval(id);
  }, [playing]);

  const current = [...REPLAY_EVENTS].reverse().find((e) => progress >= e.at);

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-void/70 p-4">
      {/* Stand-in for the recorded viewport */}
      <div className="relative mb-3 h-[92px] overflow-hidden rounded-lg border border-border-faint bg-bg-surface/60 p-3">
        <div className="space-y-2">
          <div className="h-1.5 w-20 rounded-full bg-text-muted/25" />
          <div className="flex items-center gap-2 rounded border border-border-faint bg-bg-void/60 px-2 py-1.5">
            <Lock className="h-2.5 w-2.5 shrink-0 text-text-muted" />
            <span className="min-w-0 truncate font-mono text-[10px] tracking-[0.3em] text-text-muted">
              {"•".repeat(16)}
            </span>
            <span className="ml-auto shrink-0 rounded bg-signal/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-signal">
              masked
            </span>
          </div>
          <div
            className={cn(
              "h-6 w-24 rounded transition-colors duration-300",
              progress >= 78 ? "bg-status-danger/25" : "bg-signal/20"
            )}
          />
        </div>

        {/* Cursor drifting across the frame */}
        <MousePointer2
          className="absolute h-3.5 w-3.5 text-text-primary transition-all duration-150 ease-linear"
          style={{
            left: `${12 + progress * 0.62}%`,
            top: `${20 + Math.sin(progress / 12) * 22}%`,
          }}
          aria-hidden="true"
        />

        {progress >= 78 && (
          <div className="absolute inset-x-3 bottom-2 animate-fade-in rounded border border-status-danger/40 bg-status-danger/10 px-2 py-1 font-mono text-[9px] text-status-danger">
            TypeError: reading &apos;email&apos; &mdash; checkout.ts:142
          </div>
        )}
      </div>

      {/* Transport */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause replay preview" : "Play replay preview"}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-signal/15 text-signal transition-colors hover:bg-signal/25"
        >
          {playing ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="ml-0.5 h-3 w-3" />
          )}
        </button>

        <div className="relative h-1 flex-1 rounded-full bg-bg-elevated">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-signal"
            style={{ width: `${progress}%` }}
          />
          {REPLAY_EVENTS.map((e) => (
            <span
              key={e.at}
              className={cn(
                "absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border-2 border-bg-void transition-colors duration-200",
                e.at === 78
                  ? "bg-status-danger"
                  : progress >= e.at
                    ? "bg-signal"
                    : "bg-text-muted/40"
              )}
              style={{ left: `calc(${e.at}% - 4px)` }}
            />
          ))}
        </div>

        <span className="w-10 shrink-0 text-right font-mono text-[10px] tabular-nums text-text-muted">
          0:{String(Math.floor(progress * 0.42)).padStart(2, "0")}
        </span>
      </div>

      <p className="mt-2 truncate font-mono text-[10px] text-text-muted">
        {current ? current.label : "Session started"}
      </p>
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

const PILLARS = [
  {
    kicker: "Change Intelligence",
    icon: GitCommitHorizontal,
    status: "live" as Status,
    title: "Every error, traced back to a commit.",
    body: "Apperio ingests your pushes, deploys and releases the second they happen. When an error group appears, it ranks the commits most likely to have caused it by how far their changed files overlap the failing stack, then shows the winner as Likely caused by, with the diff and the deploy it rode in on.",
    visual: <SuspectCommits />,
  },
  {
    kicker: "Plain-English layer",
    icon: Sparkles,
    status: "live" as Status,
    title: "Written for whoever is reading it.",
    body: "Every commit gets a summary a non-engineer can follow. Every error group gets a root cause in the same voice. Every deploy gets a verdict: better, worse, or no change. Flip to the technical register when you want frames and line numbers instead.",
    visual: <RegisterToggle />,
  },
  {
    kicker: "Session Replay",
    icon: Video,
    status: "beta" as Status,
    title: "Watch the session that broke.",
    body: "Go from an error group straight into the recording of the exact session that produced it, with the clicks, scrolls and route changes that led there. Every text input and password is masked before it leaves the browser. Off until you switch it on, per project, seven-day retention.",
    visual: <ReplayScrubber />,
  },
];

export function PillarsSection() {
  const containerRef = useScrollReveal({ stagger: 0.12, y: 40 });

  return (
    <section
      id="pillars"
      ref={containerRef}
      className="border-t border-border-faint py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <SectionHeading
          eyebrow="The shift"
          headline="What if the fix arrived"
          headlineAccent="with the alert?"
          sub="Not another dashboard replaying what already happened. Apperio joins the two halves your stack keeps apart, then does the reading for you."
        />

        <div className="mt-20 space-y-6">
          {PILLARS.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.kicker}
                data-reveal
                className={cn(
                  "grid items-center gap-8 rounded-2xl border border-border-subtle bg-bg-surface/40 p-6 backdrop-blur-sm transition-colors duration-300 hover:border-signal/25 sm:p-10 lg:grid-cols-2 lg:gap-14",
                  // Alternate which side the visual lands on so the eye zig-zags
                  i % 2 === 1 && "lg:[&>*:first-child]:order-2"
                )}
              >
                <div>
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal/10 text-signal">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                      {pillar.kicker}
                    </span>
                    <StatusBadge status={pillar.status} />
                  </div>

                  <h3 className="font-display text-2xl font-extrabold leading-tight tracking-tight text-text-primary sm:text-3xl">
                    {pillar.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-text-secondary sm:text-base">
                    {pillar.body}
                  </p>
                </div>

                <div>{pillar.visual}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
