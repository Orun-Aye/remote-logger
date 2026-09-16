"use client";

import { SectionHeading } from "@/components/shared/SectionHeading";
import { useScrollReveal, useSpotlight } from "@/hooks/useGsapAnimations";
import { GitBranch, Siren, Unlink } from "lucide-react";

const PAINS = [
  {
    title: "You find out from a user",
    body: "By the time someone bothers to email you, the error has been firing for hours. You have no idea how many people hit it first and quietly closed the tab.",
  },
  {
    title: "A stack trace is not an answer",
    body: "Cannot read properties of undefined at chunk-4f2a.js:1:88213. Minified, contextless, and several commits removed from whatever actually caused it.",
  },
  {
    title: "Nothing joins the break to the change",
    body: "Your error tracker has never seen your commits. Your git log has never seen production. You reconcile the two by hand, from memory, at 2am.",
  },
  {
    title: "The tools assume a team you do not have",
    body: "Enterprise observability is priced and designed for an on-call rotation, a platform engineer, and a procurement cycle. You are one person shipping on a Sunday.",
  },
];

/**
 * The severed-link diagram: two things your stack already knows, and the join
 * between them that nobody owns. This is the whole thesis in one graphic.
 */
function SeveredLink() {
  return (
    <div
      className="relative grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch"
      data-reveal
    >
      {/* Left panel — what git knows */}
      <div className="rounded-xl border border-border-subtle bg-bg-surface/60 p-5 backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2">
          <GitBranch className="h-3.5 w-3.5 text-text-muted" />
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
            Your repo knows
          </span>
        </div>
        <p className="font-display text-base font-bold text-text-primary">
          What changed
        </p>
        <div className="mt-3 space-y-1.5 font-mono text-[11px] text-text-secondary">
          <p>
            <span className="text-data">a7f3c21</span> fix: cache user profile
          </p>
          <p>
            <span className="text-data">3b91e04</span> chore: bump deps
          </p>
          <p>
            <span className="text-data">c2d7a18</span> feat: express checkout
          </p>
        </div>
      </div>

      {/* Broken join */}
      <div className="flex items-center justify-center py-2 sm:px-2 sm:py-0">
        <div className="flex items-center gap-2">
          <span className="hidden h-px w-8 bg-gradient-to-r from-transparent to-status-danger/40 sm:block" />
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-status-danger/50 bg-status-danger/5 text-status-danger">
            <Unlink className="h-4 w-4" />
          </span>
          <span className="hidden h-px w-8 bg-gradient-to-l from-transparent to-status-danger/40 sm:block" />
        </div>
      </div>

      {/* Right panel — what production knows */}
      <div className="rounded-xl border border-border-subtle bg-bg-surface/60 p-5 backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2">
          <Siren className="h-3.5 w-3.5 text-text-muted" />
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
            Production knows
          </span>
        </div>
        <p className="font-display text-base font-bold text-text-primary">
          What broke
        </p>
        <div className="mt-3 space-y-1.5 font-mono text-[11px] text-text-secondary">
          <p>
            <span className="text-level-error">TypeError</span> /checkout
          </p>
          <p>
            <span className="text-level-warn">Slow</span> GET /api/users 1.8s
          </p>
          <p>
            <span className="text-level-error">Failed</span> POST /api/pay
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProblemSection() {
  const containerRef = useScrollReveal({ stagger: 0.1 });
  const spotlightRef = useSpotlight();

  return (
    <section
      id="problem"
      ref={containerRef}
      className="border-t border-border-faint py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <SectionHeading
          eyebrow="The problem"
          headline="The moment your code leaves your laptop,"
          headlineAccent="you go blind."
          sub="You wrote it, you tested it, you shipped it. Then it met real browsers, flaky networks, and users doing things you never imagined. From that point on you are guessing, and your only monitor is a customer annoyed enough to write in."
        />

        <div className="mx-auto mt-16 max-w-4xl">
          <SeveredLink />
          <p
            className="mx-auto mt-6 max-w-xl text-center text-sm text-text-secondary"
            data-reveal
          >
            Both halves of the answer already exist. Nothing in your stack is
            holding them in the same hand.
          </p>
        </div>

        {/* Four pains, numbered */}
        <div
          ref={spotlightRef}
          className="mt-20 grid gap-4 sm:grid-cols-2"
        >
          {PAINS.map((pain, i) => (
            <div
              key={pain.title}
              data-reveal
              data-spotlight
              className="spotlight-card group rounded-xl border border-border-subtle bg-bg-surface/40 p-6 backdrop-blur-sm transition-colors duration-300 hover:border-status-danger/30"
            >
              <div className="relative z-10">
                <span className="font-mono text-2xl font-bold text-status-danger/30 transition-colors duration-300 group-hover:text-status-danger/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-lg font-bold text-text-primary">
                  {pain.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {pain.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
