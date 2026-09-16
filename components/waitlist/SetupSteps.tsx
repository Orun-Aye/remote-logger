"use client";

import { SectionHeading } from "@/components/shared/SectionHeading";
import { SignalDot } from "@/components/shared/SignalDot";
import { TerminalBlock } from "@/components/shared/TerminalBlock";
import { useScrollReveal } from "@/hooks/useGsapAnimations";
import { Github } from "lucide-react";

const INIT_SNIPPET = `import { Apperio } from 'apperio'

new Apperio({
  apiKey: process.env.APPERIO_KEY,
  environment: 'production'
})`;

export function SetupSteps() {
  const containerRef = useScrollReveal({ stagger: 0.12 });

  return (
    <section
      id="setup"
      ref={containerRef}
      className="border-t border-border-faint py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <SectionHeading
          eyebrow="Get started"
          headline="Live in three steps."
          headlineAccent="None of them is a dashboard."
          sub="No agent to run, no collector to host, no YAML. If you can install a package and click Authorize, you are done."
        />

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {/* Step 1 */}
          <div
            data-reveal
            className="flex flex-col rounded-xl border border-border-subtle bg-bg-surface/40 p-6 backdrop-blur-sm"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-signal font-display text-sm font-bold text-bg-void">
                1
              </span>
              <h3 className="font-display text-lg font-bold text-text-primary">
                Install the SDK
              </h3>
            </div>

            <TerminalBlock code="npm install apperio" showCopy />

            <div className="mt-4 rounded-lg border border-border-faint bg-bg-void/60 p-4">
              <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-text-secondary">
                <code>{INIT_SNIPPET}</code>
              </pre>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-text-secondary">
              That is the whole integration. Errors, network calls, clicks, page
              views, console output and Web Vitals start flowing immediately,
              with PII stripped before anything leaves the browser.
            </p>
          </div>

          {/* Step 2 */}
          <div
            data-reveal
            className="flex flex-col rounded-xl border border-border-subtle bg-bg-surface/40 p-6 backdrop-blur-sm"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-signal font-display text-sm font-bold text-bg-void">
                2
              </span>
              <h3 className="font-display text-lg font-bold text-text-primary">
                Connect your repo
              </h3>
            </div>

            <div className="rounded-lg border border-border-subtle bg-bg-void p-4">
              <div className="flex items-center gap-3">
                <Github className="h-5 w-5 shrink-0 text-text-primary" />
                <div className="min-w-0">
                  <p className="truncate font-mono text-[11px] text-text-primary">
                    you/shop
                  </p>
                  <p className="font-mono text-[10px] text-text-muted">
                    Apperio App installed
                  </p>
                </div>
                <SignalDot status="ok" size="sm" className="ml-auto shrink-0" />
              </div>

              <div className="mt-4 space-y-1.5 border-t border-border-faint pt-3 font-mono text-[10px] text-text-muted">
                <p>push  ·  deployment  ·  release  ·  issues</p>
                <p className="text-signal">Backfilled 50 commits</p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-text-secondary">
              Install the GitHub App on the repos behind the project. Commits,
              deploys and releases stream in over webhooks from that second, and
              your recent history is backfilled so the feed is never empty.
            </p>

            <p className="mt-3 text-xs text-text-muted">
              Optional. Apperio is a complete error and performance monitor
              without it. The repo is what adds the change side of the story.
            </p>
          </div>

          {/* Step 3 */}
          <div
            data-reveal
            className="flex flex-col rounded-xl border border-border-subtle bg-bg-surface/40 p-6 backdrop-blur-sm"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-signal font-display text-sm font-bold text-bg-void">
                3
              </span>
              <h3 className="font-display text-lg font-bold text-text-primary">
                Ship, and read the story
              </h3>
            </div>

            <div className="rounded-lg border border-border-subtle bg-bg-void p-4">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
                This week on you/shop
              </p>
              <ul className="space-y-2.5 text-[11px] leading-relaxed text-text-secondary">
                <li className="flex gap-2">
                  <span className="mt-1.5 shrink-0">
                    <SignalDot status="ok" size="sm" pulse={false} />
                  </span>
                  You shipped 11 commits across 3 deploys.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 shrink-0">
                    <SignalDot status="ok" size="sm" pulse={false} />
                  </span>
                  Errors are down 47%. The checkout regression is closed.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 shrink-0">
                    <SignalDot status="warn" size="sm" pulse={false} />
                  </span>
                  /settings is your slowest page at 2.4s. It got worse on
                  Thursday.
                </li>
              </ul>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-text-secondary">
              Open it when something needs you. Otherwise let the digest come to
              you: what you shipped, what it did to your users, and the one thing
              worth looking at next.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
