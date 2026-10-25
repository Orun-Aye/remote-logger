"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollReveal, useStaggerReveal } from "@/hooks/useGsapAnimations";
import { ProductShot } from "@/components/landing/ProductShot";
import { CodeBlock, LandingHeading } from "@/components/landing/primitives";
import { RUN } from "@/components/landing/run-facts";
import { HERO_SUBTITLE } from "@/components/landing/copy";
import { shotRenders } from "@/lib/screenshots";

// ─── Shared ──────────────────────────────────────────────────────────────────

function StartButtons({ align = "left" }: { align?: "left" | "center" }) {
  return (
    <div
      className={
        align === "center"
          ? "flex flex-wrap items-center justify-center gap-3"
          : "flex flex-wrap items-center gap-3"
      }
    >
      <Button
        variant="signal"
        size="lg"
        className="signal-fill shadow-none hover:translate-y-0"
        asChild
      >
        <Link href="/signup">
          Start free
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        variant="outline"
        size="lg"
        className="border-border-subtle text-text-secondary hover:text-text-primary"
        asChild
      >
        <Link href="/docs/quickstart">Read the quickstart</Link>
      </Button>
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

// Rendered without an intro animation: hiding the text until hydration made
// the hero paragraph the mobile LCP element at 5.7s on a throttled phone.
function Hero() {
  return (
    <section className="relative pt-16">
      <div className="mx-auto max-w-[1200px] px-4 pb-14 pt-16 sm:px-6 md:pb-20 md:pt-24">
        <div className="max-w-3xl">
          <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-border-subtle px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-text-secondary">
            <span
              className="h-1.5 w-1.5 rounded-full bg-signal"
              aria-hidden="true"
            />
            Now open to everyone
          </span>

          <h1 className="text-balance font-display text-[clamp(34px,6vw,64px)] font-semibold leading-[1.04] tracking-[-0.035em] text-text-primary">
            <span className="block">
              Your code shipped at{" "}
              <span className="tabular-nums">{RUN.commitTime}</span>.
            </span>
            <span className="block">
              It broke at{" "}
              <span className="tabular-nums text-status-danger">
                {RUN.brokeTime}
              </span>
              .
            </span>
            <span className="block text-signal">
              Apperio already knows why.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-relaxed text-text-secondary md:text-lg">
            {HERO_SUBTITLE}
          </p>

          <div className="mt-9">
            <StartButtons />
          </div>

          <p className="mt-5 text-xs text-text-muted">
            No credit card. Setup is one snippet of code.
          </p>
        </div>
      </div>

      {/* The capture is the LCP element, so it paints immediately instead of
          fading in. */}
      {shotRenders("suspect-commit") && (
        <div className="mx-auto max-w-[1200px] px-4 pb-24 sm:px-6 md:pb-32">
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

// ─── How it works ────────────────────────────────────────────────────────────

const STEPS = [
  {
    title: "Create a project",
    body: "Sign up with your email or GitHub and create a project. You get an API key straight away.",
  },
  {
    title: "Add the snippet",
    body: "Errors, network calls, clicks, page views and Web Vitals start flowing, with personal data stripped in the browser.",
    code: "npm install apperio",
  },
  {
    title: "Connect GitHub",
    body: "Optional. With your repo connected, every error points to the commit and deploy that most likely caused it.",
  },
];

function HowItWorks() {
  const containerRef = useScrollReveal({ stagger: 0.1 });

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="border-t border-border-subtle py-24 sm:py-28"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <LandingHeading
          eyebrow="How it works"
          headline="Live in a few minutes."
          headlineAccent="No servers to run."
        />

        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, i) => (
            <li key={step.title} data-reveal className="min-w-0">
              <span className="font-mono text-[13px] tabular-nums text-signal">
                0{i + 1}
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold tracking-[-0.01em] text-text-primary">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {step.body}
              </p>
              {step.code && (
                <CodeBlock label="terminal" code={step.code} className="mt-4" />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ─── Features ────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    title: "Change Intelligence",
    body: "Errors are matched to the commits and deploys behind them, so you start from a suspect, not a stack trace.",
  },
  {
    title: "AI root cause",
    body: "A plain-English explanation of what most likely went wrong, written against your actual stack trace.",
  },
  {
    title: "Issues drafted for you",
    body: "One click opens a GitHub issue with the stack, the impact and the suspect commit. Close it there, it resolves here.",
  },
  {
    title: "Performance and Web Vitals",
    body: "LCP, CLS, INP and slow pages, measured in your visitors' real browsers.",
  },
  {
    title: "Release health",
    body: "An hour after each deploy, a verdict on whether it made things better or worse.",
  },
  {
    title: "Alerts that reach you",
    body: "New kinds of errors notify you without setup. Add rules for email, Slack or webhooks when you want them.",
  },
];

function Features() {
  const headingRef = useScrollReveal();
  const gridRef = useStaggerReveal({ stagger: 0.05 });

  return (
    <section
      id="features"
      className="border-t border-border-subtle py-24 sm:py-28"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div ref={headingRef}>
          <LandingHeading
            eyebrow="What you get"
            headline="One snippet, one dashboard."
            headlineAccent="No add-ons."
          />
        </div>

        <div
          ref={gridRef}
          className="mt-14 grid gap-px overflow-hidden rounded-[14px] border border-border-subtle bg-border-subtle sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((feature) => (
            <div key={feature.title} data-stagger className="bg-bg-void p-6">
              <h3 className="font-display text-base font-semibold tracking-[-0.01em] text-text-primary">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {feature.body}
              </p>
            </div>
          ))}
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
      className="border-t border-border-subtle py-28 sm:py-32"
    >
      <div className="mx-auto max-w-[1200px] px-4 text-center sm:px-6">
        <h2
          className="mb-5 font-display text-[clamp(32px,5vw,56px)] font-semibold leading-[1.06] tracking-[-0.035em] text-text-primary"
          data-reveal
        >
          Stop finding out last.
        </h2>

        <p
          className="mx-auto mb-10 max-w-lg text-base leading-relaxed text-text-secondary"
          data-reveal
        >
          Your users will not email you when something breaks. They will just
          not come back. Start watching in a few minutes.
        </p>

        <div data-reveal>
          <StartButtons align="center" />
        </div>
      </div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Features />
      <ClosingCTA />
    </>
  );
}
