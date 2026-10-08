"use client";

import { ArrowDown } from "lucide-react";
import { useScrollReveal, useStaggerReveal } from "@/hooks/useGsapAnimations";
import { ProductShot } from "@/components/landing/ProductShot";
import { ProductTour } from "@/components/landing/ProductTour";
import { CodeBlock, LandingHeading } from "@/components/landing/primitives";
import { LAST_SHIPPED, RUN } from "@/components/landing/run-facts";
import { HERO_SUBTITLE } from "@/components/landing/copy";
import { shotRenders } from "@/lib/screenshots";
import { BuildLog } from "./BuildLog";
import { CharterOffer } from "./CharterOffer";
import { ComparisonTable } from "./ComparisonTable";
import { FeatureCard } from "./FeatureCard";
import { IncidentTimeline } from "./IncidentTimeline";
import { ProblemSection } from "./ProblemSection";
import { ScrollProgress } from "./ScrollProgress";
import { SetupSteps } from "./SetupSteps";
import { StackStrip } from "./StackStrip";
import { UseCases } from "./UseCases";
import { WaitlistFAQ } from "./WaitlistFAQ";
import { WaitlistForm, WaitlistSignupProvider } from "./WaitlistForm";

// ─── Hero ────────────────────────────────────────────────────────────────────

// Rendered without an intro animation: hiding the text until hydration made
// the hero paragraph the mobile LCP element at 5.7s on a throttled phone.
function Hero() {
  return (
    <section id="waitlist" className="relative pt-16">
      <div className="mx-auto max-w-[1200px] px-4 pb-12 pt-14 sm:px-6 md:pb-16 md:pt-20">
        <div className="mb-7 flex flex-wrap items-center gap-3">
          <span className="signal-fill inline-flex items-center gap-1.5 rounded-full bg-signal px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-bg-void">
            <span
              className="h-1.5 w-1.5 rounded-full bg-bg-void"
              aria-hidden="true"
            />
            Live
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
            Private beta · charter access open
          </span>
        </div>

        <h1 className="text-balance font-display text-[clamp(34px,6vw,64px)] font-semibold leading-[1.04] tracking-[-0.035em] text-text-primary">
          <span className="block">
            Your code shipped at{" "}
            <span className="tabular-nums">{RUN.commitTime}</span>.
          </span>
          <span className="block">
            It broke at{" "}
            <span className="tabular-nums text-status-danger">
              {RUN.errorTime}
            </span>
            .
          </span>
          <span className="block text-signal">Apperio already knows why.</span>
        </h1>

        <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-2 lg:gap-14">
          <div className="max-w-xl">
            <p className="text-base leading-relaxed text-text-secondary md:text-lg">
              {HERO_SUBTITLE}
            </p>
            {/* Honest about setup: there is no working no-code or script-tag
                install today, only the npm package plus an init snippet. */}
            <p className="mt-4 text-sm leading-relaxed text-text-muted">
              Setup is one snippet of code, added once by you or whoever built
              your site.
            </p>
          </div>

          <div>
            <div className="mb-4">
              <WaitlistForm />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-text-muted">
                <span>No spam, ever.</span>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-1.5 font-medium text-text-secondary transition-colors hover:text-text-primary"
                >
                  See it work end to end
                  <ArrowDown className="h-3 w-3" />
                </a>
                <span>
                  Have an invite code?{" "}
                  <a
                    href="/signup"
                    className="font-medium text-signal underline-offset-4 hover:underline"
                  >
                    Sign up
                  </a>
                </span>
              </div>

              {/* TODO(changelog): link the item to its /changelog entry once
                  the backend serves real entries instead of seed data. */}
              <p className="mt-5 font-mono text-[11px] text-text-muted">
                Last shipped{" "}
                <span className="tabular-nums text-text-secondary">
                  {LAST_SHIPPED.date}
                </span>
                {" · "}
                <a
                  href="#build-log"
                  className="text-text-secondary underline decoration-border-accent underline-offset-4 transition-colors hover:text-text-primary"
                >
                  {LAST_SHIPPED.item}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Not part of the hero sequence: the capture is the LCP element, so it
          paints immediately instead of fading in. */}
      {shotRenders("suspect-commit") && (
        <div className="mx-auto max-w-[1200px] px-4 pb-20 sm:px-6 md:pb-28">
          <ProductShot
            name="suspect-commit"
            priority
            caption="Likely caused by"
          />
        </div>
      )}
    </section>
  );
}

// ─── Everything else (bento) ─────────────────────────────────────────────────

/** A card's capture, or nothing so the card renders text-only when the shot
 *  is missing from a production build. */
function cardShot(name: string) {
  return shotRenders(name) ? <ProductShot name={name} /> : undefined;
}

function FeatureBento() {
  const headingRef = useScrollReveal();
  const gridRef = useStaggerReveal({ stagger: 0.06 });

  return (
    <section
      id="features"
      className="border-t border-border-subtle py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div ref={headingRef}>
          <LandingHeading
            eyebrow="Everything else"
            headline="The rest of what you would"
            headlineAccent="otherwise piece together yourself."
            sub="One snippet, one dashboard. Nothing here is an add-on tier or a second product."
          />
        </div>

        <div
          ref={gridRef}
          // Dense packing plus Release health spanning both columns at md:
          // without them the two-column layout leaves a hole beside
          // "Issues drafted", because the wide Web Vitals card cannot fit.
          className="mt-14 grid grid-cols-1 gap-4 md:grid-flow-dense md:grid-cols-2 lg:grid-cols-3"
        >
          <FeatureCard
            pain="A stack trace is not an answer"
            title="AI root cause"
            description="Open an error and Root Cause Analysis explains in plain English what most likely went wrong, with a confidence label, written against your actual stack trace rather than a generic pattern library."
            visual={cardShot("ai-root-cause")}
            span={2}
          />

          <FeatureCard
            pain="Copy-pasting stack traces into issues"
            title="Issues drafted for you"
            description="One click turns an error group into a GitHub issue with the stack, the impact and the suspect commit attached. Close it there and Apperio marks the error resolved here."
            visual={cardShot("issue-draft")}
          />

          <FeatureCard
            pain="Users leave before they complain"
            title="Performance and Web Vitals"
            description="LCP, CLS and INP, network timing and slow pages, measured in your visitors' real browsers rather than a synthetic run from a data centre."
            visual={cardShot("web-vitals")}
            span={2}
          />

          <FeatureCard
            pain="Manual logging is always incomplete"
            title="Auto-instrumentation"
            description="Errors, network requests, clicks, page views, console output and Web Vitals, captured from the moment you initialise. No wrapping, no decorators."
            visual={
              <CodeBlock
                label="app.ts"
                code={`new Apperio({\n  apiKey,\n  projectId,\n})\n// that is the entire setup`}
              />
            }
          />

          <FeatureCard
            pain="Accidentally logging your users"
            title="PII stripped at the source"
            description="Eleven built-in patterns for emails, card numbers, phone numbers, social security numbers, API keys, JWTs and more, replaced in the browser before anything is sent."
            visual={cardShot("pii-redacted-log")}
          />

          <FeatureCard
            pain="Finding out on social media"
            title="Alerts that reach you"
            description="A new kind of error notifies the project owner without a rule. Add rules when you want thresholds, sent by email, to Slack or a webhook, or opened as a GitHub issue."
            visual={cardShot("alert-in-app")}
          />

          <FeatureCard
            pain="Did that deploy help or hurt?"
            title="Release health"
            description="An hour after each deploy, Apperio compares its error rate with the hour before and gives a verdict: Improved, Healthy, Degraded, or Not enough traffic."
            visual={cardShot("deploy-impact")}
            className="md:col-span-2 lg:col-span-1"
          />

          <FeatureCard
            pain="Nobody opens the dashboard"
            title="A digest that reads like a person"
            description="Weekly, in plain English: what you shipped, what it did to your users, and the one thing worth looking at next. Not built yet."
            status="next"
            span={3}
          />
        </div>
      </div>
    </section>
  );
}

// ─── Closing CTA ─────────────────────────────────────────────────────────────

function ClosingCTA() {
  const closingRef = useScrollReveal();

  return (
    <section
      ref={closingRef}
      className="border-t border-border-subtle py-28 sm:py-36"
    >
      <div className="mx-auto max-w-[1200px] px-4 text-center sm:px-6">
        <p
          className="mb-6 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted"
          data-reveal
        >
          Private beta · invites in waitlist order
        </p>

        <h2
          className="mb-6 font-display text-[clamp(32px,5vw,60px)] font-semibold leading-[1.06] tracking-[-0.035em] text-text-primary"
          data-reveal
        >
          Stop finding out last.
        </h2>

        <p
          className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-text-secondary"
          data-reveal
        >
          Every hour an error runs unseen is a person who tried your product
          once and decided it was broken. They will not email you. They will
          just not come back.
        </p>

        <div className="mb-10 flex justify-center" data-reveal>
          <WaitlistForm align="center" cta="Join the waitlist" />
        </div>

        <div className="mx-auto mb-8 max-w-[420px] text-left" data-reveal>
          <CodeBlock label="terminal" code="npm install apperio" />
        </div>

        <p className="text-xs text-text-muted" data-reveal>
          Free tier forever · No credit card · Charter pricing locked ·
          One-click unsubscribe
        </p>
      </div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function WaitlistPage() {
  return (
    <WaitlistSignupProvider>
      <ScrollProgress />
      <Hero />
      <StackStrip />
      <ProblemSection />
      <ProductTour />
      <IncidentTimeline />
      <SetupSteps />
      <FeatureBento />
      <UseCases />
      <ComparisonTable />
      <BuildLog />
      <CharterOffer />
      <WaitlistFAQ />
      <ClosingCTA />
    </WaitlistSignupProvider>
  );
}
