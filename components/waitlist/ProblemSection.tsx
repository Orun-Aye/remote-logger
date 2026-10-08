"use client";

import { LandingHeading } from "@/components/landing/primitives";
import { useScrollReveal } from "@/hooks/useGsapAnimations";
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
 * between them that nobody owns. A concept diagram, not product UI, so it is
 * drawn rather than captured.
 */
function SeveredLink() {
  return (
    <div
      className="relative grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch"
      data-reveal
    >
      <div className="rounded-[14px] border border-border-subtle bg-bg-surface p-5">
        <div className="mb-3 flex items-center gap-2">
          <GitBranch className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
            Your repo knows
          </span>
        </div>
        <p className="font-display text-base font-semibold text-text-primary">
          What changed
        </p>
        <div className="mt-3 space-y-1.5 font-mono text-[12px] text-text-secondary">
          <p>
            <span className="text-text-muted">fix:</span> cache user profile
          </p>
          <p>
            <span className="text-text-muted">chore:</span> bump deps
          </p>
          <p>
            <span className="text-text-muted">feat:</span> express checkout
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center py-1 sm:px-2 sm:py-0">
        <div className="flex items-center gap-2">
          <span className="hidden h-px w-8 bg-border-accent sm:block" />
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-status-danger/60 text-status-danger">
            <Unlink className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">No link between them</span>
          </span>
          <span className="hidden h-px w-8 bg-border-accent sm:block" />
        </div>
      </div>

      <div className="rounded-[14px] border border-border-subtle bg-bg-surface p-5">
        <div className="mb-3 flex items-center gap-2">
          <Siren className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
            Production knows
          </span>
        </div>
        <p className="font-display text-base font-semibold text-text-primary">
          What broke
        </p>
        <div className="mt-3 space-y-1.5 font-mono text-[12px] text-text-secondary">
          <p>
            <span className="text-status-danger">TypeError</span> /checkout
          </p>
          <p>
            <span className="text-status-warn">Slow</span> GET /api/users
          </p>
          <p>
            <span className="text-status-danger">Failed</span> POST /api/pay
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProblemSection() {
  const containerRef = useScrollReveal({ stagger: 0.08 });

  return (
    <section
      id="problem"
      ref={containerRef}
      className="py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <LandingHeading
          eyebrow="The problem"
          headline="The moment your site goes live,"
          headlineAccent="you go blind."
          sub="You built it, you tested it, you launched it. Then it met real browsers, flaky networks, and people doing things you never imagined. From that point on you are guessing, and your only warning is a customer annoyed enough to write in."
        />

        <div className="mt-14 max-w-4xl">
          <SeveredLink />
          <p
            className="mt-5 max-w-xl text-sm text-text-secondary"
            data-reveal
          >
            Both halves of the answer already exist. Nothing in your stack is
            holding them in the same hand.
          </p>
        </div>

        <div className="mt-16 grid gap-x-10 gap-y-8 border-t border-border-subtle pt-10 sm:grid-cols-2">
          {PAINS.map((pain, i) => (
            <div key={pain.title} data-reveal className="flex gap-4">
              <span className="pt-[3px] font-mono text-[12px] tabular-nums text-text-muted">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-text-primary">
                  {pain.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">
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
