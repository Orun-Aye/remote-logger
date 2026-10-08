"use client";

import { type ReactNode } from "react";
import { useScrollReveal } from "@/hooks/useGsapAnimations";
import { CodeBlock, LandingHeading } from "@/components/landing/primitives";
import { ProductShot } from "@/components/landing/ProductShot";
import { shotRenders } from "@/lib/screenshots";

const INIT_SNIPPET = `import { Apperio } from 'apperio'

new Apperio({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
  environment: 'production',
  release: 'v2.4.1',
})`;

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      data-reveal
      className="flex min-w-0 flex-col rounded-[14px] border border-border-subtle bg-bg-surface p-5 sm:p-6"
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="signal-fill flex h-7 w-7 items-center justify-center rounded-full bg-signal font-mono text-[13px] font-medium text-bg-void">
          {n}
        </span>
        <h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-text-primary">
          {title}
        </h3>
      </div>
      {/* The first child drops its top margin, so a step whose capture is
          missing from a production build starts with its text. */}
      <div className="[&>:first-child]:mt-0">{children}</div>
    </div>
  );
}

export function SetupSteps() {
  const containerRef = useScrollReveal({ stagger: 0.12 });

  return (
    <section
      id="setup"
      ref={containerRef}
      className="border-t border-border-subtle py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <LandingHeading
          eyebrow="Get started"
          headline="Live in three steps."
          headlineAccent="None of them is a dashboard."
          sub="No servers to run. Add one snippet to your site, or ask whoever built it to, and connect GitHub if your code lives there. That is the whole setup."
        />

        <div className="mt-14 grid gap-4 lg:grid-cols-[1.15fr_1fr_1fr]">
          <Step n={1} title="Install the SDK">
            <CodeBlock label="terminal" code="npm install apperio" />
            <CodeBlock label="app.ts" code={INIT_SNIPPET} className="mt-3" />
            <p className="mt-4 text-sm leading-relaxed text-text-secondary">
              That is the whole integration. Errors, network calls, clicks, page
              views, console output and Web Vitals start flowing immediately,
              with personal data stripped before anything leaves the browser.
            </p>
          </Step>

          <Step n={2} title="Connect your repo">
            {shotRenders("github-app-card") && (
              <ProductShot name="github-app-card" caption="Project integrations" />
            )}
            <p className="mt-4 text-sm leading-relaxed text-text-secondary">
              Install the GitHub App on the repos behind the project. Commits,
              deploys and releases arrive over webhooks from then on, and the
              last 50 commits are backfilled so the feed is never empty.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-text-muted">
              Optional. Apperio is a complete error and performance monitor
              without it. The repo is what adds the change side of the story.
            </p>
          </Step>

          <Step n={3} title="Ship, and read the story">
            {(shotRenders("latest-changes") || shotRenders("deploy-impact")) && (
              <div className="space-y-5">
                <ProductShot name="latest-changes" caption="Latest changes" />
                <ProductShot name="deploy-impact" caption="Deploy impact" />
              </div>
            )}
            <p className="mt-4 text-sm leading-relaxed text-text-secondary">
              The project overview shows what changed, in plain English, and
              whether your last deploy made things better or worse.
            </p>
          </Step>
        </div>
      </div>
    </section>
  );
}
